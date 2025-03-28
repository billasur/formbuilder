'use client'

import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Input, 
  Button, 
  Space, 
  Divider, 
  List, 
  Tag, 
  Skeleton, 
  Empty, 
  Alert,
  Steps,
  message
} from 'antd';
import { 
  BulbOutlined, 
  RobotOutlined, 
  LoadingOutlined, 
  SendOutlined,
  FormOutlined,
  CheckCircleOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { createFormFromStructure } from '../../firebase/formService';
import { useAuth } from '../../contexts/AuthContext';
import { generateFormStructure } from '../../utils/aiUtils';
import styles from './AIFormGenerator.module.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

const examplePrompts = [
  "Create a job application form with personal details, education, experience, and skills sections",
  "Generate a customer feedback survey with satisfaction rating, product quality, and service questions",
  "Make an event registration form with attendee details, session selection, and payment options",
  "Design a medical patient intake form with personal history and current symptoms"
];

export default function AIFormGenerator() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedForm, setGeneratedForm] = useState(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  
  const handleGenerateForm = async () => {
    if (!prompt.trim()) {
      message.error('Please enter a prompt to generate a form');
      return;
    }
    
    if (!currentUser) {
      message.error('You must be logged in to generate forms');
      return;
    }
    
    setGenerating(true);
    setError('');
    setCurrentStep(1);
    
    try {
      // Call your AI service to generate form structure
      const formStructure = await generateFormStructure(prompt);
      
      if (!formStructure || !formStructure.fields || formStructure.fields.length === 0) {
        throw new Error('Failed to generate valid form structure');
      }
      
      setGeneratedForm(formStructure);
      setCurrentStep(2);
    } catch (err) {
      console.error('Error generating form:', err);
      setError(err.message || 'Failed to generate form');
      setCurrentStep(0);
    } finally {
      setGenerating(false);
    }
  };
  
  const handleCreateForm = async () => {
    if (!generatedForm) return;
    
    setCurrentStep(3);
    
    try {
      // Create the form in your database
      const formId = await createFormFromStructure({
        ...generatedForm,
        ownerId: currentUser.uid,
        isAIGenerated: true,
        createdAt: new Date(),
      });
      
      message.success('Form created successfully!');
      
      // Redirect to the form builder to edit
      router.push(`/form/builder/${formId}`);
    } catch (err) {
      console.error('Error creating form:', err);
      setError('Failed to create form: ' + err.message);
      setCurrentStep(2);
    }
  };
  
  const handleUseExample = (example: string) => {
    setPrompt(example);
  };
  
  return (
    <Card className={styles.aiFormCard}>
      <div className={styles.cardHeader}>
        <Title level={3}>
          <RobotOutlined /> AI Form Generator
        </Title>
        <Text type="secondary">
          Describe the form you want to create, and our AI will generate it for you.
        </Text>
      </div>
      
      <Steps
        current={currentStep}
        className={styles.steps}
        items={[
          {
            title: 'Describe',
            icon: currentStep === 0 && generating ? <LoadingOutlined /> : <BulbOutlined />
          },
          {
            title: 'Generate',
            icon: currentStep === 1 && generating ? <LoadingOutlined /> : <RobotOutlined />
          },
          {
            title: 'Review',
            icon: <FormOutlined />
          },
          {
            title: 'Create',
            icon: <CheckCircleOutlined />
          }
        ]}
      />
      
      <div className={styles.promptSection}>
        <TextArea
          placeholder="Describe the form you want to create..."
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={generating || currentStep > 1}
          className={styles.promptInput}
        />
        
        {currentStep <= 1 && (
          <>
            <Button
              type="primary"
              icon={generating ? <LoadingOutlined /> : <SendOutlined />}
              onClick={handleGenerateForm}
              loading={generating}
              disabled={!prompt.trim()}
              className={styles.generateButton}
            >
              {generating ? 'Generating...' : 'Generate Form'}
            </Button>
            
            <div className={styles.examplesSection}>
              <Text strong>Or try one of these examples:</Text>
              <div className={styles.examples}>
                {examplePrompts.map((example, index) => (
                  <Tag
                    key={index}
                    className={styles.exampleTag}
                    onClick={() => handleUseExample(example)}
                  >
                    {example}
                  </Tag>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className={styles.errorAlert}
        />
      )}
      
      {currentStep >= 2 && generatedForm && (
        <div className={styles.previewSection}>
          <Divider>
            <Space>
              <FormOutlined />
              <span>Generated Form Preview</span>
            </Space>
          </Divider>
          
          <Card className={styles.formPreviewCard}>
            <Title level={4}>{generatedForm.name}</Title>
            <Paragraph>{generatedForm.description}</Paragraph>
            
            <List
              dataSource={generatedForm.fields}
              renderItem={(field: any) => (
                <List.Item className={styles.fieldItem}>
                  <div>
                    <Text strong>{field.label}</Text>
                    {field.required && <Tag color="red">Required</Tag>}
                    <div>
                      <Text type="secondary">{field.description}</Text>
                    </div>
                    <div className={styles.fieldType}>
                      <Tag color="blue">{field.type}</Tag>
                    </div>
                  </div>
                </List.Item>
              )}
            />
            
            <div className={styles.actionButtons}>
              <Space>
                {currentStep === 2 && (
                  <>
                    <Button
                      onClick={() => setCurrentStep(0)}
                    >
                      Start Over
                    </Button>
                    <Button
                      type="primary"
                      icon={<RocketOutlined />}
                      onClick={handleCreateForm}
                    >
                      Create This Form
                    </Button>
                  </>
                )}
              </Space>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
} 