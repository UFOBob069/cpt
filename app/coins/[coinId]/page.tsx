'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import PredictionForm from '@/app/components/PredictionForm';
import { db, auth } from '@/firebase/config';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Prediction } from '@/app/types';
import Link from 'next/link';

interface Prediction {
  id: number;
  price: number;
  timeframe: TimeFrame;
  createdAt: string;
  votes: number;
  userId: string;
  userName: string;
  voters: Record<string, number>;
  userPhotoURL?: string;
  summary: string;
  researchLinks?: string[];
}

type TimeFrame = 
  | 'q1_2025' | 'q2_2025' | 'q3_2025' | 'q4_2025' 
  | 'q1_2026' | 'q2_2026' 
  | '2026' | '2027' | '2028' | '2029' | '2030' 
  | '2035' | '2040';

const timeFrameLabels: Record<TimeFrame, string> = {
  q1_2025: 'Q1 2025',
  q2_2025: 'Q2 2025',
  q3_2025: 'Q3 2025',
  q4_2025: 'Q4 2025',
  q1_2026: 'Q1 2026',
  q2_2026: 'Q2 2026',
  2026: '2026',
  2027: '2027',
  2028: '2028',
  2029: '2029',
  2030: '2030',
  2035: '2035',
  2040: '2040'
};

const mockPredictions: Prediction[] = [
  {
    id: 1,
    price: 45000,
    timeframe: 'q1_2025',
    createdAt: '2024-01-20',
    votes: 15,
    userId: '1',
    userName: 'CryptoExpert',
    voters: {},
    userPhotoURL: '/default-avatar.png',
    summary: 'This is a summary of the prediction'
  },
  {
    id: 2,
    price: 50000,
    timeframe: 'q1_2025',
    createdAt: '2024-01-19',
    votes: 8,
    userId: '2',
    userName: 'BitcoinBull',
    voters: {},
    userPhotoURL: '/default-avatar.png',
    summary: 'This is a summary of the prediction'
  },
  {
    id: 3,
    price: 42000,
    timeframe: 'q2_2025',
    createdAt: '2024-01-18',
    votes: -3,
    userId: '3',
    userName: 'CryptoBear',
    voters: {},
    userPhotoURL: '/default-avatar.png',
    summary: 'This is a summary of the prediction'
  }
];

