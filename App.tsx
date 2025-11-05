
import React, { useState } from 'react';
import Header from './components/Header';
import ResearcherPanel from './components/ResearcherPanel';
import ImageAnalyzer from './components/ImageAnalyzer';
import VideoAnalyzer from './components/VideoAnalyzer';
import QuickAnswer from './components/QuickAnswer';
import TextToSpeech from './components/TextToSpeech';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.PITCH_GENERATOR);

  const renderContent = () => {
    switch (mode) {
      case AppMode.PITCH_GENERATOR:
        return <ResearcherPanel />;
      case AppMode.IMAGE_ANALYZER:
        return <ImageAnalyzer />;
      case AppMode.VIDEO_ANALYZER:
        return <VideoAnalyzer />;
      case AppMode.QUICK_ANSWER:
        return <QuickAnswer />;
      case AppMode.TTS:
        return <TextToSpeech />;
      default:
        return <ResearcherPanel />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header currentMode={mode} setMode={setMode} />
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-xs text-gray-500 dark:text-gray-400">
        <p>Galileo | Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
