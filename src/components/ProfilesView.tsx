import React from 'react';
import { Users, User, Download, Sparkles } from 'lucide-react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Survey, ParticipantProfile, CommunityInitiative } from '../types/survey';

export const ProfilesView: React.FC<{
  profiles: ParticipantProfile[];
  survey: Survey;
  surveyFileBuffer: ArrayBuffer | null;
  isDocxTemplate: boolean;
  initiatives: CommunityInitiative[];
  onUpdateProfile: (updated: ParticipantProfile) => void;
  onSelectProfile: (id: string) => void;
}> = ({ profiles, survey, surveyFileBuffer, isDocxTemplate, initiatives, onUpdateProfile, onSelectProfile }) => {
  const filteredProfiles = profiles.filter(p => p.surveyId === survey.id);

  const exportToTxt = (profile: ParticipantProfile) => {
    let content = `SURVEY REPORT: ${survey.name}\nDate: ${new Date(profile.timestamp).toLocaleString()}\nCompleteness: ${profile.completeness}%\n\n`;
    content += `EXTRACTED DATA:\n`;
    survey.questions.forEach(q => {
      content += `- ${q.fieldName}: ${profile.responses[q.fieldName] || "Missing"}\n`;
    });
    if (profile.analysis?.needsAndWants) {
      content += `\nNEEDS & INTERESTS:\n` + profile.analysis.needsAndWants.map(n => `- ${n}`).join('\n') + '\n';
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${profile.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToDocx = (profile: ParticipantProfile) => {
    if (!surveyFileBuffer) return;
    try {
      const zip = new PizZip(surveyFileBuffer);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      const renderData: Record<string, any> = {};
      survey.questions.forEach(q => {
        const val = profile.responses[q.fieldName] || "";
        renderData[q.fieldName] = val;
        renderData[q.id] = val;
        const cleanKey = q.fieldName.replace(/[^a-zA-Z0-9]/g, "");
        if (cleanKey) renderData[cleanKey] = val;
      });
      doc.render(renderData);
      const out = doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(out);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey-filled-${profile.id}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to render DOCX. Check tags in template.");
    }
  };

  if (filteredProfiles.length === 0) {
    return (
      <div className="p-12 text-center space-y-4">
        <Users size={48} className="text-white/30 mx-auto" />
        <h2 className="text-lg font-black uppercase text-white">No Profiles Found</h2>
        <p className="text-xs text-white/50">Perform voice capture in training labs or upload templates to capture profiles.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 pb-32 text-left font-sans">
      <div className="flex justify-between items-center"><h2 className="text-xs font-black text-white/60 uppercase">{filteredProfiles.length} Profiles</h2></div>
      <div className="space-y-3">
        {filteredProfiles.map(profile => {
          const participantName = profile.responses[survey.questions[0]?.fieldName] || 'Participant';
          return (
            <div key={profile.id} className="glass-card rounded-2xl p-5 space-y-4 border border-white/5">
              <div className="flex gap-4">
                <div className="w-11 h-11 glass-inset rounded-xl flex items-center justify-center text-blue-400"><User size={22} /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{participantName}</h3>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-white/50 font-bold uppercase">{new Date(profile.timestamp).toLocaleDateString()}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-green-400/20 text-green-400">{profile.completeness}% Complete</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onSelectProfile(profile.id)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5"><Sparkles size={12} /><span>Outreach Matcher</span></button>
                <button onClick={() => isDocxTemplate && surveyFileBuffer ? exportToDocx(profile) : exportToTxt(profile)} className="py-2 px-3 glass-button rounded-xl"><Download size={14} className="text-white/70" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
