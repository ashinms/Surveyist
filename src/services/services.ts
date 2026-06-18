import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import Groq from 'groq-sdk';
import { Survey, CoachingOverview, QuestionCoaching, RecordingAnalysis, CommunityInitiative, ReferralRecommendation, ParticipantProfile, CumulativeInsights } from '../types/survey';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/* ==========================================
   1. FILE PARSER SERVICE
   ========================================== */
export interface ParsedDocument {
  text: string;
  fileName: string;
  fileType: string;
  success: boolean;
  error?: string;
}

export class FileParser {
  private async parseDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  private async parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    return fullText.trim();
  }

  private async parseTxt(file: File): Promise<string> {
    return await file.text();
  }

  async parseFile(file: File): Promise<ParsedDocument> {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

    try {
      let text = '';
      switch (fileExtension) {
        case 'docx':
          text = await this.parseDocx(file);
          break;
        case 'pdf':
          text = await this.parsePdf(file);
          break;
        case 'txt':
          text = await this.parseTxt(file);
          break;
        default:
          throw new Error(`Unsupported file type: .${fileExtension}`);
      }

      return { text: text.trim(), fileName, fileType: fileExtension, success: true };
    } catch (error) {
      return {
        text: '',
        fileName,
        fileType: fileExtension,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = ['docx', 'pdf', 'txt'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedTypes.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type .${fileExtension} not supported. Use .docx, .pdf, or .txt.`
      };
    }
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit.' };
    }
    return { valid: true };
  }
}
export const fileParser = new FileParser();

/* ==========================================
   2. SPEECH SERVICE
   ========================================== */
export interface SpeechService {
  startListening(onTranscript: (t: string) => void): Promise<void>;
  stopListening(): Promise<string>;
  speak(text: string): Promise<void>;
  stopSpeaking(): void;
  isAvailable(): boolean;
}

export class WebSpeechService implements SpeechService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private synthesis: SpeechSynthesis;
  private onTranscriptCallback: ((t: string) => void) | null = null;
  private recognition: any = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
  }

  async startListening(onTranscript: (t: string) => void): Promise<void> {
    this.audioChunks = [];
    this.onTranscriptCallback = onTranscript;
    onTranscript("Listening... Start speaking to see live transcription.");

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const rec = new SpeechRecognitionClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (this.onTranscriptCallback && transcript.trim()) {
            this.onTranscriptCallback(transcript);
          }
        };
        rec.onerror = (err: any) => console.error("SpeechRecognition error:", err);
        rec.start();
        this.recognition = rec;
      } catch (e) {
        console.warn("Failed to initialize native SpeechRecognition:", e);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };
      this.mediaRecorder.start(250);
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      throw err;
    }
  }

  async stopListening(): Promise<string> {
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
      this.recognition = null;
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        resolve("");
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const stream = this.mediaRecorder?.stream;
          stream?.getTracks().forEach(track => track.stop());

          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
          if (audioBlob.size < 100) {
            resolve("");
            return;
          }

          if (this.onTranscriptCallback) {
            this.onTranscriptCallback("Processing high-quality transcription with AI...");
          }

          const ext = (this.mediaRecorder?.mimeType || 'audio/webm').split(';')[0].split('/')[1] || 'webm';
          const audioFile = new File([audioBlob], `recording.${ext}`, { type: audioBlob.type });

          const apiKey = import.meta.env.VITE_GROQ_API_KEY;
          if (!apiKey) throw new Error("VITE_GROQ_API_KEY missing");

          const formData = new FormData();
          formData.append('file', audioFile);
          formData.append('model', 'whisper-large-v3');

          const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: formData
          });

          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error?.message || `HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          resolve((result.text || "").trim());
        } catch (error) {
          console.error("Groq Whisper failed:", error);
          reject(error);
        }
      };
      this.mediaRecorder.stop();
    });
  }

  async speak(text: string): Promise<void> {
    if (!this.synthesis) return;
    return new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => resolve();
      u.onerror = () => resolve();
      this.synthesis.speak(u);
    });
  }

  stopSpeaking(): void {
    if (this.synthesis) this.synthesis.cancel();
  }

  isAvailable(): boolean { return true; }
}
export const createSpeechService = (): SpeechService => new WebSpeechService();

/* ==========================================
   3. AI SERVICE INTERFACE & ENGINES
   ========================================== */
export interface AIService {
  parseSurvey(text: string): Promise<Survey>;
  generateCoachingOverview(survey: Survey): Promise<CoachingOverview>;
  generateQuestionCoaching(survey: Survey): Promise<QuestionCoaching[]>;
  generateSingleQuestionCoaching(questionId: string, questionText: string): Promise<QuestionCoaching>;
  analyzeTranscript(transcript: string, survey: Survey): Promise<RecordingAnalysis>;
  generatePracticeResponse(userMessage: string, survey: Survey, history: any, persona?: string): Promise<string>;
  generatePracticeFeedback(transcript: string, survey: Survey, coachPersona?: string): Promise<any>;
  matchReferrals(responses: Record<string, string>, initiatives: CommunityInitiative[], interviewerNotes?: string): Promise<ReferralRecommendation[]>;
  scourInitiativesForSurvey(survey: Survey): Promise<CommunityInitiative[]>;
  generateCumulativeInsights(profiles: ParticipantProfile[], survey: Survey): Promise<CumulativeInsights>;
}

