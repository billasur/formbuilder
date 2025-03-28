'use client'

import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Upload, 
  Button, 
  Space, 
  Radio, 
  Input, 
  message, 
  Divider, 
  Alert 
} from 'antd';
import { 
  InboxOutlined, 
  CodeOutlined, 
  ImportOutlined, 
  LinkOutlined 
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { importFormFromJson } from '../../utils/formExportImport';
import styles from './FormImport.module.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

interface FormImportProps {
  onSuccess?: (formId: string) => void;
  targetFormId?: string;
  mode?: 'create' | 'update';
}

export default function FormImport({ 
  onSuccess, 
  targetFormId, 
  mode = 'create' 
}: FormImportProps) {
  const { currentUser } = useAuth();
  const [importType, setImportType] = useState<'file' | 'json'>('file');
  const [importName, setImportName] = useState('');
  const [jsonContent, setJsonContent] = useState('');
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleImport = async () => {
    if (!currentUser) {
      message.error('You must be logged in to import forms');
      return;
    }
    
    // Reset error
    setError(null);
    
    // Validate inputs
    if (importType === 'json' && !jsonContent.trim()) {
      setError('Please enter the JSON content');
      return;
    }
    
    if (importType === 'file' && fileList.length === 0) {
      setError('Please upload a form file');
      return;
    }
    
    setLoading(true);
    
    try {
      let formId;
      
      if (importType === 'file') {
        formId = await importFormFromJson(
          fileList[0].originFileObj,
          currentUser.uid,
          { 
            createNew: mode === 'create',
            targetFormId: mode === 'update' ? targetFormId : undefined
          }
        );
      } else {
        // Create a file from the JSON string
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const file = new File([blob], 'form-import.json', { type: 'application/json' });
        
        formId = await importFormFromJson(
          file,
          currentUser.uid,
          { 
            createNew: mode === 'create',
            targetFormId: mode === 'update' ? targetFormId : undefined
          }
        );
      }
      
      message.success(`Form ${mode === 'create' ? 'imported' : 'updated'} successfully`);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(formId);
      }
    } catch (error) {
      console.error('Import error:', error);
      setError(error.message || 'An error occurred during import');
      message.error('Failed to import form');
    } finally {
      setLoading(false);
    }
  };
  
  // File upload props
  const uploadProps = {
    accept: '.json',
    beforeUpload: (file: any) => {
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    },
    fileList,
    maxCount: 1
  };
  
  return (
    <Card className={styles.importCard}>
      <Title level={4}>
        <ImportOutlined /> {mode === 'create' ? 'Import Form' : 'Update Form from Import'}
      </Title>
      
      <Paragraph className={styles.description}>
        Import a form from a JSON file or paste JSON directly. 
        {mode === 'update' && ' This will update your existing form fields and settings.'}
      </Paragraph>
      
      {error && (
        <Alert 
          message="Import Error" 
          description={error}
          type="error"
          showIcon
          className={styles.errorAlert}
        />
      )}
      
      <Radio.Group 
        value={importType} 
        onChange={(e) => setImportType(e.target.value)}
        className={styles.radioGroup}
      >
        <Radio.Button value="file">Upload File</Radio.Button>
        <Radio.Button value="json">Paste JSON</Radio.Button>
      </Radio.Group>
      
      <Divider />
      
      {importType === 'file' ? (
        <Dragger {...uploadProps} className={styles.uploader}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to upload</p>
          <p className="ant-upload-hint">
            Support for .json files exported from this application
          </p>
        </Dragger>
      ) : (
        <TextArea
          placeholder="Paste your form JSON here..."
          rows={10}
          value={jsonContent}
          onChange={(e) => setJsonContent(e.target.value)}
          className={styles.jsonInput}
        />
      )}
      
      {mode === 'create' && (
        <Input
          placeholder="Form Name (Optional)"
          value={importName}
          onChange={(e) => setImportName(e.target.value)}
          className={styles.nameInput}
          prefix={<CodeOutlined />}
        />
      )}
      
      <div className={styles.actionButtons}>
        <Button
          type="primary"
          size="large"
          icon={<ImportOutlined />}
          onClick={handleImport}
          loading={loading}
        >
          {mode === 'create' ? 'Import Form' : 'Update Form'}
        </Button>
      </div>
    </Card>
  );
} 