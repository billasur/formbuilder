import pako from 'pako'; // Make sure to add pako dependency: npm install pako
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Compress string with pako
export const compressData = (data: string): string => {
  try {
    const compressed = pako.deflate(data, { to: 'string' });
    return btoa(compressed);
  } catch (error) {
    console.error('Compression error:', error);
    return data;
  }
};

// Decompress string with pako
export const decompressData = (compressedData: string): string => {
  try {
    const decoded = atob(compressedData);
    const decompressed = pako.inflate(decoded, { to: 'string' });
    return decompressed;
  } catch (error) {
    console.error('Decompression error:', error);
    return compressedData;
  }
};

// Handle file upload with compression
export const uploadFileWithCompression = async (file: File): Promise<string> => {
  try {
    // Check file size
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size exceeds 10MB limit');
    }
    
    // Convert to base64
    const base64Data = await fileToBase64(file);
    
    // Compress only if the file is not already compressed
    // Images like JPEG, PNG are already compressed, so check file type
    const isCompressedType = /\.(jpg|jpeg|png|gif|webp|mp3|mp4|pdf)$/i.test(file.name);
    
    // Skip compression for already compressed file types
    if (isCompressedType) {
      return base64Data;
    }
    
    // Compress other file types
    const compressedData = compressData(base64Data);
    
    // Return the smaller of the two (original or compressed)
    const isCompressedSmaller = compressedData.length < base64Data.length;
    return isCompressedSmaller ? compressedData : base64Data;
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
};

// Save compressed file to Firestore
// This should be used when saving a single file is more efficient than creating a new Storage entry
export const saveFileToFirestore = async (
  collectionName: string, 
  documentId: string, 
  fieldName: string, 
  file: File
): Promise<void> => {
  try {
    const compressedData = await uploadFileWithCompression(file);
    
    // Update Firestore document with the compressed file data
    await updateDoc(doc(db, collectionName, documentId), {
      [fieldName]: {
        data: compressedData,
        name: file.name,
        type: file.type,
        size: file.size,
        compressed: true,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error saving file to Firestore:', error);
    throw error;
  }
};

// Helper function to download file from compressed data
export const downloadCompressedFile = (
  fileData: {
    data: string,
    name: string,
    type: string,
    compressed: boolean
  }
): void => {
  try {
    // Decompress if needed
    const fileContent = fileData.compressed 
      ? decompressData(fileData.data) 
      : fileData.data;
    
    // Create download link
    const link = document.createElement('a');
    link.href = fileContent;
    link.download = fileData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}; 