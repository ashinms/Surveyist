import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CheckCircle, Square, Mic, ChevronDown, CheckSquare, AlertCircle, MicOff, Lightbulb 
} from 'lucide-react';
import { Survey, RecordingAnalysis, isQuestionCovered } from '../types/survey';
import { createAIService, createSpeechService } from '../services/services';
import { Modal } from './Modal';

export const RecordingView: React.FC<{ survey: Survey; onSaveProfile: (r: Record<string, string>, a?: RecordingAnalysis) => void }> = ({ survey, onSaveProfile }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [analysis, setAnalysis] = useState<RecordingAnalysis | null>(null);
  const [showClarification, setShowClarification] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [permissionError, setPermissionError] = useState(false);
  const [coveredQuestions, setCoveredQuestions] = useState<Record<string, boolean>>({});
  const [showQuestionsList, setShowQuestionsList] = useState(true);

  const timerRef = useRef<any>();
  const aiService = useMemo(() => createAIService(), []);
  const speechService = useMemo(() => createSpeechService(), []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    speechService.stopSpeaking();
  }, []);

  useEffect(() => {
    if (!liveTranscript.trim()) return;
    setCoveredQuestions(prev => {
      const newCovered = { ...prev };
      let changed = false;
      survey.questions.forEach(q => {
        if (!newCovered[q.id] && isQuestionCovered(liveTranscript, q.fieldName)) {
          newCovered[q.id] = true;
          changed = true;
        }
      });
      return changed ? newCovered : prev;
    });
  }, [liveTranscript, survey.questions]);

  const startRecording = async () => {
    setLiveTranscript('');
    setAnalysis(null);
    setCoveredQuestions({});
    setPermissionError(false);
    try {
      await speechService.startListening(t => setLiveTranscript(t));
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      setPermissionError(true);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    try {
      const final = await speechService.stopListening();
      const text = final || liveTranscript;
      if (!text.trim()) {
        alert('No speech detected.');
        return;
      }
      setIsAnalyzing(true);
      const res = await aiService.analyzeTranscript(text, survey);
      setAnalysis(res);
      if ((res.unclearQuestions && res.unclearQuestions.length > 0) || (res.unansweredQuestions && res.unansweredQuestions.length > 0)) {
        setShowClarification(true);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClarificationComplete = (clarified: Record<string, string>) => {
    if (analysis) {
      const final = { ...analysis.extractedResponses, ...clarified };
      onSaveProfile(final, analysis);
      setShowClarification(false);
      setAnalysis(null);
      setLiveTranscript('');
    }
  };

  if (permissionError) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
        <MicOff size={40} className="text-red-400" />
        <h2 className="text-xl font-bold text-white">Mic Permission Blocked</h2>
        <button onClick={startRecording} className="px-6 py-3 glass-button text-white rounded-2xl font-bold hover:scale-105 transition-transform">Try Again</button>
      </div>
    );
  }

  const allClarify = analysis ? [...new Set([...(analysis.unclearQuestions || []), ...(analysis.unansweredQuestions || [])])] : [];

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="space-y-2 text-left">
        <h2 className="text-2xl font-black text-white uppercase">Voice Capture</h2>
        <p className="text-sm text-white/60">Capture live interview data and extract survey profiles automatically.</p>
      </div>

      {!analysis && !isAnalyzing ? (
        <div className="flex flex-col items-center gap-10 py-12">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 scale-105' : 'glass-button hover:scale-110'}`}
          >
            {isRecording ? <Square className="text-white animate-pulse" size={40} /> : <Mic className="text-blue-400" size={40} />}
          </button>

          {isRecording && (
            <div className="text-red-400 font-black text-xl font-mono">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </div>
          )}

          <div className="w-full glass-card rounded-2xl p-5 space-y-4 text-left">
            <button onClick={() => setShowQuestionsList(!showQuestionsList)} className="w-full flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1.5 text-[10px] font-black uppercase text-white/70">
                  <span>Questionnaire Progress</span>
                  <span className="text-blue-400">{Object.values(coveredQuestions).filter(Boolean).length}/{survey.questions.length} Asked</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${survey.questions.length > 0 ? (Object.values(coveredQuestions).filter(Boolean).length / survey.questions.length) * 100 : 0}%` }} />
                </div>
              </div>
              <ChevronDown size={16} className={`text-white/60 ml-4 transition-transform ${showQuestionsList ? 'rotate-180' : ''}`} />
            </button>

            {showQuestionsList && (
              <div className="space-y-2 pt-2 border-t border-white/5 max-h-52 overflow-y-auto pr-1">
                {survey.questions.map(q => {
                  const isChecked = !!coveredQuestions[q.id];
                  return (
                    <div key={q.id} onClick={() => setCoveredQuestions(prev => ({ ...prev, [q.id]: !isChecked }))} className="flex items-start gap-2.5 cursor-pointer select-none">
                      <div className="text-blue-400 mt-0.5">{isChecked ? <CheckSquare size={14} className="fill-blue-500/20" /> : <Square size={14} />}</div>
                      <span className={`text-[11px] font-medium leading-tight ${isChecked ? 'text-white/40 line-through' : 'text-white/80'}`}>{q.fieldName}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {isRecording && (
            <div className="w-full glass-inset rounded-3xl p-6 text-left">
              <p className="text-lg text-white italic leading-relaxed">{liveTranscript || "Listening..."}</p>
            </div>
          )}
        </div>
      ) : isAnalyzing ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-white/60 text-center">AI is Analyzing Transcription Technique & Parsing Profile...</p>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className={`text-6xl font-black mb-2 ${analysis!.score >= 80 ? 'text-green-400' : 'text-amber-400'}`}>{analysis!.score}%</div>
            <p className="text-xs font-black uppercase text-white/70">Transcription Quality</p>
          </div>

          {analysis!.improvementAnalysis && (
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <h3 className="font-black uppercase tracking-widest text-[10px] text-white">AI Coach's Feedback</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black text-white/60 uppercase mb-2">Strengths</p>
                  <ul className="space-y-1">
                    {analysis!.improvementAnalysis.strengths.map((s, i) => (
                      <li key={i} className="text-xs flex items-center gap-2 text-white/80"><CheckCircle size={14} className="text-green-400" />{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/60 uppercase mb-2">Actionable Tips</p>
                  <ul className="space-y-1">
                    {analysis!.improvementAnalysis.actionableTips.map((t, i) => (
                      <li key={i} className="text-xs font-bold italic text-white/80"><Lightbulb size={14} className="text-yellow-400 inline mr-2" />{t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h3 className="font-black uppercase text-[10px] text-white">Extracted Answers</h3>
            {Object.entries(analysis!.extractedResponses).map(([f, v], i) => (
              <div key={i} className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-[9px] font-black text-blue-400 uppercase">{f}</span>
                <span className="text-sm font-medium text-white/80">{v || "—"}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setAnalysis(null)} className="flex-1 p-5 glass-inset text-white/60 font-black uppercase text-xs rounded-2xl">Discard</button>
            <button onClick={() => handleClarificationComplete({})} className="flex-1 p-5 glass-button text-blue-400 font-black uppercase text-xs rounded-2xl hover:scale-105 transition-transform">Save Results</button>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      <Modal isOpen={showClarification} title="Clarification Needed" onClose={() => setShowClarification(false)} icon={<AlertCircle className="text-amber-400" size={24} />}>
        <p className="text-xs text-white/70 mb-4">Please provide missing or unclear information captured during the dialogue:</p>
        <div className="space-y-4">
          {allClarify.map((q, i) => (
            <div key={i} className="space-y-2">
              <label className="text-[10px] font-black text-white/60 uppercase block">{q}</label>
              <input
                type="text"
                onChange={e => {
                  if (analysis) {
                    analysis.extractedResponses[q] = e.target.value;
                  }
                }}
                className="w-full p-3 glass-inset rounded-xl focus:outline-none text-xs text-white"
                placeholder="Enter response details..."
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button onClick={() => setShowClarification(false)} className="flex-1 py-3.5 glass-inset text-white/60 font-black uppercase text-xs rounded-xl">Skip</button>
          <button onClick={() => handleClarificationComplete({})} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs rounded-xl">Save All</button>
        </div>
      </Modal>
    </div>
  );
};
