import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormBuilder from '../FormBuilder';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the firebase functions
jest.mock('../../../firebase/formService', () => ({
  updateForm: jest.fn(() => Promise.resolve()),
  getFormById: jest.fn(() => Promise.resolve({
    id: 'test-form-id',
    name: 'Test Form',
    description: 'Test Description',
    fields: [],
    settings: {
      submitButtonText: 'Submit'
    }
  }))
}));

describe('FormBuilder', () => {
  beforeEach(() => {
    // Mock implementation
    jest.clearAllMocks();
  });

  test('renders form builder with no fields', async () => {
    render(
      <AuthProvider>
        <FormBuilder 
          formId="test-form-id" 
          initialForm={{
            id: 'test-form-id',
            name: 'Test Form',
            description: 'Test Description',
            fields: [],
            settings: {
              submitButtonText: 'Submit'
            }
          }}
        />
      </AuthProvider>
    );
    
    // Check if the form builder is rendered
    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    
    // Check if add field button is rendered
    expect(screen.getByText('Add Field')).toBeInTheDocument();
  });

  test('adds a new field when "Add Field" button is clicked', async () => {
    render(
      <AuthProvider>
        <FormBuilder 
          formId="test-form-id" 
          initialForm={{
            id: 'test-form-id',
            name: 'Test Form',
            description: 'Test Description',
            fields: [],
            settings: {
              submitButtonText: 'Submit'
            }
          }}
        />
      </AuthProvider>
    );
    
    // Click the add field button
    fireEvent.click(screen.getByText('Add Field'));
    
    // Wait for the field type modal to appear
    await waitFor(() => {
      expect(screen.getByText('Select Field Type')).toBeInTheDocument();
    });
    
    // Select the "Text" field type
    fireEvent.click(screen.getByText('Text'));
    
    // Check if the field editor is rendered
    await waitFor(() => {
      expect(screen.getByText('Field Properties')).toBeInTheDocument();
    });
  });
}); 