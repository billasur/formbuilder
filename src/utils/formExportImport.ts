import { saveAs } from 'file-saver';
import { message } from 'antd';
import { getFormById, createForm, updateForm } from '../firebase/formService';
import { uploadFileWithCompression, compressData, decompressData } from './fileUtils';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';

// Export a form to JSON file
export const exportFormToJson = async (formId: string): Promise<void> => {
  try {
    // Get the form data
    const form = await getFormById(formId);
    
    if (!form) {
      throw new Error('Form not found');
    }
    
    // Create a sanitized version of the form without sensitive data
    const exportData = {
      name: form.name,
      description: form.description,
      fields: form.fields,
      settings: form.settings,
      isTemplate: true,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create a blob and trigger download
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, `${form.name.replace(/\s+/g, '_')}_export.json`);
    
    message.success('Form exported successfully');
  } catch (error) {
    console.error('Error exporting form:', error);
    message.error('Failed to export form');
    throw error;
  }
};

// Export a form to a compressed string
export const exportFormToCompressedString = async (formId: string): Promise<string> => {
  try {
    // Get the form data
    const form = await getFormById(formId);
    
    if (!form) {
      throw new Error('Form not found');
    }
    
    // Create a sanitized version of the form without sensitive data
    const exportData = {
      name: form.name,
      description: form.description,
      fields: form.fields,
      settings: form.settings,
      isTemplate: true,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0'
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(exportData);
    
    // Compress the string
    const compressedData = compressData(jsonString);
    
    return compressedData;
  } catch (error) {
    console.error('Error creating compressed form export:', error);
    message.error('Failed to create compressed form export');
    throw error;
  }
};

// Import a form from a JSON file
export const importFormFromJson = async (
  file: File, 
  userId: string, 
  options: { createNew: boolean, targetFormId?: string } = { createNew: true }
): Promise<string> => {
  try {
    // Read the file
    const fileContent = await readFileAsText(file);
    
    // Parse the JSON
    let formData;
    try {
      formData = JSON.parse(fileContent);
    } catch (error) {
      throw new Error('Invalid JSON format in the uploaded file');
    }
    
    // Validate the imported data
    if (!formData.fields || !Array.isArray(formData.fields)) {
      throw new Error('Invalid form data: missing fields array');
    }
    
    // Process the form data
    if (options.createNew) {
      // Create a new form
      const newFormData = {
        ownerId: userId,
        name: formData.name || 'Imported Form',
        description: formData.description || '',
        fields: formData.fields,
        settings: formData.settings || {},
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newFormId = await createForm(newFormData);
      return newFormId;
    } else if (options.targetFormId) {
      // Update existing form
      await updateForm(options.targetFormId, {
        fields: formData.fields,
        settings: formData.settings || {},
        updatedAt: new Date()
      });
      
      return options.targetFormId;
    } else {
      throw new Error('Invalid import options');
    }
  } catch (error) {
    console.error('Error importing form:', error);
    throw error;
  }
};

// Helper function to read file as text
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
};

// Export form templates to share with community
export const exportFormAsTemplate = async (formId: string, isPublic: boolean): Promise<string> => {
  try {
    // Get full form data
    const form = await getFormById(formId);
    
    if (!form) {
      throw new Error('Form not found');
    }
    
    // Create template data
    const templateData = {
      name: form.name,
      description: form.description,
      fields: form.fields,
      settings: form.settings,
      category: form.settings?.category || 'General',
      tags: form.settings?.tags || [],
      thumbnail: form.settings?.thumbnail || null,
      isPublic,
      originalFormId: formId,
      creatorId: form.ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      downloadCount: 0
    };
    
    // Save to templates collection
    // This would normally be implemented in a templateService file
    const templateRef = await addDoc(collection(db, 'templates'), templateData);
    
    return templateRef.id;
  } catch (error) {
    console.error('Error exporting form as template:', error);
    throw error;
  }
}; 