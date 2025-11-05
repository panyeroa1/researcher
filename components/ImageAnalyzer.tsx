
import React, { useState, useCallback } from 'react';
import { analyzeImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import LoadingSpinner from './LoadingSpinner';
import { UploadIcon } from './common/Icons';

const ImageAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('What do you see in this image?');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysis('');
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !prompt) {
      setError('Please upload an image and provide a prompt.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysis('');

    try {
      const base64Image = await fileToBase64(imageFile);
      const result = await analyzeImage(base64Image, imageFile.type, prompt);
      setAnalysis(result);
    } catch (err) {
      setError('Failed to analyze the image.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const ImageUploadArea = () => (
    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
      <div className="space-y-1 text-center">
        <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="flex text-sm text-gray-600 dark:text-gray-400">
          <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-dark-card rounded-md font-medium text-brand-primary dark:text-brand-light hover:text-brand-secondary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-light">
            <span>Upload a file</span>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-dark-card shadow-lg rounded-xl p-6">
      <h2 className="text-2xl font-bold text-brand-primary dark:text-brand-light mb-2">Image Understanding</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">Upload an image and ask Gemini to analyze it.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">1. Upload Image</h3>
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-80 object-contain rounded-lg shadow-md" />
              <button onClick={() => {setImagePreview(null); setImageFile(null);}} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/75">&times;</button>
            </div>
          ) : <ImageUploadArea />}
        </div>
        <div>
          <h3 className="font-semibold mb-2">2. Provide a Prompt</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Describe this image in detail."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-light outline-none transition duration-200"
            rows={4}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !imageFile}
            className="mt-4 w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {isLoading && <LoadingSpinner message="Analyzing image..." />}
        {error && <div className="text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}
        {analysis && (
          <div>
            <h3 className="text-xl font-semibold mb-2">Analysis Result</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg whitespace-pre-wrap">{analysis}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalyzer;
