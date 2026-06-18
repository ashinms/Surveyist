import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lightbulb, Target, ChevronRight, VolumeX, Sparkles, Keyboard, Phone, ChevronDown, 
  CheckSquare, Square, Mic, MicOff, MessageCircle, Award, Clock, MessageSquare, 
  TrendingUp, CheckCircle 
} from 'lucide-react';
import { Survey, CoachingOverview, QuestionCoaching, isQuestionCovered } from '../types/survey';
import { createAIService, createSpeechService } from '../services/services';

const renderCoachingText = (item: any, wrapQuotes = false): React.ReactNode => {
  if (!item) return '';
  if (typeof item === 'string') return wrapQuotes ? `"${item}"` : item;
  if (typeof item === 'object') {
    const phrase = item.phrase || item.mistake || item.tip || item.text || Object.values(item).find(v => typeof v === 'string') || '';
    const rationale = item.rationale || item.explanation || item.reason;
    const renderedPhrase = wrapQuotes ? `"${phrase}"` : phrase;
    return rationale ? (
      <span>
        <span>{renderedPhrase}</span>
        <span className="block text-[10px] text-white/40 mt-1 not-italic font-normal">Rationale: {rationale}</span>
      </span>
    ) : renderedPhrase;
  }
  return String(item);
};

