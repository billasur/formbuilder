import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';

// Collections
const usersCollection = collection(db, 'users');

// Get user settings
export const getUserSettings = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(usersCollection, userId));
    
    if (!userDoc.exists()) {
      // Create default settings if user doesn't have any
      const defaultSettings = {
        theme: 'default',
        darkMode: false,
        primaryColor: '#1890ff',
        notifications: {
          email: true,
          formSubmissions: true,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(doc(usersCollection, userId), {
        settings: defaultSettings,
        userId
      });
      
      return defaultSettings;
    }
    
    const userData = userDoc.data();
    return userData?.settings || {
      theme: 'default',
      darkMode: false,
      primaryColor: '#1890ff',
      notifications: {
        email: true,
        formSubmissions: true,
      }
    };
  } catch (error) {
    console.error('Error getting user settings:', error);
    // Return default settings in case of error
    return {
      theme: 'default',
      darkMode: false,
      primaryColor: '#1890ff',
      notifications: {
        email: true,
        formSubmissions: true,
      }
    };
  }
};

// Update user settings
export const updateUserSettings = async (userId: string, settings: any) => {
  try {
    await updateDoc(doc(usersCollection, userId), {
      'settings': settings,
      'updatedAt': serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

// Create user profile
export const createUserProfile = async (userId: string, userData: any) => {
  try {
    await setDoc(doc(usersCollection, userId), {
      ...userData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      settings: {
        theme: 'default',
        darkMode: false,
        primaryColor: '#1890ff',
        notifications: {
          email: true,
          formSubmissions: true,
        }
      }
    });
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Add getUsersByEmail function to userService.ts
export const getUsersByEmail = async (email: string) => {
  try {
    const q = query(collection(db, 'users'), where('email', '>=', email), where('email', '<=', email + '\uf8ff'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}; 