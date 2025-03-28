'use client'

import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  List, 
  Space, 
  Tag, 
  Divider,
  Empty
} from 'antd';
import { 
  FormOutlined, 
  FileTextOutlined, 
  RocketOutlined, 
  UserOutlined,
  RobotOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase/config';
import { getAllUserForms } from '../firebase/formService';
import { getAllFormResponses } from '../firebase/responseService';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const { Title, Paragraph } = Typography;

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalForms: 0,
    publishedForms: 0,
    totalResponses: 0,
    aiGeneratedForms: 0,
  });
  const [recentForms, setRecentForms] = useState([]);
  const [aiGeneratedForms, setAiGeneratedForms] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!auth.currentUser) {
          setLoading(false);
          return;
        }

        // Fetch all forms created by the user
        const forms = await getAllUserForms(auth.currentUser.uid);
        
        // Calculate stats
        const published = forms.filter(form => form.isPublished).length;
        const aiGenerated = forms.filter(form => form.isAIGenerated).length;
        
        // Get all form responses
        let totalResponses = 0;
        for (const form of forms) {
          const responses = await getAllFormResponses(form.id);
          totalResponses += responses.length;
        }
        
        setStats({
          totalForms: forms.length,
          publishedForms: published,
          totalResponses: totalResponses,
          aiGeneratedForms: aiGenerated
        });
        
        // Sort forms by creation date (newest first)
        const sortedForms = [...forms].sort((a, b) => {
          return b.createdAt?.toDate?.() - a.createdAt?.toDate?.() || 0;
        });
        
        // Set recent forms (up to 6)
        setRecentForms(sortedForms.slice(0, 6));
        
        // Set AI generated forms
        const aiForms = sortedForms.filter(form => form.isAIGenerated);
        setAiGeneratedForms(aiForms.slice(0, 6));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  if (loading) {
    return <LoadingSpinner fullScreen={true} />;
  }
  
  if (!auth.currentUser) {
    return (
      <div className="home-page">
        <Card className="welcome-card">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title level={2}>Welcome to FormBuilder</Title>
            <Paragraph>
              Create, manage, and share forms easily. Sign in to get started.
            </Paragraph>
            <Space>
              <Button 
                type="primary" 
                size="large"
                onClick={() => router.push('/auth/signin')}
              >
                Sign In
              </Button>
              <Button 
                size="large"
                onClick={() => router.push('/auth/signup')}
              >
                Sign Up
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="home-page">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Forms" 
              value={stats.totalForms} 
              prefix={<FormOutlined />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Published Forms" 
              value={stats.publishedForms} 
              prefix={<RocketOutlined />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Responses" 
              value={stats.totalResponses} 
              prefix={<FileTextOutlined />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="AI Generated" 
              value={stats.aiGeneratedForms} 
              prefix={<RobotOutlined />} 
            />
          </Card>
        </Col>
      </Row>
      
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>
            <FormOutlined style={{ marginRight: 8 }} />
            Recent Forms
          </Title>
          <Button 
            type="link" 
            onClick={() => router.push('/dashboard/forms')}
          >
            View All Forms
          </Button>
        </div>
        
        {recentForms.length > 0 ? (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
            dataSource={recentForms}
            renderItem={(form) => (
              <List.Item>
                <Card
                  hoverable
                  onClick={() => router.push(`/form/builder/${form.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    {form.isAIGenerated ? <RobotOutlined style={{ marginRight: 8, color: '#1890ff' }} /> : <FormOutlined style={{ marginRight: 8 }} />}
                    <Typography.Text strong ellipsis style={{ flex: 1 }}>
                      {form.name}
                    </Typography.Text>
                  </div>
                  <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                    {form.description || 'No description'}
                  </Typography.Paragraph>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={form.isPublished ? 'green' : 'orange'}>
                      {form.isPublished ? 'Published' : 'Draft'}
                    </Tag>
                    <Button size="small" type="link" icon={<ArrowRightOutlined />}>
                      Edit
                    </Button>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No forms created yet" />
        )}
      </div>

      {aiGeneratedForms.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>
              <RobotOutlined style={{ marginRight: 8 }} />
              AI Generated Forms
            </Title>
            <Button 
              type="link" 
              onClick={() => router.push('/form/ai')}
            >
              Create AI Form
            </Button>
          </div>
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
            dataSource={aiGeneratedForms}
            renderItem={(form) => (
              <List.Item>
                <Card
                  hoverable
                  onClick={() => router.push(`/form/builder/${form.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <RobotOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <Typography.Text strong ellipsis style={{ flex: 1 }}>
                      {form.name}
                    </Typography.Text>
                  </div>
                  <Typography.Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                    {form.description || 'No description'}
                  </Typography.Paragraph>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={form.isPublished ? 'green' : 'orange'}>
                      {form.isPublished ? 'Published' : 'Draft'}
                    </Tag>
                    <Button size="small" type="link" icon={<ArrowRightOutlined />}>
                      Edit
                    </Button>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
} 