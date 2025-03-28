import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  UserCredential,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Define user role types
export type UserRoleType = 'admin' | 'user';

export interface UserProfile {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRoleType;
  createdAt: Date;
  updatedAt?: Date;
}

// Sign up with email and password
export const signUp = async (email: string, password: string): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create a user document in Firestore
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    email,
    role: 'user',
    createdAt: new Date()
  });
  
  return userCredential;
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    // Use persistence to keep the user signed in
    // Firebase's default is 'LOCAL' which persists even when browser is closed
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Store basic auth data in localStorage for smoother page transitions
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
    };
    localStorage.setItem('authUser', JSON.stringify(userData));
    
    return userCredential;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Store basic auth data
    const userData = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
    };
    localStorage.setItem('authUser', JSON.stringify(userData));
    
    return userCredential;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  localStorage.removeItem('authUser');
  return await firebaseSignOut(auth);
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

// Get user role
export const getUserRole = async (userId: string): Promise<UserRoleType> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  
  if (userDoc.exists()) {
    return userDoc.data().role as UserRoleType;
  }
  
  return 'user'; // Default role
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}; 