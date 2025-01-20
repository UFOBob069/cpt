import Image from 'next/image';
import Link from 'next/link';

interface CoinItemProps {
  coin: {
    id: string;
    name: string;
    symbol: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap_rank: number;
  };
  targets: {
    shortTerm: string;
    longTerm: string;
    upside: string;
  };
}

export default function CoinItem({ coin, targets }: CoinItemProps) {
  const priceChangeColor = coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500';
  const upsideColor = targets.upside !== '--' && parseFloat(targets.upside) >= 0 
    ? 'text-green-500' 
    : 'text-red-500';

  return (
    <Link href={`/coins/${coin.id}`} className="coin-row">
      <div className="coin-cell rank-cell">
        {coin.market_cap_rank}
      </div>
      <div className="coin-cell name-cell">
        <Image src={coin.image} alt={coin.name} width={24} height={24} />
        <div className="coin-name-wrapper">
          <span className="coin-name">{coin.name}</span>
          <span className="coin-symbol">{coin.symbol.toUpperCase()}</span>
        </div>
      </div>
      <div className="coin-cell price-cell">
        ${coin.current_price.toLocaleString()}
      </div>
      <div className={`coin-cell change-cell ${priceChangeColor}`}>
        {coin.price_change_percentage_24h.toFixed(2)}%
      </div>
      <div className="coin-cell target-cell">
        {targets.shortTerm}
      </div>
      <div className="coin-cell target-cell">
        {targets.longTerm}
      </div>
      <div className={`coin-cell target-cell ${targets.upside !== '--' ? upsideColor : ''}`}>
        {targets.upside}
      </div>
    </Link>
  );
} 