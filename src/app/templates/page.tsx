'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Spin, 
  message, 
  Tag, 
  Empty,
  Divider,
  Space
} from 'antd';
import { 
  CopyOutlined, 
  EyeOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { getPublicTemplates, createFormFromTemplate } from '../../firebase/templateService';
import { auth } from '../../firebase/config';

const { Title, Paragraph } = Typography;

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingForm, setCreatingForm] = useState(false);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const publicTemplates = await getPublicTemplates();
        setTemplates(publicTemplates);
      } catch (error) {
        console.error('Error fetching templates:', error);
        message.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleCreateFromTemplate = async (templateId) => {
    if (!auth.currentUser) {
      message.error('You must be logged in to create forms');
      router.push('/auth/signin');
      return;
    }

    setCreatingForm(true);

    try {
      const formId = await createFormFromTemplate(
        auth.currentUser.uid,
        templateId
      );
      message.success('Form created from template');
      router.push(`/form/builder/${formId}`);
    } catch (error) {
      console.error('Error creating form from template:', error);
      message.error('Failed to create form from template');
    } finally {
      setCreatingForm(false);
    }
  };

  const handlePreviewTemplate = (templateId) => {
    router.push(`/templates/preview/${templateId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading templates..." />
      </div>
    );
  }

  return (
    <div className="templates-page">
      <Card>
        <Title level={2}>Form Templates</Title>
        <Paragraph>
          Choose from a variety of pre-built templates to quickly create your forms.
          You can customize them after selecting a template.
        </Paragraph>

        <Divider />

        {templates.length === 0 ? (
          <Empty 
            description="No templates found" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        ) : (
          <Row gutter={[16, 16]}>
            {templates.map(template => (
              <Col xs={24} sm={12} md={8} lg={6} key={template.id}>
                <Card
                  hoverable
                  cover={
                    <div className="template-preview">
                      {/* Template preview image or icon would go here */}
                      <div className="template-icon">
                        {template.icon || '📝'}
                      </div>
                    </div>
                  }
                  actions={[
                    <Button 
                      key="preview" 
                      icon={<EyeOutlined />} 
                      onClick={() => handlePreviewTemplate(template.id)}
                    >
                      Preview
                    </Button>,
                    <Button
                      key="use"
                      type="primary"
                      icon={<CopyOutlined />}
                      loading={creatingForm}
                      onClick={() => handleCreateFromTemplate(template.id)}
                    >
                      Use
                    </Button>
                  ]}
                >
                  <Card.Meta 
                    title={template.name}
                    description={
                      <Space direction="vertical">
                        <Paragraph ellipsis={{ rows: 2 }}>
                          {template.description}
                        </Paragraph>
                        <div>
                          {template.tags?.map(tag => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </div>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
} 