'use client';
import { useState } from 'react';
import { User } from '@/app/types';
import { auth } from '@/firebase/config';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

interface AuthProps {
  onSignIn?: (user: User) => void;
  onSignOut?: () => void;
}

export default function Auth({ onSignIn, onSignOut }: AuthProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (onSignIn && result.user) {
        onSignIn(result.user as User);
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      if (onSignOut) {
        onSignOut();
      }
    } catch (error) {
      console.error("Error signing out", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={handleSignIn} 
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Loading...' : 'Sign In with Google'}
      </button>
      <button 
        onClick={handleSignOut}
        disabled={isLoading}
        className="ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
      >
        {isLoading ? 'Loading...' : 'Sign Out'}
      </button>
    </div>
  );
}