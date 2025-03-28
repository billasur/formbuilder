import { 
  doc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  Unsubscribe,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from './config';

// Subscribe to a single document with realtime updates
export const subscribeToDocument = <T = DocumentData>(
  collectionName: string,
  documentId: string,
  callback: (data: T | null) => void
): Unsubscribe => {
  const docRef = doc(db, collectionName, documentId);
  
  return onSnapshot(docRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = {
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as unknown as T;
      
      callback(data);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error subscribing to ${collectionName}/${documentId}:`, error);
    callback(null);
  });
};

// Subscribe to a collection with realtime updates and filtering
export const subscribeToCollection = <T = DocumentData>(
  collectionName: string,
  callback: (data: T[]) => void,
  queryConstraints: any[] = []
): Unsubscribe => {
  const collectionRef = collection(db, collectionName);
  const queryRef = query(collectionRef, ...queryConstraints);
  
  return onSnapshot(queryRef, (querySnapshot: QuerySnapshot) => {
    const items: T[] = [];
    
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      } as unknown as T);
    });
    
    callback(items);
  }, (error) => {
    console.error(`Error subscribing to ${collectionName}:`, error);
    callback([]);
  });
};

// Subscribe to user's forms
export const subscribeToUserForms = (
  userId: string,
  callback: (forms: any[]) => void
): Unsubscribe => {
  return subscribeToCollection(
    'forms',
    callback,
    [
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    ]
  );
};

// Subscribe to form submissions
export const subscribeToFormSubmissions = (
  formId: string,
  callback: (submissions: any[]) => void
): Unsubscribe => {
  return subscribeToCollection(
    'submissions',
    callback,
    [
      where('formId', '==', formId),
      orderBy('createdAt', 'desc')
    ]
  );
}; 