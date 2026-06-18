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
  });

  it('normalizes alternative phrasings when original keys are not present', async () => {
    const mockChatCompletion = vi.fn().mockResolvedValue({
      choices: [{
        message: {
          content: JSON.stringify({
            phrasings: ['How is your day?'],
            mistakes: ['Failing'],
            follow_up_tips: ['Keep asking']
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
  });
});
