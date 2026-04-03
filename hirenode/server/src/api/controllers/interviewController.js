import { Candidate, Job } from '../../models/index.js';
import { generateInterviewQuestion } from '../../agents/InterviewerAgent.js';
import { evaluateInterview } from '../../agents/EvaluatorAgent.js';

// GET /api/interview/validate-token/:token
export const validateToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const candidate = await Candidate.findOne({
      'interviewToken.token': token,
    }).populate('jobId', 'title description rubric');

    if (!candidate) {
      return res.status(404).json({ error: 'Invalid interview token' });
    }

    if (candidate.interviewToken.expiresAt < new Date()) {
      candidate.interview.status = 'expired';
      await candidate.save();
      return res.status(410).json({ error: 'Interview link has expired' });
    }

    if (candidate.interview.status === 'completed') {
      return res.status(410).json({ error: 'Interview already completed' });
    }

    if (candidate.interviewToken.usedAt && candidate.interview.status !== 'in_progress') {
      return res.status(410).json({ error: 'Interview link already used' });
    }

    const job = await Job.findById(candidate.jobId);

    res.json({
      valid: true,
      candidate: {
        name: candidate.personal.name,
        jobTitle: job?.title || 'Unknown Role',
        jobDescription: job?.description || '',
        interviewStatus: candidate.interview.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/interview/start
export const startInterview = async (req, res, next) => {
  try {
    const { token } = req.body;

    const candidate = await Candidate.findOne({ 'interviewToken.token': token });
    if (!candidate) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const job = await Job.findById(candidate.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Mark interview as started
    candidate.interview.status = 'in_progress';
    candidate.interview.startedAt = new Date();
    candidate.interviewToken.usedAt = new Date();
    candidate.pipelineStage = 'interview_scheduled';

    // Generate first question
    let firstQuestion;
    try {
      firstQuestion = await generateInterviewQuestion({
        rubric: job.rubric,
        questionBank: job.questionBank,
        conversationHistory: [],
        candidateName: candidate.personal.name,
        jobTitle: job.title,
        stage: 'early',
        questionNumber: 1,
        cvSummary: candidate.cvText.substring(0, 500),
      });
    } catch (aiError) {
      console.error('AI question generation failed:', aiError.message);
      firstQuestion = {
        question: `Hello ${candidate.personal.name}! Welcome to your interview for the ${job.title} position. To start, could you walk me through your background and what excites you about this role?`,
        competencyAssessed: job.rubric[0]?.competency || 'general',
      };
    }

    // Add AI question to conversation history
    candidate.interview.conversationHistory.push({
      role: 'ai',
      content: firstQuestion.question,
      timestamp: new Date(),
      competencyAssessed: firstQuestion.competencyAssessed,
    });
    candidate.interview.questionCount = 1;

    await candidate.save();

    res.json({
      message: 'Interview started',
      question: firstQuestion.question,
      questionNumber: 1,
      totalQuestions: 8,
      interviewStatus: 'continue',
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/interview/process-audio
export const processAudio = async (req, res, next) => {
  try {
    const { token, conversationHistory, questionNumber } = req.body;
    const parsedHistory = typeof conversationHistory === 'string'
      ? JSON.parse(conversationHistory)
      : conversationHistory || [];

    const candidate = await Candidate.findOne({ 'interviewToken.token': token });
    if (!candidate || candidate.interview.status !== 'in_progress') {
      return res.status(400).json({ error: 'Invalid or inactive interview session' });
    }

    const job = await Job.findById(candidate.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    let transcribedText = '';

    // Transcribe audio via Groq Whisper
    if (req.file) {
      try {
        const { transcribeAudio } = await import('../../services/groq.service.js');
        transcribedText = await transcribeAudio(req.file.buffer, req.file.mimetype);
      } catch (sttError) {
        console.error('STT failed:', sttError.message);
        transcribedText = '[Audio transcription failed]';
      }
    } else if (req.body.textResponse) {
      // Fallback: text input for testing
      transcribedText = req.body.textResponse;
    }

    // Add candidate's answer to history
    candidate.interview.conversationHistory.push({
      role: 'candidate',
      content: transcribedText,
      timestamp: new Date(),
    });

    const currentQuestionNum = parseInt(questionNumber) || candidate.interview.questionCount;
    const shouldConclude = currentQuestionNum >= 8;

    if (shouldConclude) {
      // Conclude interview
      candidate.interview.status = 'completed';
      candidate.interview.completedAt = new Date();
      candidate.interview.duration = Math.round(
        (candidate.interview.completedAt - candidate.interview.startedAt) / 1000
      );
      candidate.pipelineStage = 'completed';
      await candidate.save();

      await Job.findByIdAndUpdate(candidate.jobId, { $inc: { 'stats.interviewed': 1 } });

      // Trigger evaluation asynchronously
      setImmediate(async () => {
        try {
          const evalResult = await evaluateInterview({
            conversationHistory: candidate.interview.conversationHistory,
            rubric: job.rubric,
            jobTitle: job.title,
          });

          candidate.scores = {
            overall: evalResult.overallScore,
            breakdown: evalResult.breakdown,
            integrityScore: candidate.scores.integrityScore,
            aiVerdict: evalResult.verdict,
            aiSummary: evalResult.summary,
            confidence: evalResult.confidence,
            redFlags: evalResult.redFlags || [],
          };
          candidate.pipelineStage = 'reviewed';
          await candidate.save();
        } catch (evalError) {
          console.error('Evaluation failed:', evalError.message);
        }
      });

      return res.json({
        interviewStatus: 'completed',
        message: 'Interview completed. Thank you!',
        transcribedText,
      });
    }

    // Generate next question
    const coveredCompetencies = candidate.interview.conversationHistory
      .filter(m => m.role === 'ai' && m.competencyAssessed)
      .map(m => m.competencyAssessed);

    let stage = 'early';
    if (currentQuestionNum >= 3 && currentQuestionNum <= 6) stage = 'mid';
    else if (currentQuestionNum > 6) stage = 'late';

    let nextQuestion;
    try {
      nextQuestion = await generateInterviewQuestion({
        rubric: job.rubric,
        questionBank: job.questionBank,
        conversationHistory: candidate.interview.conversationHistory,
        candidateName: candidate.personal.name,
        jobTitle: job.title,
        stage,
        questionNumber: currentQuestionNum + 1,
        cvSummary: candidate.cvText.substring(0, 500),
        coveredCompetencies,
      });
    } catch (aiError) {
      console.error('AI question generation failed:', aiError.message);
      nextQuestion = {
        question: 'Could you tell me about a challenging project you worked on recently?',
        competencyAssessed: 'problem_solving',
      };
    }

    // Add AI's next question
    candidate.interview.conversationHistory.push({
      role: 'ai',
      content: nextQuestion.question,
      timestamp: new Date(),
      competencyAssessed: nextQuestion.competencyAssessed,
      preliminaryScore: nextQuestion.preliminaryScore || null,
    });
    candidate.interview.questionCount = currentQuestionNum + 1;

    await candidate.save();

    // Generate TTS audio (optional)
    let audioBuffer = null;
    try {
      const { synthesizeSpeech } = await import('../../services/tts.service.js');
      audioBuffer = await synthesizeSpeech(nextQuestion.question);
    } catch (ttsError) {
      console.error('TTS failed:', ttsError.message);
    }

    const response = {
      question: nextQuestion.question,
      questionNumber: currentQuestionNum + 1,
      totalQuestions: 8,
      interviewStatus: 'continue',
      transcribedText,
      competencyAssessed: nextQuestion.competencyAssessed,
    };

    if (audioBuffer) {
      response.audioBase64 = audioBuffer.toString('base64');
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// POST /api/interview/conclude
export const concludeInterview = async (req, res, next) => {
  try {
    const { token } = req.body;

    const candidate = await Candidate.findOne({ 'interviewToken.token': token });
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const job = await Job.findById(candidate.jobId);

    candidate.interview.status = 'completed';
    candidate.interview.completedAt = new Date();
    candidate.interview.duration = Math.round(
      (candidate.interview.completedAt - candidate.interview.startedAt) / 1000
    );
    candidate.pipelineStage = 'completed';
    await candidate.save();

    await Job.findByIdAndUpdate(candidate.jobId, { $inc: { 'stats.interviewed': 1 } });

    // Async evaluation
    setImmediate(async () => {
      try {
        const evalResult = await evaluateInterview({
          conversationHistory: candidate.interview.conversationHistory,
          rubric: job.rubric,
          jobTitle: job.title,
        });

        candidate.scores = {
          overall: evalResult.overallScore,
          breakdown: evalResult.breakdown,
          integrityScore: candidate.scores.integrityScore,
          aiVerdict: evalResult.verdict,
          aiSummary: evalResult.summary,
          confidence: evalResult.confidence,
          redFlags: evalResult.redFlags || [],
        };
        candidate.pipelineStage = 'reviewed';
        await candidate.save();
      } catch (evalError) {
        console.error('Evaluation failed:', evalError.message);
      }
    });

    res.json({ message: 'Interview concluded. Evaluation in progress.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/interview/heartbeat
export const heartbeat = async (req, res, next) => {
  try {
    const { token } = req.body;
    const candidate = await Candidate.findOne({ 'interviewToken.token': token });

    if (!candidate || candidate.interview.status !== 'in_progress') {
      return res.status(400).json({ active: false });
    }

    res.json({ active: true, questionNumber: candidate.interview.questionCount });
  } catch (error) {
    next(error);
  }
};

// POST /api/interview/flag
export const flagIntegrity = async (req, res, next) => {
  try {
    const { token, flagType, detail } = req.body;

    const candidate = await Candidate.findOne({ 'interviewToken.token': token });
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    candidate.flags.push({
      type: flagType,
      timestamp: new Date(),
      detail: detail || '',
    });

    // Reduce integrity score
    const penalty = {
      tab_switch: 5,
      copy_paste: 10,
      background_voice: 15,
      left_frame: 8,
    };
    candidate.scores.integrityScore = Math.max(
      0,
      (candidate.scores.integrityScore || 100) - (penalty[flagType] || 5)
    );

    await candidate.save();

    res.json({ message: 'Flag recorded' });
  } catch (error) {
    next(error);
  }
};
