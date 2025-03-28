'use client'

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Card, Input, message, Dropdown, Menu, Typography } from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined, 
  EyeOutlined,
  FileDoneOutlined,
  MoreOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { auth } from '../../../firebase/config';
import { getAllUserForms, deleteForm } from '../../../firebase/formService';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

const { Title } = Typography;

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchForms = async () => {
      if (!auth.currentUser) {
        router.push('/auth/signin');
        return;
      }

      try {
        const fetchedForms = await getAllUserForms(auth.currentUser.uid);
        setForms(fetchedForms);
      } catch (error) {
        console.error('Error fetching forms:', error);
        message.error('Failed to load forms');
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [router]);

  const handleCreateForm = () => {
    router.push('/form/builder/new');
  };

  const handleCreateAIForm = () => {
    router.push('/form/ai');
  };

  const handleEditForm = (formId) => {
    router.push(`/form/builder/${formId}`);
  };

  const handleViewForm = (formId) => {
    router.push(`/form/preview/${formId}`);
  };

  const handleViewResponses = (formId) => {
    router.push(`/form/responses/${formId}`);
  };

  const handleDeleteForm = async (formId) => {
    try {
      await deleteForm(formId);
      setForms(forms.filter(form => form.id !== formId));
      message.success('Form deleted successfully');
    } catch (error) {
      console.error('Error deleting form:', error);
      message.error('Failed to delete form');
    }
  };

  const handleDuplicateForm = async (formId) => {
    // Implement form duplication logic
    message.info('Form duplication coming soon');
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {record.isAIGenerated && <RobotOutlined style={{ color: '#1890ff' }} />}
          <a onClick={() => handleEditForm(record.id)}>{text}</a>
        </Space>
      ),
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return record.name.toLowerCase().includes(value.toLowerCase()) ||
               record.description.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : 'Unknown',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.isPublished ? 'green' : 'orange'}>
          {record.isPublished ? 'Published' : 'Draft'}
        </Tag>
      ),
    },
    {
      title: 'Responses',
      dataIndex: 'responsesCount',
      key: 'responsesCount',
      render: (count, record) => (
        <a onClick={() => handleViewResponses(record.id)}>{count || 0}</a>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => handleEditForm(record.id)}
          />
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleViewForm(record.id)}
          />
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item 
                  key="responses" 
                  icon={<FileDoneOutlined />}
                  onClick={() => handleViewResponses(record.id)}
                >
                  View Responses
                </Menu.Item>
                <Menu.Item 
                  key="duplicate" 
                  icon={<CopyOutlined />}
                  onClick={() => handleDuplicateForm(record.id)}
                >
                  Duplicate
                </Menu.Item>
                <Menu.Item 
                  key="delete" 
                  icon={<DeleteOutlined />} 
                  danger
                  onClick={() => handleDeleteForm(record.id)}
                >
                  Delete
                </Menu.Item>
              </Menu>
            }
            trigger={['click']}
          >
            <Button icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner fullScreen={true} />;
  }

  return (
    <div className="forms-page">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4}>Your Forms</Title>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
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
          </Space>
        </div>

        <Input
          placeholder="Search forms..."
          prefix={<SearchOutlined />}
          onChange={e => setSearchText(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={forms}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No forms yet. Create your first form!' }}
        />
      </Card>
    </div>
  );
} 