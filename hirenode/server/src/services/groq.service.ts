import Groq from 'groq-sdk';
import config from '../config/index.js';

const groq = new Groq({ apiKey: config.groq.apiKey || 'dummy-key' });

/**
 * Transcribe audio using Groq Whisper
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} mimeType - MIME type of the audio
 * @returns {string} Transcribed text
 */
export const transcribeAudio = async (audioBuffer, mimeType = 'audio/webm') => {
  try {
    // Convert buffer to File-like object for Groq SDK
    const file = new File([audioBuffer], 'audio.webm', { type: mimeType });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3',
      language: 'en',
      response_format: 'text',
    });

    return transcription || '';
  } catch (error) {
    console.error('Groq STT error:', error.message);

    // Fallback: try with json format
    try {
      const file = new File([audioBuffer], 'audio.webm', { type: mimeType });
      const transcription = await groq.audio.transcriptions.create({
        file,
        model: 'whisper-large-v3',
        language: 'en',
        response_format: 'json',
      });
      return transcription.text || '';
    } catch (retryError) {
      console.error('Groq STT retry failed:', retryError.message);
      throw new Error('Audio transcription failed');
    }
  }
};
