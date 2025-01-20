'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import PredictionForm from '@/app/components/PredictionForm';
import { db, auth } from '@/firebase/config';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDoc, increment } from 'firebase/firestore';

interface Prediction {
  id: number;
  price: number;
  timeframe: TimeFrame;
  createdAt: string;
  votes: number;
  userId: string;
  userName: string;
  voters: Record<string, number>;
}

type TimeFrame = 
  | 'q1_2025' | 'q2_2025' | 'q3_2025' | 'q4_2025'
  | 'q1_2026' | 'q2_2026' | 'y2026'
  | 'y2027' | 'y2028' | 'y2029' | 'y2030'
  | 'y2035' | 'y2040';

const timeFrameLabels: Record<TimeFrame, string> = {
  q1_2025: 'Q1 2025',
  q2_2025: 'Q2 2025',
  q3_2025: 'Q3 2025',
  q4_2025: 'Q4 2025',
  q1_2026: 'Q1 2026',
  q2_2026: 'Q2 2026',
  y2026: '2026',
  y2027: '2027',
  y2028: '2028',
  y2029: '2029',
  y2030: '2030',
  y2035: '2035',
  y2040: '2040'
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
    voters: {}
  },
  {
    id: 2,
    price: 50000,
    timeframe: 'q1_2025',
    createdAt: '2024-01-19',
    votes: 8,
    userId: '2',
    userName: 'BitcoinBull',
    voters: {}
  },
  {
    id: 3,
    price: 42000,
    timeframe: 'q2_2025',
    createdAt: '2024-01-18',
    votes: -3,
    userId: '3',
    userName: 'CryptoBear',
    voters: {}
  }
];

export default function CoinPage() {
  const params = useParams();
  const [coin, setCoin] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('q1_2025');
  const [showPredictionForm, setShowPredictionForm] = useState(false);

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
      } catch (error) {
        console.error('Error fetching coin:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch coin data');
        setLoading(false);
      }
    };

    fetchCoin();
  }, [params.coinId]);

  // Fetch predictions
  useEffect(() => {
    if (!params.coinId) return;

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
    }, (error) => {
      console.error('Error fetching predictions:', error);
      setError('Failed to fetch predictions');
    });

    return () => unsubscribe();
  }, [params.coinId]);

  const handleVote = async (predictionId: string, isUpvote: boolean) => {
    if (!auth.currentUser) {
      alert('Please sign in to vote');
      return;
    }

    try {
      const predictionRef = doc(db, 'predictions', predictionId);
      const predictionDoc = await getDoc(predictionRef);
      
      if (!predictionDoc.exists()) {
        console.error('Prediction not found');
        return;
      }

      const data = predictionDoc.data();
      const userId = auth.currentUser.uid;
      const voters = data.voters || {};
      const userPreviousVote = voters[userId] || 0;

      // Remove previous vote if exists
      if (userPreviousVote !== 0) {
        await updateDoc(predictionRef, {
          votes: increment(-userPreviousVote),
          [`voters.${userId}`]: 0
        });
      }

      // Add new vote
      const voteValue = isUpvote ? 1 : -1;
      if (userPreviousVote !== voteValue) {
        await updateDoc(predictionRef, {
          votes: increment(voteValue),
          [`voters.${userId}`]: voteValue
        });
      }

    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote. Please try again.');
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

      {/* Predictions Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Price Predictions</h2>
          <button
            onClick={() => setShowPredictionForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Add Prediction
          </button>
        </div>

        {predictions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No predictions yet. Be the first to make a prediction!
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Prediction Summary for {timeFrameLabels[selectedTimeframe]}</h3>
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as TimeFrame)}
                className="border rounded-lg px-3 py-2"
              >
                {Object.entries(timeFrameLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
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
                <div key={prediction.id} className="border rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex flex-col items-center mr-4 w-16">
                      <button
                        onClick={() => handleVote(prediction.id, true)}
                        className={`text-gray-500 hover:text-green-500 ${
                          prediction.voters?.[auth.currentUser?.uid] === 1 ? 'text-green-500' : ''
                        }`}
                        disabled={!auth.currentUser}
                      >
                        <ArrowUpIcon className="h-6 w-6" />
                      </button>
                      <span className={`font-bold ${
                        prediction.votes > 0 ? 'text-green-500' : 
                        prediction.votes < 0 ? 'text-red-500' : 
                        'text-gray-500'
                      }`}>
                        {prediction.votes || 0}
                      </span>
                      <button
                        onClick={() => handleVote(prediction.id, false)}
                        className={`text-gray-500 hover:text-red-500 ${
                          prediction.voters?.[auth.currentUser?.uid] === -1 ? 'text-red-500' : ''
                        }`}
                        disabled={!auth.currentUser}
                      >
                        <ArrowDownIcon className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">${prediction.price.toLocaleString()}</span>
                        <span className="text-sm text-gray-500">
                          {timeFrameLabels[prediction.timeframe as TimeFrame]}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{prediction.summary}</p>
                      {prediction.researchLinks?.length > 0 && (
                        <div className="text-sm text-blue-500">
                          {prediction.researchLinks.map((link: string, index: number) => {
                            // Ensure the link has a protocol
                            const fullLink = link.startsWith('http') ? link : `https://${link}`;
                            
                            // Get display URL
                            let displayUrl = link;
                            try {
                              // Add https:// temporarily if missing, just for parsing
                              const urlForParsing = link.startsWith('http') ? link : `https://${link}`;
                              const url = new URL(urlForParsing);
                              displayUrl = url.hostname;
                            } catch (e) {
                              // If parsing fails, use the original link
                              console.error('Error parsing URL:', e);
                            }

                            return (
                              <a
                                key={index}
                                href={fullLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block hover:underline text-blue-600 mb-1"
                              >
                                {displayUrl}
                              </a>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                        <span>by {prediction.userName}</span>
                        <span>Posted on {new Date(prediction.createdAt).toLocaleDateString()}</span>
                      </div>
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