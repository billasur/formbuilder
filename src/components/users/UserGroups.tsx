'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Typography, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  message, 
  Popconfirm, 
  Tag,
  Empty,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  TeamOutlined, 
  UserAddOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { 
  createGroup, 
  getUserGroups, 
  updateGroup, 
  deleteGroup,
  addMemberToGroup
} from '../../firebase/groupService';
import { searchUsers } from '../../firebase/userService';
import styles from './UserGroups.module.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface Group {
  id: string;
  name: string;
  members: string[];
  memberDetails?: any[];
}

export default function UserGroups() {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Load user groups
  useEffect(() => {
    const loadGroups = async () => {
      if (!currentUser) return;
      
      try {
        const groups = await getUserGroups(currentUser.uid);
        setGroups(groups);
      } catch (error) {
        console.error('Error loading user groups:', error);
        message.error('Failed to load user groups');
      } finally {
        setLoading(false);
      }
    };
    
    loadGroups();
  }, [currentUser]);
  
  // Handle search
  const handleSearch = async (value) => {
    if (!value) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const results = await searchUsers(value);
      
      // Filter out current user
      const filteredResults = results.filter(user => 
        user.id !== currentUser?.uid
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Create or update group
  const handleSubmit = async (values) => {
    try {
      if (selectedGroup) {
        // Update existing group
        await updateGroup(selectedGroup.id, {
          ...values,
          ownerId: currentUser.uid,
        });
        
        message.success('Group updated successfully');
        
        // Update local state
        setGroups(groups.map(group => 
          group.id === selectedGroup.id 
            ? { ...group, ...values } 
            : group
        ));
      } else {
        // Create new group
        const newGroup = await createGroup({
          ...values,
          ownerId: currentUser.uid,
          createdAt: new Date(),
          members: []
        });
        
        message.success('Group created successfully');
        
        // Update local state
        setGroups([...groups, newGroup]);
      }
      
      // Close modal and reset form
      setModalVisible(false);
      form.resetFields();
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error saving group:', error);
      message.error('Failed to save group');
    }
  };
  
  // Delete group
  const handleDelete = async (groupId) => {
    try {
      await deleteGroup(groupId);
      
      message.success('Group deleted successfully');
      
      // Update local state
      setGroups(groups.filter(group => group.id !== groupId));
    } catch (error) {
      console.error('Error deleting group:', error);
      message.error('Failed to delete group');
    }
  };
  
  // Add user to group
  const handleAddUser = async (groupId, userId) => {
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;
      
      const updatedMembers = [...(group.members || [])];
      
      // Check if user is already in the group
      if (updatedMembers.includes(userId)) {
        message.info('User is already in this group');
        return;
      }
      
      updatedMembers.push(userId);
      
      await addMemberToGroup(groupId, userId);
      
      message.success('User added to group');
      
      // Update local state
      setGroups(groups.map(group => 
        group.id === groupId 
          ? { ...group, members: updatedMembers } 
          : group
      ));
    } catch (error) {
      console.error('Error adding user to group:', error);
      message.error('Failed to add user to group');
    }
  };
  
  // Remove user from group
  const handleRemoveUser = async (groupId, userId) => {
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;
      
      const updatedMembers = (group.members || []).filter(id => id !== userId);
      
      await addMemberToGroup(groupId, userId, false);
      
      message.success('User removed from group');
      
      // Update local state
      setGroups(groups.map(group => 
        group.id === groupId 
          ? { ...group, members: updatedMembers } 
          : group
      ));
    } catch (error) {
      console.error('Error removing user from group:', error);
      message.error('Failed to remove user from group');
    }
  };
  
  // Group list columns
  const columns = [
    {
      title: 'Group Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Members',
      dataIndex: 'members',
      key: 'members',
      render: (members = []) => (
        <Tag color="blue">{members.length} users</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedGroup(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button
            icon={<TeamOutlined />}
            onClick={() => {
              setSelectedGroup(record);
              setModalVisible(true);
              // Switch to the members tab in the modal
            }}
          >
            Manage Members
          </Button>
          <Popconfirm
            title="Delete this group?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Add null checks for currentUser
  const userId = currentUser?.uid || '';

  return (
    <div className={styles.userGroupsContainer}>
      <Card className={styles.userGroupsCard}>
        <div className={styles.cardHeader}>
          <Title level={3}>User Groups</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedGroup(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Create Group
          </Button>
        </div>
        
        <Table
          dataSource={groups}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <Empty 
                description="No user groups found" 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
              />
            )
          }}
        />
      </Card>
      
      <Modal
        title={selectedGroup ? `Edit Group: ${selectedGroup.name}` : 'Create User Group'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedGroup(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Group Name"
            rules={[{ required: true, message: 'Please enter a group name' }]}
          >
            <Input placeholder="Enter group name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              placeholder="Enter group description" 
              rows={3}
            />
          </Form.Item>
          
          {selectedGroup && (
            <>
              <Divider>Group Members</Divider>
              
              <div className={styles.memberSection}>
                <Select
                  showSearch
                  placeholder="Search users to add"
                  value={searchValue}
                  onChange={setSearchValue}
                  onSearch={handleSearch}
                  loading={searchLoading}
                  filterOption={false}
                  notFoundContent={null}
                  style={{ width: '100%' }}
                  suffixIcon={<SearchOutlined />}
                >
                  {searchResults.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.displayName || user.email}
                    </Option>
                  ))}
                </Select>
                
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => {
                    if (searchValue) {
                      handleAddUser(selectedGroup.id, searchValue);
                      setSearchValue('');
                    }
                  }}
                  disabled={!searchValue}
                >
                  Add User
                </Button>
              </div>
              
              {selectedGroup.memberDetails && selectedGroup.memberDetails.length > 0 ? (
                <Table
                  dataSource={selectedGroup.memberDetails}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: 'User',
                      dataIndex: 'displayName',
                      key: 'displayName',
                      render: (text, record) => text || record.email,
                    },
                    {
                      title: 'Email',
                      dataIndex: 'email',
                      key: 'email',
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, record) => (
                        <Button
                          danger
                          onClick={() => handleRemoveUser(selectedGroup.id, record.id)}
                        >
                          Remove
                        </Button>
                      ),
                    },
                  ]}
                />
              ) : (
                <Empty 
                  description="No members in this group" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </>
          )}
          
          <Form.Item className={styles.formActions}>
            <Space>
              <Button type="primary" htmlType="submit">
                {selectedGroup ? 'Update Group' : 'Create Group'}
              </Button>
              <Button 
                onClick={() => {
                  setModalVisible(false);
                  setSelectedGroup(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 