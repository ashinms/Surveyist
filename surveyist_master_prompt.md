I want to build a fully featured, responsive React + Vite + TypeScript application called **CARE-O: Conversational Assessment & Routing Engine for Outreach**.

### 📱 Premium Design Layout Requirement:
*   **CARE-O** is styled and structured as a **mobile-first web application** mirroring high-end iOS/Android apps.
*   The UI must render inside a centered container with a maximum width of `max-w-md` and height of `h-[100dvh]` (to simulate a premium mobile app frame on desktop viewports) while scaling natively to full screen on actual mobile devices.
*   It features a sticky, glassmorphism bottom navigation bar typical of modern mobile application designs.

### 🌐 System Architecture & Workflow Description:
CARE-O is a professional, AI-driven interview training lab and community outreach matching application designed for social workers and outreach volunteers. Below is the explicit step-by-step user workflow and navigation flow that the code must support:

1.  **Phase 1: Survey Import & Tab Locking (Landing State)**
    *   **User Action**: The app opens to the **Import** tab. To prevent navigation to empty views, the **Training Lab**, **Live Capture**, **Profiles**, **Outreach**, and **Schemes** tabs must be locked and disabled (`disabled: !currentSurvey`).
    *   **Import Process**: The user pastes questionnaire text or uploads a survey template document (.docx, .pdf, .txt). The app parses the text locally, uses the Groq API to extract structural questions, and opens a "Review & Edit Survey" editor.
    *   **Auto-Transition**: When the user clicks "Finish & Import", the survey structure is stored in state (`currentSurvey`). The app must automatically transition the user to the **Training Lab** (`activeTab = 'training'`) and unlock all other navigation tabs.

2.  **Phase 2: AI-Powered Training Lab**
    *   **User Action**: The user opens the **Training Lab** tab. They can view a customized strategy guide generated for this specific survey.
    *   **Simulations**: The user enters chat or call practice modes. The AI acts as a survey respondent with a customized persona.
    *   **Fuzzy Progress Tracker**: As the user interviews the AI, the app runs a double-pass keyword and fuzzy text-matching algorithm (Dice Coefficient) to check off questionnaire progress in real-time.
    *   **Speech Synthesis & Recognition**: In call mode, the app uses Web Speech synthesis to read the AI respondent's lines aloud and Web Speech recognition to capture the user's speech.
    *   **Grading**: Clicking "Finish & Grade" submits the transcript for evaluation, grading their conversational skill, and providing strengths and actionable improvement tips.

3.  **Phase 3: Live Interview Capture**
    *   **User Action**: The user conducts a real field interview under the **Live Capture** tab.
    *   **Auto-extraction**: The user records audio, transcribes it, and AI extracts structured answers.
    *   **Clarification Modal**: If any questions are incomplete or unclear, the app opens a "Clarification Needed" popup displaying these specific questions for manual override.
    *   **Auto-Navigation**: Saving the profile pushes it to the list of profiles and automatically changes the tab to **Profiles** (`activeTab = 'profiles'`).

4.  **Phase 4: Profiles & Outreach Matcher**
    *   **User Action**: The **Profiles** tab lists all recorded respondents with completeness percentages.
    *   **Document Generation**: The user can export responses as plain text or as a pre-populated Word document (using client-side `docxtemplater` to replace template tags).
    *   **Matching Transition**: Clicking "Outreach Matcher" sets the active profile ID and shifts the view to the **Outreach** tab.

5.  **Phase 5: Support Scheme Outreach Tracker & WhatsApp Outreach**
    *   **User Action**: The **Outreach** tab matches the respondent's answers against a local initiatives database (containing CDC vouchers, ComCare aid, SkillsFuture credits, and elderly support programs).
    *   **Interactive Pipeline**: Users manage each matched scheme along a visual status pipeline (Matched -> Drafted -> Dispatched -> Approved -> Closed).
    *   **Email Dispatches**: The user drafts and dispatches personalized emails to the participant and intake offices.
    *   **WhatsApp Outreach**: Features a dynamic AI-Automated WhatsApp template preview that assesses the participant's needs (Shelter/Housing, Financial/SSO, Medical, Food Insecurity) and lists relevant emergency links. The user can manually toggle needs via on-screen buttons, live-preview the message, copy it, or send it directly.

6.  **Phase 6: Support Schemes Database**
    *   **User Action**: The **Schemes** tab displays the global master list of programs and includes an editor to add/remove custom schemes dynamically, modifying the matching engine.

---

### 1. Project Dependencies
Please install these npm packages first:
- `groq-sdk` (for Groq Llama completions)
- `lucide-react` (for UI icons)
- `mammoth` (for Word doc text extraction)
- `pdfjs-dist` (for PDF text extraction)
- `pizzip` (for client-side docx templating)
- `docxtemplater` (for docx template rendering)

### 2. Verified File Architecture
Please create or overwrite the following 25 files with the exact, verbatim code provided below. Ensure a 1:1 match of the compiler settings, bundler configurations, HTML elements, custom CSS tokens, state variables, component architecture, and logical API routing. Do not truncate the code or replace files with mock placeholders.

---

#### File 1: `.env`
**Description**: Root environment config containing API Key

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

---

#### File 2: `package.json`
**Description**: Project configuration and dependencies manifest

```json
{
  "name": "surveyist",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "docxtemplater": "^3.68.7",
    "groq-sdk": "^0.9.0",
    "lucide-react": "^0.344.0",
    "mammoth": "^1.6.0",
    "pdfjs-dist": "^3.11.174",
    "pizzip": "^3.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.0.0",
    "vite": "^5.4.2",
    "vitest": "^4.1.9"
  }
}
```

---

#### File 3: `vite.config.ts`
**Description**: Vite bundler configuration

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
})
```

---

#### File 4: `tailwind.config.js`
**Description**: Tailwind CSS style configuration

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214.3 31.8% 91.4%)",
      },
      animation: {
        'in': 'fadeIn 0.3s ease-in'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
}
```

---

#### File 5: `postcss.config.js`
**Description**: PostCSS styling compiler configuration

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

#### File 6: `tsconfig.json`
**Description**: TypeScript compiler configuration

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

---

#### File 7: `tsconfig.app.json`
**Description**: TypeScript App compiler targets

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": [
      "ES2020",
      "DOM",
      "DOM.Iterable"
    ],
    "module": "ESNext",
    "skipLibCheck": true,
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    /* Linting */
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": false,
    "noUncheckedSideEffectImports": false
  },
  "include": [
    "src"
  ]
}
```

---

#### File 8: `tsconfig.node.json`
**Description**: TypeScript Node compiler targets

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": false,
    "noUncheckedSideEffectImports": false
  },
  "include": ["vite.config.ts"]
}
```

---

#### File 9: `index.html`
**Description**: Main HTML mounting entry point

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Surveyist - AI Interview Training</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

#### File 10: `src/vite-env.d.ts`
**Description**: Vite environment typescript definitions

```typescript
/// <reference types="vite/client" />

declare module 'pizzip';
declare module 'docxtemplater';
```

---

#### File 11: `src/index.css`
**Description**: Global styling and glassmorphism animation tokens

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-white/15;
  }
  body {
    @apply bg-slate-900 text-white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
  }
}

