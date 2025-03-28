import { db, auth } from './config';
import { collection, addDoc, deleteDoc, doc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export const shareFormWithUser = async (formId: string, userId: string, permission: 'view' | 'edit') => {
  try {
    await addDoc(collection(db, 'formShares'), {
      formId,
      userId,
      permission,
      sharedBy: auth.currentUser?.uid,
      sharedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error sharing form:', error);
    throw error;
  }
};

export const removeFormShare = async (shareId: string) => {
  try {
    await deleteDoc(doc(db, 'formShares', shareId));
    return true;
  } catch (error) {
    console.error('Error removing form share:', error);
    throw error;
  }
};

export const getFormShares = async (formId: string) => {
  try {
    const q = query(collection(db, 'formShares'), where('formId', '==', formId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting form shares:', error);
    throw error;
  }
}; 