import React, { useState } from 'react';
import { generateLandingPage, generatePresentationData, generatePresentationImage, generateSpeech } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { createWavBlobUrl, decodeBase64 } from '../utils/helpers';
import { PresentationSlide } from '../types';
import PresentationViewer from './PresentationViewer';

type Status = 'idle' | 'generating_text' | 'generating_script' | 'generating_images' | 'generating_audio' | 'done' | 'error';

const ResearcherPanel: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [landingPageHtml, setLandingPageHtml] = useState<string>('');
  const [slides, setSlides] = useState<PresentationSlide[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [progressMessage, setProgressMessage] = useState('');


  const handleGeneratePitch = async () => {
    if (!topic.trim()) {
      setError('Please provide a topic for your pitch.');
      setStatus('error');
      return;
    }

    setStatus('generating_text');
    setError('');
    setLandingPageHtml('');
    setAudioUrl(null);
    setSlides([]);
    setProgressMessage('');

    try {
      // Step 1: Generate Landing Page HTML
      const htmlResult = await generateLandingPage(topic);
      if (htmlResult.startsWith('Error:')) throw new Error(htmlResult);
      setLandingPageHtml(htmlResult);
      
      // Step 2: Generate Presentation Data (Script, Titles, Image Prompts)
      setStatus('generating_script');
      const presentationData = await generatePresentationData(htmlResult);
      if (!presentationData || presentationData.length === 0) {
        throw new Error("Failed to generate presentation data.");
      }
      const initialSlides = presentationData.map(data => ({ ...data, imageUrl: null }));
      setSlides(initialSlides);

      // Step 3: Generate Images in Parallel
      setStatus('generating_images');
      const imagePromises = presentationData.map((slide, index) => 
        generatePresentationImage(slide.imagePrompt).then(imageData => {
          setProgressMessage(`Generating image ${index + 1} of ${presentationData.length}...`);
          if (imageData) {
            const imageUrl = `data:image/jpeg;base64,${imageData}`;
            setSlides(prev => prev.map((s, i) => i === index ? { ...s, imageUrl } : s));
          }
        })
      );
      await Promise.all(imagePromises);

      // Step 4: Generate Full Audio from Script
      setStatus('generating_audio');
      const fullScript = presentationData.map(s => s.script).join('\n\n');
      // FIX: The `generateSpeech` function requires a voice name as the second argument.
      // 'Kore' is chosen as a default voice. The original call was missing this argument,
      // which is the likely cause of the "Expected 2 arguments, but got 1" error.
      const audioData = await generateSpeech(fullScript, 'Kore');
      if (!audioData) throw new Error('Failed to generate audio data.');
      
      // FIX: The TTS API returns raw PCM audio data, which cannot be played directly
      // in an <audio> tag. The base64 response is decoded and then wrapped in a
      // WAV file format to ensure browser compatibility.
      const audioBytes = decodeBase64(audioData);
      const url = createWavBlobUrl(audioBytes);
      setAudioUrl(url);

      setStatus('done');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setStatus('error');
      console.error(err);
    }
  };

  const getStatusMessage = (): string => {
    switch (status) {
      case 'generating_text': return 'Analyzing topic and generating landing page...';
      case 'generating_script': return 'Structuring the presentation...';
      case 'generating_images': return progressMessage || 'Conceptualizing visuals...';
      case 'generating_audio': return 'Synthesizing 10-minute audio summary... This may take a moment.';
      default: return '';
    }
  };

  const isLoading = status !== 'idle' && status !== 'done' && status !== 'error';

  return (
    <div className="bg-white dark:bg-dark-card shadow-lg rounded-xl overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-brand-primary dark:text-brand-light mb-2">Investor Pitch Generator</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Describe your idea, and Gemini will generate a landing page and a full audiovisual presentation to win over investors.
        </p>
        <div className="space-y-4">
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., A solar-powered drone for agricultural monitoring..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-light outline-none transition duration-200"
            rows={4}
            disabled={isLoading}
          />
          <button
            onClick={handleGeneratePitch}
            disabled={isLoading}
            className="w-full sm:w-auto bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center"
          >
            {isLoading ? 'Generating...' : 'Generate Investor Pitch'}
          </button>
        </div>
      </div>
      
      <div className="px-6 pb-6">
        {isLoading && <LoadingSpinner message={getStatusMessage()} />}
        {status === 'error' && <div className="text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}
        
        {(status === 'done' && slides.length > 0 && audioUrl) && (
          <div className="mt-6 space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Synchronized Presentation</h3>
              <PresentationViewer slides={slides} audioUrl={audioUrl} />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">Investor Landing Page Preview</h3>
              <div 
                className="prose prose-lg dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border dark:border-gray-700"
                dangerouslySetInnerHTML={{ __html: landingPageHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearcherPanel;