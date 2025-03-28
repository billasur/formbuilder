import { db, auth } from './config';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, where, getDocs, serverTimestamp, arrayUnion } from 'firebase/firestore';

export const getUserGroups = async () => {
  try {
    const q = query(collection(db, 'groups'), where('members', 'array-contains', auth.currentUser?.uid));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw error;
  }
};

export const createGroup = async (name: string, members: string[] = []) => {
  try {
    const groupData = {
      name,
      members: [auth.currentUser?.uid, ...members],
      createdBy: auth.currentUser?.uid,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'groups'), groupData);
    return {
      id: docRef.id,
      ...groupData
    };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const addMemberToGroup = async (groupId: string, userId: string) => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userId)
    });
    return true;
  } catch (error) {
    console.error('Error adding member to group:', error);
    throw error;
  }
}; 