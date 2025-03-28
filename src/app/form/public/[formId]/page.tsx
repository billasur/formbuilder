'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Divider, 
  Space, 
  Button, 
  message,
  Result,
  Spin
} from 'antd';
import { 
  FormOutlined,
  CheckCircleOutlined,
  LockOutlined 
} from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { getFormById } from '../../../../firebase/formService';
import { submitForm } from '../../../../firebase/responseService';
import { auth } from '../../../../firebase/config';
import FormRenderer from '../../../../components/form/FormRenderer';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { submitFormResponse } from '../../../../firebase/responseService';

const { Title, Text } = Typography;

export default function PublicFormView() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Track form view
  useEffect(() => {
    const trackView = async () => {
      try {
        // Increment form view counter in Firestore
        const formRef = doc(db, 'forms', formId);
        await updateDoc(formRef, {
          views: increment(1)
        });
      } catch (error) {
        console.error('Error tracking form view:', error);
      }
    };
    
    if (form && !loading) {
      trackView();
    }
  }, [form, formId, loading]);
  
  // Fetch form data
  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const formData = await getFormById(formId);
        
        if (!formData) {
          setError('Form not found');
          return;
        }
        
        // Check form access
        const isPublicOrLinkAccess = 
          formData.accessType === 'public' || 
          formData.accessType === 'link';
        
        if (!isPublicOrLinkAccess) {
          setAccessDenied(true);
          return;
        }
        
        setForm(formData);
      } catch (error) {
        console.error('Error fetching form:', error);
        setError('Failed to load form');
      } finally {
        setLoading(false);
      }
    };
    
    fetchForm();
  }, [formId]);
  
  const handleValuesChange = (changedValues, allValues) => {
    setFormValues(allValues);
  };
  
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Validate all fields have values
      const fields = form.fields || [];
      const requiredFields = fields.filter(field => field.required);
      
      for (const field of requiredFields) {
        if (!formValues[field.id]) {
          message.error(`Please fill in the field: ${field.label}`);
          setSubmitting(false);
          return;
        }
      }
      
      // Prepare submission data
      const submissionData = {
        formId,
        formName: form.name,
        responses: formValues,
        createdAt: new Date(),
        userId: auth.currentUser?.uid || null,
        userEmail: auth.currentUser?.email || null
      };
      
      // Submit form
      await submitForm(submissionData);
      
      // Success
      setSubmitted(true);
      message.success('Form submitted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }
  
  if (error) {
    return (
      <Result
        status="error"
        title="Failed to load form"
        subTitle={error}
        extra={[
          <Button type="primary" key="home" onClick={() => router.push('/')}>
            Back to Home
          </Button>
        ]}
      />
    );
  }
  
  if (accessDenied) {
    return (
      <Result
        status="403"
        title="Access Denied"
        subTitle="You don't have permission to view this form"
        icon={<LockOutlined />}
        extra={[
          <Button type="primary" key="home" onClick={() => router.push('/')}>
            Back to Home
          </Button>
        ]}
      />
    );
  }
  
  if (submitted) {
    return (
      <Result
        status="success"
        title="Form Submitted Successfully!"
        subTitle="Thank you for submitting the form."
        icon={<CheckCircleOutlined />}
        extra={[
          <Button type="primary" key="home" onClick={() => router.push('/')}>
            Back to Home
          </Button>,
          <Button key="another" onClick={() => {
            setSubmitted(false);
            setFormValues({});
          }}>
            Submit Another Response
          </Button>
        ]}
      />
    );
  }
  
  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '800px', 
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      <Card bordered={false} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={3}>{form.name}</Title>
          {form.description && <Text type="secondary">{form.description}</Text>}
        </div>
        
        <Divider style={{ margin: '16px 0' }} />
        
        <FormRenderer
          fields={form.fields || []}
          onValuesChange={handleValuesChange}
          values={formValues}
        />
        
        <Divider style={{ margin: '16px 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            type="primary" 
            size="large"
            icon={<FormOutlined />}
            onClick={handleSubmit}
            loading={submitting}
          >
            Submit
          </Button>
        </div>
      </Card>
    </div>
  );
} 