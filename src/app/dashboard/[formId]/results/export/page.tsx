'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Radio, 
  Space, 
  message, 
  Divider,
  Result 
} from 'antd';
import { 
  FileExcelOutlined, 
  FilePdfOutlined, 
  FileTextOutlined, 
  CloudDownloadOutlined 
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '../../../../../firebase/config';
import { getForm } from '../../../../../firebase/formService';
import { getFormResponses } from '../../../../../firebase/responseService';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';
import { exportToExcel, exportToPDF, exportToCSV } from '../../../../../utils/exportUtils';
import { FormModel, FormSubmission } from '../../../../../types/form';

const { Title, Paragraph } = Typography;

export default function ExportFormDataPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params.formId as string;
  
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState<FormModel | null>(null);
  const [responses, setResponses] = useState<FormSubmission[]>([]);
  const [exportFormat, setExportFormat] = useState('excel');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) {
        router.push('/auth/signin');
        return;
      }
      
      try {
        // Get form data
        const formData = await getForm(formId);
        
        if (!formData || formData.ownerId !== auth.currentUser.uid) {
          setError('You do not have permission to access this form');
          setLoading(false);
          return;
        }
        
        setForm(formData);
        
        // Get form responses
        const responseData = await getFormResponses(formId);
        setResponses(responseData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [formId, router]);
  
  const handleExport = async () => {
    if (responses.length === 0) {
      message.warning('No data to export');
      return;
    }
    
    setExporting(true);
    
    try {
      // Prepare filename
      const filename = `${form?.name?.replace(/\s+/g, '-').toLowerCase() || 'form'}-responses`;
      
      // Export based on selected format
      if (exportFormat === 'excel') {
        exportToExcel(responses, form?.fields, form, filename);
      } else if (exportFormat === 'pdf') {
        exportToPDF(responses, form?.fields, form, filename);
      } else if (exportFormat === 'csv') {
        exportToCSV(responses, form?.fields, form, filename);
      }
      
      message.success(`Data exported as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      console.error('Error exporting data:', err);
      message.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner tip="Loading form data..." />;
  }

  return (
    <div className="export-page">
      <Card title="Export Form Responses">
        {error ? (
          <Result
            status="error"
            title="Error"
            subTitle={error}
            extra={
              <Button type="primary" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            }
          />
        ) : responses.length === 0 ? (
          <Result
            status="info"
            title="No Responses"
            subTitle="This form has no submissions yet."
            extra={
              <Button type="primary" onClick={() => router.push(`/dashboard/${formId}/results`)}>
                Back to Results
              </Button>
            }
          />
        ) : (
          <>
            <Title level={4}>{form?.name || 'Form'}</Title>
            <Paragraph>
              Total responses: <strong>{responses.length}</strong>
            </Paragraph>
            
            <Divider />
            
            <Typography.Title level={5}>Export Format</Typography.Title>
            <Radio.Group 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value)}
              size="large"
              style={{ marginBottom: 24 }}
            >
              <Radio.Button value="excel">
                <FileExcelOutlined /> Excel
              </Radio.Button>
              <Radio.Button value="pdf">
                <FilePdfOutlined /> PDF
              </Radio.Button>
              <Radio.Button value="csv">
                <FileTextOutlined /> CSV
              </Radio.Button>
            </Radio.Group>

            <Divider />

            <Space>
              <Button 
                type="primary" 
                size="large"
                icon={<CloudDownloadOutlined />} 
                onClick={handleExport}
                loading={exporting}
              >
                Export as {exportFormat.toUpperCase()}
              </Button>
              <Button 
                onClick={() => router.push(`/dashboard/${formId}/results`)}
              >
                Back to Results
              </Button>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
} 