const MOCK_LOOKUPS = {
  name: {
    phrasings: ['May I know who I have the pleasure of speaking with today?', 'Could you share your name with me?'],
    mistakes: ['Mispronouncing the participant\'s name without checking.', 'Sounding transactional or rushed when introducing yourself.'],
    tips: ['Ask how they prefer to be addressed.', 'Use their name naturally later to build rapport.']
  },
  income: {
    phrasings: ['If comfortable sharing, which bracket does your monthly income fall into?', 'To help match schemes, could you share your approximate income range?'],
    mistakes: ['Sounding judgmental or embarrassed when asking about finances.', 'Pressuring the participant if they hesitate to share.'],
    tips: ['Emphasize that all details are kept strictly confidential.', 'If they decline, skip to other eligibility questions.']
  },
  employment: {
    phrasings: ['What does your day-to-day look like at the moment in terms of work?', 'Could you tell me a bit about your current job or employment situation?'],
    mistakes: ['Making assumptions about employment stability.', 'Sounding dismissive or awkward if they mention being unemployed.'],
    tips: ['Ask how long they have been in this role.', 'Probe if they are interested in upskilling or job placement.']
  },
  digital: {
    phrasings: ['How reliable would you say your internet connection and devices are?', 'Do you feel you have the digital access and tools you need?'],
    mistakes: ['Assuming familiarity with technical terms.', 'Overlooking subtle barriers like sharing a single phone in a family.'],
    tips: ['Ask what devices they use most often.', 'Inquire if anyone needs devices for school or remote work.']
  },
  age: {
    phrasings: ['To help categorize feedback, what age bracket do you belong to?', 'Would you mind sharing which age range you fall into?'],
    mistakes: ['Asking for exact birth year too abruptly.', 'Showing surprise or making ageist remarks.'],
    tips: ['Remind them they can select a broad bracket.', 'Thank them and proceed smoothly.']
  }
};

export class MockAIService implements AIService {
  async parseSurvey(_text: string): Promise<Survey> {
    return {
      id: `survey-${Date.now()}`,
      name: 'Community Support & Needs Assessment Survey',
      questions: [
        { id: 'q1', fieldName: 'What is your full name?', type: 'string' },
        { id: 'q2', fieldName: 'What is your age?', type: 'string' },
        { id: 'q3', fieldName: 'What is your current employment status? (Options: Employed, Unemployed, Retired)', type: 'enum', options: ['Employed', 'Unemployed', 'Retired'] },
        { id: 'q4', fieldName: 'Rate your access to reliable digital services at home (1-5)?', type: 'enum', options: ['1 - Poor', '3 - Moderate', '5 - Excellent'] },
        { id: 'q5', fieldName: 'What is your monthly household income bracket?', type: 'enum', options: ['Under $1900', '$1900 - $3000', 'Over $3000'] }
      ]
    };
  }

  async generateCoachingOverview(survey: Survey): Promise<CoachingOverview> {
    return {
      surveyName: survey.name,
      totalQuestions: survey.questions.length,
      estimatedDuration: '5 minutes',
      surveyFlow: ['Rapport Building', 'Core Questions', 'Closing Feedback'],
      conversationalApproach: 'Establish high rapport by listening carefully and validating participant hardships.',
      participantPersona: 'A natural, responsive Singapore resident looking for support.',
      coachPersona: 'Rigorous and critical interviewer coach. Evaluate conversational flow, question clarity, and empathy.'
    };
  }

  async generateQuestionCoaching(survey: Survey): Promise<QuestionCoaching[]> {
    return Promise.all(survey.questions.map(q => this.generateSingleQuestionCoaching(q.id, q.fieldName)));
  }

  async generateSingleQuestionCoaching(questionId: string, questionText: string): Promise<QuestionCoaching> {
    const qText = questionText.toLowerCase();
    let data = {
      phrasings: ['How would you describe your situation with this in your own words?', 'If you don\'t mind sharing, could you tell me a bit about this?'],
      mistakes: ['Asking in a rigid, robotic tone.', 'Rushing past their response without acknowledging it.'],
      tips: ['Validate their response and ask how it impacts their life.', 'Ask if they could share a brief example.']
    };

    if (qText.includes('name')) data = MOCK_LOOKUPS.name;
    else if (qText.includes('income') || qText.includes('$') || qText.includes('earn')) data = MOCK_LOOKUPS.income;
    else if (qText.includes('employment') || qText.includes('work') || qText.includes('job')) data = MOCK_LOOKUPS.employment;
    else if (qText.includes('digital') || qText.includes('internet') || qText.includes('device')) data = MOCK_LOOKUPS.digital;
    else if (qText.includes('age') || qText.includes('year') || qText.includes('old')) data = MOCK_LOOKUPS.age;

    return {
      questionId,
      question: questionText,
      naturalPhrasing: data.phrasings,
      commonMistakes: data.mistakes,
      followUpTips: data.tips,
      stealthIntegration: "Integrate this question casually during rapport building or when discussing their general background rather than asking it directly."
    };
  }

