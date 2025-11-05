
import React, { useState } from 'react';
import { getQuickAnswer } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

const QuickAnswer: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a question.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnswer('');
    try {
      const result = await getQuickAnswer(prompt);
      setAnswer(result);
    } catch (err) {
      setError('Failed to get an answer.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card shadow-lg rounded-xl p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-brand-primary dark:text-brand-light mb-2">Quick Answer</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Get low-latency responses for simple queries using Gemini Flash Lite.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a quick question..."
          className="flex-grow p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-light outline-none transition duration-200"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-accent hover:opacity-90 text-gray-900 font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      <div className="mt-6">
        {isLoading && <LoadingSpinner message="Getting your answer..." />}
        {error && <div className="text-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg">{error}</div>}
        {answer && (
          <div>
            <h3 className="text-xl font-semibold mb-2">Answer</h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg whitespace-pre-wrap">{answer}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickAnswer;
