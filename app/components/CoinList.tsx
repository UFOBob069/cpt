'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/firebase/config';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { PredictionSummary } from '@/app/types';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const formatPrice = (price: number | null | undefined) => {
  if (price === null || price === undefined) return 'N/A';
  if (price >= 1) {
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  }
  return `$${price.toFixed(6)}`;
};

export default function CoinList({ coins = [], loading }: { coins?: Coin[], loading: boolean }) {
  const [predictions, setPredictions] = useState<{ [key: string]: PredictionSummary }>({});

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!coins.length) return;

      try {
        const predictionsRef = collection(db, 'predictions');
        const allPredictions: { [key: string]: PredictionSummary } = {};

        for (const coin of coins) {
          const q = query(predictionsRef, where('coinId', '==', coin.id));
          const querySnapshot = await getDocs(q);
          
          const coinPredictions = querySnapshot.docs.map(doc => ({
            ...doc.data()
          }));

          if (coinPredictions.length > 0) {
            const timeframeSummary: { [key: string]: PredictionSummary } = {};
            coinPredictions.forEach(pred => {
              if (!timeframeSummary[pred.timeframe]) {
                timeframeSummary[pred.timeframe] = {
                  avgPrice: 0,
                  totalVotes: 0,
                  count: 0
                };
              }

              const summary = timeframeSummary[pred.timeframe];
              summary.avgPrice = (summary.avgPrice * summary.count + pred.price) / (summary.count + 1);
              summary.totalVotes += pred.votes ?? 0;
              summary.count += 1;
            });

            allPredictions[coin.id] = timeframeSummary;
          }
        }

        setPredictions(allPredictions);
      } catch (error) {
        console.error('Error fetching predictions:', error);
      }
    };

    fetchPredictions();
  }, [coins]);

  const renderPredictionCell = (coinId: string, timeframe: string) => {
    const prediction = predictions[coinId]?.[timeframe];
    
    return (
      <div>
        <div>{formatPrice(prediction?.avgPrice ?? 0)}</div>
        <div className="text-xs text-gray-500">
          {prediction?.count ?? 0} predictions • {prediction?.totalVotes ?? 0} votes
        </div>
      </div>
    );
  };

  if (!coins?.length && !loading) return <div className="p-4">No coins available</div>;
  if (loading) return <div className="p-4">Loading coins...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coin</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">24h</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q1 2025</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q2 2025</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2030</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {coins.map((coin) => (
            <tr key={coin.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link href={`/coins/${coin.id}`} className="flex items-center">
                  <Image
                    src={coin.image}
                    alt={coin.name}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{coin.name}</div>
                    <div className="text-gray-500">{coin.symbol.toUpperCase()}</div>
                  </div>
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {formatPrice(coin.current_price)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {coin.price_change_percentage_24h?.toFixed(2) ?? 'N/A'}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {renderPredictionCell(coin.id, 'q1_2025')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {renderPredictionCell(coin.id, 'q2_2025')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {renderPredictionCell(coin.id, 'y2030')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 