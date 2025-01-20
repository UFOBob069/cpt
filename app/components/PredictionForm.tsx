'use client';
import { useState } from 'react';
import { db, auth } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface PredictionFormProps {
  coinId: string;
  coinName: string;
  onClose: () => void;
  timeframe: string;
}

type TimeFrame = 
  | 'q1_2025' | 'q2_2025' | 'q3_2025' | 'q4_2025'
  | 'q1_2026' | 'q2_2026' | 'y2026'
  | 'y2027' | 'y2028' | 'y2029' | 'y2030'
  | 'y2035' | 'y2040';

const timeFrameLabels: Record<TimeFrame, string> = {
  q1_2025: 'Q1 2025', q2_2025: 'Q2 2025', q3_2025: 'Q3 2025', q4_2025: 'Q4 2025',
  q1_2026: 'Q1 2026', q2_2026: 'Q2 2026', y2026: '2026',
  y2027: '2027', y2028: '2028', y2029: '2029', y2030: '2030',
  y2035: '2035', y2040: '2040'
};

export default function PredictionForm({ coinId, coinName, onClose, timeframe }: PredictionFormProps) {
  const [price, setPrice] = useState('');
  const [summary, setSummary] = useState('');
  const [researchLinks, setResearchLinks] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setError('You must be signed in to submit a prediction');
      return;
    }

    if (!price || !summary) {
      setError('Price and summary are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const predictionData = {
        coinId,
        coinName,
        price: parseFloat(price),
        timeframe,
        summary,
        researchLinks: researchLinks.filter(link => link.trim() !== ''),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        userPhotoURL: auth.currentUser.photoURL,
        createdAt: serverTimestamp(),
        votes: 0,
        voters: {} // Will store user IDs and their vote (+1 or -1)
      };

      await addDoc(collection(db, 'predictions'), predictionData);
      onClose();
    } catch (err) {
      setError('Failed to submit prediction. Please try again.');
      console.error('Error submitting prediction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">New Prediction for {coinName}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Price (USD)
            </label>
            <input
              type="number"
              step="0.000001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter target price"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timeframe
            </label>
            <input
              type="text"
              value={timeFrameLabels[timeframe as TimeFrame]}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Explain your prediction..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Research Links
            </label>
            {researchLinks.map((link, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => {
                    const newLinks = [...researchLinks];
                    newLinks[index] = e.target.value;
                    setResearchLinks(newLinks);
                  }}
                  className="w-full p-2 border rounded"
                  placeholder="https://..."
                />
                {index === researchLinks.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setResearchLinks([...researchLinks, ''])}
                    className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    +
                  </button>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Prediction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 