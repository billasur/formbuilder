import { auth, db, storage } from './config';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Update user profile
export const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No user is signed in');
    }
    
    // Update Firebase Auth profile
    await updateProfile(currentUser, data);
    
    // Update Firestore user document
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // Update existing document
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new user document
      await setDoc(userDocRef, {
        uid: currentUser.uid,
        email: currentUser.email,
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Upload profile image and update user profile
export const uploadProfileImage = async (file: File) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No user is signed in');
    }
    
    // Create a storage reference
    const storageRef = ref(storage, `profile-images/${currentUser.uid}/${file.name}`);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const photoURL = await getDownloadURL(storageRef);
    
    // Update user profile with new photo URL
    await updateUserProfile({ photoURL });
    
    return { success: true, photoURL };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
}; 