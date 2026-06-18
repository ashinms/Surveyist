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