@layer components {
  /* Glassmorphism Background */
  .glass-bg {
    @apply bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600;
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
  }

  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* Main Container */
  .glass-container {
    @apply shadow-2xl;
    background: rgba(15, 23, 42, 0.35);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  /* Glass Card */
  .glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.25);
  }

  /* Glass Button */
  .glass-button {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.2);
  }

  /* Glass Inset (for inputs, etc.) */
  .glass-inset {
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 2px 8px 0 rgba(0, 0, 0, 0.25);
  }

  /* Glass Header */
  .glass-header {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.15);
  }

  /* Glass Navigation */
  .glass-nav {
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35);
  }
}
```

---

#### File 12: `src/main.tsx`
**Description**: React application entry point

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'


import { ErrorBoundary } from './components/views.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
```

---

#### File 13: `src/types/survey.ts`
**Description**: Shared interview, scoring, and program schemes type definitions and fuzzy helpers

```typescript
export interface Question {
  id: string;
  fieldName: string;
  type: 'string' | 'enum';
  options?: string[];
}

export interface Survey {
  id: string;
  name: string;
  questions: Question[];
}

export interface CoachingOverview {
  surveyName: string;
  totalQuestions: number;
  estimatedDuration: string;
  surveyFlow: string[];
  conversationalApproach: string;
  participantPersona: string;
  coachPersona: string;
}

export interface QuestionCoaching {
  questionId: string;
  question: string;
  naturalPhrasing: string[];
  commonMistakes: string[];
  followUpTips: string[];
  stealthIntegration?: string;
}

export interface RecordingAnalysis {
  score: number;
  answeredQuestions: string[];
  unansweredQuestions: string[];
  unclearQuestions: string[];
  extractedResponses: Record<string, string>;
  improvementAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    actionableTips: string[];
  };
  needsAndWants?: string[];
}

export interface CommunityInitiative {
  id: string;
  title: string;
  category: 'Outreach Event' | 'Activity' | 'Financial Bursary' | 'Upskilling' | 'Other';
  description: string;
  eligibility: string;
  organisation?: string;
}

export interface ReferralRecommendation {
  initiativeId: string;
  initiativeTitle: string;
  category: string;
  matchReason: string;
  priority: 'High' | 'Medium' | 'Low';
  selected?: boolean;
  followedUp?: boolean;
  status?: 'Matched' | 'Drafted' | 'Dispatched' | 'Approved' | 'Closed';
}

export interface DispatchedEmail {
  id: string;
  recipient: string;
  recipientType: 'Participant' | 'Organisation';
  subject: string;
  body: string;
  timestamp: number;
}

export interface ParticipantProfile {
  id: string;
  surveyId: string;
  timestamp: number;
  responses: Record<string, string>;
  textSummary?: string;
  completeness: number;
  analysis?: RecordingAnalysis;
  referrals?: ReferralRecommendation[];
  dispatchedEmails?: DispatchedEmail[];
  interviewerNotes?: string;
}

export const DEFAULT_INITIATIVES: CommunityInitiative[] = [
  {
    id: 'init-1',
    title: 'ComCare Short-to-Medium Term Assistance (SMTA)',
    category: 'Financial Bursary',
    description: 'Provides temporary financial aid, assistance with household bills, and job search support for low-income individuals or families in Singapore.',
    eligibility: 'Monthly household income of $1,900 and below, or Per Capita Income (PCI) of $650 and below.',
    organisation: 'Social Service Office (SSO)'
  },
  {
    id: 'init-2',
    title: 'SkillsFuture Credit & Career Transition Programme',
    category: 'Upskilling',
    description: 'Provides subsidized vocational training courses and job placement services to help Singaporeans reskill and transition to new industries.',
    eligibility: 'Singapore Citizens aged 25 and above; additional subsidies for mid-career workers aged 40+.',
    organisation: 'SkillsFuture Singapore (SSG)'
  },
  {
    id: 'init-3',
    title: 'CDC Vouchers Scheme',
    category: 'Outreach Event',
    description: 'Distributes community vouchers to households to spend at participating local heartland merchants, hawkers, and supermarkets.',
    eligibility: 'All Singaporean households are eligible to claim municipal CDC voucher credits.',
    organisation: 'Community Development Councils (CDC)'
  },
  {
    id: 'init-4',
    title: 'Seniors Go Digital & Mobile Access Scheme',
    category: 'Activity',
    description: 'Provides one-on-one digital mentoring and subsidized smartphones with data plans to help seniors stay connected.',
    eligibility: 'Singapore Citizens aged 60 and above; eligible for subsidies if holding public assistance cards.',
    organisation: 'Infocomm Media Development Authority (IMDA)'
  },
  {
    id: 'init-5',
    title: 'Mendaki Youth Mentoring & Career Navigator',
    category: 'Activity',
    description: 'Connects students and young jobseekers with industry professionals for career planning, soft skills development, and guidance.',
    eligibility: 'Malay/Muslim youths, students, and young jobseekers aged 16 to 30.',
    organisation: 'Yayasan Mendaki'
  },
  {
    id: 'init-6',
    title: 'Meals-on-Wheels Food Delivery Services',
    category: 'Activity',
    description: 'Daily home-delivery of subsidized warm, nutritious lunch and dinner meals to homebound elderly residents.',
    eligibility: 'Frail elderly aged 60+ or disabled individuals living alone with severe mobility constraints.',
    organisation: 'Touch Community Services'
  },
  {
    id: 'init-7',
    title: 'KiFAS & Childcare Financial Subsidies',
    category: 'Financial Bursary',
    description: 'Subsidizes infant care, childcare, and kindergarten fees to help lower-income families afford early childhood education.',
    eligibility: 'Singapore Citizen children enrolled in licensed childcare centres; monthly gross household income below $12,000.',
    organisation: 'Early Childhood Development Agency (ECDA)'
  },
  {
    id: 'init-8',
    title: 'FSC Casework and Counselling Services',
    category: 'Other',
    description: 'Provides free casework guidance, family mediation, stress counselling, and referral support for residents facing socio-emotional challenges.',
    eligibility: 'Available to all Singapore residents, particularly low-income families and vulnerable individuals.',
    organisation: 'Family Service Centres (FSC)'
  },
  {
    id: 'init-9',
    title: 'Enhancement for Active Seniors (EASE) Program',
    category: 'Activity',
    description: 'Retrofits HDB flats with elder-friendly modifications like grab bars, slip-resistant bathroom tiles, and wheelchair ramps.',
    eligibility: 'Singapore Citizen HDB flat owner with a resident elderly household member aged 65 and above or with mobility impairments.',
    organisation: 'Housing & Development Board (HDB)'
  },
  {
    id: 'init-10',
    title: 'NEU PC Plus Programme',
    category: 'Other',
    description: 'Offers subsidized computers and broadband internet to low-income households, students, and persons with disabilities.',
    eligibility: 'Singapore Citizens or Permanent Residents; gross monthly household income up to $3,400 or PCI up to $900.',
    organisation: 'Infocomm Media Development Authority (IMDA)'
  },
  {
    id: 'init-11',
    title: 'Silver Support Scheme',
    category: 'Financial Bursary',
    description: 'Provides quarterly cash payouts to lower-income Singaporean seniors who had low wages during their working years and have minimal family support.',
    eligibility: 'Singapore Citizens aged 65 and above; CPF contributions up to $140,000; household live in 1-5 room HDB flat with PCI up to $1,800.',
    organisation: 'Central Provident Fund (CPF) Board'
  },
  {
    id: 'init-12',
    title: 'Workfare Income Supplement (WIS) Scheme',
    category: 'Financial Bursary',
    description: 'Boosts the income and CPF savings of lower-income Singaporean workers, encouraging them to stay employed and upskill.',
    eligibility: 'Singapore Citizens aged 30 and above; earning gross monthly income up to $2,500; living in properties with annual value up to $21,000.',
    organisation: 'Ministry of Manpower (MOM)'
  }
];

/* Shared Fuzzy-Matching Utilities to prevent duplicate algorithms */
export const getDiceCoefficient = (s1: string, s2: string): number => {
  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };
  if (s1 === s2) return 1;
  if (s1.length < 2 || s2.length < 2) return 0;
  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  let intersection = 0;
  for (const b of b1) {
    if (b2.has(b)) intersection++;
  }
  return (2 * intersection) / (b1.size + b2.size);
};

export const isQuestionCovered = (messageText: string, questionText: string): boolean => {
  const cleanMsg = messageText.toLowerCase();
  const cleanQ = questionText.toLowerCase().replace(/\(.*?\)/g, '').trim();

  if (cleanMsg.includes(cleanQ)) return true;

  const stopWords = new Set(['what', 'where', 'when', 'which', 'who', 'whom', 'how', 'why', 'your', 'please', 'about', 'would', 'could', 'should', 'with', 'from', 'this', 'that', 'have', 'been', 'the', 'and', 'are', 'for', 'you', 'can', 'our', 'out', 'any', 'has', 'had', 'was', 'were', 'the']);
  const qKeywords = cleanQ
    .replace(/[?.,!/\\()]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3)
    .filter(w => !stopWords.has(w));

  if (qKeywords.length === 0) return false;

  const matchCount = qKeywords.filter(keyword => cleanMsg.includes(keyword)).length;
  const ratio = matchCount / qKeywords.length;
  const threshold = qKeywords.length <= 2 ? 0.5 : 0.6;
  if (ratio >= threshold) return true;

  if (qKeywords.length >= 2) {
    const bigrams: string[] = [];
    for (let i = 0; i < qKeywords.length - 1; i++) {
      bigrams.push(`${qKeywords[i]} ${qKeywords[i + 1]}`);
    }
    const matchedBigrams = bigrams.filter(bigram => cleanMsg.includes(bigram));
    if (matchedBigrams.length >= Math.max(1, Math.ceil(bigrams.length * 0.4))) {
      return true;
    }
  }

  const msgWords = cleanMsg
    .replace(/[?.,!/\\()]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3);

  const fuzzyMatchCount = qKeywords.filter(keyword => {
    if (cleanMsg.includes(keyword)) return true;
    return msgWords.some(msgWord => getDiceCoefficient(keyword, msgWord) >= 0.8);
  }).length;

  const fuzzyRatio = fuzzyMatchCount / qKeywords.length;
  const fuzzyThreshold = qKeywords.length <= 2 ? 0.5 : 0.6;
  return fuzzyRatio >= fuzzyThreshold;
};
```

