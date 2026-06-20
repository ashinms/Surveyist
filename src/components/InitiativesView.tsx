import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, CheckCircle, CheckSquare, Square, Send, Sparkles, Brain, Download 
} from 'lucide-react';
import { Survey, ParticipantProfile, DispatchedEmail, CommunityInitiative } from '../types/survey';

const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = "" }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={className} 
    fill="currentColor"
  >
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.054L2 22l5.077-1.331a9.927 9.927 0 004.93 1.317h.005c5.505 0 9.989-4.478 9.99-9.986 0-2.67-1.037-5.178-2.924-7.067C17.19 3.047 14.685 2 12.012 2zm0 1.698c2.217 0 4.3.864 5.867 2.433 1.566 1.567 2.428 3.65 2.429 5.867-.002 4.573-3.719 8.291-8.297 8.291-.002 0-.003 0-.005 0a8.219 8.219 0 01-4.19-1.157l-.301-.18-3.116.817.83-3.037-.197-.314a8.2 8.2 0 01-1.258-4.364c0-4.572 3.718-8.29 8.293-8.29zM8.91 7.915c-.2-.045-.4-.055-.583-.055-.183 0-.48.068-.73.342-.25.274-.954.933-.954 2.274 0 1.342.977 2.637 1.112 2.82.135.183 1.923 2.937 4.659 4.119.65.282 1.158.45 1.554.575.654.208 1.25.179 1.72.109.525-.078 1.602-.656 1.83-1.259.227-.604.227-1.12.158-1.229-.068-.109-.25-.173-.526-.31-.276-.137-1.632-.805-1.886-.897-.254-.092-.44-.137-.624.137-.184.274-.712.897-.872 1.08-.16.183-.32.205-.596.068-.276-.137-1.166-.43-2.22-1.371-.82-.731-1.374-1.634-1.535-1.908-.16-.274-.017-.422.12-.559.124-.123.276-.32.414-.48.138-.16.184-.274.276-.457.092-.183.046-.342-.023-.48-.069-.137-.624-1.503-.855-2.06-.225-.544-.452-.47-.623-.478z" />
  </svg>
);

interface InitiativesViewProps {
  survey: Survey | null;
  profiles: ParticipantProfile[];
  selectedProfileId: string | null;
  onUpdateProfile: (updated: ParticipantProfile) => void;
  onClearSelection: () => void;
  initiatives: CommunityInitiative[];
}