  async analyzeTranscript(_t: string, survey: Survey): Promise<RecordingAnalysis> {
    const extracted: Record<string, string> = {};
    if (survey && survey.questions) {
      survey.questions.forEach((q, idx) => {
        if (idx === 0) extracted[q.fieldName] = "Alex Chen";
        else if (idx === 1) extracted[q.fieldName] = "34";
        else if (q.fieldName.toLowerCase().includes('income') || q.fieldName.toLowerCase().includes('salary')) extracted[q.fieldName] = "$1,500";
        else if (q.fieldName.toLowerCase().includes('employment') || q.fieldName.toLowerCase().includes('job')) extracted[q.fieldName] = "Unemployed";
        else extracted[q.fieldName] = `Mock response for ${q.fieldName}`;
      });
    }

    return {
      score: 85,
      answeredQuestions: survey?.questions.map(q => q.fieldName) || [],
      unansweredQuestions: [],
      unclearQuestions: [],
      extractedResponses: extracted,
      improvementAnalysis: {
        strengths: ['Active listening', 'Polite tone'],
        weaknesses: ['Missed standard phrasing templates'],
        actionableTips: ['Confirm participant details clearly']
      },
      detailedFeedback: [
        { category: 'Conversational Flow', score: 88, feedback: 'Great flow, allowed the participant to share their stories without interruption.' },
        { category: 'Clarity & Rephrasing', score: 80, feedback: 'Rephrased questions well, though a few standard prompts could be tighter.' },
        { category: 'Empathy & Active Listening', score: 90, feedback: 'Validated answers and showed strong emotional support.' }
      ]
    };
  }

  async generatePracticeResponse(_m: string, _s: Survey, _h: any, _p?: string): Promise<string> {
    return 'I see. Can you tell me what the next step is?';
  }

  async generatePracticeFeedback(_t: string, survey: Survey, _cp?: string): Promise<any> {
    return {
      overallScore: 85,
      duration: '5 minutes',
      questionsAsked: 5,
      totalQuestions: survey.questions.length,
      strengths: ['Clear communication', 'Active listening', 'Empathetic tone'],
      improvements: ['Maintain eye contact', 'Avoid interrupting', 'Ask more open‑ended follow‑ups'],
      detailedFeedback: [
        { category: 'Rapport & Empathy', score: 88, feedback: 'Great warmth and tone. You made the participant feel respected and safe.', suggestions: ['Try using more reflective affirmations like "That sounds challenging, thank you for sharing."'] },
        { category: 'Pacing & Conversational Flow', score: 75, feedback: 'Generally good tempo, but you occasionally rushed into the next question without letting the participant expand.', suggestions: ['Allow 2-3 seconds of silence after a participant stops talking to give them space for deeper responses.'] },
        { category: 'Question Phrasing & Clarity', score: 70, feedback: 'You read some questions word-for-word, which felt a bit transactional.', suggestions: ['Focus on stealth integration; rephrase questions naturally into the conversation instead of reading from the template.'] },
        { category: 'Active Probing & Follow-up', score: 62, feedback: 'When the respondent mentioned income strain, you skipped straight to digital literacy instead of probing for details.', suggestions: ['Ask soft follow-ups like "Could you share a bit more about what makes that difficult?" when they signal distress.'] },
        { category: 'Questionnaire Coverage', score: 80, feedback: 'You successfully completed most of the key fields in the questionnaire.', suggestions: ['Ensure that you cover the optional feedback question at the end if time permits.'] }
      ]
    };
  }

  async matchReferrals(_responses: Record<string, string>, initiatives: CommunityInitiative[], _interviewerNotes?: string): Promise<ReferralRecommendation[]> {
    if (initiatives.length === 0) return [];
    return [{
      initiativeId: initiatives[0].id,
      initiativeTitle: initiatives[0].title,
      category: initiatives[0].category,
      matchReason: "Based on their challenges, this program is highly recommended.",
      priority: "High"
    }];
  }

  async scourInitiativesForSurvey(survey: Survey): Promise<CommunityInitiative[]> {
    return [
      { id: `init-mock-1`, title: `Financial Support for ${survey.name}`, category: 'Financial Bursary', description: 'Mock financial program related to the survey topics.', eligibility: 'Assessed based on questionnaire outcome.' },
      { id: `init-mock-2`, title: `Upskilling Program for ${survey.name}`, category: 'Upskilling', description: 'Mock training and placement classes.', eligibility: 'Unemployed or low-income residents.' }
    ];
  }

