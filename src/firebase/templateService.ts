import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { createForm } from './formService';
import { FormModel } from '../types/form';

// Collections
const templatesCollection = collection(db, 'templates');

// Get public templates
export const getPublicTemplates = async () => {
  try {
    const q = query(
      templatesCollection,
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const templates = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      });
    });
    
    return templates;
  } catch (error) {
    console.error('Error getting public templates:', error);
    
    // Fallback without ordering if index issues
    if (error.toString().includes("index")) {
      const fallbackQuery = query(
        templatesCollection,
        where('isPublic', '==', true)
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackTemplates = [];
      
      fallbackSnapshot.forEach((doc) => {
        const data = doc.data();
        fallbackTemplates.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        });
      });
      
      // Sort in memory
      return fallbackTemplates.sort((a, b) => 
        b.updatedAt.getTime() - a.updatedAt.getTime()
      );
    }
    
    throw error;
  }
};

// Get template by ID
export const getTemplateById = async (templateId: string) => {
  try {
    const templateDoc = await getDoc(doc(templatesCollection, templateId));
    
    if (!templateDoc.exists()) {
      return null;
    }
    
    const data = templateDoc.data();
    return {
      id: templateDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting template:', error);
    throw error;
  }
};

// Create a form from a template
export const createFormFromTemplate = async (userId: string, templateId: string) => {
  try {
    const template = await getTemplateById(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Create a new form based on the template
    const formData = {
      ownerId: userId,
      name: template.name,
      description: template.description || '',
      fields: template.fields || [],
      settings: template.settings || {
        submitButtonText: 'Submit',
        showProgressBar: false,
      },
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return await createForm(formData);
  } catch (error) {
    console.error('Error creating form from template:', error);
    throw error;
  }
};

// Import template from JSON
export const importTemplateFromJSON = async (jsonData: string) => {
  try {
    const templateData = JSON.parse(jsonData);
    
    // Validate template data structure
    if (!templateData.fields || !Array.isArray(templateData.fields)) {
      throw new Error('Invalid template format: missing fields array');
    }
    
    // Convert dates properly
    const template = {
      ...templateData,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    };
    
    return template;
  } catch (error) {
    console.error('Error importing template from JSON:', error);
    throw error;
  }
};

// Create form from imported data
export const createFormFromImport = async (userId: string, importData: any, formName?: string) => {
  try {
    // Prepare form data
    const formData = {
      ownerId: userId,
      name: formName || importData.name || 'Imported Form',
      description: importData.description || 'Imported form',
      fields: importData.fields || [],
      settings: importData.settings || {
        submitButtonText: 'Submit',
        showProgressBar: false,
      },
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return await createForm(formData);
  } catch (error) {
    console.error('Error creating form from import:', error);
    throw error;
  }
}; 