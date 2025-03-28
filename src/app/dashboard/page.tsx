'use client'

import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Popconfirm, 
  Tag, 
  message, 
  Empty, 
  Spin,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  Divider,
  List
} from 'antd'
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined,
  EyeOutlined,
  FormOutlined,
  RobotOutlined,
  FileTextOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { getForms, deleteForm, duplicateForm } from '../../firebase/formService'
import { getFormSubmissions } from '../../firebase/formService'
import { auth } from '../../firebase/config'
import { FormModel } from '../../types/form'
import { useRouter } from 'next/navigation'
import { getAllUserForms } from '../../firebase/formService'
import { getAllFormResponses } from '../../firebase/responseService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../../contexts/AuthContext'

const { Title, Text, Paragraph } = Typography

interface FormSummary {
  id: string;
  name: string;
  responseCount: number;
  lastModified: Date;
  status: 'active' | 'draft' | 'archived';
}

export default function Dashboard() {
  const router = useRouter()
  const { currentUser, isAuthenticated } = useAuth()
  const [username, setUsername] = useState('User')
  const [forms, setForms] = useState<FormModel[]>([])
  const [loading, setLoading] = useState(true)
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({})
  const [searchText, setSearchText] = useState('')
  const [recentForms, setRecentForms] = useState<FormModel[]>([])
  const [aiGeneratedForms, setAiGeneratedForms] = useState([])
  const [stats, setStats] = useState({
    totalForms: 0,
    publishedForms: 0,
    totalResponses: 0,
    totalFormViews: 0
  })

  useEffect(() => {
    // Use user details if available
    if (currentUser?.displayName) {
      setUsername(currentUser.displayName)
    } else if (currentUser?.email) {
      // Use the part before @ in email
      setUsername(currentUser.email.split('@')[0])
    }
  }, [currentUser])

  // Fetch user's forms
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!auth.currentUser) {
        router.push('/auth/signin')
        return
      }
      
      try {
        // Get all user forms
        const userForms = await getAllUserForms(auth.currentUser.uid)
        
        // Calculate stats
        const publishedCount = userForms.filter(form => form.isPublished).length
        const aiGenerated = userForms.filter(form => form.description?.includes('Generated') || 
                                              form.description?.includes('AI'))
        
        // Get recent forms (last 5)
        const recent = [...userForms].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)
        
        setRecentForms(recent)
        setAiGeneratedForms(aiGenerated)
        
        // Get total response count
        let responsesCount = 0
        let viewsCount = 0
        
        for (const form of userForms) {
          // Get form responses
          const responses = await getAllFormResponses(form.id)
          responsesCount += responses.length
          
          // Add form views
          viewsCount += form.views || 0
        }
        
        // Update stats
        setStats({
          totalForms: userForms.length,
          publishedForms: publishedCount,
          totalResponses: responsesCount,
          totalFormViews: viewsCount
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [router])

  const handleCreateForm = () => {
    router.push('/form/builder/new')
  }

  const handleCreateAIForm = () => {
    router.push('/form/ai')
  }

  const handleViewForm = (formId) => {
    router.push(`/form/preview/${formId}`)
  }

  const handleEditForm = (formId) => {
    router.push(`/form/builder/${formId}`)
  }

  const handleViewResponses = (formId) => {
    router.push(`/form/responses/${formId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'draft': return 'gold';
      case 'archived': return 'gray';
      default: return 'blue';
    }
  };

  if (loading) return <LoadingSpinner />;

  const formCount = recentForms?.length || 0;

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>Welcome to FormBuilder</Title>
        <Paragraph>
          Create beautiful forms, collect responses, and analyze data with our powerful form builder.
        </Paragraph>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => router.push('/form/create')}
          size="large"
        >
          Create New Form
        </Button>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => router.push('/form/list')}>
            <Statistic 
              title="My Forms" 
              value={stats.totalForms}
              prefix={<FormOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => router.push('/responses')}>
            <Statistic 
              title="Total Responses" 
              value={stats.totalResponses} 
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => router.push('/team')}>
            <Statistic 
              title="Team Members" 
              value={1} 
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Total Forms" 
              value={stats.totalForms} 
              prefix={<FormOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Published Forms" 
              value={stats.publishedForms} 
              prefix={<EyeOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Total Responses" 
              value={stats.totalResponses} 
              prefix={<FileTextOutlined />} 
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic 
              title="Form Views" 
              value={stats.totalFormViews} 
              prefix={<UserOutlined />} 
            />
          </Card>
        </Col>
      </Row>
      
      {/* Quick Actions */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>Quick Actions</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<FormOutlined />}
            onClick={handleCreateForm}
          >
            Create Form
          </Button>
          <Button 
            type="primary" 
            icon={<RobotOutlined />}
            onClick={handleCreateAIForm}
          >
            AI Form
          </Button>
          <Button 
            icon={<FileTextOutlined />}
            onClick={() => router.push('/dashboard/forms')}
          >
            View All Forms
          </Button>
        </Space>
      </Card>
      
      {/* Recent Forms */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>Recent Forms</Title>
          <Button type="link" onClick={() => router.push('/dashboard/forms')}>
            View All
          </Button>
        </div>
        
        {recentForms.length > 0 ? (
          <List
            dataSource={recentForms}
            renderItem={form => (
              <List.Item
                key={form.id}
                actions={[
                  <Button key="view" type="link" onClick={() => handleViewForm(form.id)}>View</Button>,
                  <Button key="edit" type="link" onClick={() => handleEditForm(form.id)}>Edit</Button>,
                  <Button key="responses" type="link" onClick={() => handleViewResponses(form.id)}>Responses</Button>
                ]}
              >
                <List.Item.Meta
                  title={form.name}
                  description={
                    <Space direction="vertical" size={2}>
                      <Space size={8}>
                        <Tag color={getStatusColor(form.isPublished ? 'active' : 'draft')}>
                          {form.isPublished ? 'active' : 'draft'}
                        </Tag>
                        <Text type="secondary">
                          <FileTextOutlined /> {form.responses?.length || 0} responses
                        </Text>
                      </Space>
                      <Text type="secondary">
                        <ClockCircleOutlined /> Last modified: {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : 'N/A'}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No forms created yet" />
        )}
      </Card>
      
      {/* AI Generated Forms */}
      {aiGeneratedForms.length > 0 && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              <RobotOutlined style={{ marginRight: 8 }} />
              AI Generated Forms
            </Title>
            <Button type="link" onClick={handleCreateAIForm}>
              Create New
            </Button>
          </div>
          
          <Table 
            dataSource={aiGeneratedForms}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Form Name',
                dataIndex: 'name',
                key: 'name',
                render: (text, record) => (
                  <a onClick={() => handleViewForm(record.id)}>{text}</a>
                ),
              },
              {
                title: 'Status',
                key: 'status',
                dataIndex: 'isPublished',
                render: (isPublished) => (
                  <Tag color={isPublished ? 'green' : 'orange'}>
                    {isPublished ? 'Published' : 'Draft'}
                  </Tag>
                ),
              },
              {
                title: 'Created',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date) => formatDistanceToNow(date, { addSuffix: true })
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <Space>
                    <Button size="small" icon={<EditOutlined />} onClick={() => handleEditForm(record.id)}>
                      Edit
                    </Button>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewForm(record.id)}>
                      Preview
                    </Button>
                    <Button size="small" icon={<FileTextOutlined />} onClick={() => handleViewResponses(record.id)}>
                      Responses
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  )
} 