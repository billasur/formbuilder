'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  List, 
  Tag, 
  Space, 
  Modal, 
  Empty, 
  Divider, 
  Tooltip, 
  Breadcrumb, 
  message,
  Popconfirm,
  Skeleton
} from 'antd';
import { 
  FileTextOutlined, 
  DeleteOutlined, 
  DownloadOutlined, 
  MailOutlined, 
  PrinterOutlined,
  StarOutlined,
  StarFilled,
  ExclamationCircleOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  MobileOutlined
} from '@ant-design/icons';
import { formatDistanceToNow, format } from 'date-fns';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useAuth } from '../../contexts/AuthContext';
import { getFormById } from '../../firebase/formService';
import { 
  getFormResponses, 
  getFormResponse as getResponseById, 
  deleteFormResponse as deleteResponse, 
  markResponseAsRead,
  markResponseAsFavorite
} from '../../firebase/responseService';
import { subscribeToFormSubmissions } from '../../firebase/firestore';
import styles from './FormResponseViewer.module.css';
import ResponsePDF from './ResponsePDF';

const { Title, Text, Paragraph } = Typography;

interface FormResponseViewerProps {
  formId: string;
  responseId?: string;
  onlyFavorites?: boolean;
}

// Define a FormField type
interface FormField {
  id: string;
  type: string;
  label: string;
  value?: any;
  // Add other properties as needed
}

