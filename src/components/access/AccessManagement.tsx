'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  List, 
  Button, 
  Input, 
  Space, 
  Tag, 
  Avatar, 
  Modal, 
  Form, 
  Select,
  Table,
  Typography,
  message,
  Popconfirm,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  SearchOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { db, auth } from '../../firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

export default function AccessManagement() {
  const [loading, setLoading] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  
  const [groupForm] = Form.useForm();
  
  // Fetch user groups and users
  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      
      setLoading(true);
      try {
        // Fetch groups created by this user
        const groupsQuery = query(
          collection(db, 'userGroups'),
          where('createdBy', '==', auth.currentUser.uid)
        );
        
        const groupsSnapshot = await getDocs(groupsQuery);
        const groupsData = groupsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUserGroups(groupsData);
        
        // Fetch users
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching access data:', error);
        message.error('Failed to load access data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Create a new user group
  const handleCreateGroup = async (values) => {
    if (!auth.currentUser) {
      message.error('You must be logged in');
      return;
    }
    
    try {
      setLoading(true);
      
      const newGroup = {
        name: values.name,
        description: values.description,
        members: [],
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'userGroups'), newGroup);
      
      // Update local state
      setUserGroups([...userGroups, { id: docRef.id, ...newGroup }]);
      
      setIsGroupModalVisible(false);
      groupForm.resetFields();
      message.success('Group created successfully');
    } catch (error) {
      console.error('Error creating group:', error);
      message.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };
  
  // Add user to group
  const handleAddUserToGroup = async (userId) => {
    if (!selectedGroup) {
      message.error('Please select a group first');
      return;
    }
    
    try {
      setLoading(true);
      
      // Update Firestore
      const groupRef = doc(db, 'userGroups', selectedGroup.id);
      
      await updateDoc(groupRef, {
        members: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUserGroups(userGroups.map(group => {
        if (group.id === selectedGroup.id) {
          return {
            ...group,
            members: [...(group.members || []), userId]
          };
        }
        return group;
      }));
      
      setSelectedGroup({
        ...selectedGroup,
        members: [...(selectedGroup.members || []), userId]
      });
      
      message.success('User added to group');
    } catch (error) {
      console.error('Error adding user to group:', error);
      message.error('Failed to add user to group');
    } finally {
      setLoading(false);
    }
  };
  
  // Remove user from group
  const handleRemoveUserFromGroup = async (userId) => {
    if (!selectedGroup) return;
    
    try {
      setLoading(true);
      
      // Update Firestore
      const groupRef = doc(db, 'userGroups', selectedGroup.id);
      
      await updateDoc(groupRef, {
        members: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUserGroups(userGroups.map(group => {
        if (group.id === selectedGroup.id) {
          return {
            ...group,
            members: (group.members || []).filter(id => id !== userId)
          };
        }
        return group;
      }));
      
      setSelectedGroup({
        ...selectedGroup,
        members: (selectedGroup.members || []).filter(id => id !== userId)
      });
      
      message.success('User removed from group');
    } catch (error) {
      console.error('Error removing user from group:', error);
      message.error('Failed to remove user from group');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a group
  const handleDeleteGroup = async (groupId) => {
    try {
      setLoading(true);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'userGroups', groupId));
      
      // Update local state
      setUserGroups(userGroups.filter(group => group.id !== groupId));
      
      if (selectedGroup && selectedGroup.id === groupId) {
        setSelectedGroup(null);
      }
      
      message.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      message.error('Failed to delete group');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card loading={loading} title="Access Management" bordered={false}>
      <Tabs defaultActiveKey="groups">
        <TabPane 
          tab={<span><TeamOutlined /> User Groups</span>} 
          key="groups"
        >
          <div style={{ display: 'flex', marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4}>Your User Groups</Title>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => setIsGroupModalVisible(true)}
                >
                  Create New Group
                </Button>
              </div>
              <Text type="secondary">
                Create and manage user groups to easily control form access permissions
              </Text>
            </Space>
          </div>
          
          <div style={{ display: 'flex', height: 'calc(100vh - 280px)' }}>
            {/* Left: Group List */}
            <div style={{ width: '30%', marginRight: 16, overflowY: 'auto' }}>
              <List
                dataSource={userGroups}
                renderItem={(group) => (
                  <List.Item
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={selectedGroup?.id === group.id ? 'selected-group' : ''}
                    actions={[
                      <Popconfirm
                        key="delete"
                        title="Are you sure you want to delete this group?"
                        onConfirm={() => handleDeleteGroup(group.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button 
                          icon={<DeleteOutlined />} 
                          type="text" 
                          danger
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<TeamOutlined />} />}
                      title={group.name}
                      description={
                        <>
                          <Text type="secondary">{group.description}</Text>
                          <div>
                            <Tag color="blue">{(group.members?.length || 0)} members</Tag>
                          </div>
                        </>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: 'No groups created yet' }}
              />
            </div>
            
            {/* Right: Selected Group Details */}
            <div style={{ width: '70%', overflowY: 'auto' }}>
              {selectedGroup ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Title level={4}>{selectedGroup.name}</Title>
                      <Text type="secondary">{selectedGroup.description}</Text>
                      
                      <div style={{ marginTop: 8 }}>
                        <Button 
                          type="primary" 
                          icon={<PlusOutlined />} 
                          onClick={() => setIsAddUserModalVisible(true)}
                        >
                          Add Users
                        </Button>
                      </div>
                    </Space>
                  </div>
                  
                  <Divider orientation="left">Group Members</Divider>
                  
                  <List
                    dataSource={
                      selectedGroup.members
                        ? users.filter(user => selectedGroup.members.includes(user.id))
                        : []
                    }
                    renderItem={(user) => (
                      <List.Item
                        key={user.id}
                        actions={[
                          <Button 
                            key="remove" 
                            icon={<DeleteOutlined />} 
                            danger
                            onClick={() => handleRemoveUserFromGroup(user.id)}
                          >
                            Remove
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              src={user.photoURL} 
                              icon={!user.photoURL && <UserOutlined />} 
                            />
                          }
                          title={user.displayName || user.email}
                          description={user.email}
                        />
                      </List.Item>
                    )}
                    locale={{ emptyText: 'No members in this group' }}
                  />
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Text type="secondary">Select a group to view details</Text>
                </div>
              )}
            </div>
          </div>
        </TabPane>
        
        <TabPane 
          tab={<span><UserOutlined /> Individual Access</span>} 
          key="users"
        >
          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={4}>User Access Control</Title>
              <Text type="secondary">
                Manage individual user access to your forms
              </Text>
              
              <Input.Search
                placeholder="Search users by name or email"
                onSearch={value => setSearchText(value)}
                style={{ width: '100%', marginTop: 16 }}
              />
            </Space>
          </div>
          
          <Table
            dataSource={
              searchText
                ? users.filter(user => 
                    user.displayName?.toLowerCase().includes(searchText.toLowerCase()) ||
                    user.email?.toLowerCase().includes(searchText.toLowerCase())
                  )
                : users
            }
            rowKey="id"
            columns={[
              {
                title: 'User',
                dataIndex: 'displayName',
                key: 'displayName',
                render: (text, record) => (
                  <Space>
                    <Avatar src={record.photoURL} icon={!record.photoURL && <UserOutlined />} />
                    <Space direction="vertical" size={0}>
                      <Text strong>{text || record.email}</Text>
                      {text && <Text type="secondary">{record.email}</Text>}
                    </Space>
                  </Space>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => {
                  const hasAccess = record.hasAccessToForms?.includes(auth.currentUser?.uid);
                  
                  return (
                    <Button
                      type={hasAccess ? "default" : "primary"}
                      icon={hasAccess ? <LockOutlined /> : <UnlockOutlined />}
                      onClick={() => handleToggleUserAccess(record.id, !hasAccess)}
                    >
                      {hasAccess ? "Revoke Access" : "Grant Access"}
                    </Button>
                  );
                },
              },
            ]}
          />
        </TabPane>
      </Tabs>
      
      {/* Create Group Modal */}
      <Modal
        title="Create New User Group"
        open={isGroupModalVisible}
        onCancel={() => setIsGroupModalVisible(false)}
        footer={null}
      >
        <Form form={groupForm} layout="vertical" onFinish={handleCreateGroup}>
          <Form.Item
            name="name"
            label="Group Name"
            rules={[{ required: true, message: 'Please enter a group name' }]}
          >
            <Input placeholder="e.g., Marketing Team" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Describe the purpose of this group" rows={3} />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsGroupModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create Group
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Add User to Group Modal */}
      <Modal
        title={`Add Users to ${selectedGroup?.name || 'Group'}`}
        open={isAddUserModalVisible}
        onCancel={() => setIsAddUserModalVisible(false)}
        footer={null}
      >
        <Input.Search
          placeholder="Search users by name or email"
          onSearch={value => {
            const filtered = users.filter(user => 
              (user.displayName?.toLowerCase().includes(value.toLowerCase()) ||
              user.email?.toLowerCase().includes(value.toLowerCase())) &&
              (!selectedGroup?.members || !selectedGroup.members.includes(user.id))
            );
            setSearchResults(filtered);
          }}
          style={{ marginBottom: 16 }}
        />
        
        <List
          dataSource={searchResults}
          renderItem={user => (
            <List.Item
              actions={[
                <Button 
                  key="add" 
                  type="primary" 
                  onClick={() => {
                    handleAddUserToGroup(user.id);
                    setSearchResults(searchResults.filter(u => u.id !== user.id));
                  }}
                >
                  Add
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    src={user.photoURL} 
                    icon={!user.photoURL && <UserOutlined />} 
                  />
                }
                title={user.displayName || user.email}
                description={user.email}
              />
            </List.Item>
          )}
          locale={{ emptyText: 'No matching users found' }}
        />
      </Modal>
    </Card>
  );
} 