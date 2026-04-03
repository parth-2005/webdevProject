import config from '../config/index.js';

// Cache for commonly repeated phrases
const audioCache = new Map();

// Pre-cache common filler phrases on startup
const CACHED_PHRASES = [
  'Interesting, can you tell me more about that?',
  'Thanks for sharing that. Moving to the next question.',
  'Could you elaborate on that point?',
  'Thank you. Let me ask you about something else.',
  'Great, that helps me understand your experience better.',
];

/**
 * Synthesize speech using Google Cloud TTS API
 * @param {string} text - Text to convert to speech
 * @returns {Buffer} Audio buffer (MP3)
 */
export const synthesizeSpeech = async (text) => {
  // Check cache first
  const cacheKey = text.trim().toLowerCase();
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey);
  }

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${config.googleTts.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Neural2-D', // Professional male voice
            ssmlGender: 'MALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 1.0,
            pitch: 0,
            volumeGainDb: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.statusText}`);
    }

    const data = await response.json();
    const audioBuffer = Buffer.from(data.audioContent, 'base64');

    // Cache short phrases
    if (text.length < 100) {
      audioCache.set(cacheKey, audioBuffer);
    }

    return audioBuffer;
  } catch (error) {
    console.error('TTS error:', error.message);
    return null;
  }
};

/**
 * Pre-warm the cache on startup
 */
export const warmTTSCache = async () => {
  if (!config.googleTts.apiKey || config.googleTts.apiKey === 'your_google_tts_api_key_here') {
    console.log('⚠️  TTS API key not configured. Skipping cache warm-up.');
    return;
  }

  console.log('🔄 Warming TTS cache...');
  for (const phrase of CACHED_PHRASES) {
    try {
      await synthesizeSpeech(phrase);
    } catch {
      // Silently skip failed cache entries
    }
  }
  console.log(`✅ TTS cache warmed: ${audioCache.size} phrases cached.`);
};
