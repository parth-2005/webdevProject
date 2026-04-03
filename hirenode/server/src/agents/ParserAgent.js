import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/index.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey || 'dummy-key');

/**
 * Parser Agent — JD Parsing
 * Extracts rubric and question bank from a job description
 */
export const parseJD = async (jdText, jobTitle) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert HR assistant. Analyze the following job description and extract a structured interview rubric and question bank.

Job Title: ${jobTitle}
Job Description:
${jdText}

Return a JSON object with exactly this structure:
{
  "rubric": [
    {
      "competency": "string (e.g., 'System Design', 'Problem Solving')",
      "weight": number (0-100, all weights must sum to 100),
      "description": "string (what this competency evaluates)"
    }
  ],
  "questionBank": [
    {
      "questionText": "string (the interview question)",
      "type": "technical|behavioral|situational|warmup",
      "targetCompetency": "string (which competency this tests)"
    }
  ]
}

Generate 5-7 competencies with weights summing to 100.
Generate 10-15 diverse questions covering all competencies.
Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Clean JSON from potential markdown code blocks
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      rubric: parsed.rubric || [],
      questionBank: parsed.questionBank || [],
    };
  } catch (error) {
    console.error('Parser Agent (JD) error:', error.message);
    // Return fallback rubric
    return {
      rubric: [
        { competency: 'Technical Skills', weight: 30, description: 'Core technical knowledge and expertise' },
        { competency: 'Problem Solving', weight: 20, description: 'Ability to analyze and solve complex problems' },
        { competency: 'Communication', weight: 15, description: 'Clear articulation of ideas and concepts' },
        { competency: 'Experience Relevance', weight: 15, description: 'Relevant work experience and projects' },
        { competency: 'Cultural Fit', weight: 10, description: 'Alignment with team and company values' },
        { competency: 'Leadership', weight: 10, description: 'Leadership potential and initiative' },
      ],
      questionBank: [
        { questionText: 'Walk me through your most recent project and your role in it.', type: 'warmup', targetCompetency: 'Experience Relevance' },
        { questionText: 'Can you explain a complex technical concept you work with regularly?', type: 'technical', targetCompetency: 'Technical Skills' },
        { questionText: 'Describe a time you had to debug a difficult production issue.', type: 'situational', targetCompetency: 'Problem Solving' },
        { questionText: 'How do you approach designing a system from scratch?', type: 'technical', targetCompetency: 'Technical Skills' },
        { questionText: 'Tell me about a time you disagreed with a colleague on a technical approach.', type: 'behavioral', targetCompetency: 'Communication' },
        { questionText: 'How do you stay updated with the latest technologies?', type: 'behavioral', targetCompetency: 'Cultural Fit' },
        { questionText: 'Describe a situation where you had to lead a project or initiative.', type: 'behavioral', targetCompetency: 'Leadership' },
        { questionText: 'Walk me through how you would optimize a slow database query.', type: 'technical', targetCompetency: 'Problem Solving' },
      ],
    };
  }
};

/**
 * Parser Agent — CV Parsing & Shortlisting
 * Analyzes a CV against job rubric and makes shortlist decision
 */
export const parseCV = async (cvText, rubric, jobTitle) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const rubricSummary = rubric.map(r => `${r.competency} (${r.weight}%): ${r.description}`).join('\n');

    const prompt = `You are an expert recruiter analyzing a candidate's CV against a job's requirements.

Job Title: ${jobTitle}
Required Competencies:
${rubricSummary}

Candidate CV:
${cvText.substring(0, 3000)}

Analyze the CV and return a JSON object with exactly this structure:
{
  "cvData": {
    "skills": ["skill1", "skill2"],
    "experience": number (years of experience, best estimate),
    "companies": ["company1", "company2"],
    "education": "string (degree and institution)"
  },
  "isShortlisted": boolean (true if candidate meets at least 60% of requirements),
  "shortlistReason": "string (2-3 sentences explaining the decision)",
  "matchScore": number (0-100, how well the CV matches the requirements)
}

Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      cvData: parsed.cvData || {},
      isShortlisted: parsed.isShortlisted || false,
      shortlistReason: parsed.shortlistReason || 'Unable to determine shortlist status.',
      matchScore: parsed.matchScore || 0,
    };
  } catch (error) {
    console.error('Parser Agent (CV) error:', error.message);
    return {
      cvData: {},
      isShortlisted: false,
      shortlistReason: 'AI analysis unavailable. Manual review required.',
      matchScore: 0,
    };
  }
};

/**
 * Generate JD from role name + context
 */
export const generateJobDescription = async (roleName, teamContext, techStack) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert technical writer. Generate a comprehensive job description for:

Role: ${roleName}
Team Context: ${teamContext || 'Not specified'}
Tech Stack: ${techStack || 'Not specified'}

Write a professional job description with:
1. Role Title
2. About the Role (2-3 paragraphs)
3. Key Responsibilities (5-7 bullet points)
4. Required Qualifications (5-7 bullet points)
5. Nice to Have (3-4 bullet points)
6. What We Offer (3-4 bullet points)

Write in a professional but engaging tone. Make it compelling.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('JD Generation error:', error.message);
    return `# ${roleName}\n\nWe are looking for a talented ${roleName} to join our team. Please update this job description with specific requirements.`;
  }
};
