'use client';
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useState, useEffect } from "react";
import HeroBanner from './components/HeroBanner';
import CoinList from './components/CoinList';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    const fetchCoins = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false'
        );
        const data = await response.json();
        setCoins(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching coins:', error);
        setLoading(false);
      }
    };

    fetchCoins();

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  if (loading) {
    return <div className="welcome-container">Loading...</div>;
  }

  return (
    <div className="main-container">
      <HeroBanner isLoggedIn={!!user} />
      <CoinList coins={coins} />
      <div className="welcome-container">
        <h1 className="welcome-title">Welcome</h1>
        {user ? (
          <>
            <p className="welcome-text">Welcome, {user.displayName}!</p>
            <div className="auth-buttons">
              <button className="logout-button" onClick={handleSignOut}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="welcome-text">Please sign in with Google</p>
            <div className="auth-buttons">
              <button className="google-button" onClick={handleSignIn}>
                <img 
                  src="/google.svg" 
                  alt="Google" 
                  className="google-icon"
                />
                Sign in with Google
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}