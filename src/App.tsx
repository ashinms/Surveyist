import { useState } from 'react';
import { Upload, Zap, Mic, Users, Sparkles, Database, BarChart2 } from 'lucide-react';
import { HomeView, CoachingView, RecordingView, ProfilesView, InitiativesView, SchemesView, InsightsView, ErrorBoundary } from './components/views';
import { Survey, ParticipantProfile, RecordingAnalysis, CommunityInitiative, DEFAULT_INITIATIVES } from './types/survey';
import { createAIService } from './services/services';

type Tab = 'home' | 'training' | 'record' | 'profiles' | 'initiatives' | 'schemes' | 'insights';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyFileBuffer, setSurveyFileBuffer] = useState<ArrayBuffer | null>(null);
  const [isDocxTemplate, setIsDocxTemplate] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<ParticipantProfile[]>([]);
  const [initiatives, setInitiatives] = useState<CommunityInitiative[]>(DEFAULT_INITIATIVES);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const handleSurveyUploaded = async (survey: Survey, fileBuffer?: ArrayBuffer, fileName?: string) => {
    setCurrentSurvey(survey);
    setSurveys(prev => {
      if (prev.some(s => s.id === survey.id || s.name === survey.name)) return prev;
      return [...prev, survey];
    });
    if (fileBuffer) {
      setSurveyFileBuffer(fileBuffer);
      setIsDocxTemplate(fileName?.split('.').pop()?.toLowerCase() === 'docx');
    } else {
      setSurveyFileBuffer(null);
      setIsDocxTemplate(false);
    }
    setActiveTab('training');
  };

  const handleSaveProfile = async (responses: Record<string, string>, analysis?: RecordingAnalysis, interviewerNotes?: string) => {
    const questions = currentSurvey?.questions || [];
    const answeredCount = questions.filter(q => responses[q.fieldName]?.trim()).length;
    const completeness = Math.round((answeredCount / (questions.length || 1)) * 100);

    const profileId = `profile-${Date.now()}`;
    const p: ParticipantProfile = {
      id: profileId,
      surveyId: currentSurvey?.id || '',
      timestamp: Date.now(),
      responses,
      completeness,
      analysis,
      interviewerNotes,
      referrals: undefined
    };

    setProfiles(prev => [p, ...prev]);
    setActiveTab('profiles');

    try {
      const aiService = createAIService();
      const matched = await aiService.matchReferrals(responses, initiatives, interviewerNotes);
      const refs = (matched || []).map(m => ({ ...m, selected: false, followedUp: false, status: 'Matched' as const }));
      setProfiles(prev => prev.map(prof => prof.id === profileId ? { ...p, referrals: refs, dispatchedEmails: [] } : prof));
    } catch {
      setProfiles(prev => prev.map(prof => prof.id === profileId ? { ...p, referrals: [], dispatchedEmails: [] } : prof));
    }
  };

  const tabs = [
    { id: 'home' as Tab, label: 'Import', icon: Upload },
    { id: 'training' as Tab, label: 'Training Lab', icon: Zap, disabled: !currentSurvey },
    { id: 'record' as Tab, label: 'Live Capture', icon: Mic, disabled: !currentSurvey },
    { id: 'profiles' as Tab, label: 'Profiles', icon: Users },
    { id: 'insights' as Tab, label: 'Insights', icon: BarChart2, disabled: !currentSurvey },
    { id: 'initiatives' as Tab, label: 'Outreach', icon: Sparkles },
    { id: 'schemes' as Tab, label: 'Schemes', icon: Database },
  ];

  return (
    <div className="h-screen h-[100dvh] glass-bg flex flex-col items-center overflow-hidden font-sans">
      <div className="w-full max-w-md h-full flex flex-col relative overflow-hidden glass-container">
        <header className="glass-header p-6 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-black text-white tracking-tighter uppercase flex-shrink-0">Clairo</h1>
            {currentSurvey && (
              <div className="glass-inset px-3 py-1 rounded-full max-w-[60%] truncate" title={`Active: ${currentSurvey.name}`}>
                <span className="text-[9px] font-black text-green-400 uppercase tracking-tighter block truncate">Active: {currentSurvey.name}</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
          {activeTab === 'home' && (
            <HomeView 
              onSurveyUpload={handleSurveyUploaded} 
              surveys={surveys}
              currentSurvey={currentSurvey}
              onSelectSurvey={(s) => { setCurrentSurvey(s); setActiveTab('training'); }}
            />
          )}
          {activeTab === 'training' && currentSurvey && <CoachingView survey={currentSurvey} />}
          {activeTab === 'record' && currentSurvey && <RecordingView survey={currentSurvey} onSaveProfile={handleSaveProfile} />}
          {activeTab === 'profiles' && <ProfilesView profiles={profiles} survey={currentSurvey || { id: '', name: '', questions: [] }} surveyFileBuffer={surveyFileBuffer} isDocxTemplate={isDocxTemplate} initiatives={initiatives} onUpdateProfile={u => setProfiles(prev => prev.map(p => p.id === u.id ? u : p))} onSelectProfile={id => { setSelectedProfileId(id); setActiveTab('initiatives'); }} />}
          {activeTab === 'initiatives' && (
            <InitiativesView 
              survey={currentSurvey} 
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              onUpdateProfile={u => setProfiles(prev => prev.map(p => p.id === u.id ? u : p))}
              onClearSelection={() => { setSelectedProfileId(null); setActiveTab('profiles'); }}
              initiatives={initiatives}
            />
          )}
          {activeTab === 'insights' && <InsightsView survey={currentSurvey} profiles={profiles} />}
          {activeTab === 'schemes' && <SchemesView initiatives={initiatives} setInitiatives={setInitiatives} />}
        </main>

        <nav className="absolute bottom-8 left-4 right-4 glass-nav rounded-3xl p-1.5 flex items-center justify-between gap-1 z-50">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`flex-1 flex flex-col items-center gap-1 py-1 px-0.5 rounded-xl transition-all ${isActive
                    ? 'bg-blue-500/30 text-white scale-105 shadow-md shadow-blue-500/25 backdrop-blur-sm'
                    : isDisabled
                      ? 'text-white/30 opacity-30 cursor-not-allowed'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
              >
                <Icon size={14} />
                <span className="text-[6.5px] font-black uppercase tracking-tight text-center">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default App;