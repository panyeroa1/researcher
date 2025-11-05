
import React, { useState, useRef, useCallback } from 'react';
import { analyzeVideoFrames } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { UploadIcon } from './common/Icons';

const FRAME_CAPTURE_INTERVAL_MS = 1000; // Capture one frame per second
const MAX_FRAMES = 30; // Limit the number of frames to send

const VideoAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('Summarize this video.');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string>('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoPreview(url);
            setAnalysis('');
            setError('');
        }
    };

    const extractFrames = useCallback(async (): Promise<string[]> => {
        return new Promise((resolve) => {
            if (!videoRef.current || !canvasRef.current) {
                resolve([]);
                return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            const frames: string[] = [];

            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                let capturedFrames = 0;

                const captureFrame = () => {
                    if (context && capturedFrames < MAX_FRAMES && video.currentTime < video.duration) {
                        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        frames.push(dataUrl.split(',')[1]);
                        capturedFrames++;
                        video.currentTime += video.duration / (MAX_FRAMES + 1);
                    } else {
                        video.removeEventListener('seeked', captureFrame);
                        resolve(frames);
                    }
                };

                video.addEventListener('seeked', captureFrame);
                video.currentTime = 0; // Start capturing
            };
            
            if (video.readyState >= 1) { // METADATA_LOADED
              video.onloadedmetadata(new Event('loadedmetadata'));
            }
        });
    }, []);

    const handleSubmit = async () => {
        if (!videoFile || !prompt) {
            setError('Please upload a video and provide a prompt.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysis('');

        try {
            setLoadingMessage('Extracting frames from video...');
            const frames = await extractFrames();
            if (frames.length === 0) {
                throw new Error("Could not extract frames from video.");
            }
            
            setLoadingMessage(`Analyzing ${frames.length} frames with Gemini...`);
            const result = await analyzeVideoFrames(frames, prompt);
            setAnalysis(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to analyze the video.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    return (
        <div className="bg-white dark:bg-dark-card shadow-lg rounded-xl p-6">
            <h2 className="text-2xl font-bold text-brand-primary dark:text-brand-light mb-2">Video Understanding</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Upload a short video and ask Gemini Pro to analyze its content frame by frame.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold mb-2">1. Upload Video</h3>
                    {videoPreview ? (
                        <div className="relative">
                            <video ref={videoRef} src={videoPreview} controls className="w-full rounded-lg shadow-md"></video>
                            <button onClick={() => { setVideoPreview(null); setVideoFile(null); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/75">&times;</button>
                        </div>
                    ) : (
                         <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <UploadIcon className="mx-auto h-12 w-12 text-gray-400"/>
                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                    <label htmlFor="video-upload" className="relative cursor-pointer bg-white dark:bg-dark-card rounded-md font-medium text-brand-primary dark:text-brand-light hover:text-brand-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-light">
                                        <span>Upload a video</span>
                                        <input id="video-upload" name="video-upload" type="file" className="sr-only" accept="video/*" onChange={handleFileChange} />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">MP4, MOV, WEBM</p>
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="font-semibold mb-2">2. Provide a Prompt</h3>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., What is happening in this video?"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-light outline-none transition duration-200"
                        rows={4}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !videoFile}
                        className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Analyzing...' : 'Analyze Video'}
                    </button>
                </div>
            </div>

            {isLoading && <LoadingSpinner message={loadingMessage} />}
            {error && <div className="mt-6 text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}
            {analysis && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">Analysis Result</h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg whitespace-pre-wrap">{analysis}</div>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};

export default VideoAnalyzer;
