
import React, { useState, useRef, useCallback } from 'react';
import { generateSpeech } from '../services/geminiService';
import { decodeBase64, decodeAudioData, createWavBlobUrl } from '../utils/helpers';
import LoadingSpinner from './LoadingSpinner';
import { DownloadIcon } from './common/Icons';

const voices = [
  { id: 'Kore', name: 'Kore (Female, calm)' },
  { id: 'Zephyr', name: 'Zephyr (Female, warm)' },
  { id: 'Puck', name: 'Puck (Male, friendly)' },
  { id: 'Charon', name: 'Charon (Male, deep)' },
  { id: 'Fenrir', name: 'Fenrir (Male, powerful)' },
];

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState<string>('Hello! I am Galileo. How can I assist you today?');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioContext = audioContextRef.current;
        
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }

        const audioBytes = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioContext);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => setIsPlaying(false);
        source.start();

        audioSourceRef.current = source;
        setIsPlaying(true);
        
        const wavUrl = createWavBlobUrl(audioBytes);
        setDownloadUrl(wavUrl);
    } catch (e) {
        console.error("Error playing audio: ", e);
        setError("Could not play the generated audio.");
        setIsPlaying(false);
    }
  }, []);


  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please enter some text to synthesize.');
      return;
    }
    setIsLoading(true);
    setError('');
    setDownloadUrl(null);
    
    try {
      const audioData = await generateSpeech(text, selectedVoice);
      if (audioData) {
        await playAudio(audioData);
      } else {
        setError('Failed to generate speech. The API returned no audio data.');
      }
    } catch (err) {
      setError('An error occurred during speech synthesis.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card shadow-lg rounded-xl p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-brand-primary dark:text-brand-light mb-2">Text-to-Speech</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Convert text into natural-sounding speech with Gemini, powered by SSML for enhanced quality.
      </p>

      <div className="space-y-4">
        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to speak..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-light outline-none transition duration-200"
            rows={6}
        />
        <div>
            <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select a Voice:</label>
            <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-light outline-none transition duration-200"
            >
                {voices.map(voice => (
                <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
            </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || isPlaying}
        className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Generating Audio...' : (isPlaying ? 'Playing...' : 'Speak Now')}
      </button>
      
      {isLoading && <LoadingSpinner message="Synthesizing speech..." />}
      {error && <div className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}
      
      {downloadUrl && !isLoading && (
        <div className="mt-4 text-center">
            <a
                href={downloadUrl}
                download="galileo-speech.wav"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                <DownloadIcon className="w-5 h-5" />
                Download Audio (.wav)
            </a>
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;
