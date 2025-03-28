import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  serverTimestamp,
  increment,
  FieldValue
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { nanoid } from 'nanoid';
import { db, storage } from './config';
import { FormModel, FormField, FormSubmission, HiddenField } from '../types/form';
import { auth } from './config';

// Form Collection References
const formsCollection = collection(db, 'forms');
const submissionsCollection = collection(db, 'submissions');

// Get all forms for a user
export const getForms = async (userId: string): Promise<FormModel[]> => {
  try {
    const q = query(
      formsCollection, 
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const forms: FormModel[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      forms.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as FormModel);
    });
    
    return forms;
  } catch (error) {
    console.error("Error getting forms:", error);
    
    // If there's an indexing error, use this fallback without ordering
    // This avoids breaking the app while waiting for the index to be created
    if (error.toString().includes("index")) {
      const fallbackQuery = query(
        formsCollection,
        where('ownerId', '==', userId)
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackForms: FormModel[] = [];
      
      fallbackSnapshot.forEach((doc) => {
        const data = doc.data();
        fallbackForms.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as FormModel);
      });
      
      // Sort in memory
      return fallbackForms.sort((a, b) => 
        b.updatedAt.getTime() - a.updatedAt.getTime()
      );
    }
    
    throw error;
  }
};

// Get a form by ID
export const getFormById = async (formId: string): Promise<FormModel | null> => {
  try {
    const formDoc = await getDoc(doc(formsCollection, formId));
    
    if (!formDoc.exists()) {
      return null;
    }
    
    const data = formDoc.data();
    return {
      id: formDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as FormModel;
  } catch (error) {
    console.error('Error getting form:', error);
    throw error;
  }
};

// Create a new form
export const createForm = async (formData: Omit<FormModel, 'id'>): Promise<string> => {
  try {
    // Add timestamps if they're not already present
    const dataWithTimestamps = {
      ...formData,
      createdAt: formData.createdAt || new Date(),
      updatedAt: formData.updatedAt || new Date()
    };
    
    const docRef = await addDoc(formsCollection, dataWithTimestamps);
    console.log('Form created with ID:', docRef.id); // Log to verify form creation
    return docRef.id;
  } catch (error) {
    console.error('Error creating form:', error);
    throw error;
  }
};

// Update a form
export const updateForm = async (formId: string, updatedData: Partial<FormModel>) => {
  try {
    const formRef = doc(db, 'forms', formId);
    
    // Filter out undefined values
    const dataToUpdate = Object.fromEntries(
      Object.entries(updatedData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(formRef, dataToUpdate);
    return { success: true };
  } catch (error) {
    console.error('Error updating form:', error);
    throw error;
  }
};

// Delete a form
export const deleteForm = async (formId: string): Promise<void> => {
  try {
    await deleteDoc(doc(formsCollection, formId));
    // Note: In a production app, you would also delete related submissions
  } catch (error) {
    console.error('Error deleting form:', error);
    throw error;
  }
};

// Submit a form
export const submitForm = async (
  formId: string, 
  answers: Record<string, any>,
  hiddenFields: HiddenField[] = []
): Promise<string> => {
  try {
    const submissionData: FormSubmission = {
      id: nanoid(),
      formId: formId,
      data: answers,
      submittedAt: new Date(),
      submittedBy: auth.currentUser?.uid || undefined
    };
    
    const docRef = await addDoc(submissionsCollection, submissionData);
    return docRef.id;
  } catch (error) {
    console.error("Error submitting form:", error);
    throw error;
  }
};

// Get form submissions
export const getFormSubmissions = async (formId: string): Promise<FormSubmission[]> => {
  try {
    const q = query(
      submissionsCollection, 
      where('formId', '==', formId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const submissions: FormSubmission[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        formId: data.formId,
        data: data.data,
        submittedAt: data.submittedAt?.toDate() || new Date(),
        submittedBy: data.submittedBy
      } as FormSubmission);
    });
    
    return submissions;
  } catch (error) {
    console.error('Error getting form submissions:', error);
    throw error;
  }
};

// Upload a file (for file uploads and signatures)
export const uploadFile = async (formId: string, file: File): Promise<string> => {
  try {
    const fileId = nanoid();
    const fileExtension = file.name.split('.').pop();
    const path = `forms/${formId}/uploads/${fileId}.${fileExtension}`;
    const fileRef = ref(storage, path);
    
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Process file for submission (for signatures and file uploads)
export const processFileForSubmission = async (
  formId: string, 
  fieldId: string, 
  fileData: File | string
): Promise<string> => {
  try {
    // If fileData is already a URL string, return it
    if (typeof fileData === 'string' && fileData.startsWith('http')) {
      return fileData;
    }
    
    // Convert base64 signature to File
    let file: File;
    if (typeof fileData === 'string') {
      // It's a base64 data URL (signature)
      const res = await fetch(fileData);
      const blob = await res.blob();
      file = new File([blob], 'signature.png', { type: 'image/png' });
    } else {
      file = fileData;
    }
    
    // Upload to Firebase storage
    return await uploadFile(formId, file);
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
};

// Submit form response
export const submitFormResponse = async (formId: string, responseData: any) => {
  const response = await addDoc(collection(db, 'forms', formId, 'responses'), {
    ...responseData,
    submittedAt: serverTimestamp()
  });
  
  return response.id;
};

// Duplicate a form
export const duplicateForm = async (formId: string): Promise<string> => {
  try {
    const originalForm = await getFormById(formId);
    
    if (!originalForm) {
      throw new Error('Form not found');
    }
    
    const { id, ...formData } = originalForm;
    
    // Create a duplicate with a new name
    const newForm = {
      ...formData,
      name: `${formData.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublished: false
    };
    
    return await createForm(newForm);
  } catch (error) {
    console.error('Error duplicating form:', error);
    throw error;
  }
};

// Get all forms for a user including AI-generated forms
export const getAllUserForms = async (userId: string): Promise<FormModel[]> => {
  try {
    const q = query(
      formsCollection, 
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const forms: FormModel[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      forms.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as FormModel);
    });
    
    return forms;
  } catch (error) {
    console.error('Error getting all user forms:', error);
    throw error;
  }
};

// Update form permissions
export const updateFormPermissions = async (formId: string, permissionsData: any) => {
  try {
    const formRef = doc(db, 'forms', formId);
    
    // Only update permissions-related fields
    const dataToUpdate = {
      accessType: permissionsData.accessType,
      collaborators: permissionsData.collaborators,
      lastUpdated: serverTimestamp()
    };

    // Filter out undefined values to prevent errors
    const cleanData = Object.fromEntries(
      Object.entries(dataToUpdate).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(formRef, cleanData);
    return { success: true };
  } catch (error) {
    console.error('Error updating form permissions:', error);
    throw error;
  }
};

// Check if user has access to form
export const checkFormAccess = async (formId: string, userId: string) => {
  try {
    const formDoc = await getFormById(formId);
    
    // If user is the owner, they have access
    if (formDoc.ownerId === userId) {
      return { hasAccess: true, role: 'owner' };
    }
    
    // Check if form is public
    if (formDoc.accessType === 'public') {
      return { hasAccess: true, role: 'viewer' };
    }
    
    // Check if form is accessible via link
    if (formDoc.accessType === 'link') {
      return { hasAccess: true, role: 'viewer' };
    }
    
    // Check if user is a collaborator
    const collaborator = formDoc.collaborators?.find(c => c.id === userId);
    if (collaborator) {
      return { hasAccess: true, role: collaborator.role };
    }
    
    // No access
    return { hasAccess: false, role: null };
  } catch (error) {
    console.error('Error checking form access:', error);
    throw error;
  }
};

// Upload field data as file for specific field types
export const uploadFieldDataAsFile = async (formId: string, fieldId: string, data: string) => {
  try {
    // Only process for text fields, paragraph fields, etc.
    // Generate a file-like object from the data
    const fieldData = new Blob([data], { type: 'text/plain' });
    
    // Create a storage reference
    const storageRef = ref(storage, `forms/${formId}/fields/${fieldId}.txt`);
    
    // Upload the blob
    await uploadBytes(storageRef, fieldData);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return { success: true, fileUrl: downloadURL };
  } catch (error) {
    console.error('Error uploading field data as file:', error);
    throw error;
  }
};

// Get field data from file
export const getFieldDataFromFile = async (fileUrl: string) => {
  try {
    // Fetch the file content
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch field data: ${response.statusText}`);
    }
    
    // Get the text content
    const data = await response.text();
    
    return { success: true, data };
  } catch (error) {
    console.error('Error getting field data from file:', error);
    throw error;
  }
};

// Update submitForm function to handle file uploads for text fields
export const submitFormWithFileStorage = async (formId: string, formData: any) => {
  try {
    // First, create the response document
    const responseRef = await addDoc(collection(db, 'responses'), {
      formId,
      createdAt: serverTimestamp(),
      submittedBy: auth.currentUser?.uid || 'anonymous',
      // Store metadata and non-text fields directly in the document
      metadata: {
        browser: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }
    });
    
    const responseId = responseRef.id;
    
    // Process each field
    const fieldPromises = Object.entries(formData).map(async ([fieldId, value]) => {
      // If the field is a text or paragraph type and longer than 100 characters
      // store it as a file
      if (typeof value === 'string' && value.length > 100) {
        const { fileUrl } = await uploadFieldDataAsFile(formId, `${responseId}_${fieldId}`, value);
        
        // Update the document with the file URL instead of the actual content
        await updateDoc(responseRef, {
          [`fields.${fieldId}`]: {
            type: 'file',
            fileUrl: fileUrl
          }
        });
      } else {
        // For smaller text fields or non-text fields, store directly
        await updateDoc(responseRef, {
          [`fields.${fieldId}`]: value
        });
      }
    });
    
    // Wait for all field processing to complete
    await Promise.all(fieldPromises);
    
    return { success: true, responseId };
  } catch (error) {
    console.error('Error submitting form with file storage:', error);
    throw error;
  }
};

// Get form versions
export const getFormVersions = async (formId: string) => {
  try {
    const q = query(
      collection(db, 'formVersions'), 
      where('formId', '==', formId),
      orderBy('version', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error getting form versions:', error);
    throw error;
  }
};

// Create a form version
export const createFormVersion = async (formId: string, formData: any, notes?: string) => {
  try {
    // Get current version number
    const versions = await getFormVersions(formId);
    const currentVersion = versions.length > 0 ? versions[0].version + 1 : 1;
    
    // Create new version
    const versionData = {
      formId,
      version: currentVersion,
      data: formData,
      notes: notes || '',
      createdBy: auth.currentUser?.uid || 'system',
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'formVersions'), versionData);
    return {
      id: docRef.id,
      ...versionData
    };
  } catch (error) {
    console.error('Error creating form version:', error);
    throw error;
  }
};

// Restore a form version
export const restoreFormVersion = async (formId: string, versionId: string) => {
  try {
    // Get the version data
    const versionDoc = await getDoc(doc(db, 'formVersions', versionId));
    
    if (!versionDoc.exists()) {
      throw new Error('Version not found');
    }
    
    const versionData = versionDoc.data();
    
    // Update the form with the version data
    await updateDoc(doc(db, 'forms', formId), {
      ...versionData.data,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.uid || 'system',
      restoredFromVersion: versionData.version
    });
    
    // Create a new version to mark the restore point
    return await createFormVersion(formId, versionData.data, `Restored from version ${versionData.version}`);
  } catch (error) {
    console.error('Error restoring form version:', error);
    throw error;
  }
};

// Delete a form version
export const deleteFormVersion = async (versionId: string) => {
  try {
    await deleteDoc(doc(db, 'formVersions', versionId));
    return true;
  } catch (error) {
    console.error('Error deleting form version:', error);
    throw error;
  }
};

// Add getForm function
export const getForm = async (formId: string): Promise<FormModel | null> => {
  try {
    const docRef = doc(db, 'forms', formId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as FormModel;
    }
    return null;
  } catch (error) {
    console.error('Error getting form:', error);
    throw error;
  }
}; 