
import React, { useState, useRef, useCallback } from 'react';
import { generateSpeech } from '../services/geminiService';
import { decodeBase64, decodeAudioData } from '../utils/helpers';
import LoadingSpinner from './LoadingSpinner';

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState<string>('Hello! I am Galileo. How can I assist you today?');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const audioContext = audioContextRef.current;
        
        // Stop any currently playing audio
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
    
    try {
      const audioData = await generateSpeech(text);
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
        Convert text into natural-sounding speech with Gemini.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to speak..."
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-light outline-none transition duration-200"
        rows={6}
      />

      <button
        onClick={handleSubmit}
        disabled={isLoading || isPlaying}
        className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Generating Audio...' : (isPlaying ? 'Playing...' : 'Speak Now')}
      </button>
      
      {isLoading && <LoadingSpinner message="Synthesizing speech..." />}
      {error && <div className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}
    </div>
  );
};

export default TextToSpeech;