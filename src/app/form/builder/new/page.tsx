'use client'

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { auth } from '../../../../firebase/config';
import { createForm } from '../../../../firebase/formService';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';

export default function NewFormPage() {
  const router = useRouter();

  useEffect(() => {
    const createNewForm = async () => {
      try {
        if (!auth.currentUser) {
          message.error('You must be logged in to create a form');
          router.push('/auth/signin');
          return;
        }

        // Create a blank form
        const formId = await createForm({
          ownerId: auth.currentUser.uid,
          name: 'Untitled Form',
          description: '',
          fields: [],
          settings: {
            submitButtonText: 'Submit',
            showProgressBar: false,
            locale: 'en',
            captchaKind: 'none'
          },
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Redirect to the form builder with the new form ID
        router.push(`/form/builder/${formId}`);
      } catch (error) {
        console.error('Error creating new form:', error);
        message.error('Failed to create new form');
        router.push('/dashboard');
      }
    };

    createNewForm();
  }, [router]);

  return (
    <div className="form-builder-container">
      <LoadingSpinner 
        tip="Creating new form..." 
        fullScreen={true}
      />
    </div>
  );
} 