export const CoachingView: React.FC<{ survey: Survey }> = ({ survey }) => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'questions' | 'practice'>('strategy');
  const [practiceMode, setPracticeMode] = useState<'chat' | 'call' | null>(null);
  const [overview, setOverview] = useState<CoachingOverview | null>(null);
  const [questionCoaching, setQuestionCoaching] = useState<QuestionCoaching[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [coveredQuestions, setCoveredQuestions] = useState<Record<string, boolean>>({});
  const [showProgressDetails, setShowProgressDetails] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState<Record<string, boolean>>({});

  const aiService = useMemo(() => createAIService(), []);
  const speechService = useMemo(() => createSpeechService(), []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const ov = await aiService.generateCoachingOverview(survey);
        setOverview(ov);
        setQuestionCoaching([]);
      } catch {
        alert("Failed to load coaching guide.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [survey]);

  useEffect(() => {
    if (messages.length === 0) return;
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    setCoveredQuestions(prev => {
      const newCovered = { ...prev };
      let changed = false;
      survey.questions.forEach(q => {
        if (!newCovered[q.id]) {
          const isCovered = userMessages.some(msg => isQuestionCovered(msg, q.fieldName));
          if (isCovered) {
            newCovered[q.id] = true;
            changed = true;
          }
        }
      });
      return changed ? newCovered : prev;
    });
  }, [messages, survey.questions]);

  const loadQuestionCoaching = async (questionId: string, questionText: string) => {
    if (questionCoaching.some(qc => qc.questionId === questionId) || loadingQuestions[questionId]) return;
    setLoadingQuestions(prev => ({ ...prev, [questionId]: true }));
    try {
      const qc = await aiService.generateSingleQuestionCoaching(questionId, questionText);
      setQuestionCoaching(prev => [...prev, qc]);
    } catch {
      console.error("Failed to load question coaching.");
    } finally {
      setLoadingQuestions(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSendMessage = async (text?: string) => {
    const content = text || liveTranscript;
    if (!content.trim() || isAILoading) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLiveTranscript('');
    setIsAILoading(true);

    try {
      const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
      const response = await aiService.generatePracticeResponse(content, survey, history, overview?.participantPersona);
      const aiMsg = { id: `a-${Date.now()}`, role: 'ai', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      if (practiceMode === 'call') await speechService.speak(response);
    } catch {
      alert("AI Response failed.");
    } finally {
      setIsAILoading(false);
    }
  };

  const toggleVoice = async () => {
    if (isListening) {
      const final = await speechService.stopListening();
      setIsListening(false);
      if (final || liveTranscript) handleSendMessage(final || liveTranscript);
    } else {
      try {
        setIsListening(true);
        await speechService.startListening(t => setLiveTranscript(t));
      } catch {
        setIsListening(false);
        alert('Mic blocked.');
      }
    }
  };

  const finishSession = async () => {
    speechService.stopSpeaking();
    if (isListening) await speechService.stopListening();
    setIsAILoading(true);
    try {
      const transcript = messages.map(m => `${m.role === 'user' ? 'INTERVIEWER' : 'PARTICIPANT'}: ${m.content}`).join('\n');
      const feedback = await aiService.generatePracticeFeedback(transcript, survey, overview?.coachPersona);
      if (feedback && typeof feedback.overallScore !== 'undefined') {
        setFeedbackData(feedback);
        setShowFeedback(true);
      } else throw new Error();
    } catch {
      alert('Analysis failed. Exchange more dialogue before grading.');
    } finally {
      setIsAILoading(false);
    }
  };

  const enterPractice = async (mode: 'chat' | 'call') => {
    speechService.stopSpeaking();
    setPracticeMode(mode);
    setMessages([]);
    setFeedbackData(null);
    setShowFeedback(false);
    setCoveredQuestions({});
    setShowProgressDetails(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 pt-12">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">AI is Crafting Strategy Guide...</p>
      </div>
    );
  }

  if (showFeedback && feedbackData) {
    return (
      <div className="p-6 space-y-6 pb-32 text-left font-sans">
        <div className="text-center space-y-4 pt-4">
          <div className="w-20 h-20 glass-inset rounded-[2rem] flex items-center justify-center mx-auto"><Award className="text-blue-400" size={40} /></div>
          <h2 className="text-2xl font-black uppercase text-white">Coaching Report</h2>
          <p className="text-sm text-white/60">AI Evaluation Feedback</p>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 text-center border border-white/10">
          <div className={`text-6xl font-black mb-2 ${feedbackData.overallScore >= 80 ? 'text-green-400' : 'text-amber-400'}`}>{feedbackData.overallScore}%</div>
          <p className="text-xs font-black uppercase text-white/70">Overall Score</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-4 text-center">
            <Clock className="mx-auto mb-2 text-blue-400" size={24} />
            <p className="text-base font-black text-white">{feedbackData.duration || "5 minutes"}</p>
            <p className="text-[9px] font-black uppercase text-white/50">Duration</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <MessageSquare className="mx-auto mb-2 text-purple-400" size={24} />
            <p className="text-base font-black text-white">{feedbackData.questionsAsked}/{feedbackData.totalQuestions}</p>
            <p className="text-[9px] font-black uppercase text-white/50">Questions Asked</p>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-6 space-y-4">
          <h3 className="flex items-center gap-2 font-black text-[10px] uppercase text-white"><TrendingUp size={16} className="text-green-400" /> Strengths</h3>
          <ul className="space-y-2 text-xs text-white/80">
            {feedbackData.strengths.map((s: string, i: number) => <li key={i} className="flex gap-2"><CheckCircle size={14} className="text-green-400 flex-shrink-0" />{s}</li>)}
          </ul>
        </div>

        <div className="glass-card rounded-[2rem] p-6 space-y-4">
          <h3 className="flex items-center gap-2 font-black text-[10px] uppercase text-white"><Lightbulb size={16} className="text-yellow-400" /> Improvements</h3>
          <ul className="space-y-2 text-xs text-white/80">
            {feedbackData.improvements.map((s: string, i: number) => <li key={i} className="flex gap-2"><Lightbulb size={14} className="text-yellow-400 flex-shrink-0" />{s}</li>)}
          </ul>
        </div>

        <button onClick={() => { setShowFeedback(false); setPracticeMode(null); }} className="w-full p-5 glass-button text-blue-300 font-black uppercase text-xs rounded-2xl hover:scale-105 transition-transform">Start New Practice</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full font-sans text-left">
      <div className="px-6 pt-2 pb-4 flex-shrink-0">
        <div className="glass-inset p-1.5 rounded-2xl flex gap-1">
          {(['strategy', 'questions', 'practice'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${activeTab === tab ? 'glass-button text-blue-300' : 'text-white/60'}`}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {activeTab === 'strategy' && overview && (
          <div className="space-y-6">
            <div className="glass-card rounded-[2rem] p-8 text-white border border-white/10">
              <h2 className="text-2xl font-black mb-4">{overview.surveyName}</h2>
              <div className="flex gap-3 text-white/80 text-[10px] font-black uppercase">
                <span className="glass-inset px-3 py-1.5 rounded-xl">{survey.questions.length} Questions</span>
                <span className="glass-inset px-3 py-1.5 rounded-xl">{overview.estimatedDuration}</span>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-6 space-y-4">
              <h3 className="flex items-center gap-2 font-black text-[10px] uppercase text-white"><Lightbulb className="text-yellow-400" size={16} /> Conversational Strategy</h3>
              <p className="text-sm text-white/80 font-medium">{overview.conversationalApproach}</p>
            </div>

            <div className="glass-card rounded-[2rem] p-6 space-y-4">
              <h3 className="flex items-center gap-2 font-black text-[10px] uppercase text-white"><Target className="text-blue-400" size={16} /> Recommended Survey Flow</h3>
              <ul className="space-y-4">
                {overview.surveyFlow.map((flowStep, i) => (
                  <li key={i} className="flex gap-4 text-sm text-white/80 font-bold">
                    <div className="w-6 h-6 glass-inset text-blue-400 rounded-lg flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">{i + 1}</div>
                    {flowStep}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-3">
            {survey.questions.map(q => {
              const coaching = questionCoaching.find(qc => qc.questionId === q.id);
              const isLoadingCoaching = loadingQuestions[q.id];
              const isExpanded = selectedQuestion === q.id;

              return (
                <div key={q.id} onClick={() => { setSelectedQuestion(isExpanded ? null : q.id); loadQuestionCoaching(q.id, q.fieldName); }} className="glass-card rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.01] transition-all border border-white/5">
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 glass-inset rounded-xl flex items-center justify-center text-blue-400 font-black text-xs">{q.id.replace('q', '')}</div>
                      <p className="font-bold text-white text-sm">{q.fieldName}</p>
                    </div>
                    <ChevronRight className={`text-white/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 space-y-4 border-t border-white/5 bg-slate-900/10">
                      {isLoadingCoaching ? (
                        <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
                      ) : coaching ? (
                        <>
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-blue-400 uppercase">Natural Phrasing</p>
                            {coaching.naturalPhrasing.map((p, i) => <div key={i} className="text-xs text-white/70 glass-inset p-3 rounded-xl italic">{renderCoachingText(p, true)}</div>)}
                          </div>
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-red-400 uppercase">Common Mistakes</p>
                            <ul className="space-y-1">
                              {coaching.commonMistakes.map((m, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-white/60 font-medium">
                                  <VolumeX size={12} className="mt-0.5 flex-shrink-0" />
                                  <span>{renderCoachingText(m, false)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : <p className="text-xs text-white/40 italic py-2">Failed to load tips.</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="h-[550px] flex flex-col glass-card rounded-[2.5rem] overflow-hidden border border-white/10 relative">
            {!practiceMode ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 glass-inset rounded-[1.5rem] flex items-center justify-center mx-auto text-blue-400"><Sparkles size={32} /></div>
                  <h3 className="text-2xl font-black text-white">AI Simulation Practice</h3>
                  <p className="text-[10px] font-bold uppercase text-white/60">Choose interaction channel</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full">
                  <button onClick={() => enterPractice('chat')} className="p-6 glass-button rounded-3xl text-center space-y-2 hover:scale-105 transition-transform">
                    <Keyboard className="mx-auto text-white/80" size={28} />
                    <span className="block font-black uppercase text-[9px] text-white">Chat Bot</span>
                  </button>
                  <button onClick={() => enterPractice('call')} className="p-6 glass-button rounded-3xl text-center space-y-2 hover:scale-105 transition-transform">
                    <Phone className="mx-auto text-white/80" size={28} />
                    <span className="block font-black uppercase text-[9px] text-white">Call Bot</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-5 flex items-center justify-between glass-header">
                  <div className="flex gap-3 items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-white/60">{practiceMode} Session</span>
                  </div>
                  <button onClick={finishSession} className="glass-button text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:scale-105 transition-transform">
                    Finish & Grade
                  </button>
                </div>

                <div className="px-6 py-3 border-b border-white/10 bg-white/5">
                  <button onClick={() => setShowProgressDetails(!showProgressDetails)} className="w-full flex items-center justify-between text-left">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1.5 text-[9px] font-black uppercase text-white/70">
                        <span>Questionnaire Progress</span>
                        <span className="text-blue-400">{Object.values(coveredQuestions).filter(Boolean).length}/{survey.questions.length} Asked</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${survey.questions.length > 0 ? (Object.values(coveredQuestions).filter(Boolean).length / survey.questions.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <ChevronDown size={14} className={`text-white/60 ml-4 transition-transform ${showProgressDetails ? 'rotate-180' : ''}`} />
                  </button>

                  {showProgressDetails && (
                    <div className="space-y-1.5 pt-2 border-t border-white/5 max-h-32 overflow-y-auto pr-1">
                      {survey.questions.map(q => {
                        const isChecked = !!coveredQuestions[q.id];
                        return (
                          <div key={q.id} className="flex items-start gap-2 select-none">
                            <div className="text-blue-400 mt-0.5">{isChecked ? <CheckSquare size={12} className="fill-blue-500/10" /> : <Square size={12} />}</div>
                            <span className={`text-[10px] font-medium leading-tight ${isChecked ? 'text-white/40 line-through' : 'text-white/80'}`}>{q.fieldName}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.length === 0 && (
                    <div className="flex justify-center my-4">
                      <div className="glass-inset px-4 py-3 rounded-2xl text-[10px] font-bold text-blue-400 uppercase tracking-wider text-center max-w-[90%] border border-blue-500/20">
                        🤝 Simulation active. Please ask the participant your first survey question.
                      </div>
                    </div>
                  )}

                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium text-white ${m.role === 'user' ? 'glass-button rounded-tr-none' : 'glass-inset rounded-tl-none'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}

                  {isListening && (
                    <div className="glass-inset p-4 rounded-2xl flex items-center gap-3">
                      <Mic className="text-blue-400 animate-pulse" size={18} />
                      <p className="text-xs italic font-bold text-blue-400">{liveTranscript || "Listening..."}</p>
                    </div>
                  )}

                  {isAILoading && (
                    <div className="flex justify-start">
                      <div className="glass-inset p-4 rounded-2xl flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 glass-header flex gap-3">
                  {practiceMode === 'call' && (
                    <button onClick={toggleVoice} className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white' : 'glass-button text-white/80'}`}>
                      {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                  )}
                  <input
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    onChange={e => setLiveTranscript(e.target.value)}
                    value={liveTranscript}
                    placeholder="Type here..."
                    className="flex-1 glass-inset rounded-2xl px-6 focus:outline-none text-sm text-white placeholder-white/40"
                  />
                  <button onClick={() => handleSendMessage()} className="p-4 glass-button text-blue-400 rounded-2xl hover:scale-105 transition-transform">
                    <MessageCircle size={24} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
