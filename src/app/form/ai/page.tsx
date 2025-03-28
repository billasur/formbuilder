'use client'

import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Space, 
  Select, 
  message, 
  Divider, 
  Typography,
  Alert,
  Statistic,
  Modal
} from 'antd';
import { 
  RobotOutlined, 
  FormOutlined, 
  SendOutlined,
  ThunderboltOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { auth } from '../../../firebase/config';
import { createForm } from '../../../firebase/formService';
import { generateFormWithAI, getTokenUsage } from '../../../services/aiService';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Predefined templates for common form types
const AI_TEMPLATES = {
  contact: `Create a contact form with these fields:
    - Full name (required)
    - Email (required)
    - Phone number (optional)
    - Subject (required)
    - Message (required)
    - Preferred contact method (radio: email, phone)
    - Department (dropdown: Sales, Support, Billing, Other)`,

  survey: `Create a customer satisfaction survey with these fields:
    - Name (optional)
    - Email (optional)
    - How did you hear about us? (dropdown)
    - Rate your experience (1-5 stars)
    - What did you like most? (text area)
    - Areas for improvement (text area)
    - Would you recommend us? (yes/no)
    - Additional comments (optional text area)`,

  application: `Create a job application form with these fields:
    - Personal information (name, email, phone, address)
    - Job position (dropdown)
    - Resume upload (file)
    - Cover letter (text area)
    - Work experience (text area)
    - Education (text area)
    - References (optional)`,

  feedback: `Create a product feedback form with these fields:
    - Name (optional)
    - Email (optional)
    - Product name/version (required)
    - Rating (1-5 stars)
    - What did you like? (text area)
    - What needs improvement? (text area)
    - Would you recommend this product? (yes/no)
    - Any other comments (text area)`,

  event: `Create an event registration form with these fields:
    - Name (required)
    - Email (required)
    - Phone number (optional)
    - Number of attendees (number input)
    - Event date selection (dropdown with options)
    - Dietary restrictions (checkboxes)
    - Special requests (text area)
    - How did you hear about this event? (dropdown)`,
};

export default function AIFormGenerator() {
  const router = useRouter();
  const [formType, setFormType] = useState('custom');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [error, setError] = useState(null);
  
  // New state for template editing
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState('');
  const [selectedTemplateName, setSelectedTemplateName] = useState('');

  // Function to handle template selection and allow editing
  const handleTemplateSelect = (value) => {
    setFormType(value);
    if (value !== 'custom') {
      setSelectedTemplateName(value);
      setEditedTemplate(AI_TEMPLATES[value]);
      setFormDescription('');
    } else {
      setSelectedTemplateName('');
      setEditedTemplate('');
    }
  };

  // Function to open the template edit modal
  const handleEditTemplate = () => {
    if (formType !== 'custom') {
      setEditedTemplate(AI_TEMPLATES[formType]);
      setIsEditingTemplate(true);
    }
  };

  // Function to save the edited template
  const handleSaveTemplate = () => {
    setIsEditingTemplate(false);
    // We're not actually changing the template constants, just using the edited version
  };

  const generateAIForm = async () => {
    if (!auth.currentUser) {
      message.error('You must be logged in to create forms');
      router.push('/auth/signin');
      return;
    }

    setLoading(true);
    setTokensUsed(0);
    
    try {
      // Get the prompt based on form type
      let prompt = '';
      if (formType === 'custom') {
        prompt = formDescription;
      } else {
        // Use the edited template if available, otherwise use the default
        prompt = editedTemplate || AI_TEMPLATES[formType];
      }
      
      if (!prompt) {
        message.error('Please provide a form description');
        setLoading(false);
        return;
      }

      // Check if API key is configured
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        setError('API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.');
        setLoading(false);
        return;
      }

      // Generate form fields using AI
      const formStructure = await generateFormWithAI(prompt);
      
      // Track token usage
      if (formStructure.tokensUsed) {
        setTokensUsed(formStructure.tokensUsed);
      }
      
      // Create the form in Firebase
      const formId = await createForm({
        ownerId: auth.currentUser.uid,
        name: formName || `${formType.charAt(0).toUpperCase() + formType.slice(1)} Form`,
        description: formDescription || `Generated ${formType} form`,
        fields: formStructure.fields || [],
        settings: {
          submitButtonText: 'Submit',
          showProgressBar: true,
          ...formStructure.settings
        },
        isPublished: false,
        isAIGenerated: true, // Mark as AI generated
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      message.success('Form created successfully!');
      
      // Explicitly navigate to the form builder with the new form ID
      router.push(`/form/builder/${formId}`);
    } catch (error) {
      console.error('Error generating form:', error);
      
      // More specific error messages
      if (error.toString().includes('API Key')) {
        message.error('Authentication error with AI service. Please check your API key.');
      } else if (error.toString().includes('JSON')) {
        message.error('Invalid response format from AI service. Please try again.');
      } else {
        message.error('Failed to generate form. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-form-generator">
        <Card title="AI Form Generator">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <LoadingSpinner fullScreen={true} />
            <Paragraph style={{ marginTop: 20 }}>
              This may take a few moments while we craft your form...
            </Paragraph>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="ai-form-generator">
      <Card 
        title={
          <Space>
            <RobotOutlined /> AI Form Generator
          </Space>
        }
      >
        {tokensUsed > 0 && (
          <Alert
            message="Form Generated Successfully"
            description={
              <div>
                <p>Your form has been created! You can now customize it in the form builder.</p>
                <Statistic 
                  title="Tokens Used" 
                  value={tokensUsed} 
                  prefix={<ThunderboltOutlined />} 
                />
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            closable
            onClose={() => setError(null)}
          />
        )}

        <Paragraph>
          Describe the form you want to create, or select a template type and we'll generate it for you using AI.
        </Paragraph>

        <Form layout="vertical">
          <Form.Item label="Form Name">
            <Input
              placeholder="Enter form name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </Form.Item>

          <Form.Item label="Form Type">
            <Select 
              value={formType} 
              onChange={handleTemplateSelect}
              style={{ width: '100%' }}
            >
              <Option value="custom">Custom Form</Option>
              <Option value="contact">Contact Form</Option>
              <Option value="survey">Survey Form</Option>
              <Option value="application">Application Form</Option>
              <Option value="feedback">Feedback Form</Option>
              <Option value="event">Event Registration</Option>
            </Select>
            
            {formType !== 'custom' && (
              <Button 
                type="link" 
                icon={<EditOutlined />}
                onClick={handleEditTemplate}
                style={{ padding: '4px 0', marginTop: '4px' }}
              >
                Edit template
              </Button>
            )}
          </Form.Item>

          {formType === 'custom' && (
            <Form.Item 
              label="Form Description" 
              required
              rules={[{ required: true, message: 'Please provide a description for your form' }]}
            >
              <TextArea
                placeholder="Describe the form you want to create..."
                rows={6}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={generateAIForm}
              disabled={formType === 'custom' && !formDescription}
            >
              Generate Form
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Modal for template editing */}
      <Modal
        title={`Edit ${selectedTemplateName.charAt(0).toUpperCase() + selectedTemplateName.slice(1)} Template`}
        open={isEditingTemplate}
        onCancel={() => setIsEditingTemplate(false)}
        onOk={handleSaveTemplate}
        width={700}
      >
        <Paragraph>
          Customize the template to your needs. Keep the structure similar for best results.
        </Paragraph>
        <TextArea
          rows={12}
          value={editedTemplate}
          onChange={(e) => setEditedTemplate(e.target.value)}
        />
      </Modal>
    </div>
  );
} 