export const InitiativesView: React.FC<InitiativesViewProps> = ({ survey, profiles, selectedProfileId, onUpdateProfile, onClearSelection, initiatives }) => {
  const [responsesExpanded, setResponsesExpanded] = useState(false);
  const [emailsToCustomize, setEmailsToCustomize] = useState<DispatchedEmail[] | null>(null);
  const [customizedIndex, setCustomizedIndex] = useState<number>(0);

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);
  const matchedReferrals = selectedProfile?.referrals || [];

  const [manualNeeds, setManualNeeds] = useState<{
    shelter: boolean | null;
    financial: boolean | null;
    medical: boolean | null;
    food: boolean | null;
  }>({ shelter: null, financial: null, medical: null, food: null });

  const detectNeeds = () => {
    if (!selectedProfile) return { shelter: false, financial: false, medical: false, food: false };
    const responsesStr = JSON.stringify(selectedProfile.responses).toLowerCase();
    const notesStr = (selectedProfile.interviewerNotes || '').toLowerCase();
    const refsStr = matchedReferrals.map(r => r.initiativeTitle + ' ' + r.matchReason + ' ' + r.category).join(' ').toLowerCase();
    const combined = `${responsesStr} ${notesStr} ${refsStr}`;

    const autoShelter = combined.includes('shelter') || combined.includes('housing') || combined.includes('homeless') || combined.includes('rough sleep') || combined.includes('accommodation');
    const autoFinancial = combined.includes('financial') || combined.includes('income') || combined.includes('comcare') || combined.includes('sso') || combined.includes('bursary') || combined.includes('grant') || combined.includes('allowance') || combined.includes('cash') || combined.includes('debt') || combined.includes('bill');
    const autoMedical = combined.includes('medical') || combined.includes('health') || combined.includes('doctor') || combined.includes('clinic') || combined.includes('hospital') || combined.includes('healthcare') || combined.includes('check-up') || combined.includes('illness');
    const autoFood = combined.includes('food') || combined.includes('meals') || combined.includes('eat') || combined.includes('hungry') || combined.includes('groceries') || combined.includes('soup kitchen') || combined.includes('food bank') || combined.includes('food insecurity');

    return {
      shelter: manualNeeds.shelter !== null ? manualNeeds.shelter : autoShelter,
      financial: manualNeeds.financial !== null ? manualNeeds.financial : autoFinancial,
      medical: manualNeeds.medical !== null ? manualNeeds.medical : autoMedical,
      food: manualNeeds.food !== null ? manualNeeds.food : autoFood,
    };
  };

  const activeNeeds = detectNeeds();

  const getWhatsAppTemplateMessage = () => {
    const pName = selectedProfile ? selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant' : 'Participant';
    
    const resourceBlocks: string[] = [];
    if (activeNeeds.shelter) {
      resourceBlocks.push(`📍 *For Safe Accommodation & Shelter Tonight:*\nFind an immediate safe space to sleep through the PEERS Network partners: 👉 https://www.msf.gov.sg/what-we-do/rough-sleepers`);
    }
    if (activeNeeds.financial) {
      resourceBlocks.push(`💰 *For Urgent Financial Aid & Social Support:*\nLocate your nearest Social Service Office (SSO) to walk in for ComCare assistance: 👉 https://www.supportgowhere.gov.sg`);
    }
    if (activeNeeds.medical) {
      resourceBlocks.push(`🏥 *For Free Medical Care & Check-ups:*\nVisit a mobile or community outreach clinic for free healthcare: 👉 https://mtalvernia.sg/outreach/`);
    }
    if (activeNeeds.food) {
      resourceBlocks.push(`🍲 *For Free Daily Meals & Food Packs:*\nFind free hot meals and soup kitchens in your immediate area: 👉 Home - The Food Bank Singapore`);
    }

    const dynamic_resource_list = resourceBlocks.length > 0 
      ? resourceBlocks.join('\n\n')
      : `_No immediate emergency resources selected. Use the toggles below to add resources._`;

    return `Hi ${pName}, it was really nice chatting with you just now. Thank you for sharing your story with us.\n\n` +
      `Our system is currently processing your information to match you with the best financial, housing, and social support workflows.\n\n` +
      `While we finalize your application and prepare your next steps, here is a list of immediate resources tailored to your situation that you can approach right away:\n\n` +
      `${dynamic_resource_list}\n\n` +
      `Please take care, and our team will text you an update right here as soon as your primary application details are verified! If you need anything urgent in the meantime, feel free to reply to this message.`;
  };

  const getWhatsAppTemplateLink = () => {
    const text = getWhatsAppTemplateMessage();
    const encodedText = encodeURIComponent(text);
    const cleanedPhone = cleanPhoneNumber(participantPhone);
    if (cleanedPhone) {
      return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
    }
    return `https://wa.me/?text=${encodedText}`;
  };

  const getCAREOFollowUpPrompt = () => {
    const pName = selectedProfile ? selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant' : 'Participant';
    const emailField = survey?.questions.find(q => q.fieldName.toLowerCase().includes('email'))?.fieldName || '';
    const participantEmail = selectedProfile ? selectedProfile.responses[emailField] || `${pName.toLowerCase().replace(/\s+/g, '.')}@gmail.com` : 'N/A';
    
    const detectedNeedsList: string[] = [];
    if (activeNeeds.shelter) detectedNeedsList.push("Shelter/Housing Need");
    if (activeNeeds.financial) detectedNeedsList.push("Financial/SSO Need");
    if (activeNeeds.medical) detectedNeedsList.push("Medical Need");
    if (activeNeeds.food) detectedNeedsList.push("Food Insecurity");
    const hasJobReferral = matchedReferrals.some(r => r.category.toLowerCase().includes('job') || r.category.toLowerCase().includes('upskill') || r.initiativeTitle.toLowerCase().includes('skillsfuture') || r.initiativeTitle.toLowerCase().includes('career'));
    if (hasJobReferral) detectedNeedsList.push("Job Support & Upskilling");

    const detectedNeedsStr = detectedNeedsList.length > 0 ? detectedNeedsList.join(', ') : 'None explicitly detected';
    
    const responsesList = survey?.questions.map(q => `- ${q.fieldName}: ${selectedProfile?.responses[q.fieldName] || '—'}`).join('\n') || '';
    const matchedSchemesList = matchedReferrals.map(ref => `- ${ref.initiativeTitle} (${ref.category}): ${ref.matchReason} [Priority: ${ref.priority}]`).join('\n') || 'None matched';
    const dispatchHistoryList = selectedProfile?.dispatchedEmails && selectedProfile.dispatchedEmails.length > 0
      ? selectedProfile.dispatchedEmails.map(log => `- Sent ${log.recipientType} Email to ${log.recipient} on ${new Date(log.timestamp).toLocaleDateString()}: "${log.subject}"`).join('\n')
      : 'No outreach emails dispatched yet';

    return `You are an AI outreach and follow-up assistant helping a community surveyor.

You are receiving structured CARE-O data from the Conversational Assessment & Routing Engine for Outreach.

CARE-O helps surveyors conduct conversational assessments, extract participant needs, match support schemes, and prepare follow-up workflows.

Please use the participant profile below to generate practical follow-up materials for both:
1. the surveyor/outreach worker, and
2. the surveyee/participant.

Important rules:
- Be warm, respectful, concise, and non-judgmental.
- Do not invent facts that are not present in the CARE-O context.
- Clearly mark assumptions.
- Do not promise that support is guaranteed.
- Do not diagnose medical, legal, financial, or mental health conditions.
- If urgent risk is detected, recommend human review.
- Participant-facing messages should be simple, reassuring, and easy to act on.
- Surveyor-facing messages can be structured and operational.
- If participant email is available, draft an email follow-up.
- If participant phone/WhatsApp is available, draft a WhatsApp/SMS follow-up.
- If contact information is missing, still draft the message body and note that contact details are missing.

CARE-O CONTEXT

Participant Name:
${pName}

Participant Phone / WhatsApp:
${participantPhone || 'Not Provided'}

Participant Email:
${participantEmail}

Survey Name:
${survey?.name || 'Community Assessment'}

Profile Date:
${selectedProfile ? new Date(selectedProfile.timestamp).toLocaleDateString() : 'N/A'}

Profile Completeness:
${selectedProfile?.completeness || 0}%

Detected Needs:
${detectedNeedsStr}

Interviewer Notes:
${selectedProfile?.interviewerNotes || 'None'}

Survey Responses:
${responsesList}

Matched Support Schemes:
${matchedSchemesList}

Existing Outreach / Dispatch History:
${dispatchHistoryList}

IMMEDIATE RESOURCE RULES

If the CARE-O context suggests housing, shelter, homelessness, rough sleeping, unsafe accommodation, eviction, or urgent accommodation need, include this resource:

📍 Safe Accommodation & Shelter:
Find an immediate safe space to sleep through the PEERS Network partners:
https://www.msf.gov.sg/what-we-do/rough-sleepers

If the CARE-O context suggests financial need, low income, no income, unemployment, debt, bills, urgent aid, rent, utilities, ComCare, or SSO need, include this resource:

💰 Financial Aid & Social Support:
Locate your nearest Social Service Office to walk in for ComCare assistance:
https://www.supportgowhere.gov.sg

If the CARE-O context suggests medical, health, clinic, hospital, medication, check-up, injury, illness, or healthcare need, include this resource:

🏥 Medical Care & Check-ups:
Visit a mobile or community outreach clinic for free healthcare:
https://mtalvernia.sg/outreach/

If the CARE-O context suggests food insecurity, skipped meals, hunger, groceries, food packs, free meals, or soup kitchen need, include this resource:

🍲 Food Support:
Find food support and food bank resources:
https://www.foodbank.sg

If the CARE-O context suggests job search, employment, career transition, training, upskilling, or reskilling need, include this resource:

🎓 Job Support & Upskilling:
Explore SkillsFuture and career transition support:
https://www.skillsfuture.gov.sg

TASKS

Please generate the following:

1. Internal case summary for the surveyor.
2. Key needs and risk factors.
3. Recommended next steps for the surveyor.
4. Missing information the surveyor should collect.
5. WhatsApp/SMS follow-up message for the participant.
6. Email follow-up draft for the participant, if email is available.
7. Regular check-in messages for Day 1, Day 3, Day 7, and Day 14.
8. Immediate resource reminder based on detected needs.
9. Suggested future update schedule.
10. Escalation review with level: Low, Medium, High, or Urgent.

OUTPUT FORMAT

## 1. Internal Case Summary
Summarize the participant’s situation in 4-6 concise bullet points.

## 2. Key Needs and Risk Factors
List detected needs and any risk factors. Separate confirmed facts from assumptions.

## 3. Surveyor Next Steps
Give a practical checklist for the surveyor/outreach worker.

## 4. Missing Information to Collect
List any important gaps in the participant profile.

## 5. WhatsApp/SMS Follow-up Message
Draft a warm, short participant-facing message. Thank them for sharing, explain that the team is reviewing next steps, include immediate resources if relevant, and invite them to reply if anything urgent changes.

## 6. Email Follow-up Draft
If participant email is available, draft:
Subject:
Body:

If email is not available, write:
"No participant email was provided. Draft body below for manual use:"
Then provide the email body.

## 7. Regular Check-in Messages

### Day 1 Check-in
Short message.

### Day 3 Check-in
Short message.

### Day 7 Check-in
Short message.

### Day 14 Check-in
Short message.

## 8. Immediate Resource Reminder
List only the resources relevant to the participant’s detected needs. If no urgent category is detected, suggest SupportGoWhere as a general resource.

## 9. Future Update Schedule
Suggest when the surveyor should next contact the participant and what each update should cover.

## 10. Escalation Review
Level: Low / Medium / High / Urgent
Reasoning:
Recommended human follow-up:`;
  };

  const downloadCAREOFollowUpPrompt = () => {
    const pName = selectedProfile ? selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant' : 'Participant';
    const payload = getCAREOFollowUpPrompt();
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `care-o-followup-prompt-${pName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cleanPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.length === 8 && /^[89]/.test(cleaned)) {
      return `65${cleaned}`;
    }
    return cleaned;
  };

  const phoneField = survey?.questions.find(q => {
    const name = q.fieldName.toLowerCase();
    return name.includes('phone') || name.includes('contact') || name.includes('mobile') || name.includes('number');
  })?.fieldName || '';
  const participantPhone = selectedProfile && phoneField ? selectedProfile.responses[phoneField] || '' : '';

  const getWhatsAppLink = (init: CommunityInitiative, phone: string) => {
    const pName = selectedProfile ? selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant' : 'Participant';
    const text = `Hi ${pName}! Here are the details of the support program we discussed:\n\n` +
      `*${init.title}*\n` +
      `${init.description}\n\n` +
      (init.contactPhone ? `📞 Phone: ${init.contactPhone}\n` : '') +
      (init.contactEmail ? `✉️ Email: ${init.contactEmail}\n` : '') +
      (init.website ? `🌐 Website: ${init.website}\n` : '') +
      `\nFeel free to reach out to them directly or let me know if you need help with application!`;
      
    const encodedText = encodeURIComponent(text);
    const cleanedPhone = cleanPhoneNumber(phone);
    if (cleanedPhone) {
      return `https://wa.me/${cleanedPhone}?text=${encodedText}`;
    }
    return `https://wa.me/?text=${encodedText}`;
  };

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
          const initDetails = initiatives?.find(i => i.id === ref.initiativeId);
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
              
              {initDetails && (initDetails.contactPhone || initDetails.contactEmail || initDetails.website) && (
                <div className="mt-3 text-[10px] text-white/70 bg-slate-950/40 border border-white/5 p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-blue-400 tracking-wider">
                    <span>Quick Contact Info</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const pName = selectedProfile ? selectedProfile.responses[survey?.questions[0]?.fieldName || ''] || 'Participant' : 'Participant';
                          const text = `Hi ${pName}! Here is the contact info for ${initDetails.title}:\n\n` +
                            `*${initDetails.title}*\n` +
                            `${initDetails.description}\n\n` +
                            (initDetails.contactPhone ? `📞 Phone: ${initDetails.contactPhone}\n` : '') +
                            (initDetails.contactEmail ? `✉️ Email: ${initDetails.contactEmail}\n` : '') +
                            (initDetails.website ? `🌐 Website: ${initDetails.website}\n` : '');
                          navigator.clipboard.writeText(text);
                          alert(`Copied contact details for ${initDetails.title}!`);
                        }}
                        className="px-1.5 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded transition-all font-bold text-[7px] tracking-tight"
                      >
                        Copy Msg
                      </button>
                      <a
                        href={getWhatsAppLink(initDetails, participantPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-1.5 py-0.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-all font-bold text-[7px] tracking-tight flex items-center gap-1 border border-green-500/10"
                      >
                        <WhatsAppIcon size={9} />
                        <span>Send WhatsApp</span>
                      </a>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 font-medium">
                    {initDetails.contactPhone && (
                      <a href={`tel:${initDetails.contactPhone}`} onClick={e => e.stopPropagation()} className="hover:text-white flex items-center gap-1 transition-all text-white/80">
                        <span>📞</span> <span className="underline">{initDetails.contactPhone}</span>
                      </a>
                    )}
                    {initDetails.contactEmail && (
                      <a href={`mailto:${initDetails.contactEmail}`} onClick={e => e.stopPropagation()} className="hover:text-white flex items-center gap-1 transition-all text-white/80">
                        <span>✉️</span> <span className="underline truncate max-w-[120px]">{initDetails.contactEmail}</span>
                      </a>
                    )}
                    {initDetails.website && (
                      <a href={initDetails.website.startsWith('http') ? initDetails.website : `https://${initDetails.website}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="hover:text-white flex items-center gap-1 transition-all text-white/80 truncate max-w-[120px]">
                        <span>🌐</span> <span className="underline">{initDetails.website}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

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

      {/* AI-Automated WhatsApp Outreach Card */}
      <div className="glass-card rounded-[2rem] p-6 space-y-4 border border-white/5 text-left font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WhatsAppIcon size={18} className="text-green-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">AI WhatsApp Template</h3>
          </div>
          <span className="text-[8px] font-black uppercase bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Auto-Assessed</span>
        </div>

        <p className="text-[10px] text-white/60 leading-normal">
          Based on responses and matches, we dynamically generate a tailored resource text message. Toggle options below to manually include or exclude immediate emergency support lines.
        </p>

        {/* Dynamic Need Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            { key: 'shelter' as const, label: 'Shelter & Housing', emoji: '📍' },
            { key: 'financial' as const, label: 'Urgent Financial Aid', emoji: '💰' },
            { key: 'medical' as const, label: 'Free Medical Care', emoji: '🏥' },
            { key: 'food' as const, label: 'Free Daily Meals', emoji: '🍲' }
          ].map(need => {
            const val = activeNeeds[need.key];
            const isOverridden = manualNeeds[need.key] !== null;

            return (
              <button
                key={need.key}
                onClick={() => {
                  setManualNeeds(prev => ({
                    ...prev,
                    [need.key]: manualNeeds[need.key] === null ? !val : manualNeeds[need.key] ? false : manualNeeds[need.key] === false ? null : false
                  }));
                }}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  val 
                    ? 'bg-green-500/10 border-green-500/35 text-white' 
                    : 'bg-white/5 border-white/10 text-white/50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs">{need.emoji}</span>
                  <span className={`text-[7px] font-black uppercase px-1 rounded ${
                    isOverridden 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : val 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-white/10 text-white/40'
                  }`}>
                    {isOverridden ? 'Manual' : val ? 'Detected' : 'Off'}
                  </span>
                </div>
                <span className="text-[9px] font-bold mt-1.5 leading-none">{need.label}</span>
              </button>
            );
          })}
        </div>

        {/* Message Preview Container */}
        <div className="space-y-1.5 pt-2">
          <span className="block text-[8px] font-black text-blue-400 uppercase tracking-widest">Live Template Preview</span>
          <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl text-[11px] text-white/80 font-mono leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto select-all">
            {getWhatsAppTemplateMessage()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(getWhatsAppTemplateMessage());
              alert("WhatsApp template message copied to clipboard!");
            }}
            className="flex-1 py-3 glass-button rounded-xl text-[10px] font-black uppercase text-white/90 tracking-wide hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            Copy Message
          </button>
          <a
            href={getWhatsAppTemplateLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <WhatsAppIcon size={12} />
            <span>Send WhatsApp</span>
          </a>
        </div>
      </div>

      {/* CARE-O AI Follow-up Prompt Card */}
      <div className="glass-card rounded-[2rem] p-6 space-y-4 border border-white/5 text-left font-sans">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-purple-400 animate-pulse" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider text-purple-300">CARE-O AI Follow-up Prompt</h3>
          </div>
          <span className="text-[8px] font-black uppercase bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Prompt Template</span>
        </div>

        <p className="text-[10px] text-white/60 leading-normal">
          Generate a structured prompt you can paste into ChatGPT or Chatchat to draft follow-ups, check-ins, resource reminders, email drafts, and surveyor next steps.
        </p>

        {/* Payload Preview */}
        <div className="space-y-1.5 pt-1">
          <span className="block text-[8px] font-black text-purple-400 uppercase tracking-widest">Follow-up Prompt Preview</span>
          <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl text-[10px] text-white/70 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto select-all">
            {getCAREOFollowUpPrompt()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={() => {
              navigator.clipboard.writeText(getCAREOFollowUpPrompt());
              alert("CARE-O Follow-up Prompt copied to clipboard!");
            }}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <span>Copy CARE-O Follow-up Prompt</span>
          </button>
          <button
            onClick={downloadCAREOFollowUpPrompt}
            className="py-3 px-4 glass-button rounded-xl text-[10px] font-black uppercase text-white/80 hover:text-white transition-all flex items-center justify-center"
            title="Download Prompt as TXT"
          >
            <Download size={14} />
          </button>
        </div>
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
