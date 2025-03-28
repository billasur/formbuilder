import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { FormSubmission } from '../types/form';

// Collections
const submissionsCollection = collection(db, 'submissions');

// Get responses for a form
export const getFormResponses = async (formId: string): Promise<FormSubmission[]> => {
  try {
    const q = query(
      submissionsCollection,
      where('formId', '==', formId),
      orderBy('submittedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const responses: FormSubmission[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      responses.push({
        id: doc.id,
        formId: data.formId,
        data: data.data || {},
        submittedAt: data.submittedAt?.toDate() || new Date(),
        submittedBy: data.submittedBy
      });
    });
    
    return responses;
  } catch (error) {
    console.error('Error getting form responses:', error);
    throw error;
  }
};

// Submit form response
export const submitFormResponse = async (formId: string, responseData: Record<string, any>, userId?: string) => {
  try {
    const submissionData: FormSubmission = {
      id: '', // Will be set by Firestore
      formId: formId,
      data: responseData,
      submittedAt: new Date(),
      submittedBy: userId
    };
    
    const docRef = await addDoc(submissionsCollection, {
      ...submissionData,
      submittedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error submitting form response:', error);
    throw error;
  }
};

// Get a single form response
export const getFormResponse = async (responseId: string): Promise<FormSubmission | null> => {
  try {
    const docRef = doc(submissionsCollection, responseId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date()
    } as FormSubmission;
  } catch (error) {
    console.error('Error getting form response:', error);
    throw error;
  }
};

// Get all responses for all forms
export const getAllFormResponses = async (formId: string): Promise<FormSubmission[]> => {
  try {
    const q = query(
      submissionsCollection,
      where('formId', '==', formId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const responses: FormSubmission[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      responses.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as FormSubmission);
    });
    
    return responses;
  } catch (error) {
    console.error('Error getting form responses:', error);
    throw error;
  }
};

// Delete a form response
export const deleteFormResponse = async (responseId: string): Promise<boolean> => {
  try {
    const docRef = doc(submissionsCollection, responseId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting form response:', error);
    throw error;
  }
};

// Mark a response as read
export const markResponseAsRead = async (responseId: string): Promise<boolean> => {
  try {
    const docRef = doc(submissionsCollection, responseId);
    await updateDoc(docRef, {
      isRead: true,
      readAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error marking response as read:', error);
    throw error;
  }
};

// Mark a response as favorite
export const markResponseAsFavorite = async (responseId: string, isFavorite: boolean): Promise<boolean> => {
  try {
    const docRef = doc(submissionsCollection, responseId);
    await updateDoc(docRef, {
      isFavorite: isFavorite
    });
    return true;
  } catch (error) {
    console.error('Error marking response as favorite:', error);
    throw error;
  }
}; 