---

#### File 14: `src/services/services.ts`
**Description**: Unified API clients (Groq Chat completions, Whisper transcription/speech simulation, mock generators, and document parsers)

```typescript
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
  matchReferrals(responses: Record<string, string>, initiatives: CommunityInitiative[], interviewerNotes?: string): Promise<ReferralRecommendation[]>;
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
      followUpTips: data.tips,
      stealthIntegration: "Integrate this question casually during rapport building or when discussing their general background rather than asking it directly."
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
        if (typeof item === 'string') return item;
        if (typeof item === 'object') {
          const stepName = item.stepName || item.name || item.step || item.title || item.label || '';
          const desc = item.description || item.desc || '';
          if (stepName && desc) {
            return `${stepName} - ${desc}`;
          }
          if (stepName) return stepName;
          
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
    ).then(res => {
      if (res && res.improvementAnalysis) {
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
    const prompt = `Evaluate survey responses and match active local programs.\nResponses: ${JSON.stringify(responses)}\nInterviewer Notes: ${interviewerNotes || 'None'}\nActive Database: ${JSON.stringify(initiatives)}\nMatch reasons must be specific. Return JSON: { "referrals": [] }`;

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
```

---

#### File 15: `src/components/Modal.tsx`
**Description**: Shared styling modal popup component

```typescript
import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  icon?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, icon }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
      <div className="glass-card rounded-[2rem] max-w-md w-full p-6 space-y-6 text-left border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            {icon}
            <h3 className="text-lg font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
};
```

---