export default function CoinPage() {
  const params = useParams();
  const [coin, setCoin] = useState<any>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<{[key: string]: 'up' | 'down'}>({});
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('q1_2025');

  const timeframes: { value: TimeFrame; label: string }[] = [
    { value: 'q1_2025', label: 'Q1 2025' },
    { value: 'q2_2025', label: 'Q2 2025' },
    { value: 'q3_2025', label: 'Q3 2025' },
    { value: 'q4_2025', label: 'Q4 2025' },
    { value: 'q1_2026', label: 'Q1 2026' },
    { value: 'q2_2026', label: 'Q2 2026' },
    { value: '2026', label: '2026' },
    { value: '2027', label: '2027' },
    { value: '2028', label: '2028' },
    { value: '2029', label: '2029' },
    { value: '2030', label: '2030' },
    { value: '2035', label: '2035' },
    { value: '2040', label: '2040' },
  ];

  // Fetch coin data
  useEffect(() => {
    const fetchCoin = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${params.coinId}`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        setCoin(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching coin:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch coin data');
        setLoading(false);
      }
    };

    fetchCoin();
  }, [params.coinId]);

  // Fetch predictions
  useEffect(() => {
    if (!params.coinId) return;

    try {
      const predictionsRef = collection(db, 'predictions');
      const q = query(
        predictionsRef,
        where('coinId', '==', params.coinId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const predictionData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toISOString()
        }));
        setPredictions(predictionData);
      }, (err) => {
        console.error('Error fetching predictions:', err);
        setError('Failed to fetch predictions');
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up predictions listener:', err);
      setError('Failed to load predictions');
    }
  }, [params.coinId]);

  const handleVote = async (predictionId: string, voteType: 'up' | 'down') => {
    try {
      if (!auth.currentUser) {
        throw new Error('Must be signed in to vote');
      }

      const userId = auth.currentUser.uid;
      const predictionRef = doc(db, 'predictions', predictionId);
      const currentVote = userVotes[predictionId];

      if (currentVote === voteType) {
        // Remove vote if clicking the same button
        await updateDoc(predictionRef, {
          [`votes.${userId}`]: arrayRemove(voteType)
        });
        setUserVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[predictionId];
          return newVotes;
        });
      } else {
        // Add or change vote
        if (currentVote) {
          await updateDoc(predictionRef, {
            [`votes.${userId}`]: arrayRemove(currentVote)
          });
        }
        await updateDoc(predictionRef, {
          [`votes.${userId}`]: arrayUnion(voteType)
        });
        setUserVotes(prev => ({
          ...prev,
          [predictionId]: voteType
        }));
      }
    } catch (err) {
      console.error('Error voting:', err);
      alert(err instanceof Error ? err.message : 'Error voting on prediction');
    }
  };

  const getPredictionSummary = (timeframe: TimeFrame) => {
    const timeframePredictions = predictions.filter(p => p.timeframe === timeframe);
    if (timeframePredictions.length === 0) return null;

    // Sort predictions by votes and calculate weighted average
    const sortedPredictions = [...timeframePredictions].sort((a, b) => b.votes - a.votes);
    const totalVotes = sortedPredictions.reduce((sum, p) => sum + Math.max(p.votes, 0), 0);
    
    const weightedAverage = sortedPredictions.reduce((sum, p) => {
      const weight = Math.max(p.votes, 0) / (totalVotes || 1);
      return sum + (p.price * weight);
    }, 0);

    return {
      count: timeframePredictions.length,
      average: weightedAverage,
      highestVoted: sortedPredictions[0]
    };
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!coin) return <div className="p-8 text-center">Coin not found</div>;

  const filteredPredictions = predictions.filter(p => p.timeframe === selectedTimeframe);
  const summary = getPredictionSummary(selectedTimeframe);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Coin Header */}
      <div className="flex items-center mb-8">
        <Image
          src={coin.image.large}
          alt={coin.name}
          width={64}
          height={64}
          className="rounded-full"
        />
        <div className="ml-4">
          <h1 className="text-3xl font-bold">{coin.name}</h1>
          <p className="text-gray-600">{coin.symbol.toUpperCase()}</p>
        </div>
      </div>

      {/* Current Price */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Price</h2>
        <div className="text-3xl font-bold">
          ${coin.market_data?.current_price?.usd.toLocaleString() ?? 'N/A'}
        </div>
      </div>

      {/* Updated Timeframe Selection */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {timeframes.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSelectedTimeframe(value)}
              className={`px-4 py-2 rounded transition-colors ${
                selectedTimeframe === value 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Predictions Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Price Predictions for {timeframes.find(t => t.value === selectedTimeframe)?.label}
          </h2>
          <button
            onClick={() => setShowPredictionForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Add Prediction
          </button>
        </div>

        {filteredPredictions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No predictions yet for {timeframes.find(t => t.value === selectedTimeframe)?.label}. Be the first to make a prediction!
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Prediction Summary for {timeFrameLabels[selectedTimeframe]}</h3>
            </div>

            {summary && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-bold mb-2">Prediction Summary for {timeFrameLabels[selectedTimeframe]}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Weighted Average</p>
                    <p className="font-bold">${summary.average.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Number of Predictions</p>
                    <p className="font-bold">{summary.count}</p>
                  </div>
                  {summary.highestVoted && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Highest Voted Prediction</p>
                      <p className="font-bold">${summary.highestVoted.price.toLocaleString()} ({summary.highestVoted.votes} votes)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {filteredPredictions.map((prediction) => (
                <div key={prediction.id} className="bg-white rounded-lg shadow-md p-6 mb-4">
                  <div className="flex justify-between items-start mb-4">
                    {/* User info with profile link */}
                    <Link 
                      href={`/profile/${prediction.userId}`}
                      className="flex items-center group hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={prediction.userPhotoURL || '/default-avatar.png'}
                        alt={prediction.userName || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                      />
                      <div>
                        <span className="font-medium group-hover:text-blue-600 transition-colors">
                          {prediction.userName || 'Anonymous'}
                        </span>
                        <div className="text-sm text-gray-500">
                          {new Date(prediction.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>

                    {/* Price prediction */}
                    <div className="text-right">
                      <div className="text-2xl font-bold">${prediction.price.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">
                        {timeframes.find(t => t.value === prediction.timeframe)?.label}
                      </div>
                    </div>
                  </div>

                  {/* Prediction summary */}
                  <p className="text-gray-700 mb-4">{prediction.summary}</p>

                  {/* Research links */}
                  {prediction.researchLinks?.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Research Links:</div>
                      <div className="space-y-1">
                        {prediction.researchLinks.map((link: string, index: number) => {
                          const fullLink = link.startsWith('http') ? link : `https://${link}`;
                          let displayUrl = link;
                          try {
                            const urlForParsing = link.startsWith('http') ? link : `https://${link}`;
                            const url = new URL(urlForParsing);
                            displayUrl = url.hostname;
                          } catch (e) {
                            console.error('Error parsing URL:', e);
                          }

                          return (
                            <a
                              key={index}
                              href={fullLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-blue-600 hover:underline text-sm"
                            >
                              {displayUrl}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Voting section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleVote(prediction.id, 'up')}
                        className={`flex items-center space-x-1 ${
                          userVotes[prediction.id] === 'up' ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        <ArrowUpIcon className="h-5 w-5" />
                      </button>
                      <span className={`font-medium ${
                        prediction.votes > 0 ? 'text-green-600' : 
                        prediction.votes < 0 ? 'text-red-600' : 
                        'text-gray-600'
                      }`}>
                        {prediction.votes || 0}
                      </span>
                      <button
                        onClick={() => handleVote(prediction.id, 'down')}
                        className={`flex items-center space-x-1 ${
                          userVotes[prediction.id] === 'down' ? 'text-red-600' : 'text-gray-500'
                        }`}
                      >
                        <ArrowDownIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showPredictionForm && (
        <PredictionForm
          coinId={params.coinId as string}
          coinName={coin.name}
          timeframe={selectedTimeframe}
          onClose={() => setShowPredictionForm(false)}
        />
      )}
    </div>
  );
} 