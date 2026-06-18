import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Brain, TrendingUp, Users, CheckCircle2, Sparkles, Loader2, ClipboardList, ShieldAlert, CheckSquare, Square
} from 'lucide-react';
import { Survey, ParticipantProfile, CumulativeInsights } from '../types/survey';
import { createAIService } from '../services/services';

interface InsightsViewProps {
  survey: Survey | null;
  profiles: ParticipantProfile[];
}

export const InsightsView: React.FC<InsightsViewProps> = ({ survey, profiles }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<CumulativeInsights | null>(null);
  const [activeTab, setActiveTab] = useState<'charts' | 'ai'>('charts');
  
  // Local checklists for proactive initiatives
  const [initiativeStatus, setInitiativeStatus] = useState<Record<string, boolean>>({});

  const totalRespondents = profiles.length;
  
  // Calculate average completeness
  const avgCompleteness = totalRespondents > 0
    ? Math.round(profiles.reduce((sum, p) => sum + p.completeness, 0) / totalRespondents)
    : 0;

  // Calculate local category counts for SVG chart
  const categoryStats = React.useMemo(() => {
    const counts: Record<string, number> = {
      'Financial Bursary': 0,
      'Upskilling': 0,
      'Activity': 0,
      'Outreach Event': 0,
      'Other': 0
    };
    
    let total = 0;
    profiles.forEach(p => {
      (p.referrals || []).forEach(ref => {
        const cat = ref.category || 'Other';
        counts[cat] = (counts[cat] || 0) + 1;
        total++;
      });
    });

    return { counts, total };
  }, [profiles]);

  // Calculate pipeline status counts
  const pipelineStats = React.useMemo(() => {
    const counts: Record<string, number> = {
      'Matched': 0,
      'Drafted': 0,
      'Dispatched': 0,
      'Approved': 0,
      'Closed': 0
    };
    
    profiles.forEach(p => {
      (p.referrals || []).forEach(ref => {
        const status = ref.status || 'Matched';
        counts[status] = (counts[status] || 0) + 1;
      });
    });

    return counts;
  }, [profiles]);

  const generateAIInsights = async () => {
    if (!survey || totalRespondents === 0) return;
    setLoading(true);
    try {
      const aiService = createAIService();
      const res = await aiService.generateCumulativeInsights(profiles, survey);
      setInsights(res);
      // Initialize checklist state
      const initialChecked: Record<string, boolean> = {};
      if (res && res.proactiveInitiatives) {
        res.proactiveInitiatives.forEach(init => {
          initialChecked[init.id] = init.completed;
        });
      }
      setInitiativeStatus(initialChecked);
      setActiveTab('ai');
    } catch (err) {
      console.error("AI Insights compilation failed", err);
      alert("Unable to compile AI trends. Falling back to cached results.");
    } finally {
      setLoading(false);
    }
  };

  const toggleInitiative = (id: string) => {
    setInitiativeStatus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // If no profiles are available yet
  if (totalRespondents === 0) {
    return (
      <div className="p-8 text-center space-y-4 pt-16 font-sans">
        <div className="w-14 h-14 glass-inset rounded-2xl flex items-center justify-center mx-auto text-blue-400">
          <BarChart2 size={28} />
        </div>
        <h3 className="text-white font-bold text-sm uppercase">No Insights Available</h3>
        <p className="text-white/60 text-xs max-w-xs mx-auto">
          Please conduct at least one field interview and save the profile in the **Live Capture** tab to compile cumulative statistics and AI trends.
        </p>
      </div>
    );
  }

  // Pre-configured category colors
  const categoryColors: Record<string, string> = {
    'Financial Bursary': 'bg-red-500/80 text-red-400 border-red-500/25',
    'Upskilling': 'bg-blue-500/80 text-blue-400 border-blue-500/25',
    'Activity': 'bg-green-500/80 text-green-400 border-green-500/25',
    'Outreach Event': 'bg-purple-500/80 text-purple-400 border-purple-500/25',
    'Other': 'bg-slate-500/80 text-slate-400 border-slate-500/25'
  };

  return (
    <div className="p-6 space-y-6 pb-32 text-left font-sans animate-in">
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Community Insights</h2>
        <p className="text-xs text-white/50">Aggregate demographics and proactive planning</p>
      </div>

      {/* Segmented Controller Toggle */}
      <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-xl">
        <button 
          onClick={() => setActiveTab('charts')} 
          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${activeTab === 'charts' ? 'glass-button text-blue-400' : 'text-white/40'}`}
        >
          <BarChart2 size={12} />
          Dashboard Metrics
        </button>
        <button 
          onClick={() => {
            if (!insights) {
              generateAIInsights();
            } else {
              setActiveTab('ai');
            }
          }} 
          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${activeTab === 'ai' ? 'glass-button text-blue-400' : 'text-white/40'}`}
        >
          <Brain size={12} />
          AI Trend Advisor
        </button>
      </div>

      {activeTab === 'charts' && (
        <div className="space-y-6">
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                <Users size={20} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-white/40 block">Total Interviewed</span>
                <span className="text-lg font-black text-white">{totalRespondents}</span>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-400">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-white/40 block">Avg Completeness</span>
                <span className="text-lg font-black text-white">{avgCompleteness}%</span>
              </div>
            </div>
          </div>

          {/* SVG Pie Ring and Stats */}
          <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
            <h3 className="text-xs font-black text-white/60 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp size={12} />
              Prevalence of Needs by Category
            </h3>
            
            <div className="space-y-3 pt-2">
              {Object.entries(categoryStats.counts).map(([category, count]) => {
                const percentage = categoryStats.total > 0
                  ? Math.round((count / categoryStats.total) * 100)
                  : 0;

                // Color mapping details
                const barColor = category === 'Financial Bursary' ? 'bg-red-500' :
                                 category === 'Upskilling' ? 'bg-blue-500' :
                                 category === 'Activity' ? 'bg-green-500' :
                                 category === 'Outreach Event' ? 'bg-purple-500' : 'bg-slate-500';

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-white/80">
                      <span>{category}</span>
                      <span className="text-white/50">{count} match{count === 1 ? '' : 'es'} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Referral Pipeline Funnel */}
          <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
            <h3 className="text-xs font-black text-white/60 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList size={12} />
              Referral Status Pipeline
            </h3>
            
            {/* Visual Horizontal Stacked Progress */}
            <div className="space-y-4 pt-2">
              <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex border border-white/5">
                {Object.entries(pipelineStats).map(([stage, count]) => {
                  const total = Object.values(pipelineStats).reduce((s, c) => s + c, 0);
                  const width = total > 0 ? (count / total) * 100 : 0;
                  if (width === 0) return null;

                  const color = stage === 'Matched' ? 'bg-blue-400' :
                                stage === 'Drafted' ? 'bg-yellow-400' :
                                stage === 'Dispatched' ? 'bg-purple-400' :
                                stage === 'Approved' ? 'bg-green-400' : 'bg-red-400';

                  return (
                    <div 
                      key={stage} 
                      style={{ width: `${width}%` }} 
                      className={`${color} h-full transition-all`}
                      title={`${stage}: ${count}`}
                    />
                  );
                })}
              </div>

              {/* Legend with Counts */}
              <div className="grid grid-cols-3 gap-y-2 gap-x-1">
                {Object.entries(pipelineStats).map(([stage, count]) => {
                  const colorText = stage === 'Matched' ? 'text-blue-400' :
                                    stage === 'Drafted' ? 'text-yellow-400' :
                                    stage === 'Dispatched' ? 'text-purple-400' :
                                    stage === 'Approved' ? 'text-green-400' : 'text-red-400';

                  const dotColor = stage === 'Matched' ? 'bg-blue-400' :
                                  stage === 'Drafted' ? 'bg-yellow-400' :
                                  stage === 'Dispatched' ? 'bg-purple-400' :
                                  stage === 'Approved' ? 'bg-green-400' : 'bg-red-400';

                  return (
                    <div key={stage} className="flex items-center gap-1.5 text-[9px] font-bold text-white/70">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      <span className="uppercase">{stage}:</span>
                      <span className={colorText}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Prompt AI Button */}
          <button 
            onClick={generateAIInsights}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={14} />
            Run Cumulative AI Trend Advisor
          </button>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center space-y-4 glass-inset rounded-3xl">
              <Loader2 size={36} className="animate-spin text-blue-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-white text-xs font-black uppercase tracking-wider">AI Trend Analysis Running</p>
                <p className="text-white/50 text-[10px] max-w-xs mx-auto">Evaluating profiles, parsing interviewer notes, and structuring community intervention recommendations...</p>
              </div>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="p-5 bg-gradient-to-br from-blue-950/40 to-slate-900/40 border border-blue-500/20 rounded-[2rem] space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Brain size={13} />
                  Executive Trend Analysis
                </h3>
                <p className="text-xs text-white/90 leading-relaxed font-medium">
                  {insights.executiveSummary}
                </p>
              </div>

              {/* Common Problems Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-white/50 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                  <ShieldAlert size={12} />
                  Top Community Vulnerabilities
                </h3>
                <div className="space-y-3">
                  {insights.commonProblems.map((prob, i) => {
                    const badgeColor = prob.severity === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/20' :
                                       prob.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
                                       'bg-blue-500/20 text-blue-400 border border-blue-500/20';

                    return (
                      <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-white text-xs">{prob.problemName}</h4>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${badgeColor}`}>
                            {prob.severity} Priority
                          </span>
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed">{prob.description}</p>
                        
                        {/* Prevalence Progress Bar */}
                        <div className="pt-2 flex items-center gap-3">
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-tight">Prevalence:</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${prob.prevalencePercentage}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-white/80">{prob.prevalencePercentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Correlations & Undercurrents */}
              <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem] space-y-3">
                <h3 className="text-xs font-black text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={12} />
                  Demographic Correlations
                </h3>
                <ul className="space-y-2 pt-1">
                  {insights.correlations.map((c, idx) => (
                    <li key={idx} className="text-xs text-white/80 leading-relaxed flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Proactive Action Checklist */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pl-1">
                  <h3 className="text-xs font-black text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList size={12} />
                    Proactive Action Plan
                  </h3>
                  <span className="text-[9px] text-white/40 uppercase">Click to check off</span>
                </div>
                
                <div className="space-y-3">
                  {insights.proactiveInitiatives.map((init) => {
                    const isCompleted = initiativeStatus[init.id] || false;
                    return (
                      <div 
                        key={init.id}
                        onClick={() => toggleInitiative(init.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-3.5 items-start ${isCompleted ? 'bg-green-500/5 border-green-500/20 opacity-70' : 'bg-white/5 border-white/10'}`}
                      >
                        <button className="text-blue-400 mt-0.5">
                          {isCompleted ? <CheckSquare size={16} className="text-green-400" /> : <Square size={16} />}
                        </button>
                        <div className="space-y-1">
                          <h4 className={`font-bold text-xs ${isCompleted ? 'line-through text-white/40' : 'text-white'}`}>{init.title}</h4>
                          <p className={`text-[11px] leading-relaxed ${isCompleted ? 'text-white/30' : 'text-white/70'}`}>{init.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Refresh AI Insights */}
              <button 
                onClick={generateAIInsights}
                className="w-full py-3 bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Recalculate AI Trends
              </button>
            </div>
          ) : (
            <div className="p-12 text-center text-white/40 text-xs">
              Click the AI Trend Advisor tab or compile button to generate recommendations.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