  async generateCumulativeInsights(profiles: ParticipantProfile[], survey: Survey): Promise<CumulativeInsights> {
    const totalCount = profiles.length;
    const surveyName = survey?.name || 'Community Needs Assessment';
    return {
      executiveSummary: `This cumulative analysis compiles feedback from ${totalCount} respondent${totalCount === 1 ? '' : 's'} who completed the ${surveyName}. The data points to a high prevalence of financial stress due to inflation, coupled with low awareness of digital training programs among senior participants. Immediate community-level intervention is recommended to bridge these resource gaps.`,
      commonProblems: [
        {
          problemName: "Cost of Living & Food Inflation",
          description: "Respondents report struggling to afford basic household items and groceries, leading to severe budgeting constraints.",
          prevalencePercentage: totalCount > 0 ? 65 : 0,
          severity: "High"
        },
        {
          problemName: "Lack of Digital Literacy & Device Access",
          description: "Frail and elderly participants express low confidence in navigating smartphones or online services, which isolates them from modern digital infrastructure.",
          prevalencePercentage: totalCount > 0 ? 45 : 0,
          severity: "Medium"
        },
        {
          problemName: "Employment Disruption & Low Wage Stagnation",
          description: "Working-age respondents face unstable work arrangements or require upskilling support to transition into higher-paying, stable jobs.",
          prevalencePercentage: totalCount > 0 ? 35 : 0,
          severity: "High"
        }
      ],
      correlations: [
        "Elderly respondents over the age of 60 correlate heavily (85%) with lack of digital literacy and device sharing.",
        "Underemployed households are 3x more likely to need ComCare short-to-medium term assistance.",
        "A strong pattern shows childcare demands are preventing female heads of households from taking full-time job roles."
      ],
      proactiveInitiatives: [
        {
          id: "pro-1",
          title: "Block-by-Block Digital Literacy Helpdesks",
          description: "Deploy youth volunteers to block void decks on weekends to help seniors download municipal apps and claim CDC vouchers.",
          completed: false
        },
        {
          id: "pro-2",
          title: "Bulk Purchase Food Distribution Drive",
          description: "Partner with a local charity to distribute dry ration bags monthly to residents flagged as high-need financial bursary candidates.",
          completed: false
        },
        {
          id: "pro-3",
          title: "SkillsFuture Career Caravan",
          description: "Organize a mobile career counseling and training enrolment booth inside the community center during the upcoming roadshow.",
          completed: false
        }
      ]
    };
  }
}

