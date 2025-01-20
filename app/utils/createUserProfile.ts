import { db } from '@/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function createUserProfile(user: any) {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    try {
      await setDoc(userRef, {
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        email: user.email || '',
        description: '',
        twitterHandle: '',
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }
} 