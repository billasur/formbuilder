'use client'

import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  message, 
  Upload, 
  Space, 
  Divider,
  Radio 
} from 'antd';
import { InboxOutlined, LinkOutlined, CodeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { auth } from '../../../firebase/config';
import { importTemplateFromJSON, createFormFromImport } from '../../../firebase/templateService';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

export default function ImportTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState('file');
  const [jsonContent, setJsonContent] = useState('');
  const [importName, setImportName] = useState('');
  const [fileList, setFileList] = useState([]);

  const handleImport = async () => {
    if (!auth.currentUser) {
      message.error('You must be logged in to import templates');
      router.push('/auth/signin');
      return;
    }
    
    if (importType === 'json' && !jsonContent) {
      message.error('Please enter JSON content');
      return;
    }
    
    if (importType === 'file' && fileList.length === 0) {
      message.error('Please upload a template file');
      return;
    }
    
    setLoading(true);
    
    try {
      let templateData;
      
      if (importType === 'json') {
        templateData = await importTemplateFromJSON(jsonContent);
      } else if (importType === 'file') {
        // Read file contents
        const file = fileList[0].originFileObj;
        const text = await file.text();
        templateData = await importTemplateFromJSON(text);
      }
      
      // Create form from template
      const formId = await createFormFromImport(
        auth.currentUser.uid,
        templateData,
        importName || undefined
      );
      
      message.success('Template imported successfully!');
      router.push(`/form/builder/${formId}`);
    } catch (error) {
      console.error('Error importing template:', error);
      message.error('Failed to import template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // File upload configuration
  const uploadProps = {
    accept: '.json',
    beforeUpload: (file) => {
      // Prevent automatic upload
      setFileList([file]);
      return false;
    },
    fileList,
    onRemove: () => {
      setFileList([]);
    },
    maxCount: 1
  };

  if (loading) {
    return <LoadingSpinner tip="Importing template..." fullScreen={true} />;
  }

  return (
    <div className="import-template-page">
      <Card title="Import Form Template">
        <Paragraph>
          Import a form template from a JSON file or paste the JSON code directly.
        </Paragraph>
        
        <Divider />
        
        <Form layout="vertical">
          <Form.Item label="Template Name (Optional)">
            <Input 
              placeholder="My Imported Template" 
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
            />
          </Form.Item>
          
          <Form.Item label="Import Type">
            <Radio.Group 
              value={importType} 
              onChange={(e) => setImportType(e.target.value)}
            >
              <Radio.Button value="file"><InboxOutlined /> File Upload</Radio.Button>
              <Radio.Button value="json"><CodeOutlined /> JSON Code</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          {importType === 'file' && (
            <Form.Item>
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                  Support for JSON template files only
                </p>
              </Dragger>
            </Form.Item>
          )}
          
          {importType === 'json' && (
            <Form.Item label="Paste JSON">
              <TextArea
                rows={10}
                placeholder='{"fields": [...], "settings": {...}}'
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                onClick={handleImport}
              >
                Import Template
              </Button>
              <Button onClick={() => router.push('/templates')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
} 