'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Typography, 
  Space, 
  Divider,
  Statistic,
  Empty,
  Tag,
  message
} from 'antd';
import { 
  ArrowLeftOutlined, 
  DownloadOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  FormOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { getFormById } from '../../../../firebase/formService';
import { getAllFormResponses, deleteResponse, getResponsesByFormId } from '../../../../firebase/responseService';
import { auth } from '../../../../firebase/config';
import LoadingSpinner from '../../../../components/ui/LoadingSpinner';
import { CSVLink } from 'react-csv';
import { format } from 'date-fns';

const { Title, Text } = Typography;

export default function FormResponsesPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params.formId as string;
  
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchFormAndResponses = async () => {
      try {
        // Check authentication
        if (!auth.currentUser) {
          router.push('/auth/signin');
          return;
        }
        
        // Get form data
        const formData = await getFormById(formId);
        
        // Check if user owns the form
        if (formData.ownerId !== auth.currentUser.uid) {
          message.error('You do not have permission to view this form\'s responses');
          router.push('/dashboard/forms');
          return;
        }
        
        setForm(formData);
        
        // Get form responses
        const formResponses = await getAllFormResponses(formId);
        setResponses(formResponses);
      } catch (error) {
        console.error('Error fetching form responses:', error);
        setError('Failed to load form responses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormAndResponses();
  }, [formId, router]);
  
  const handleBackToForm = () => {
    router.push(`/form/builder/${formId}`);
  };
  
  const handleViewResponse = (responseId) => {
    router.push(`/form/responses/${formId}/${responseId}`);
  };
  
  const handleDeleteResponse = async (responseId) => {
    try {
      await deleteResponse(responseId);
      
      // Update local state
      setResponses(responses.filter(r => r.id !== responseId));
      message.success('Response deleted successfully');
    } catch (error) {
      console.error('Error deleting response:', error);
      message.error('Failed to delete response');
    }
  };
  
  // Prepare CSV data for export
  const getCsvData = () => {
    if (!responses.length || !form) return [];
    
    // Headers row
    const headers = [
      'Submission ID',
      'Submission Date',
      ...form.fields.map(field => field.label)
    ];
    
    // Data rows
    const rows = responses.map(response => {
      const row = [
        response.id,
        format(response.createdAt, 'yyyy-MM-dd HH:mm:ss')
      ];
      
      // Add field values
      form.fields.forEach(field => {
        const value = response.data[field.id];
        row.push(value !== undefined ? value : '');
      });
      
      return row;
    });
    
    return [headers, ...rows];
  };
  
  if (loading) {
    return <LoadingSpinner fullScreen tip="Loading form responses..." />;
  }
  
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <Result
            status="error"
            title="Error Loading Responses"
            subTitle={error}
            extra={
              <Button type="primary" onClick={() => router.push('/dashboard/forms')}>
                Back to Forms
              </Button>
            }
          />
        </Card>
      </div>
    );
  }
  
  // Create table columns dynamically based on form fields
  const createColumns = () => {
    const baseColumns = [
      {
        title: 'Submission Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date) => format(date, 'yyyy-MM-dd HH:mm:ss'),
        sorter: (a, b) => a.createdAt - b.createdAt,
      }
    ];
    
    // Add columns for each form field
    const fieldColumns = form.fields.map(field => ({
      title: field.label,
      dataIndex: ['data', field.id],
      key: field.id,
      ellipsis: true,
      render: (text) => {
        if (Array.isArray(text)) {
          return text.join(', ');
        }
        return text;
      }
    })).slice(0, 3); // Only show first 3 fields in table
    
    // Action column
    const actionColumn = {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small" 
            onClick={() => handleViewResponse(record.id)}
          >
            View
          </Button>
          <Button 
            icon={<DeleteOutlined />} 
            size="small" 
            danger
            onClick={() => handleDeleteResponse(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    };
    
    return [...baseColumns, ...fieldColumns, actionColumn];
  };
  
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBackToForm}>
              Back to Form
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              {form?.name} - Responses
            </Title>
          </Space>
          
          <Space>
            {responses.length > 0 && (
              <CSVLink 
                data={getCsvData()} 
                filename={`${form.name}-responses.csv`}
                className="ant-btn ant-btn-primary"
              >
                <DownloadOutlined /> Export CSV
              </CSVLink>
            )}
            <Button 
              type="primary" 
              icon={<FormOutlined />} 
              onClick={() => router.push(`/form/preview/${formId}`)}
            >
              View Form
            </Button>
          </Space>
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div style={{ marginBottom: 24 }}>
          <Space size="large">
            <Statistic title="Total Responses" value={responses.length} />
            <Statistic 
              title="Completion Rate" 
              value={form.views > 0 ? Math.round((responses.length / form.views) * 100) : 0} 
              suffix="%" 
            />
          </Space>
        </div>
        
        {responses.length > 0 ? (
          <Table 
            columns={createColumns()} 
            dataSource={responses} 
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="No responses yet. Share your form to start collecting data." />
        )}
      </Card>
    </div>
  );
} 