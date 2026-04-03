import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey || 'dummy-key');

/**
 * Evaluator Agent
 * Run once per interview conclusion. Uses Gemini Pro for higher quality reasoning.
 * Chain-of-thought evaluation of the full transcript.
 */
export const evaluateInterview = async ({ conversationHistory, rubric, jobTitle }) => {
  try {
    // Use Gemini Pro for evaluation (higher quality, latency acceptable)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const rubricStr = rubric.map(r => `- ${r.competency} (weight: ${r.weight}%): ${r.description}`).join('\n');

    const transcript = conversationHistory
      .map(m => `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n\n');

    const prompt = `You are an expert interview evaluator. You must evaluate the following interview transcript for the "${jobTitle}" position.

EVALUATION RUBRIC:
${rubricStr}

FULL INTERVIEW TRANSCRIPT:
${transcript}

INSTRUCTIONS:
1. Evaluate each answer segment independently against the relevant competency.
2. For each competency in the rubric, provide a score (0-100) and a brief reasoning (1-2 sentences).
3. Calculate the overall weighted score based on the rubric weights.
4. Write a 2-3 sentence summary as if writing for a hiring manager.
5. Provide a final verdict: "shortlist" (score >= 70), "hold" (50-69), or "reject" (< 50).
6. List any red flags observed during the interview.
7. Provide a confidence level (0-100) in your evaluation.

Use chain-of-thought reasoning: evaluate each answer, then synthesize.

Return a JSON object with exactly this structure:
{
  "breakdown": [
    {
      "competency": "string",
      "score": number (0-100),
      "reasoning": "string (1-2 sentences)"
    }
  ],
  "overallScore": number (0-100, weighted by rubric),
  "summary": "string (2-3 sentences for hiring manager)",
  "verdict": "shortlist" | "hold" | "reject",
  "confidence": number (0-100),
  "redFlags": ["string"] (empty array if none)
}

Return ONLY valid JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      breakdown: parsed.breakdown || [],
      overallScore: parsed.overallScore || 0,
      summary: parsed.summary || '',
      verdict: parsed.verdict || 'hold',
      confidence: parsed.confidence || 50,
      redFlags: parsed.redFlags || [],
    };
  } catch (error) {
    console.error('Evaluator Agent error:', error.message);

    // Fallback: basic scoring
    return {
      breakdown: rubric.map(r => ({
        competency: r.competency,
        score: 50,
        reasoning: 'AI evaluation unavailable. Manual review required.',
      })),
      overallScore: 50,
      summary: 'AI evaluation failed. Please review the transcript manually.',
      verdict: 'hold',
      confidence: 0,
      redFlags: ['AI evaluation error — manual review required'],
    };
  }
};