export class GroqService implements AIService {
  private groq: Groq | null = null;
  private mockService = new MockAIService();

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('VITE_GROQ_API_KEY missing, GroqService falling back to MockAIService');
    } else {
      try {
        this.groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
      } catch (e) {
        console.error('Failed to initialize Groq client, falling back to MockAIService', e);
      }
    }
  }

  private parseResponse<T>(content: string | null): T {
    if (!content) return {} as T;
    try {
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(content.substring(start, end + 1).replace(/[\u0000-\u001F\u007F-\u009F]/g, ''));
      }
      return JSON.parse(content);
    } catch {
      return {} as T;
    }
  }

  private async callGroqJSON<T>(apiCall: () => Promise<any>, fallbackCall: () => Promise<T>, methodName: string): Promise<T> {
    if (!this.groq) return fallbackCall();
    const maxRetries = 3;
    let delay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await apiCall();
        const content = response.choices[0].message.content;
        const res = this.parseResponse<T>(content);
        if (res && Object.keys(res).length > 0) return res;
      } catch (err: any) {
        if (attempt === maxRetries) break;
        const waitTime = (err?.status === 429 || err?.message?.includes('429')) ? delay * 2.5 : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= 2;
      }
    }
    return fallbackCall();
  }

  private async callGroqString(apiCall: () => Promise<any>, fallbackCall: () => Promise<string>, methodName: string): Promise<string> {
    if (!this.groq) return fallbackCall();
    const maxRetries = 3;
    let delay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await apiCall();
        const content = response.choices[0].message.content;
        if (content) return content;
      } catch (err: any) {
        if (attempt === maxRetries) break;
        const waitTime = (err?.status === 429 || err?.message?.includes('429')) ? delay * 2.5 : delay;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= 2;
      }
    }
    return fallbackCall();
  }

  async parseSurvey(text: string): Promise<Survey> {
    return this.callGroqJSON<any>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Strict, literal information extraction bot. JSON only.' },
          {
            role: 'user',
            content: `Task: Extract a complete, ordered list of survey questions from the raw document text: "${text}".
Guidelines:
1. ONLY extract questions that appear verbatim in the text. Do NOT invent, infer, or add any questions.
2. Provide a concise, professional survey name based on its purpose.
3. For each question, output:
   - "id": a unique identifier (e.g., "q1").
   - "fieldName": the exact question text as it appears.
   - "type": "string" unless the question includes explicit multiple‑choice options, in which case use "enum" and list the options array.
JSON format:
{
  "name": "Professional Survey Title",
  "questions": [
    { "id": "q1", "fieldName": "What is your name?", "type": "string" }
  ]
}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.parseSurvey(text),
      'parseSurvey'
    ).then(res => ({
      id: `survey-${Date.now()}`,
      name: res.name || 'Survey',
      questions: (Array.isArray(res.questions) ? res.questions : []).map((q: any, i: number) => ({
        ...q,
        id: `q${i + 1}`,
        fieldName: q.fieldName || `Question ${i + 1}`
      }))
    }));
  }

  async generateCoachingOverview(survey: Survey): Promise<CoachingOverview> {
    return this.callGroqJSON<CoachingOverview>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an expert conversational designer and interviewer coach. JSON only.' },
          {
            role: 'user',
            content: `Design a detailed training lab strategy for survey: "${survey.name}" (questions: ${JSON.stringify(survey.questions)}). 
Guidelines:
1. Participant persona: background, Demographics, attitude, typical answers, and enforce a rule to NEVER break character, never mention AI.
2. Coach persona: define explicit grading criteria with Empathy, active listening, bias avoidance.
3. Interview flow: define 4-5 named steps with descriptions.
4. Estimated duration: calculate minutes based on average speaking rate of 130 wpm.
Return ONLY pure JSON matching this schema:
{
  "surveyName": "${survey.name}",
  "totalQuestions": ${survey.questions.length},
  "estimatedDuration": "<numeric> minutes",
  "surveyFlow": ["Step 1", "Step 2"],
  "conversationalApproach": "2-3 sentence advice.",
  "participantPersona": "2-3 sentence description.",
  "coachPersona": "2-3 sentence grading criteria."
}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.generateCoachingOverview(survey),
      'generateCoachingOverview'
    ).then(res => {
      res.surveyFlow = this.normalizeSurveyFlow(res.surveyFlow);
      if (res.estimatedDuration) {
        const raw = String(res.estimatedDuration);
        const match = raw.match(/([0-9.]+)/);
        if (match) {
          const num = Math.round(parseFloat(match[1]));
          res.estimatedDuration = `${num} minutes`;
        }
      }
      if (!res.participantPersona) {
        res.participantPersona = `Realistic roleplay participant for ${survey.name}. Be natural, brief, and authentic to a real human respondent without sounding like an AI assistant.`;
      } else if (typeof res.participantPersona === 'object') {
        res.participantPersona = JSON.stringify(res.participantPersona, null, 2);
      }
      if (!res.coachPersona) {
        res.coachPersona = `Rigorous coach. AUTHENTIC evaluation. JSON only.`;
      } else if (typeof res.coachPersona === 'object') {
        res.coachPersona = JSON.stringify(res.coachPersona, null, 2);
      }
      return res;
    });
  }

  private normalizeSurveyFlow(flow: any): string[] {
    if (!flow) return ["Intro", "Core", "Probing", "Closing"];
    if (Array.isArray(flow)) {
      return flow.map((item) => {
        if (!item) return "";
        if (typeof item === 'string') {
          try {
            const trimmed = item.trim();
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              const parsed = JSON.parse(trimmed);
              const stepName = parsed.id || parsed.stepName || parsed.name || parsed.step || parsed.title || parsed.label || parsed.phase || '';
              const desc = parsed.description || parsed.desc || parsed.explanation || '';
              if (stepName && desc) return `${stepName} - ${desc}`;
              if (stepName) return stepName;
              if (desc) return desc;
            }
          } catch {
            // Treat as regular string
          }
          return item;
        }
        if (typeof item === 'object') {
          const stepName = item.id || item.stepName || item.name || item.step || item.title || item.label || item.phase || '';
          const desc = item.description || item.desc || item.explanation || '';
          if (stepName && desc) {
            return `${stepName} - ${desc}`;
          }
          if (stepName) return stepName;
          if (desc) return desc;
          
          const keys = Object.keys(item);
          if (keys.length === 1) return `${keys[0]}: ${typeof item[keys[0]] === 'object' ? JSON.stringify(item[keys[0]]) : item[keys[0]]}`;
          return item.name || item.step || JSON.stringify(item);
        }
        return String(item);
      }).filter(Boolean);
    }
    return ["Intro", "Core", "Probing", "Closing"];
  }

  async generateQuestionCoaching(survey: Survey): Promise<QuestionCoaching[]> {
    return this.callGroqJSON<{ questions: any[] }>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Expert interview training assistant. JSON only.' },
          {
            role: 'user',
            content: `Generate coaching guidelines for questions:\n${survey.questions.map(q => `- [${q.id}] ${q.fieldName}`).join('\n')}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      async () => ({ questions: await this.mockService.generateQuestionCoaching(survey) }),
      'generateQuestionCoaching'
    ).then(res => (Array.isArray(res.questions) ? res.questions : []).map((q, i) => ({
      ...q,
      questionId: survey.questions[i]?.id || q.questionId
    })));
  }

  async generateSingleQuestionCoaching(questionId: string, questionText: string): Promise<QuestionCoaching> {
    return this.callGroqJSON<any>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Expert interview training assistant. You must output a JSON object containing guidelines for the interviewer. JSON only.' },
          {
            role: 'user',
            content: `For the survey question: "${questionText}" (id: ${questionId}), generate coaching advice.
Return ONLY a JSON object with this exact structure:
{
  "naturalPhrasing": [
    "A warmer or more natural way to ask this question",
    "Another conversational phrasing option"
  ],
  "commonMistakes": [
    "A mistake interviewers commonly make when asking this",
    "Another mistake to avoid"
  ],
  "followUpTips": [
    "A tip on how to handle responses or follow up",
    "Another follow-up tip"
  ],
  "stealthIntegration": "A 1-2 sentence tactical recommendation on how to weave this topic/question naturally into a conversation without sounding like reading from a survey script."
}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.generateSingleQuestionCoaching(questionId, questionText),
      'generateSingleQuestionCoaching'
    ).then(res => {
      // Normalize properties to prevent runtime TypeError crashes in the UI
      const naturalPhrasing = Array.isArray(res.naturalPhrasing) ? res.naturalPhrasing : 
                            Array.isArray(res.natural_phrasing) ? res.natural_phrasing :
                            Array.isArray(res.phrasings) ? res.phrasings : [];
                            
      const commonMistakes = Array.isArray(res.commonMistakes) ? res.commonMistakes : 
                           Array.isArray(res.common_mistakes) ? res.common_mistakes :
                           Array.isArray(res.mistakes) ? res.mistakes : [];
                           
      const followUpTips = Array.isArray(res.followUpTips) ? res.followUpTips : 
                         Array.isArray(res.follow_up_tips) ? res.follow_up_tips :
                         Array.isArray(res.tips) ? res.tips : [];

      const stealthIntegration = typeof res.stealthIntegration === 'string' ? res.stealthIntegration :
                                 typeof res.stealth_integration === 'string' ? res.stealth_integration :
                                 'Weave this topic naturally into conversation based on the participant\'s narrative.';

      return {
        questionId,
        question: questionText,
        naturalPhrasing: naturalPhrasing.length > 0 ? naturalPhrasing : ["Ask the question naturally and listen carefully."],
        commonMistakes: commonMistakes.length > 0 ? commonMistakes : ["Asking in a rigid tone."],
        followUpTips: followUpTips.length > 0 ? followUpTips : ["Acknowledge and validate the response."],
        stealthIntegration
      };
    });
  }

  async analyzeTranscript(transcript: string, survey: Survey): Promise<RecordingAnalysis> {
    const prompt = `Analyze interview transcript for survey "${survey.name}".
Transcript: "${transcript}"

Please evaluate the interviewer's performance and extract the participant's answers.

Survey Questions to extract:
${survey.questions.map(q => `- ${q.fieldName} (${q.type})`).join('\n')}

Return JSON in this format:
{
  "score": 0-100, // Quality score for the interviewer
  "answeredQuestions": ["fieldName"], 
  "unansweredQuestions": ["fieldName"],
  "unclearQuestions": ["fieldName"],
  "extractedResponses": {
    "question fieldName": "extracted answer value" // Use the exact fieldName or close match as the key
  },
  "improvementAnalysis": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "actionableTips": ["string"]
  },
  "needsAndWants": ["string"],
  "detailedFeedback": [
    { "category": "Conversational Flow", "score": 0-100, "feedback": "feedback text" },
    { "category": "Clarity & Rephrasing", "score": 0-100, "feedback": "feedback text" },
    { "category": "Empathy & Active Listening", "score": 0-100, "feedback": "feedback text" }
  ]
}`;

    return this.callGroqJSON<RecordingAnalysis>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Precise semantic text extractor and quality evaluator. JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.analyzeTranscript(transcript, survey),
      'analyzeTranscript'
    ).then(res => {
      if (res) {
        if (res.improvementAnalysis) {
          const imp = res.improvementAnalysis;
          if (Array.isArray(imp.strengths)) {
            imp.strengths = imp.strengths.map((s: any) => typeof s === 'object' ? s.description || s.text || s.strength || JSON.stringify(s) : String(s));
          }
          if (Array.isArray(imp.weaknesses)) {
            imp.weaknesses = imp.weaknesses.map((w: any) => typeof w === 'object' ? w.description || w.text || w.weakness || JSON.stringify(w) : String(w));
          }
          if (Array.isArray(imp.actionableTips)) {
            imp.actionableTips = imp.actionableTips.map((t: any) => typeof t === 'object' ? t.description || t.text || t.tip || JSON.stringify(t) : String(t));
          }
        }
        if (Array.isArray(res.detailedFeedback)) {
          res.detailedFeedback = res.detailedFeedback.map((df: any) => {
            return {
              category: String(df.category || df.name || 'General'),
              score: typeof df.score === 'number' ? df.score : parseInt(String(df.score || 0), 10),
              feedback: String(df.feedback || df.description || df.text || '')
            };
          });
        }
      }
      return res;
    });
  }

  async generatePracticeResponse(userMessage: string, survey: Survey, history: any, persona?: string): Promise<string> {
    const systemPrompt = `You are a participant being interviewed for: "${survey.name}".
Persona: ${persona || `A typical respondent`}.
CRITICAL RULES: Stay in character. Never mention AI. Keep it to 1-3 natural conversational sentences maximum.`;

    return this.callGroqString(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-6),
          { role: 'user', content: userMessage }
        ]
      }),
      () => this.mockService.generatePracticeResponse(userMessage, survey, history, persona),
      'generatePracticeResponse'
    );
  }

  async generatePracticeFeedback(transcript: string, survey: Survey, coachPersona?: string): Promise<any> {
    const prompt = `Grade the interviewer's performance in this practice transcript:
"${transcript}"

You must evaluate them across exactly these 5 distinct coaching metrics:
1. "Rapport & Empathy" (How warm, respectful, and safe they made the respondent feel)
2. "Pacing & Conversational Flow" (Pacing of questions, conversational comfort, avoiding abrupt changes or interruptions)
3. "Question Phrasing & Clarity" (How naturally and clearly questions were integrated into dialogue rather than sounding transactional or read verbatim)
4. "Active Probing & Follow-up" (Ability to ask supportive follow-up questions when the respondent hints at challenges)
5. "Questionnaire Coverage" (How cleanly and naturally they retrieved the required survey answers without badgering)

Return JSON with this exact schema:
{
  "overallScore": 0-100,
  "duration": "X mins",
  "questionsAsked": X,
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "detailedFeedback": [
    {
      "category": "Rapport & Empathy",
      "score": 0-100,
      "feedback": "Detailed evaluation text describing how they performed in this category.",
      "suggestions": ["Specific actionable suggestion to improve this category."]
    },
    {
      "category": "Pacing & Conversational Flow",
      "score": 0-100,
      "feedback": "...",
      "suggestions": ["..."]
    },
    {
      "category": "Question Phrasing & Clarity",
      "score": 0-100,
      "feedback": "...",
      "suggestions": ["..."]
    },
    {
      "category": "Active Probing & Follow-up",
      "score": 0-100,
      "feedback": "...",
      "suggestions": ["..."]
    },
    {
      "category": "Questionnaire Coverage",
      "score": 0-100,
      "feedback": "...",
      "suggestions": ["..."]
    }
  ]
}`;

    return this.callGroqJSON<any>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: coachPersona ? `${coachPersona} You are a professional coach. JSON only.` : 'Rigorous interviewer coach. JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.generatePracticeFeedback(transcript, survey, coachPersona),
      'generatePracticeFeedback'
    ).then(res => {
      if (res) {
        res.totalQuestions = survey.questions.length;
        res.questionsAsked = typeof res.questionsAsked === 'number' ? res.questionsAsked : parseInt(String(res.questionsAsked || 0), 10);
        
        if (Array.isArray(res.improvements)) {
          res.improvements = res.improvements.map((item: any) => {
            if (item && typeof item === 'object') {
              return item.description || item.text || item.improvement || JSON.stringify(item);
            }
            return String(item);
          });
        }
        if (Array.isArray(res.strengths)) {
          res.strengths = res.strengths.map((item: any) => {
            if (item && typeof item === 'object') {
              return item.description || item.text || item.strength || JSON.stringify(item);
            }
            return String(item);
          });
        }
      }
      return res;
    });
  }

  async matchReferrals(responses: Record<string, string>, initiatives: CommunityInitiative[], interviewerNotes?: string): Promise<ReferralRecommendation[]> {
    if (initiatives.length === 0) return [];
    
    const prompt = `You are an expert social services referral assistant in Singapore.
Evaluate the following participant's survey responses and notes against the database of active support schemes.

Participant Survey Responses:
${JSON.stringify(responses, null, 2)}

Interviewer Notes:
${interviewerNotes || 'None'}

Active Database of Support Schemes:
${JSON.stringify(initiatives, null, 2)}

Please match the participant to any relevant schemes in the database. For each match, you must extract:
1. initiativeId: The exact ID of the initiative from the database (e.g., "init-1", "init-2")
2. initiativeTitle: The exact title of the initiative (e.g., "ComCare Short-to-Medium Term Assistance (SMTA)")
3. category: The category of the initiative
4. matchReason: A specific explanation of why this scheme matches the participant's profile and eligibility criteria
5. priority: Either "High", "Medium", or "Low" based on the urgency of their situation and criteria fit

Return a JSON object in this exact structure:
{
  "referrals": [
    {
      "initiativeId": "initiative ID",
      "initiativeTitle": "initiative title",
      "category": "initiative category",
      "matchReason": "detailed matching explanation",
      "priority": "High" | "Medium" | "Low"
    }
  ]
}`;

    return this.callGroqJSON<{ referrals: ReferralRecommendation[] }>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an outreach matching coordinator. You must only return valid JSON matching the schema.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      async () => ({ referrals: await this.mockService.matchReferrals(responses, initiatives) }),
      'matchReferrals'
    ).then(res => {
      if (res && Array.isArray(res.referrals)) {
        return res.referrals.map((r: any) => {
          const matchedId = r.initiativeId || r.id || '';
          const matchedTitle = r.initiativeTitle || r.title || r.program || '';
          const matchedCategory = r.category || '';
          const matchedReason = r.matchReason || r.reason || 'Matched based on survey answers.';
          const matchedPriority = (r.priority === 'High' || r.priority === 'Medium' || r.priority === 'Low') ? r.priority : 'Medium';
          
          return {
            initiativeId: String(matchedId),
            initiativeTitle: String(matchedTitle),
            category: String(matchedCategory),
            matchReason: String(matchedReason),
            priority: matchedPriority,
            selected: false,
            followedUp: false,
            status: 'Matched' as const
          };
        }).filter(r => r.initiativeId && r.initiativeTitle);
      }
      return [];
    });
  }

  async scourInitiativesForSurvey(survey: Survey): Promise<CommunityInitiative[]> {
    const prompt = `Generate 3 relevant support programs for survey topics:\nQuestions: ${JSON.stringify(survey.questions.map(q => q.fieldName))}\nReturn JSON: { "initiatives": [] }`;

    return this.callGroqJSON<{ initiatives: CommunityInitiative[] }>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Outreach researcher. JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      async () => ({ initiatives: await this.mockService.scourInitiativesForSurvey(survey) }),
      'scourInitiativesForSurvey'
    ).then(res => (Array.isArray(res.initiatives) ? res.initiatives : []).map((init, index) => ({
      ...init,
      id: `init-${Date.now()}-${index}`
    })));
  }

  async generateCumulativeInsights(profiles: ParticipantProfile[], survey: Survey): Promise<CumulativeInsights> {
    if (profiles.length === 0) {
      return this.mockService.generateCumulativeInsights(profiles, survey);
    }

    const profileSummaries = profiles.map((p, index) => {
      const name = p.responses[survey.questions[0]?.fieldName || ''] || `Participant ${index + 1}`;
      const briefResponses = Object.entries(p.responses)
        .map(([q, a]) => `- ${q}: ${a}`)
        .join('\n');
      const referrals = (p.referrals || [])
        .map(ref => `- Matched: ${ref.initiativeTitle} (${ref.priority} priority - Status: ${ref.status || 'Matched'})`)
        .join('\n');
      
      return `### Respondent #${index + 1}: ${name}
Completeness: ${p.completeness}%
Interviewer Notes: ${p.interviewerNotes || 'None'}
Responses:
${briefResponses}
Matched Support Programs:
${referrals}`;
    }).join('\n\n');

    const prompt = `Task: Perform a cumulative, aggregate trend analysis across a database of ${profiles.length} participant interviews.
Survey Name: ${survey.name}
Survey Questions: ${JSON.stringify(survey.questions.map(q => q.fieldName))}

Participant Profile Database:
${profileSummaries}

Based on this data, construct an analysis in JSON format containing:
1. "executiveSummary": A comprehensive, high-level summary of findings, dominant trends, and resource bottlenecks. (2-3 sentences)
2. "commonProblems": An array of top 3-4 recurring issues found in the database. For each issue, output:
   - "problemName": Short descriptive label (e.g. "Rental Arrears", "Senior Digital Literacy Gaps").
   - "description": 1-2 sentence explanation of why this is a recurring problem based on interviewee responses.
   - "prevalencePercentage": Estimated percentage of the respondent pool suffering from this issue (0-100).
   - "severity": "High" | "Medium" | "Low" based on urgency.
3. "correlations": An array of 3 specific patterns, demographics links, or structural insights. (e.g., "Seniors are disproportionately isolated", "Low income directly links to low device ownership").
4. "proactiveInitiatives": An array of 3 highly actionable, concrete local events/initiatives the community organization can run to proactively address these specific trends. Output:
   - "id": unique string ID.
   - "title": e.g. "FSC Counselling Caravan".
   - "description": Concise description of what the initiative does.
   - "completed": false

Format the output strictly as a JSON object conforming to the CumulativeInsights schema:
{
  "executiveSummary": "...",
  "commonProblems": [
    { "problemName": "...", "description": "...", "prevalencePercentage": 60, "severity": "High" }
  ],
  "correlations": [
    "..."
  ],
  "proactiveInitiatives": [
    { "id": "...", "title": "...", "description": "...", "completed": false }
  ]
}`;

    return this.callGroqJSON<CumulativeInsights>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an advanced social science researcher and community program coordinator. Strictly respond in JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      async () => this.mockService.generateCumulativeInsights(profiles, survey),
      'generateCumulativeInsights'
    );
  }
}

export const createAIService = (provider: 'groq' | 'mock' = 'groq'): AIService => {
  if (provider === 'groq') {
    return new GroqService(import.meta.env.VITE_GROQ_API_KEY);
  }
  return new MockAIService();
};