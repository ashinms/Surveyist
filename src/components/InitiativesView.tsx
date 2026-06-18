import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, CheckCircle, CheckSquare, Square, Send, Sparkles 
} from 'lucide-react';
import { Survey, ParticipantProfile, DispatchedEmail } from '../types/survey';

interface InitiativesViewProps {
  survey: Survey | null;
  profiles: ParticipantProfile[];
  selectedProfileId: string | null;
  onUpdateProfile: (updated: ParticipantProfile) => void;
  onClearSelection: () => void;
}

export const InitiativesView: React.FC<InitiativesViewProps> = ({ survey, profiles, selectedProfileId, onUpdateProfile, onClearSelection }) => {
  const [responsesExpanded, setResponsesExpanded] = useState(false);
  const [emailsToCustomize, setEmailsToCustomize] = useState<DispatchedEmail[] | null>(null);
  const [customizedIndex, setCustomizedIndex] = useState<number>(0);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);
  const matchedReferrals = selectedProfile?.referrals || [];

  const updateReferralStatus = (refId: string, newStatus: any) => {
    if (!selectedProfile || !selectedProfile.referrals) return;
    const updated = selectedProfile.referrals.map(ref => 
      ref.initiativeId === refId 
        ? { ...ref, status: newStatus, followedUp: ['Dispatched', 'Approved', 'Closed'].includes(newStatus) } 
        : ref
    );
    onUpdateProfile({ ...selectedProfile, referrals: updated });
  };

  const toggleReferralSelection = (refId: string) => {
    if (!selectedProfile || !selectedProfile.referrals) return;
    const updated = selectedProfile.referrals.map(ref => 
      ref.initiativeId === refId ? { ...ref, selected: !ref.selected } : ref
    );
    onUpdateProfile({ ...selectedProfile, referrals: updated });
  };

  const handleDispatchSelectedEmails = () => {
    if (!selectedProfile || !selectedProfile.referrals) return;
    const selected = selectedProfile.referrals.filter(ref => ref.selected && !ref.followedUp);
    if (selected.length === 0) return alert("Select at least one matched program.");

    const participantName = selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant';
    const emailField = survey?.questions.find(q => q.fieldName.toLowerCase().includes('email'))?.fieldName || '';
    const participantEmail = selectedProfile.responses[emailField] || `${participantName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;

    const generated: DispatchedEmail[] = [];

    // Confirmation email
    let pBody = `Dear ${participantName},\n\nWe have referred you to these schemes:\n`;
    selected.forEach((ref, idx) => { pBody += `${idx + 1}. ${ref.initiativeTitle}\n`; });
    pBody += `\nStaff from the respective departments will contact you.`;
    
    generated.push({ id: `e-p-${Date.now()}`, recipient: participantEmail, recipientType: 'Participant', subject: `Referral Confirmation: ${survey?.name}`, body: pBody, timestamp: Date.now() });

    // Organisation emails
    selected.forEach((ref, idx) => {
      generated.push({
        id: `e-org-${Date.now()}-${idx}`,
        recipient: ref.category.includes('Financial') ? 'bursaries@community.gov' : 'outreach@community.gov',
        recipientType: 'Organisation',
        subject: `Outreach Referral: ${participantName} - ${ref.initiativeTitle}`,
        body: `Dear Intake Officer,\n\nWe refer participant "${participantName}" for ${ref.initiativeTitle}.\nReason: ${ref.matchReason}`,
        timestamp: Date.now()
      });
    });

    setEmailsToCustomize(generated);
    setCustomizedIndex(0);
  };

  if (!selectedProfile) {
    return (
      <div className="p-8 text-center space-y-4 pt-16 font-sans">
        <div className="w-14 h-14 glass-inset rounded-2xl flex items-center justify-center mx-auto text-blue-400"><Sparkles size={28} /></div>
        <h3 className="text-white font-bold text-sm uppercase">Select Profile First</h3>
        <p className="text-white/60 text-xs max-w-xs mx-auto">Open the **Profiles** tab and click **Outreach Matcher** on any profile to match local support programs and generate drafts.</p>
      </div>
    );
  }

  const participantName = selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant';

  return (
    <div className="p-6 space-y-6 text-left font-sans">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Outreach Matcher</h2>
          <p className="text-xs text-white/50">Manage local support grants for {participantName}</p>
        </div>
        <button onClick={onClearSelection} className="px-3 py-1.5 glass-button text-xs rounded-xl">Back</button>
      </div>

      <div className="glass-card rounded-[2rem] p-6 space-y-4 border border-white/5">
        <button onClick={() => setResponsesExpanded(!responsesExpanded)} className="w-full flex justify-between items-center text-xs font-bold text-white/80">
          <span>Responses Overview</span>
          {responsesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {responsesExpanded && (
          <div className="space-y-2 max-h-48 overflow-y-auto pt-2 border-t border-white/5">
            {survey?.questions.map(q => (
              <div key={q.id} className="text-xs">
                <span className="block font-black text-blue-400/80 uppercase">{q.fieldName}</span>
                <span className="text-white/80">{selectedProfile.responses[q.fieldName] || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-white/60 uppercase">Matched Local Schemes</h3>
        {matchedReferrals.map(ref => {
          const isFollowedUp = ref.followedUp;
          const currentStatus = ref.status || (ref.followedUp ? 'Dispatched' : 'Matched');
          return (
            <div key={ref.initiativeId} onClick={() => !isFollowedUp && toggleReferralSelection(ref.initiativeId)} className={`p-4 rounded-2xl border transition-all ${isFollowedUp ? 'bg-green-500/5 border-green-500/20' : ref.selected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="text-blue-400 mt-0.5">{isFollowedUp ? <CheckCircle className="text-green-400" size={16} /> : ref.selected ? <CheckSquare size={16} /> : <Square size={16} />}</div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{ref.initiativeTitle}</h4>
                    <span className="text-[9px] text-white/40 uppercase">{ref.category}</span>
                  </div>
                </div>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${ref.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{ref.priority}</span>
              </div>
              <p className="text-[11px] text-white/80 mt-3 p-3 bg-slate-900/40 border border-white/5 rounded-xl">{ref.matchReason}</p>
              
              {/* Interactive pipeline */}
              <div className="flex gap-1 overflow-x-auto pt-3 border-t border-white/5 mt-3">
                {(['Matched', 'Drafted', 'Dispatched', 'Approved', 'Closed'] as const).map(stage => (
                  <button
                    key={stage}
                    onClick={e => { e.stopPropagation(); updateReferralStatus(ref.initiativeId, stage); }}
                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${currentStatus === stage ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40'}`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {matchedReferrals.some(r => r.selected && !r.followedUp) && (
        <button onClick={handleDispatchSelectedEmails} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"><Send size={14} /><span>Send Follow-Up Emails</span></button>
      )}

      {/* Dispatched Logs */}
      {selectedProfile.dispatchedEmails && selectedProfile.dispatchedEmails.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-white/10">
          <h3 className="text-xs font-black text-white/60 uppercase">Outreach Email Logs</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedProfile.dispatchedEmails.map(log => (
              <div key={log.id} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-white/60"><span className="text-[9px] uppercase">{log.recipientType}: {log.recipient}</span><span>{new Date(log.timestamp).toLocaleTimeString()}</span></div>
                <p className="text-white/80 font-medium truncate">{log.subject}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customizer Modal overlay */}
      {emailsToCustomize && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="glass-card rounded-[2rem] max-w-md w-full p-6 space-y-6 text-left border border-white/10 shadow-2xl">
            <h3 className="text-base font-black text-white uppercase border-b border-white/10 pb-3">Review Email ({customizedIndex + 1}/{emailsToCustomize.length})</h3>
            <div className="space-y-3">
              <input type="text" value={emailsToCustomize[customizedIndex].recipient} onChange={e => { const u = [...emailsToCustomize]; u[customizedIndex].recipient = e.target.value; setEmailsToCustomize(u); }} className="w-full p-3 glass-inset rounded-xl text-xs text-white" />
              <input type="text" value={emailsToCustomize[customizedIndex].subject} onChange={e => { const u = [...emailsToCustomize]; u[customizedIndex].subject = e.target.value; setEmailsToCustomize(u); }} className="w-full p-3 glass-inset rounded-xl text-xs text-white" />
              <textarea rows={6} value={emailsToCustomize[customizedIndex].body} onChange={e => { const u = [...emailsToCustomize]; u[customizedIndex].body = e.target.value; setEmailsToCustomize(u); }} className="w-full p-3 glass-inset rounded-xl text-xs text-white font-mono leading-relaxed resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEmailsToCustomize(null)} className="flex-1 py-3 glass-inset text-xs rounded-xl">Cancel</button>
              {customizedIndex < emailsToCustomize.length - 1 ? (
                <button onClick={() => setCustomizedIndex(customizedIndex + 1)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs">Next</button>
              ) : (
                <button
                  onClick={() => {
                    const matchedRefs = selectedProfile.referrals || [];
                    const updated = matchedRefs.map(ref => ref.selected ? { ...ref, followedUp: true, status: 'Dispatched' as const, selected: false } : ref);
                    onUpdateProfile({ ...selectedProfile, referrals: updated, dispatchedEmails: [...(selectedProfile.dispatchedEmails || []), ...emailsToCustomize] });
                    setEmailsToCustomize(null);
                    alert("Mock outreach referrals dispatched!");
                  }}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl text-xs"
                >
                  Send All
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