#### File 16: `src/components/ErrorBoundary.tsx`
**Description**: App runtime exception error boundary screen

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center p-6 glass-bg text-sans">
          <div className="w-full max-w-md glass-card rounded-[2.5rem] p-8 text-center space-y-6 border border-red-500/20">
            <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="text-red-400 animate-pulse" size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase text-white tracking-tight">Application Error</h2>
              <p className="text-xs text-white/60 font-bold uppercase tracking-wider">A runtime exception occurred</p>
            </div>
            <div className="glass-inset p-4 rounded-2xl text-left max-h-40 overflow-y-auto pr-1">
              <p className="text-xs font-black text-red-400 mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message}
              </p>
              {this.state.error?.stack && (
                <pre className="text-[10px] text-white/50 font-mono whitespace-pre-wrap leading-relaxed select-all">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
            <button onClick={() => window.location.reload()} className="w-full p-4 glass-button text-blue-400 font-black uppercase text-xs rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
              <RotateCcw size={16} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

#### File 17: `src/components/HomeView.tsx`
**Description**: Import tab view for copying questionnaire text or uploading PDF/DOCX templates

```typescript
import React, { useState, useRef, useMemo } from 'react';
import { FileText, Trash2, Plus, X, Upload, Type, ArrowRight } from 'lucide-react';
import { Survey } from '../types/survey';
import { fileParser, createAIService } from '../services/services';

export const HomeView: React.FC<{
  onSurveyUpload: (s: Survey, fileBuffer?: ArrayBuffer, fileName?: string) => void;
  surveys: Survey[];
  currentSurvey: Survey | null;
  onSelectSurvey: (survey: Survey) => void;
}> = ({ onSurveyUpload, surveys, currentSurvey, onSelectSurvey }) => {
  const [surveyText, setSurveyText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [uploadedBuffer, setUploadedBuffer] = useState<ArrayBuffer | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiService = useMemo(() => createAIService(), []);

  const handleFile = async (file: File) => {
    const validation = fileParser.validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setIsProcessing(true);
    try {
      const parsed = await fileParser.parseFile(file);
      if (parsed.success && parsed.text) {
        setSurveyText(parsed.text);
        const buffer = await file.arrayBuffer();
        setUploadedBuffer(buffer);
        setUploadedFileName(file.name);
        setInputMode('text');
      } else {
        alert(parsed.error || 'Failed to parse file');
      }
    } catch {
      alert('Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!surveyText.trim()) return;
    setIsProcessing(true);
    try {
      const parsed = await aiService.parseSurvey(surveyText);
      setEditingSurvey(parsed);
    } catch (err: any) {
      alert('AI processing failed: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSurveyEdit = () => {
    if (!editingSurvey) return;
    onSurveyUpload(editingSurvey, uploadedBuffer || undefined, uploadedFileName || undefined);
    setSurveyText('');
    setUploadedBuffer(null);
    setUploadedFileName(null);
    setEditingSurvey(null);
  };

  if (editingSurvey) {
    return (
      <div className="p-6 space-y-6 pb-32 animate-in fade-in duration-300 text-left font-sans">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Review & Edit Survey</h2>
          <p className="text-xs text-white/60 uppercase font-black tracking-widest">Fine-tune questions before importing</p>
        </div>

        <div className="glass-card rounded-[2rem] p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest">Survey Title</label>
            <input
              type="text"
              value={editingSurvey.name}
              onChange={e => setEditingSurvey({ ...editingSurvey, name: e.target.value })}
              className="w-full p-4 glass-inset rounded-2xl focus:outline-none text-sm font-bold text-white placeholder-white/30"
              placeholder="e.g. Needs Assessment Survey"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest">Questions ({editingSurvey.questions.length})</label>
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {editingSurvey.questions.map((q, qIdx) => (
                <div key={qIdx} className="glass-inset p-4 rounded-2xl space-y-3 relative group">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider mt-2 flex-shrink-0">Q{qIdx + 1}</span>
                    <textarea
                      rows={2}
                      value={q.fieldName}
                      onChange={e => {
                        const updated = [...editingSurvey.questions];
                        updated[qIdx] = { ...updated[qIdx], fieldName: e.target.value };
                        setEditingSurvey({ ...editingSurvey, questions: updated });
                      }}
                      className="flex-1 bg-transparent text-sm text-white font-bold placeholder-white/30 focus:outline-none resize-none border-b border-white/5 focus:border-blue-500/50 py-1"
                      placeholder="Question text..."
                    />
                    <button
                      onClick={() => setEditingSurvey({ ...editingSurvey, questions: editingSurvey.questions.filter((_, idx) => idx !== qIdx) })}
                      className="p-2 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-wider">Type:</span>
                    <div className="flex gap-2">
                      {(['string', 'enum'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            const updated = [...editingSurvey.questions];
                            updated[qIdx] = type === 'enum' 
                              ? { ...updated[qIdx], type: 'enum', options: updated[qIdx].options || ['Yes', 'No'] }
                              : { ...updated[qIdx], type: 'string', options: undefined };
                            setEditingSurvey({ ...editingSurvey, questions: updated });
                          }}
                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${q.type === type ? 'glass-button text-blue-400' : 'text-white/40 bg-white/5'}`}
                        >
                          {type === 'string' ? 'Text Answer' : 'Multiple Choice'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {q.type === 'enum' && q.options && (
                    <div className="space-y-2 pl-4 border-l-2 border-white/10 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-white/50 uppercase tracking-wider">Options:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...editingSurvey.questions];
                            updated[qIdx] = { ...updated[qIdx], options: [...(q.options || []), `Option ${(q.options || []).length + 1}`] };
                            setEditingSurvey({ ...editingSurvey, questions: updated });
                          }}
                          className="flex items-center gap-1 text-[8px] font-black text-blue-400 hover:text-blue-300 uppercase"
                        >
                          <Plus size={10} /> Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={opt}
                              onChange={e => {
                                const updatedOpts = [...(q.options || [])];
                                updatedOpts[optIdx] = e.target.value;
                                const updated = [...editingSurvey.questions];
                                updated[qIdx] = { ...updated[qIdx], options: updatedOpts };
                                setEditingSurvey({ ...editingSurvey, questions: updated });
                              }}
                              className="flex-1 bg-slate-900/40 p-2 rounded-lg border border-white/5 text-xs text-white placeholder-white/20 focus:outline-none"
                            />
                            {q.options!.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...editingSurvey.questions];
                                  updated[qIdx] = { ...updated[qIdx], options: q.options!.filter((_, idx) => idx !== optIdx) };
                                  setEditingSurvey({ ...editingSurvey, questions: updated });
                                }}
                                className="p-1.5 hover:bg-red-500/10 text-white/30 hover:text-red-400 rounded-md transition-colors"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setEditingSurvey({
                ...editingSurvey,
                questions: [...editingSurvey.questions, { id: `q${editingSurvey.questions.length + 1}`, fieldName: `New Question`, type: 'string' }]
              })}
              className="w-full p-4 border border-dashed border-white/15 hover:border-blue-500/40 text-white/60 hover:text-blue-400 font-black uppercase tracking-wider text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span>Add Custom Question</span>
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button onClick={() => setEditingSurvey(null)} className="flex-1 p-4 glass-inset text-white/60 hover:text-white font-black uppercase text-xs rounded-2xl">Cancel</button>
            <button onClick={handleSaveSurveyEdit} className="flex-1 p-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs rounded-2xl shadow-lg hover:scale-[1.01] transition-transform">Finish & Import</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-full font-sans space-y-6">
      <div className="text-center mb-6 pt-6">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase drop-shadow-lg">Surveyist</h1>
        <p className="text-white/80 text-base font-medium max-w-xs mx-auto leading-tight">AI-Driven Precision for Professional Interview Excellence</p>
      </div>

      {currentSurvey && (
        <div className="max-w-2xl mx-auto p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3 text-left">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <span className="block text-[8px] font-black text-green-400 uppercase tracking-widest">Active Survey Configured</span>
            <span className="text-xs font-bold text-white truncate block">{currentSurvey.name}</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto glass-card p-6">
        <div className="flex gap-4 mb-5 text-left">
          <div className="p-3 glass-inset rounded-2xl"><FileText className="text-blue-400" size={24} /></div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-tight">Import New Survey</h2>
            <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Strict AI Extraction Enabled</p>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={() => setInputMode('text')} className={`flex-1 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 ${inputMode === 'text' ? 'glass-button text-white' : 'glass-inset text-white/60'}`}><Type size={14} />Text</button>
          <button onClick={() => setInputMode('file')} className={`flex-1 py-2 rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 ${inputMode === 'file' ? 'glass-button text-white' : 'glass-inset text-white/60'}`}><Upload size={14} />File</button>
        </div>

        {inputMode === 'text' ? (
          <>
            <textarea
              value={surveyText}
              onChange={e => setSurveyText(e.target.value)}
              placeholder="Paste survey questions here..."
              className="w-full h-44 p-4 glass-inset rounded-2xl focus:outline-none resize-none mb-5 text-xs text-white placeholder-white/40 leading-relaxed"
            />
            <button
              onClick={handleProcess}
              disabled={!surveyText.trim() || isProcessing}
              className="w-full py-4 glass-button text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
            >
              {isProcessing ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span>Process with AI</span><ArrowRight size={16} /></>}
            </button>
          </>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={`p-6 text-center rounded-2xl border-2 border-dashed transition-all cursor-pointer ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
          >
            <input ref={fileInputRef} type="file" accept=".docx,.pdf,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
            <Upload className="text-blue-400 mx-auto mb-3" size={24} />
            <h3 className="text-white font-bold text-sm mb-1 uppercase">Upload Document</h3>
            <p className="text-white/60 text-[10px]">DOCX, PDF, TXT (Max 10MB)</p>
          </div>
        )}
      </div>

      {surveys.length > 0 && (
        <div className="max-w-2xl mx-auto glass-card p-6 text-left space-y-4">
          <div>
            <h3 className="text-xs font-black text-white/50 uppercase tracking-widest">Select Active Survey</h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Switch survey structure instantly</p>
          </div>
          <div className="space-y-2">
            {surveys.map(s => {
              const isActive = currentSurvey?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSurvey(s)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all text-left ${isActive ? 'bg-blue-500/15 border-blue-500/30 shadow' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                >
                  <div className="min-w-0 pr-4">
                    <h4 className="font-bold text-white text-xs truncate">{s.name}</h4>
                    <span className="text-[9px] text-white/40 uppercase font-black tracking-wider block mt-0.5">{s.questions.length} Questions</span>
                  </div>
                  {isActive && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-green-400/20 text-green-400 uppercase tracking-widest flex-shrink-0">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
```

---

#### File 18: `src/components/RecordingView.tsx`
**Description**: Live Capture tab for voice recording, speech-to-text, and questionnaire auto-filling

```typescript
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CheckCircle, Square, Mic, ChevronDown, CheckSquare, AlertCircle, MicOff, Lightbulb 
} from 'lucide-react';
import { Survey, RecordingAnalysis, isQuestionCovered } from '../types/survey';
import { createAIService, createSpeechService } from '../services/services';
import { Modal } from './Modal';

export const RecordingView: React.FC<{ survey: Survey; onSaveProfile: (r: Record<string, string>, a?: RecordingAnalysis, n?: string) => void }> = ({ survey, onSaveProfile }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [analysis, setAnalysis] = useState<RecordingAnalysis | null>(null);
  const [showClarification, setShowClarification] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [permissionError, setPermissionError] = useState(false);
  const [coveredQuestions, setCoveredQuestions] = useState<Record<string, boolean>>({});
  const [showQuestionsList, setShowQuestionsList] = useState(true);
  const [interviewerNotes, setInterviewerNotes] = useState('');

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
    setInterviewerNotes('');
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
      onSaveProfile(final, analysis, interviewerNotes);
      setShowClarification(false);
      setAnalysis(null);
      setLiveTranscript('');
      setInterviewerNotes('');
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
                    {analysis!.improvementAnalysis.strengths.map((s: any, i) => (
                      <li key={i} className="text-xs flex items-center gap-2 text-white/80">
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                        <span>{typeof s === 'object' ? s.description || s.text || s.strength || JSON.stringify(s) : s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/60 uppercase mb-2">Actionable Tips</p>
                  <ul className="space-y-1">
                    {analysis!.improvementAnalysis.actionableTips.map((t: any, i) => (
                      <li key={i} className="text-xs font-bold italic text-white/80">
                        <Lightbulb size={14} className="text-yellow-400 inline mr-2 flex-shrink-0" />
                        <span>{typeof t === 'object' ? t.description || t.text || t.tip || JSON.stringify(t) : t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="glass-card rounded-3xl p-6 space-y-4 text-left">
            <h3 className="font-black uppercase text-[10px] text-white">Extracted Answers (Edit if needed)</h3>
            <div className="space-y-3">
              {survey.questions.map((q, idx) => {
                const val = analysis!.extractedResponses[q.fieldName] || '';
                return (
                  <div key={idx} className="space-y-1">
                    <label className="text-[9px] font-black text-blue-400 uppercase block">{q.fieldName}</label>
                    <input
                      type="text"
                      value={val}
                      onChange={e => {
                        setAnalysis(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            extractedResponses: {
                              ...prev.extractedResponses,
                              [q.fieldName]: e.target.value
                            }
                          };
                        });
                      }}
                      className="w-full p-2.5 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/30"
                      placeholder="Add response..."
                    />
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <label className="text-[9px] font-black text-purple-400 uppercase block">Extra Notes by Interviewer</label>
              <textarea
                value={interviewerNotes}
                onChange={e => setInterviewerNotes(e.target.value)}
                rows={3}
                placeholder="Add notes (AI will use this for scheme matching)..."
                className="w-full p-3 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/30 resize-none leading-relaxed"
              />
            </div>
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
```

---

#### File 19: `src/components/CoachingView.tsx`
**Description**: Training Lab tab for strategy reviews and AI call/chat simulated client roleplays

```typescript
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
            {feedbackData.strengths.map((s: any, i: number) => (
              <li key={i} className="flex gap-2">
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                <span>{typeof s === 'object' ? s.description || s.text || s.strength || JSON.stringify(s) : s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card rounded-[2rem] p-6 space-y-4">
          <h3 className="flex items-center gap-2 font-black text-[10px] uppercase text-white"><Lightbulb size={16} className="text-yellow-400" /> Improvements</h3>
          <ul className="space-y-2 text-xs text-white/80">
            {feedbackData.improvements.map((s: any, i: number) => (
              <li key={i} className="flex gap-2">
                <Lightbulb size={14} className="text-yellow-400 flex-shrink-0" />
                <span>{typeof s === 'object' ? s.description || s.text || s.improvement || JSON.stringify(s) : s}</span>
              </li>
            ))}
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
                  <div className="p-5 flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 glass-inset rounded-xl flex items-center justify-center text-blue-400 font-black text-xs flex-shrink-0 mt-0.5">{q.id.replace('q', '')}</div>
                      <p className="font-bold text-white text-sm leading-relaxed pt-0.5">{q.fieldName}</p>
                    </div>
                    <ChevronRight className={`text-white/40 transition-transform mt-3.5 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
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
                          {coaching.stealthIntegration && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-green-400 uppercase">Stealth Integration (Ask Without Being Obvious)</p>
                              <div className="text-xs text-white/70 glass-inset p-3 rounded-xl leading-relaxed">
                                {renderCoachingText(coaching.stealthIntegration, false)}
                              </div>
                            </div>
                          )}
                          {coaching.followUpTips && coaching.followUpTips.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-purple-400 uppercase">Follow-Up & Probing Tips</p>
                              <ul className="space-y-1.5">
                                {coaching.followUpTips.map((t, i) => (
                                  <li key={i} className="text-xs text-white/70 bg-white/5 p-2.5 rounded-xl border border-white/5">
                                    {renderCoachingText(t, false)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="space-y-2">
                            <p className="text-[9px] font-black text-red-400 uppercase">Common Mistakes</p>
                            <ul className="space-y-1.5">
                              {coaching.commonMistakes.map((m, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-white/60 font-medium bg-red-500/5 p-2.5 rounded-xl border border-red-500/10">
                                  <VolumeX size={12} className="mt-0.5 flex-shrink-0 text-red-400" />
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
```

---

#### File 20: `src/components/ProfilesView.tsx`
**Description**: Profiles tab for listing collected survey records and exporting reports

```typescript
import React, { useState } from 'react';
import { Users, User, Download, Sparkles, Edit2, Save, X } from 'lucide-react';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Survey, ParticipantProfile, CommunityInitiative } from '../types/survey';
import { createAIService } from '../services/services';
import { Modal } from './Modal';

export const ProfilesView: React.FC<{
  profiles: ParticipantProfile[];
  survey: Survey;
  surveyFileBuffer: ArrayBuffer | null;
  isDocxTemplate: boolean;
  initiatives: CommunityInitiative[];
  onUpdateProfile: (updated: ParticipantProfile) => void;
  onSelectProfile: (id: string) => void;
}> = ({ profiles, survey, surveyFileBuffer, isDocxTemplate, initiatives, onUpdateProfile, onSelectProfile }) => {
  const [editingProfile, setEditingProfile] = useState<ParticipantProfile | null>(null);
  const [editedResponses, setEditedResponses] = useState<Record<string, string>>({});
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredProfiles = profiles.filter(p => p.surveyId === survey.id);

  const startEdit = (profile: ParticipantProfile) => {
    setEditingProfile(profile);
    setEditedResponses({ ...profile.responses });
    setEditedNotes(profile.interviewerNotes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingProfile) return;
    setIsSaving(true);
    try {
      const answeredCount = survey.questions.filter(q => editedResponses[q.fieldName]?.trim()).length;
      const completeness = Math.round((answeredCount / (survey.questions.length || 1)) * 100);

      const updatedProfile: ParticipantProfile = {
        ...editingProfile,
        responses: editedResponses,
        interviewerNotes: editedNotes,
        completeness
      };

      onUpdateProfile(updatedProfile);

      const aiService = createAIService();
      const matched = await aiService.matchReferrals(editedResponses, initiatives, editedNotes);
      const refs = (matched || []).map(m => ({ ...m, selected: false, followedUp: false, status: 'Matched' as const }));
      
      onUpdateProfile({ ...updatedProfile, referrals: refs });
      setEditingProfile(null);
    } catch {
      alert("Saved changes, but re-matching support schemes failed.");
      setEditingProfile(null);
    } finally {
      setIsSaving(false);
    }
  };

  const exportToTxt = (profile: ParticipantProfile) => {
    let content = `==================================================\n`;
    content += `SURVEY FORM: ${survey.name}\n`;
    content += `==================================================\n`;
    content += `Date: ${new Date(profile.timestamp).toLocaleString()}\n`;
    content += `Completeness: ${profile.completeness}%\n\n`;
    
    content += `INTERVIEW RESPONSES:\n`;
    survey.questions.forEach((q, idx) => {
      content += `\n[Q${idx + 1}] ${q.fieldName}\n`;
      content += `Answer: ${profile.responses[q.fieldName] || "(No Response)"}\n`;
      content += `--------------------------------------------------\n`;
    });

    if (profile.interviewerNotes) {
      content += `\nINTERVIEWER EXTRA NOTES:\n`;
      content += `${profile.interviewerNotes}\n`;
      content += `--------------------------------------------------\n`;
    }
    
    if (profile.analysis?.needsAndWants) {
      content += `\nNEEDS & INTERESTS IDENTIFIED:\n` + profile.analysis.needsAndWants.map(n => `- ${n}`).join('\n') + '\n';
      content += `--------------------------------------------------\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `survey-filled-${profile.id}.txt`;
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
    <div className="p-6 space-y-4 pb-32 text-left font-sans animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-black text-white/60 uppercase">{filteredProfiles.length} Profiles</h2>
      </div>
      <div className="space-y-3">
        {filteredProfiles.map(profile => {
          const participantName = profile.responses[survey.questions[0]?.fieldName] || 'Participant';
          return (
            <div key={profile.id} className="glass-card rounded-2xl p-5 space-y-4 border border-white/5">
              <div className="flex gap-4">
                <div className="w-11 h-11 glass-inset rounded-xl flex items-center justify-center text-blue-400 flex-shrink-0"><User size={22} /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate text-sm">{participantName}</h3>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-white/50 font-bold uppercase">{new Date(profile.timestamp).toLocaleDateString()}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-green-400/20 text-green-400">{profile.completeness}% Complete</span>
                  </div>
                </div>
              </div>

              {profile.interviewerNotes && (
                <div className="p-3 bg-slate-900/35 border border-white/5 rounded-xl text-[11px] text-white/80 leading-relaxed italic">
                  <span className="block text-[8px] font-black text-purple-400 uppercase not-italic mb-1">Interviewer Notes</span>
                  {profile.interviewerNotes}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => onSelectProfile(profile.id)} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1.5"><Sparkles size={12} /><span>Outreach Matcher</span></button>
                <button onClick={() => startEdit(profile)} className="py-2 px-3 glass-button rounded-xl text-white/70 hover:text-white" title="Edit Responses"><Edit2 size={14} /></button>
                <button onClick={() => isDocxTemplate && surveyFileBuffer ? exportToDocx(profile) : exportToTxt(profile)} className="py-2 px-3 glass-button rounded-xl" title="Download filled survey"><Download size={14} className="text-white/70" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={!!editingProfile} title="Edit Survey Responses" onClose={() => setEditingProfile(null)} icon={<Edit2 className="text-blue-400" size={20} />}>
        {editingProfile && (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            <p className="text-xs text-white/60 mb-2">Edit responses to survey questions and update interviewer notes below:</p>
            <div className="space-y-3">
              {survey.questions.map((q, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[9px] font-black text-blue-400 uppercase block">{q.fieldName}</label>
                  <input
                    type="text"
                    value={editedResponses[q.fieldName] || ''}
                    onChange={e => setEditedResponses(prev => ({ ...prev, [q.fieldName]: e.target.value }))}
                    className="w-full p-2.5 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/30"
                    placeholder="Enter answer..."
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5 pt-3 border-t border-white/5">
              <label className="text-[9px] font-black text-purple-400 uppercase block">Extra Notes by Interviewer</label>
              <textarea
                value={editedNotes}
                onChange={e => setEditedNotes(e.target.value)}
                rows={3}
                placeholder="Add extra interviewer notes..."
                className="w-full p-3 bg-slate-900/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/30 resize-none leading-relaxed"
              />
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button onClick={() => setEditingProfile(null)} className="flex-1 py-3 glass-inset text-white/60 font-black uppercase text-xs rounded-xl" disabled={isSaving}>Cancel</button>
          <button onClick={handleSaveEdit} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-1.5" disabled={isSaving}>
            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>Save & Re-Match</span>}
          </button>
        </div>
      </Modal>
    </div>
  );
};
```

---

#### File 21: `src/components/InitiativesView.tsx`
**Description**: Outreach tab for matching Singapore CDC/SSD programs and drafting emails

```typescript
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
```

---

#### File 22: `src/components/SchemesView.tsx`
**Description**: Schemes database management view tab

```typescript
import React, { useState } from 'react';
import { CommunityInitiative } from '../types/survey';

export const SchemesView: React.FC<{
  initiatives: CommunityInitiative[];
  setInitiatives: React.Dispatch<React.SetStateAction<CommunityInitiative[]>>;
}> = ({ initiatives, setInitiatives }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CommunityInitiative['category']>('Outreach Event');
  const [organisation, setOrganisation] = useState('');
  const [description, setDescription] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [filter, setFilter] = useState<'all' | 'Financial Bursary' | 'Upskilling' | 'Activity'>('all');

  const filtered = initiatives.filter(i => filter === 'all' || i.category === filter);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const newItem: CommunityInitiative = {
      id: `init-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim(),
      eligibility: eligibility.trim() || 'Open to all Singapore residents.',
      organisation: organisation.trim() || 'Social Services'
    };
    setInitiatives(prev => [...prev, newItem]);
    setTitle('');
    setDescription('');
    setEligibility('');
    setOrganisation('');
    setShowAdd(false);
  };

  const groupedByOrg = filtered.reduce((groups, item) => {
    const org = item.organisation?.trim() || 'Other Services';
    if (!groups[org]) {
      groups[org] = [];
    }
    groups[org].push(item);
    return groups;
  }, {} as Record<string, CommunityInitiative[]>);

  return (
    <div className="p-6 space-y-6 pb-32 text-left font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Support Schemes</h2>
          <p className="text-xs text-white/50">Schemes database used by matching engine</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-2 glass-button text-blue-400 rounded-xl text-xs font-black uppercase tracking-wider">{showAdd ? 'Close' : 'Add New'}</button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="glass-inset p-5 rounded-2xl space-y-3">
          <input type="text" placeholder="Title" required value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none" />
          <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white focus:outline-none">
            <option value="Financial Bursary">Financial Bursary</option>
            <option value="Upskilling">Upskilling</option>
            <option value="Outreach Event">Outreach Event</option>
            <option value="Activity">Activity</option>
          </select>
          <input type="text" placeholder="Organisation" value={organisation} onChange={e => setOrganisation(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20" />
          <textarea placeholder="Description" required rows={2} value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20" />
          <input type="text" placeholder="Eligibility Criteria" value={eligibility} onChange={e => setEligibility(e.target.value)} className="w-full p-3 bg-slate-900/40 rounded-xl text-xs text-white placeholder-white/20" />
          <button type="submit" className="w-full py-3 bg-blue-600 text-white font-black uppercase text-xs rounded-xl shadow">Save Scheme</button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-xl">
        {(['all', 'Financial Bursary', 'Upskilling', 'Activity'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filter === f ? 'glass-button text-blue-400' : 'text-white/40'}`}>
            {f === 'all' ? 'All' : f.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByOrg).map(([orgName, items]) => (
          <div key={orgName} className="space-y-3">
            <div className="flex items-center gap-2 pl-1.5 border-l-2 border-blue-500">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">{orgName}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-white/10 rounded-full text-white/60 font-bold">{items.length}</span>
            </div>
            <div className="space-y-3">
              {items.map(i => (
                <div key={i.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-xs">{i.title}</h4>
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">{i.category}</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{i.description}</p>
                  <div className="text-[9px] text-white/40 border-t border-white/5 pt-2 font-bold uppercase"><span className="text-blue-400">Eligibility:</span> {i.eligibility}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(groupedByOrg).length === 0 && (
          <p className="text-xs text-white/40 text-center py-6">No support schemes found in this category.</p>
        )}
      </div>
    </div>
  );
};
```

---

#### File 23: `src/components/views.tsx`
**Description**: Views coordinator exporting all subcomponents

```typescript
export { ErrorBoundary } from './ErrorBoundary';
export { Modal } from './Modal';
export { HomeView } from './HomeView';
export { RecordingView } from './RecordingView';
export { CoachingView } from './CoachingView';
export { ProfilesView } from './ProfilesView';
export { InitiativesView } from './InitiativesView';
export { SchemesView } from './SchemesView';
```

---

#### File 24: `src/App.tsx`
**Description**: Root App coordinator and premium bottom navigation layout

```typescript
import { useState } from 'react';
import { Upload, Zap, Mic, Users, Sparkles, Database } from 'lucide-react';
import { HomeView, CoachingView, RecordingView, ProfilesView, InitiativesView, SchemesView, ErrorBoundary } from './components/views';
import { Survey, ParticipantProfile, RecordingAnalysis, CommunityInitiative, DEFAULT_INITIATIVES } from './types/survey';
import { createAIService } from './services/services';

type Tab = 'home' | 'training' | 'record' | 'profiles' | 'initiatives' | 'schemes';

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
    { id: 'initiatives' as Tab, label: 'Outreach', icon: Sparkles },
    { id: 'schemes' as Tab, label: 'Schemes', icon: Database },
  ];

  return (
    <div className="h-screen h-[100dvh] glass-bg flex flex-col items-center overflow-hidden font-sans">
      <div className="w-full max-w-md h-full flex flex-col relative overflow-hidden glass-container">
        <header className="glass-header p-6 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-black text-white tracking-tighter uppercase flex-shrink-0">Surveyist</h1>
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
            />
          )}
          {activeTab === 'schemes' && <SchemesView initiatives={initiatives} setInitiatives={setInitiatives} />}
        </main>

        <nav className="absolute bottom-8 left-6 right-6 glass-nav rounded-3xl p-2.5 flex items-center justify-around z-50">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${isActive
                    ? 'bg-blue-500/30 text-white scale-105 shadow-md shadow-blue-500/25 backdrop-blur-sm'
                    : isDisabled
                      ? 'text-white/30 opacity-30 cursor-not-allowed'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
              >
                <Icon size={16} />
                <span className="text-[7px] font-black uppercase tracking-wider">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default App;
```

---

#### File 25: `src/__tests__/services.test.ts`
**Description**: Vitest unit and integration test suite

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getDiceCoefficient, isQuestionCovered } from '../types/survey';
import { FileParser, GroqService, MockAIService } from '../services/services';

// Mock File class since it might not be fully available in Node environment
class MockFile {
  name: string;
  size: number;
  type: string;
  constructor(name: string, size: number, type = '') {
    this.name = name;
    this.size = size;
    this.type = type;
  }
}

describe('Fuzzy Matching Utilities', () => {
  describe('getDiceCoefficient', () => {
    it('returns 1 for exact match', () => {
      expect(getDiceCoefficient('hello', 'hello')).toBe(1);
    });

    it('returns 1 for identical empty strings', () => {
      expect(getDiceCoefficient('', '')).toBe(1);
    });

    it('returns 0 for non-matching short strings less than 2 characters', () => {
      expect(getDiceCoefficient('a', 'b')).toBe(0);
    });

    it('returns expected similarity coefficient for partial matches', () => {
      expect(getDiceCoefficient('night', 'nacht')).toBe(0.25);
    });
  });

  describe('isQuestionCovered', () => {
    it('returns true for exact substring match', () => {
      expect(isQuestionCovered('What is your full name?', 'What is your full name?')).toBe(true);
      expect(isQuestionCovered('hello my name is John', 'name')).toBe(true);
    });

    it('returns true if most keywords are present', () => {
      const message = 'my monthly household income is low';
      const question = 'What is your monthly household income bracket?';
      expect(isQuestionCovered(message, question)).toBe(true);
    });

    it('filters out stop words and calculates ratio correctly', () => {
      const message = 'my current employment is stable';
      const question = 'What is your current employment status?';
      expect(isQuestionCovered(message, question)).toBe(true);
    });

    it('returns false when query does not match question context', () => {
      const message = 'My favorite color is blue';
      const question = 'Rate your access to reliable digital services at home';
      expect(isQuestionCovered(message, question)).toBe(false);
    });

    it('supports fuzzy spelling matches', () => {
      const message = 'My monthly inccome is 1500';
      const question = 'What is your monthly household income?';
      expect(isQuestionCovered(message, question)).toBe(true);
    });
  });
});

describe('FileParser Service Validation', () => {
  const parser = new FileParser();

  it('validates correct file types', () => {
    const fileDocx = new MockFile('survey.docx', 1024) as unknown as File;
    const filePdf = new MockFile('survey.pdf', 1024) as unknown as File;
    const fileTxt = new MockFile('survey.txt', 1024) as unknown as File;

    expect(parser.validateFile(fileDocx).valid).toBe(true);
    expect(parser.validateFile(filePdf).valid).toBe(true);
    expect(parser.validateFile(fileTxt).valid).toBe(true);
  });

  it('rejects unsupported extensions', () => {
    const filePng = new MockFile('survey.png', 1024) as unknown as File;
    const fileDoc = new MockFile('survey.doc', 1024) as unknown as File;

    const resPng = parser.validateFile(filePng);
    expect(resPng.valid).toBe(false);
    expect(resPng.error).toContain('not supported');

    const resDoc = parser.validateFile(fileDoc);
    expect(resDoc.valid).toBe(false);
  });

  it('rejects files larger than 10MB', () => {
    const hugeFile = new MockFile('survey.docx', 11 * 1024 * 1024) as unknown as File;
    const res = parser.validateFile(hugeFile);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('exceeds 10MB limit');
  });
});

describe('MockAIService', () => {
  const service = new MockAIService();

  it('returns valid survey structure', async () => {
    const survey = await service.parseSurvey('test');
    expect(survey.id).toBeDefined();
    expect(survey.name).toBe('Community Support & Needs Assessment Survey');
    expect(survey.questions.length).toBe(5);
    expect(survey.questions[0].fieldName).toBe('What is your full name?');
  });

  it('generates coaching overview', async () => {
    const survey = { id: 's1', name: 'Test', questions: [] };
    const overview = await service.generateCoachingOverview(survey);
    expect(overview.surveyName).toBe('Test');
    expect(overview.totalQuestions).toBe(0);
    expect(overview.estimatedDuration).toBeDefined();
  });
});

describe('GroqService Response Parsing & Normalization', () => {
  // Use a dummy key to initialize the groq SDK without falling back to MockAIService
  const service = new GroqService('gsk_dummy_key_for_testing');

  it('successfully extracts JSON object surrounded by markdown or other text', async () => {
    // Access the private method parseResponse via any casting
    const parser = (service as any).parseResponse.bind(service);
    
    const cleanJSON = `{"key": "value"}`;
    const markdownJSON = `Here is the JSON you requested:\n\`\`\`json\n{"key": "value"}\n\`\`\`\nHope this helps!`;
    const garbageJSON = `some random garbage {"key": "value"} more garbage`;

    expect(parser(cleanJSON)).toEqual({ key: 'value' });
    expect(parser(markdownJSON)).toEqual({ key: 'value' });
    expect(parser(garbageJSON)).toEqual({ key: 'value' });
  });

  it('handles invalid JSON gracefully and returns empty object', () => {
    const parser = (service as any).parseResponse.bind(service);
    expect(parser(null)).toEqual({});
    expect(parser('not a json')).toEqual({});
  });

  it('normalizes survey flow steps when they are returned as objects with stepName and description', () => {
    const normalizer = (service as any).normalizeSurveyFlow.bind(service);
    const flowObj = [
      { stepName: 'Intro', description: 'Introduce yourself' },
      { name: 'Core', desc: 'Ask questions' },
      'Closing'
    ];
    const result = normalizer(flowObj);
    expect(result[0]).toBe('Intro - Introduce yourself');
    expect(result[1]).toBe('Core - Ask questions');
    expect(result[2]).toBe('Closing');
  });

  it('normalizes snake_case fields and phrasings fields to standard camelCase arrays', async () => {
    // Stub the groq client call to return custom snake_case payloads
    const mockChatCompletion = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            natural_phrasing: ['How do you feel?'],
            common_mistakes: ['Being rude'],
            tips: ['Be polite']
          })
        }
      }]
    });

    (service as any).groq = {
      chat: {
        completions: {
          create: mockChatCompletion
        }
      }
    };

    const coaching = await service.generateSingleQuestionCoaching('q1', 'How are you?');
    expect(coaching.questionId).toBe('q1');
    expect(coaching.question).toBe('How are you?');
    expect(coaching.naturalPhrasing).toEqual(['How do you feel?']);
    expect(coaching.commonMistakes).toEqual(['Being rude']);
    expect(coaching.followUpTips).toEqual(['Be polite']);
    expect(coaching.stealthIntegration).toBeDefined();
  });

  it('normalizes alternative phrasings when original keys are not present', async () => {
    const mockChatCompletion = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            phrasings: ['How is your day?'],
            mistakes: ['Failing'],
            follow_up_tips: ['Keep asking'],
            stealth_integration: 'Weave in casually'
          })
        }
      }]
    });

    (service as any).groq = {
      chat: {
        completions: {
          create: mockChatCompletion
        }
      }
    };

    const coaching = await service.generateSingleQuestionCoaching('q2', 'How is everything?');
    expect(coaching.naturalPhrasing).toEqual(['How is your day?']);
    expect(coaching.commonMistakes).toEqual(['Failing']);
    expect(coaching.followUpTips).toEqual(['Keep asking']);
    expect(coaching.stealthIntegration).toBe('Weave in casually');
  });

  it('includes totalQuestions and parses questionsAsked in practice feedback', async () => {
    const mockChatCompletion = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            overallScore: 90,
            duration: '4 mins',
            questionsAsked: '4',
            strengths: ['Active listening'],
            improvements: ['Ask more probing questions']
          })
        }
      }]
    });

    (service as any).groq = {
      chat: {
        completions: {
          create: mockChatCompletion
        }
      }
    };

    const survey = {
      id: 's1',
      name: 'Test Survey',
      questions: [
        { id: 'q1', fieldName: 'Q1', type: 'string' as const },
        { id: 'q2', fieldName: 'Q2', type: 'string' as const },
        { id: 'q3', fieldName: 'Q3', type: 'string' as const }
      ]
    };

    const feedback = await service.generatePracticeFeedback('some transcript', survey);
    expect(feedback.totalQuestions).toBe(3);
    expect(feedback.questionsAsked).toBe(4);
  });
});
```

---

Once all files are written, verify all import bindings and start the development server (`npm run dev`) to launch the preview.
