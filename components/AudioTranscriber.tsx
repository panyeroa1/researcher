
import React, { useState } from 'react';
import { transcribeAudio } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import LoadingSpinner from './LoadingSpinner';
import { UploadIcon, CopyIcon, DownloadIcon } from './common/Icons';

const AudioTranscriber: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      setAudioPreview(url);
      setTranscription('');
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      setError('Please upload an audio file.');
      return;
    }
    setIsLoading(true);
    setError('');
    setTranscription('');

    try {
      const base64Audio = await fileToBase64(audioFile);
      const result = await transcribeAudio(base64Audio, audioFile.type);
      setTranscription(result);
    } catch (err) {
      setError('Failed to transcribe the audio.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAudioFile(null);
    setAudioPreview(null);
    setTranscription('');
    setError('');
  };

  const handleCopyToClipboard = () => {
    if (transcription) {
      navigator.clipboard.writeText(transcription).then(() => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
      }, (err) => {
        console.error('Could not copy text: ', err);
      });
    }
  };

  const handleDownload = () => {
    if (transcription) {
      const blob = new Blob([transcription], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'transcription.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };


  const AudioUploadArea = () => (
    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
      <div className="space-y-1 text-center">
        <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="flex text-sm text-gray-600 dark:text-gray-400">
          <label htmlFor="audio-upload" className="relative cursor-pointer bg-white dark:bg-dark-card rounded-md font-medium text-brand-primary dark:text-brand-light hover:text-brand-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-light">
            <span>Upload a file</span>
            <input id="audio-upload" name="audio-upload" type="file" className="sr-only" accept="audio/*" onChange={handleFileChange} />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">MP3, WAV, M4A, etc.</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-dark-card shadow-lg rounded-xl p-6">
      <h2 className="text-2xl font-bold text-brand-primary dark:text-brand-light mb-2">Audio Transcription</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">Upload an audio file and get a detailed transcription, with multiple speakers identified.</p>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">1. Upload Audio File</h3>
          {audioPreview ? (
            <div className="relative group">
              <audio src={audioPreview} controls className="w-full rounded-lg shadow-md" />
              <button onClick={handleReset} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove audio file">&times;</button>
            </div>
          ) : <AudioUploadArea />}
        </div>

        {audioFile && (
            <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Transcribing...' : 'Transcribe Audio'}
            </button>
        )}
      </div>

      <div className="mt-6">
        {isLoading && <LoadingSpinner message="Transcribing audio, this may take a moment..." />}
        {error && <div className="text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}
        {transcription && (
          <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">Transcription Result</h3>
                <div className="flex items-center gap-2">
                    <button onClick={handleCopyToClipboard} className="flex items-center gap-1.5 text-sm py-1 px-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <CopyIcon className="w-4 h-4" />
                        {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={handleDownload} className="flex items-center gap-1.5 text-sm py-1 px-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <DownloadIcon className="w-4 h-4" />
                        Download
                    </button>
                </div>
            </div>
            <pre className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg whitespace-pre-wrap font-sans text-base leading-relaxed">{transcription}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioTranscriber;
