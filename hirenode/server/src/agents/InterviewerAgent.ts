import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey || 'dummy-key');

/**
 * Interviewer Agent
 * Generates contextual, adaptive interview questions based on conversation history
 */
export const generateInterviewQuestion = async ({
  rubric,
  questionBank,
  conversationHistory,
  candidateName,
  jobTitle,
  stage,
  questionNumber,
  cvSummary,
  coveredCompetencies = [],
}) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const rubricStr = rubric.map(r => `- ${r.competency} (${r.weight}%): ${r.description}`).join('\n');

    const remainingCompetencies = rubric
      .filter(r => !coveredCompetencies.includes(r.competency))
      .map(r => r.competency);

    const historyStr = conversationHistory
      .slice(-6) // Last 3 exchanges
      .map(m => `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n\n');

    const stageInstructions = {
      early: 'Ask warm, open-ended questions. "Walk me through..." or "Tell me about..." style. Make the candidate comfortable.',
      mid: 'Ask technical depth questions. Be adaptive — if the previous answer revealed a weakness, probe deeper. If strong, move to the next competency. Ask stack-specific questions.',
      late: 'Ask behavioral/situational questions. Expect STAR format answers. "Tell me about a time when..." or "How would you handle..."',
    };

    const prompt = `You are "Alex", an AI interviewer for the "${jobTitle}" position. You are interviewing ${candidateName}.

RUBRIC:
${rubricStr}

COMPETENCIES ALREADY COVERED: ${coveredCompetencies.join(', ') || 'None yet'}
COMPETENCIES REMAINING: ${remainingCompetencies.join(', ') || 'All covered'}

CANDIDATE CV SUMMARY:
${cvSummary || 'Not available'}

CONVERSATION SO FAR:
${historyStr || 'Interview just started'}

STAGE: ${stage} (Question ${questionNumber} of 8)
STAGE INSTRUCTIONS: ${stageInstructions[stage] || stageInstructions.mid}

RULES:
- Generate exactly ONE natural follow-up question
- If the candidate's last answer was vague, ask ONE follow-up to get specifics
- The question should target a competency from the REMAINING list if possible
- Sound natural and conversational, not robotic
- Do NOT repeat questions already asked
- Keep the question concise (1-3 sentences max)

Return a JSON object:
{
  "question": "your question text",
  "competencyAssessed": "which competency this question targets",
  "preliminaryScore": number (0-10, your impression of the last answer quality, or null if first question),
  "interviewStatus": "continue" or "conclude" (conclude only if all 8 questions are done)
}

Return ONLY valid JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      question: parsed.question,
      competencyAssessed: parsed.competencyAssessed || remainingCompetencies[0] || 'general',
      preliminaryScore: parsed.preliminaryScore || null,
      interviewStatus: parsed.interviewStatus || 'continue',
    };
  } catch (error) {
    console.error('Interviewer Agent error:', error.message);

    // Fallback questions by stage
    const fallbacks = {
      early: `Thanks for joining, ${candidateName}. Could you walk me through your experience and what interests you about this ${jobTitle} role?`,
      mid: 'Can you describe a technically challenging problem you solved recently? Please walk me through your approach.',
      late: 'Tell me about a time when you had to work under pressure to meet a tight deadline. How did you handle it?',
    };

    return {
      question: fallbacks[stage] || fallbacks.mid,
      competencyAssessed: rubric[0]?.competency || 'general',
      preliminaryScore: null,
      interviewStatus: questionNumber >= 8 ? 'conclude' : 'continue',
    };
  }
};
