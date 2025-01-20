interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
}

export async function getTopCoins(limit = 10): Promise<Coin[]> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`,
      { 
        next: { revalidate: 300 },
        headers: {
          'Accept': 'application/json',
          // Add your CoinGecko API key if you have one
          // 'x-cg-api-key': process.env.COINGECKO_API_KEY
        }
      }
    );
    
    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching coins:', error);
    // Return mock data if API fails
    return [
      {
        id: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
        current_price: 52000,
        market_cap: 1000000000000,
        market_cap_rank: 1,
        price_change_percentage_24h: 2.5
      },
      // Add more mock coins as needed
    ];
  }
} 