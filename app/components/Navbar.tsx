'use client';
import Link from 'next/link';
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createUserProfile } from '../utils/createUserProfile';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await createUserProfile(result.user);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowDropdown(false);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-800">
                Crypto Price Targets
              </span>
            </Link>
          </div>

          <div className="flex items-center">
            {loading ? (
              <span className="text-gray-500">Loading...</span>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg"
                >
                  {user.photoURL && (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-gray-700">{user.displayName}</span>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                    <Link
                      href={`/profile/${user.uid}`}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 