export default function FormResponseViewer({ 
  formId, 
  responseId, 
  onlyFavorites = false 
}: FormResponseViewerProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Load form data
  useEffect(() => {
    const loadForm = async () => {
      try {
        const formData = await getFormById(formId);
        setForm(formData);
      } catch (error) {
        console.error('Error loading form:', error);
        message.error('Failed to load form');
      }
    };
    
    loadForm();
  }, [formId]);
  
  // Subscribe to responses
  useEffect(() => {
    if (!formId) return;
    
    const unsubscribe = subscribeToFormSubmissions(formId, (submissions) => {
      let filteredSubmissions = submissions;
      
      // Filter for favorites if needed
      if (onlyFavorites) {
        filteredSubmissions = submissions.filter(sub => sub.isFavorite);
      }
      
      setResponses(filteredSubmissions);
      setLoading(false);
      
      // If we have a responseId, select it
      if (responseId) {
        const targetResponse = filteredSubmissions.find(r => r.id === responseId);
        if (targetResponse) {
          setSelectedResponse(targetResponse);
          setDetailModalVisible(true);
          
          // Mark as read if it's not already
          if (!targetResponse.isRead) {
            markResponseAsRead(targetResponse.id);
          }
        }
      }
    });
    
    return () => unsubscribe();
  }, [formId, responseId, onlyFavorites]);
  
  // View response details
  const handleViewResponse = async (response: any) => {
    setSelectedResponse(response);
    setDetailModalVisible(true);
    
    // Mark as read if it's not already
    if (!response.isRead) {
      await markResponseAsRead(response.id);
      
      // Update local state to reflect the change
      setResponses(prev => 
        prev.map(r => 
          r.id === response.id ? { ...r, isRead: true } : r
        )
      );
    }
  };
  
  // Delete a response
  const handleDeleteResponse = async (responseId: string) => {
    try {
      await deleteResponse(responseId);
      message.success('Response deleted successfully');
      
      // Update local state
      setResponses(prev => prev.filter(r => r.id !== responseId));
      
      // Close modal if the deleted response was being viewed
      if (selectedResponse?.id === responseId) {
        setDetailModalVisible(false);
      }
    } catch (error) {
      console.error('Error deleting response:', error);
      message.error('Failed to delete response');
    }
  };
  
  // Toggle favorite status
  const handleToggleFavorite = async (responseId: string, currentStatus: boolean) => {
    try {
      await markResponseAsFavorite(responseId, !currentStatus);
      
      // Update local state
      setResponses(prev => 
        prev.map(r => 
          r.id === responseId ? { ...r, isFavorite: !currentStatus } : r
        )
      );
      
      // Update selected response if it's the same one
      if (selectedResponse?.id === responseId) {
        setSelectedResponse(prev => ({ ...prev, isFavorite: !currentStatus }));
      }
      
      message.success(`Response ${!currentStatus ? 'marked as favorite' : 'removed from favorites'}`);
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      message.error('Failed to update favorite status');
    }
  };
  
  // Render device icon based on user agent
  const renderDeviceIcon = (userAgent: string) => {
    if (!userAgent) return <GlobalOutlined />;
    
    if (/mobile|android|iphone|ipad|ipod/i.test(userAgent)) {
      return <MobileOutlined />;
    }
    
    return <GlobalOutlined />;
  };
  
  // Then type assert the field
  const renderFieldValue = (field: unknown) => {
    const typedField = field as FormField;
    // Now you can access properties safely
    if (typedField.type === 'file') {
      return <a href={typedField.value?.fileUrl}>{typedField.label}</a>;
    }
    // ... other conditions
  };
  
  return (
    <Card className={styles.responseViewerCard}>
      <div className={styles.cardHeader}>
        <Title level={4}>
          <FileTextOutlined /> {onlyFavorites ? 'Favorite Responses' : 'Form Responses'}
        </Title>
        <Space>
          {/* Download all as PDF/CSV buttons could go here */}
        </Space>
      </div>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <Skeleton active paragraph={{ rows: 5 }} />
        </div>
      ) : responses.length > 0 ? (
        <List
          className={styles.responsesList}
          itemLayout="horizontal"
          dataSource={responses}
          renderItem={response => (
            <List.Item
              key={response.id}
              className={!response.isRead ? styles.unreadResponse : ''}
              actions={[
                <Tooltip title={response.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                  <Button
                    type="text"
                    icon={response.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                    onClick={() => handleToggleFavorite(response.id, response.isFavorite)}
                  />
                </Tooltip>,
                <Tooltip title="View details">
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewResponse(response)}
                  >
                    View
                  </Button>
                </Tooltip>,
                <Popconfirm
                  title="Delete this response?"
                  description="This action cannot be undone."
                  onConfirm={() => handleDeleteResponse(response.id)}
                  okText="Yes, delete"
                  cancelText="Cancel"
                  icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {!response.isRead && <Tag color="blue">New</Tag>}
                    {response.isFavorite && <StarFilled style={{ color: '#faad14' }} />}
                    <span>
                      {response.submitterName || 'Anonymous'} - 
                      {response.data && form?.fields ? 
                        ` ${Object.keys(response.data).slice(0, 2).map(fieldId => {
                          const field = form.fields.find(f => f.id === fieldId);
                          return field ? `${field.label}: ${response.data[fieldId]}` : '';
                        }).join(', ')}${Object.keys(response.data).length > 2 ? '...' : ''}` : 
                        ' Empty response'}
                    </span>
                  </Space>
                }
                description={
                  <Space split={<Divider type="vertical" />}>
                    <Text type="secondary">
                      <ClockCircleOutlined /> {formatDistanceToNow(new Date(response.createdAt.toDate()), { addSuffix: true })}
                    </Text>
                    <Text type="secondary">
                      <UserOutlined /> {response.submitterEmail || 'No email'}
                    </Text>
                    <Text type="secondary">
                      {renderDeviceIcon(response.userAgent)} {response.ipAddress || 'Unknown location'}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty 
          description="No responses yet" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
      
      {/* Response Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>Response Details</span>
            {selectedResponse?.isFavorite && (
              <StarFilled style={{ color: '#faad14' }} />
            )}
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={700}
        footer={[
          <Button
            key="print"
            icon={<PrinterOutlined />}
            onClick={() => window.print()}
          >
            Print
          </Button>,
          <PDFDownloadLink
            key="pdf"
            document={<ResponsePDF response={selectedResponse} form={form} />}
            fileName={`response-${selectedResponse?.id}.pdf`}
          >
            {({ loading }) => (
              <Button 
                icon={<DownloadOutlined />} 
                disabled={loading}
              >
                Download PDF
              </Button>
            )}
          </PDFDownloadLink>,
          <Popconfirm
            key="delete"
            title="Delete this response?"
            description="This action cannot be undone."
            onConfirm={() => {
              handleDeleteResponse(selectedResponse.id);
              setDetailModalVisible(false);
            }}
            okText="Yes, delete"
            cancelText="Cancel"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>,
          <Button 
            key="close" 
            type="primary" 
            onClick={() => setDetailModalVisible(false)}
          >
            Close
          </Button>
        ]}
      >
        {selectedResponse && (
          <div className={styles.responseDetail}>
            <div className={styles.responseMetadata}>
              <Space direction="vertical">
                <Text>
                  <UserOutlined /> Submitted by: {selectedResponse.submitterName || 'Anonymous'} 
                  {selectedResponse.submitterEmail && ` (${selectedResponse.submitterEmail})`}
                </Text>
                <Text>
                  <ClockCircleOutlined /> Submitted: {format(new Date(selectedResponse.createdAt.toDate()), 'PPpp')}
                </Text>
                {selectedResponse.ipAddress && (
                  <Text>
                    <GlobalOutlined /> IP Address: {selectedResponse.ipAddress}
                  </Text>
                )}
              </Space>
            </div>
            
            <Divider />
            
            <List
              dataSource={form?.fields || []}
              renderItem={field => {
                const value = selectedResponse.data?.[field.id];
                
                return (
                  <List.Item className={styles.fieldItem}>
                    <div className={styles.fieldLabel}>
                      <Text strong>{field.label}</Text>
                      {field.required && <Tag color="red">Required</Tag>}
                    </div>
                    <div className={styles.fieldValue}>
                      {value ? (
                        field.type === 'file' ? (
                          <Button 
                            icon={<DownloadOutlined />}
                            onClick={() => {/* Handle file download */}}
                          >
                            Download {field.label}
                          </Button>
                        ) : (
                          <Text>{value}</Text>
                        )
                      ) : (
                        <Text type="secondary">No response</Text>
                      )}
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
        )}
      </Modal>
    </Card>
  );
} 