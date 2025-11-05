import React, { useState, useEffect, useRef } from 'react';
import { PresentationSlide } from '../types';

interface PresentationViewerProps {
  slides: PresentationSlide[];
  audioUrl: string;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({ slides, audioUrl }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideTimings, setSlideTimings] = useState<{ startTime: number; index: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'%3E%3Crect width='1280' height='720' fill='%23111827'/%3E%3Ctext x='50%' y='50%' font-family='sans-serif' font-size='48' fill='white' text-anchor='middle' dy='.3em'%3EGenerating Image...%3C/text%3E%3C/svg%3E";


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const calculateTimings = () => {
      if (!isFinite(audio.duration)) return;

      const totalDuration = audio.duration;
      const totalWords = slides.reduce((sum, slide) => sum + (slide.script.split(' ').length || 1), 0);
      
      if (totalWords === 0) return;

      let cumulativeTime = 0;
      const timings = slides.map((slide, index) => {
        const startTime = cumulativeTime;
        const slideWords = slide.script.split(' ').length || 1;
        const slideDuration = (slideWords / totalWords) * totalDuration;
        cumulativeTime += slideDuration;
        return { startTime, index };
      });
      setSlideTimings(timings);
    };
    
    audio.addEventListener('loadedmetadata', calculateTimings);
    // If metadata is already loaded
    if (audio.readyState >= 1) {
        calculateTimings();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', calculateTimings);
    };

  }, [slides, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || slideTimings.length === 0) return;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      const activeTiming = [...slideTimings].reverse().find(t => currentTime >= t.startTime);
      if (activeTiming && activeTiming.index !== currentSlideIndex) {
        setCurrentSlideIndex(activeTiming.index);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };

  }, [slideTimings, currentSlideIndex]);
  
  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="bg-gray-100 dark:bg-gray-900/50 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
      <div className="relative aspect-video w-full bg-dark-bg rounded-lg overflow-hidden shadow-lg mb-4">
         {slides.map((slide, index) => (
           <img
            key={index}
            src={slide.imageUrl || placeholderImage}
            alt={slide.sectionTitle}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
              index === currentSlideIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
         ))}
      </div>

      <h3 className="text-xl font-semibold mb-4 text-center h-8">{currentSlide?.sectionTitle || 'Presentation'}</h3>

      <div className="w-full">
         <audio ref={audioRef} controls src={audioUrl} className="w-full">
            Your browser does not support the audio element.
          </audio>
      </div>
    </div>
  );
};

export default PresentationViewer;
