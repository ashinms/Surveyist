import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import Groq from 'groq-sdk';
import { Survey, CoachingOverview, QuestionCoaching, RecordingAnalysis, CommunityInitiative, ReferralRecommendation } from '../types/survey';

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
  matchReferrals(responses: Record<string, string>, initiatives: CommunityInitiative[]): Promise<ReferralRecommendation[]>;
  scourInitiativesForSurvey(survey: Survey): Promise<CommunityInitiative[]>;
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
      followUpTips: data.tips
    };
  }

  async analyzeTranscript(_t: string, _s: Survey): Promise<RecordingAnalysis> {
    return {
      score: 85,
      answeredQuestions: [],
      unansweredQuestions: [],
      unclearQuestions: [],
      extractedResponses: {},
      improvementAnalysis: {
        strengths: ['Active listening', 'Polite tone'],
        weaknesses: ['Missed standard phrasing templates'],
        actionableTips: ['Confirm participant details clearly']
      }
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
        { category: 'Conversational Flow', score: 78, feedback: 'Good pacing, but occasional interruptions.', suggestions: ['Allow more pauses for answers.'] },
        { category: 'Question Clarity', score: 70, feedback: 'Some questions were phrased ambiguously.', suggestions: ['Rephrase to be more direct.'] },
        { category: 'Empathy & Tone', score: 85, feedback: 'Demonstrated strong empathy.', suggestions: ['Use reflective statements more often.'] }
      ]
    };
  }

  async matchReferrals(_responses: Record<string, string>, initiatives: CommunityInitiative[]): Promise<ReferralRecommendation[]> {
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
        if (typeof item === 'string') return item;
        if (typeof item === 'object') {
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
  ]
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

      return {
        questionId,
        question: questionText,
        naturalPhrasing: naturalPhrasing.length > 0 ? naturalPhrasing : ["Ask the question naturally and listen carefully."],
        commonMistakes: commonMistakes.length > 0 ? commonMistakes : ["Asking in a rigid tone."],
        followUpTips: followUpTips.length > 0 ? followUpTips : ["Acknowledge and validate the response."]
      };
    });
  }

  async analyzeTranscript(transcript: string, survey: Survey): Promise<RecordingAnalysis> {
    return this.callGroqJSON<RecordingAnalysis>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Precise semantic text extractor and quality evaluator. JSON only.' },
          {
            role: 'user',
            content: `Analyze interview transcript for survey "${survey.name}".\nTranscript: "${transcript}"\nEvaluate interviewer only. Return JSON:\n{ "score": 0-100, "extractedResponses": { ... }, "improvementAnalysis": { "strengths": [], "weaknesses": [], "actionableTips": [] }, "needsAndWants": [] }`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.analyzeTranscript(transcript, survey),
      'analyzeTranscript'
    );
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
    return this.callGroqJSON<any>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: coachPersona ? `${coachPersona} You are a professional coach. JSON only.` : 'Rigorous interviewer coach. JSON only.' },
          {
            role: 'user',
            content: `Grade the interviewer in this transcript:\n"${transcript}"\nReturn JSON: { "overallScore": 0-100, "duration": "X mins", "questionsAsked": X, "strengths": [], "improvements": [], "detailedFeedback": [] }`
          }
        ],
        response_format: { type: 'json_object' }
      }),
      () => this.mockService.generatePracticeFeedback(transcript, survey, coachPersona),
      'generatePracticeFeedback'
    );
  }

  async matchReferrals(responses: Record<string, string>, initiatives: CommunityInitiative[]): Promise<ReferralRecommendation[]> {
    if (initiatives.length === 0) return [];
    const prompt = `Evaluate survey responses and match active local programs.\nResponses: ${JSON.stringify(responses)}\nActive Database: ${JSON.stringify(initiatives)}\nMatch reasons must be specific. Return JSON: { "referrals": [] }`;

    return this.callGroqJSON<{ referrals: ReferralRecommendation[] }>(
      () => this.groq!.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Outreach matcher coordinator. JSON only.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
      async () => ({ referrals: await this.mockService.matchReferrals(responses, initiatives) }),
      'matchReferrals'
    ).then(res => Array.isArray(res.referrals) ? res.referrals : []);
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
}

export const createAIService = (provider: 'groq' | 'mock' = 'groq'): AIService => {
  if (provider === 'groq') {
    return new GroqService(import.meta.env.VITE_GROQ_API_KEY);
  }
  return new MockAIService();
};