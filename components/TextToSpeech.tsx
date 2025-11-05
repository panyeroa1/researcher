
import React, { useState, useRef, useCallback } from 'react';
import { generateSpeech } from '../services/geminiService';
import { decodeBase64, decodeAudioData, createWavBlobUrl, mixAudio, audioBufferToPcmBytes } from '../utils/helpers';
import LoadingSpinner from './LoadingSpinner';
import { DownloadIcon } from './common/Icons';
import { BACKGROUND_MUSIC_TRACKS } from '../constants';

const voices = [
  { id: 'Kore', name: 'Kore (Female, calm)' },
  { id: 'Zephyr', name: 'Zephyr (Female, warm)' },
  { id: 'Puck', name: 'Puck (Male, friendly)' },
  { id: 'Charon', name: 'Charon (Male, deep)' },
  { id: 'Fenrir', name: 'Fenrir (Male, powerful)' },
];

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState<string>('Read aloud like an old explorer recounting the world’s secrets — deep, calm, and full of lived wisdom.\nLet each line flow slowly and reverently, as if every word reveals another heartbeat of the planet');
  const [selectedVoice, setSelectedVoice] = useState<string>('Charon');
  const [selectedMusic, setSelectedMusic] = useState<string>('none');
  const [musicVolume, setMusicVolume] = useState<number>(0.15);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);
  
  const playAudioBuffer = useCallback(async (buffer: AudioBuffer) => {
    try {
        const audioContext = getAudioContext();
        
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
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
  }, [getAudioContext]);


  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please enter some text to synthesize.');
      return;
    }
    setIsLoading(true);
    setStatusMessage('Synthesizing speech...');
    setError('');
    setDownloadUrl(null);
    
    try {
      const audioData = await generateSpeech(text, selectedVoice);
      if (!audioData) {
        throw new Error('Failed to generate speech. The API returned no audio data.');
      }

      const speechBytes = decodeBase64(audioData);

      if (selectedMusic === 'none') {
        const audioContext = getAudioContext();
        const speechBuffer = await decodeAudioData(speechBytes, audioContext);
        await playAudioBuffer(speechBuffer);
        const url = createWavBlobUrl(speechBytes);
        setDownloadUrl(url);
      } else {
        setStatusMessage('Mixing background music...');
        const musicTrack = BACKGROUND_MUSIC_TRACKS.find(t => t.id === selectedMusic);
        if (!musicTrack) throw new Error('Selected music track not found.');

        const mixedBuffer = await mixAudio(speechBytes, musicTrack.url, musicVolume);
        await playAudioBuffer(mixedBuffer);

        setStatusMessage('Encoding final audio...');
        const mixedPcmBytes = audioBufferToPcmBytes(mixedBuffer);
        const url = createWavBlobUrl(mixedPcmBytes);
        setDownloadUrl(url);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card shadow-lg rounded-xl p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-brand-primary dark:text-brand-light mb-2">Text-to-Speech Studio</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Convert text into natural-sounding speech, and optionally add background music for a professional touch.
      </p>

      <div className="space-y-4">
        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to speak..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-light outline-none transition duration-200"
            rows={6}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Voice:</label>
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
            <div>
                <label htmlFor="music-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background Music:</label>
                <select
                    id="music-select"
                    value={selectedMusic}
                    onChange={(e) => setSelectedMusic(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-light outline-none transition duration-200"
                >
                    <option value="none">None</option>
                    {BACKGROUND_MUSIC_TRACKS.map(track => (
                        <option key={track.id} value={track.id}>{track.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {selectedMusic !== 'none' && (
             <div>
                <label htmlFor="volume-slider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Music Volume: {Math.round(musicVolume * 100)}%</label>
                <input
                    id="volume-slider"
                    type="range"
                    min="0"
                    max="0.5" // Max volume at 50% to prevent overpowering speech
                    step="0.01"
                    value={musicVolume}
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
            </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || isPlaying}
        className="mt-6 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Generating...' : (isPlaying ? 'Playing...' : 'Generate & Play')}
      </button>
      
      {isLoading && <LoadingSpinner message={statusMessage} />}
      {error && <div className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}
      
      {downloadUrl && !isLoading && (
        <div className="mt-4 text-center">
            <a
                href={downloadUrl}
                download="galileo-speech.wav"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                <DownloadIcon className="w-5 h-5" />
                Download Mixed Audio (.wav)
            </a>
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;
