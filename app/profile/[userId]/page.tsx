'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { db, auth } from '@/firebase/config';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { PencilIcon } from '@heroicons/react/24/outline';

interface Prediction {
  id: string;
  coinId: string;
  coinName: string;
  price: number;
  timeframe: string;
  summary: string;
  createdAt: any;
  votes: number;
  researchLinks: string[];
  userId: string;
  userName: string;
  userPhotoURL: string;
  userDescription?: string;
  userTwitterHandle?: string;
}

interface UserProfile {
  displayName: string;
  photoURL: string;
  totalVotes: number;
  predictionCount: number;
  averageVotes: number;
  description?: string;
  twitterHandle?: string;
  userId: string;
}

interface EditProfileModal {
  displayName: string;
  description: string;
  twitterHandle: string;
}

export default function UserProfile() {
  const params = useParams();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditProfileModal>({
    displayName: '',
    description: '',
    twitterHandle: ''
  });

  const isOwnProfile = auth.currentUser?.uid === params.userId;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      // Check if user document exists, if not create it
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create the user document if it doesn't exist
        await setDoc(userDocRef, {
          displayName: editForm.displayName,
          description: editForm.description,
          twitterHandle: editForm.twitterHandle,
          photoURL: auth.currentUser.photoURL,
          email: auth.currentUser.email,
          createdAt: new Date()
        });
      } else {
        // Update existing user document
        await updateDoc(userDocRef, {
          displayName: editForm.displayName,
          description: editForm.description,
          twitterHandle: editForm.twitterHandle,
          updatedAt: new Date()
        });
      }

      // Update predictions collection with new user info
      const predictionsRef = collection(db, 'predictions');
      const userPredictions = await getDocs(
        query(predictionsRef, where('userId', '==', auth.currentUser.uid))
      );

      const updatePromises = userPredictions.docs.map(doc => 
        updateDoc(doc.ref, {
          userName: editForm.displayName
        })
      );

      await Promise.all(updatePromises);

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        displayName: editForm.displayName,
        description: editForm.description,
        twitterHandle: editForm.twitterHandle
      } : null);

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!params.userId) return;

      try {
        // First try to get user data from users collection
        const userDocRef = doc(db, 'users', params.userId);
        const userDoc = await getDoc(userDocRef);
        
        // Fetch predictions
        const predictionsRef = collection(db, 'predictions');
        const q = query(
          predictionsRef,
          where('userId', '==', params.userId),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const userPredictions: any[] = [];
        let totalVotes = 0;

        querySnapshot.forEach((doc) => {
          const prediction = {
            id: doc.id,
            ...doc.data()
          };
          userPredictions.push(prediction);
          totalVotes += prediction.votes || 0;
        });

        setPredictions(userPredictions);

        // Use user document data if it exists, fall back to prediction data
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        setProfile({
          displayName: userData?.displayName || userPredictions[0]?.userName || 'Unknown User',
          photoURL: userData?.photoURL || userPredictions[0]?.userPhotoURL || '/default-avatar.png',
          description: userData?.description || '',
          twitterHandle: userData?.twitterHandle || '',
          totalVotes: totalVotes,
          predictionCount: userPredictions.length,
          averageVotes: userPredictions.length ? totalVotes / userPredictions.length : 0,
          userId: params.userId as string
        });

        setEditForm({
          displayName: userData?.displayName || userPredictions[0]?.userName || '',
          description: userData?.description || '',
          twitterHandle: userData?.twitterHandle || ''
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params.userId]);

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-center">Profile not found</div>;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-6">
            <Image
              src={profile.photoURL}
              alt={profile.displayName}
              width={100}
              height={100}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              {profile.description && (
                <p className="text-gray-600 mt-2">{profile.description}</p>
              )}
              {profile.twitterHandle && (
                <a
                  href={`https://twitter.com/${profile.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline mt-2 block"
                >
                  @{profile.twitterHandle}
                </a>
              )}
            </div>
          </div>
          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <PencilIcon className="h-5 w-5 mr-1" />
              Edit Profile
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{profile.predictionCount}</div>
            <div className="text-gray-600">Predictions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{profile.totalVotes}</div>
            <div className="text-gray-600">Total Votes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{profile.averageVotes.toFixed(1)}</div>
            <div className="text-gray-600">Avg Votes</div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    displayName: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                  maxLength={50}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                  maxLength={200}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {editForm.description.length}/200 characters
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Twitter Handle
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">@</span>
                  <input
                    type="text"
                    value={editForm.twitterHandle}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      twitterHandle: e.target.value.replace('@', '')
                    }))}
                    className="w-full p-2 border rounded"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Predictions List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold mb-4">Predictions</h2>
        {predictions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No predictions yet
          </div>
        ) : (
          predictions.map((prediction) => (
            <div key={prediction.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <Link 
                  href={`/coins/${prediction.coinId}`}
                  className="text-lg font-semibold text-blue-600 hover:underline"
                >
                  {prediction.coinName}
                </Link>
                <div className="text-sm text-gray-500">
                  {formatDate(prediction.createdAt)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Target Price</div>
                  <div className="text-lg font-bold">
                    ${prediction.price.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Timeframe</div>
                  <div className="text-lg font-bold">{prediction.timeframe}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-600">Summary</div>
                <div className="mt-1">{prediction.summary}</div>
              </div>

              {prediction.researchLinks?.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Research Links</div>
                  {prediction.researchLinks.map((link, index) => {
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
              )}

              <div className="flex items-center text-sm text-gray-500">
                <div className={`font-semibold ${
                  prediction.votes > 0 ? 'text-green-600' : 
                  prediction.votes < 0 ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {prediction.votes} votes
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <Link href={`/profile/${prediction.userId}`} className="hover:underline">
                  by {prediction.userName}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 