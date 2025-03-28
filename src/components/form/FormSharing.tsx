'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Input, 
  Button, 
  Divider, 
  Tabs, 
  List, 
  Avatar, 
  Tag, 
  message, 
  Switch, 
  Tooltip, 
  Modal, 
  Popconfirm 
} from 'antd';
import { 
  ShareAltOutlined, 
  CopyOutlined, 
  QrcodeOutlined, 
  FacebookOutlined, 
  TwitterOutlined, 
  MailOutlined, 
  LinkOutlined, 
  UserOutlined, 
  TeamOutlined, 
  GlobalOutlined, 
  LockOutlined, 
  DeleteOutlined, 
  EyeOutlined
} from '@ant-design/icons';
import { QRCodeCanvas } from 'qrcode.react';
import { getFormCollaborators, addCollaborator, removeCollaborator, updateFormPermissions } from '../../firebase/sharingService';
import { getUsersByEmail as searchUsers } from '../../firebase/userService';
import { getUserGroups } from '../../firebase/groupService';
import { useAuth } from '../../contexts/AuthContext';
import styles from './FormSharing.module.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

interface FormSharingProps {
  formId: string;
  formName: string;
  permissions?: {
    isPublic: boolean;
    requiresLogin: boolean;
    allowEmbedding: boolean;
    allowTemplating: boolean;
    allowComments: boolean;
  };
  onPermissionsChange?: (permissions: any) => void;
}

export default function FormSharing({ 
  formId, 
  formName,
  permissions = {
    isPublic: false,
    requiresLogin: true,
    allowEmbedding: false,
    allowTemplating: false,
    allowComments: false
  },
  onPermissionsChange
}: FormSharingProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('share');
  const [publicUrl, setPublicUrl] = useState('');
  const [embedCode, setEmbedCode] = useState('');
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [localPermissions, setLocalPermissions] = useState(permissions);
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  
  // Generate shareable link and embed code
  useEffect(() => {
    const baseUrl = window.location.origin;
    const formUrl = `${baseUrl}/form/view/${formId}`;
    setPublicUrl(formUrl);
    
    const embedHtml = `<iframe src="${formUrl}?embed=true" width="100%" height="600" frameborder="0" marginheight="0" marginwidth="0">Loading...</iframe>`;
    setEmbedCode(embedHtml);
  }, [formId]);
  
  // Load collaborators
  useEffect(() => {
    const loadCollaborators = async () => {
      try {
        const result = await getFormCollaborators(formId);
        setCollaborators(result);
      } catch (error) {
        console.error('Error loading collaborators:', error);
        message.error('Failed to load collaborators');
      }
    };
    
    if (formId) {
      loadCollaborators();
    }
  }, [formId]);
  
  // Load user groups
  useEffect(() => {
    const loadGroups = async () => {
      if (!currentUser) return;
      
      setLoadingGroups(true);
      try {
        const groups = await getUserGroups(currentUser.uid);
        setUserGroups(groups);
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setLoadingGroups(false);
      }
    };
    
    loadGroups();
  }, [currentUser]);
  
  // Handle search for users
  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await searchUsers(value);
      
      // Filter out current user and existing collaborators
      const filteredResults = results.filter(user => 
        user.id !== currentUser?.uid && 
        !collaborators.some(collab => collab.userId === user.id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      message.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };
  
  // Add a collaborator
  const handleAddCollaborator = async (userId: string, role: string = 'viewer') => {
    try {
      await addCollaborator(formId, userId, role);
      
      // Find user details from search results
      const user = searchResults.find(u => u.id === userId);
      if (user) {
        const newCollaborator = {
          userId: user.id,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          role
        };
        
        setCollaborators([...collaborators, newCollaborator]);
        
        // Remove from search results
        setSearchResults(searchResults.filter(u => u.id !== userId));
        
        message.success('Collaborator added successfully');
      }
    } catch (error) {
      console.error('Error adding collaborator:', error);
      message.error('Failed to add collaborator');
    }
  };
  
  // Remove a collaborator
  const handleRemoveCollaborator = async (userId: string) => {
    try {
      await removeCollaborator(formId, userId);
      
      // Update local state
      setCollaborators(collaborators.filter(c => c.userId !== userId));
      
      message.success('Collaborator removed successfully');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      message.error('Failed to remove collaborator');
    }
  };
  
  // Share with a group
  const handleShareWithGroup = async (groupId: string) => {
    try {
      const group = userGroups.find(g => g.id === groupId);
      if (!group || !group.members || group.members.length === 0) {
        message.info('This group has no members to share with.');
        return;
      }
      
      // Add all group members as collaborators
      const promises = group.members.map(async (member: any) => {
        // Skip if already a collaborator
        if (collaborators.some(c => c.userId === member.id)) {
          return null;
        }
        
        return addCollaborator(formId, member.id, 'viewer');
      });
      
      await Promise.all(promises);
      
      // Reload collaborators
      const updatedCollaborators = await getFormCollaborators(formId);
      setCollaborators(updatedCollaborators);
      
      message.success(`Form shared with ${group.name} group members`);
    } catch (error) {
      console.error('Error sharing with group:', error);
      message.error('Failed to share with group');
    }
  };
  
  // Update form permissions
  const handlePermissionChange = (key: string, value: boolean) => {
    const updatedPermissions = { ...localPermissions, [key]: value };
    setLocalPermissions(updatedPermissions);
    
    if (onPermissionsChange) {
      onPermissionsChange(updatedPermissions);
    }
    
    // Update form permissions in database
    try {
      updateFormPermissions(formId, {
        accessType: updatedPermissions.isPublic ? 'public' : 'private',
        requiresLogin: updatedPermissions.requiresLogin,
        allowEmbedding: updatedPermissions.allowEmbedding,
        allowTemplating: updatedPermissions.allowTemplating,
        allowComments: updatedPermissions.allowComments
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
      message.error('Failed to update permissions');
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text)
      .then(() => message.success(successMessage))
      .catch(() => message.error('Failed to copy'));
  };
  
  return (
    <Card className={styles.sharingCard}>
      <Title level={4}>
        <ShareAltOutlined /> Share {formName}
      </Title>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><LinkOutlined /> Share Link</span>} key="share">
          <div className={styles.section}>
            <Space direction="vertical" className={styles.fullWidth}>
              <div>
                <Text strong>Anyone with the link can view this form:</Text>
                <div className={styles.urlContainer}>
                  <Input 
                    value={publicUrl} 
                    readOnly
                    addonAfter={
                      <Button 
                        type="text" 
                        icon={<CopyOutlined />} 
                        onClick={() => copyToClipboard(publicUrl, 'URL copied to clipboard!')}
                      />
                    }
                  />
                </div>
              </div>
              
              <Space>
                <Button 
                  icon={<QrcodeOutlined />} 
                  onClick={() => setIsQrModalVisible(true)}
                >
                  Generate QR Code
                </Button>
                
                <Button 
                  icon={<MailOutlined />} 
                  onClick={() => window.open(`mailto:?subject=${encodeURIComponent(`Form: ${formName}`)}&body=${encodeURIComponent(`Check out this form: ${publicUrl}`)}`, '_blank')}
                >
                  Email Link
                </Button>
                
                <Button 
                  icon={<FacebookOutlined />} 
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`, '_blank')}
                >
                  Share on Facebook
                </Button>
                
                <Button 
                  icon={<TwitterOutlined />} 
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(`Check out this form: ${formName}`)}`, '_blank')}
                >
                  Share on Twitter
                </Button>
              </Space>
              
              {localPermissions.allowEmbedding && (
                <div>
                  <Divider />
                  <Text strong>Embed this form on your website:</Text>
                  <div className={styles.embedContainer}>
                    <Input.TextArea 
                      value={embedCode} 
                      rows={3} 
                      readOnly
                    />
                    <Button 
                      icon={<CopyOutlined />} 
                      onClick={() => copyToClipboard(embedCode, 'Embed code copied to clipboard!')}
                    >
                      Copy Code
                    </Button>
                  </div>
                </div>
              )}
            </Space>
          </div>
        </TabPane>
        
        <TabPane tab={<span><GlobalOutlined /> Permissions</span>} key="permissions">
          <div className={styles.permissionsSection}>
            <Space direction="vertical" className={styles.fullWidth}>
              <div className={styles.permissionItem}>
                <div>
                  <Text strong>Make form public</Text>
                  <div>
                    <Text type="secondary">Anyone can view this form without a link</Text>
                  </div>
                </div>
                <Switch 
                  checked={localPermissions.isPublic} 
                  onChange={value => handlePermissionChange('isPublic', value)}
                />
              </div>
              
              <div className={styles.permissionItem}>
                <div>
                  <Text strong>Require login</Text>
                  <div>
                    <Text type="secondary">Users must be logged in to view or submit this form</Text>
                  </div>
                </div>
                <Switch 
                  checked={localPermissions.requiresLogin} 
                  onChange={value => handlePermissionChange('requiresLogin', value)}
                />
              </div>
              
              <div className={styles.permissionItem}>
                <div>
                  <Text strong>Allow embedding</Text>
                  <div>
                    <Text type="secondary">This form can be embedded on other websites</Text>
                  </div>
                </div>
                <Switch 
                  checked={localPermissions.allowEmbedding} 
                  onChange={value => handlePermissionChange('allowEmbedding', value)}
                />
              </div>
              
              <div className={styles.permissionItem}>
                <div>
                  <Text strong>Allow templating</Text>
                  <div>
                    <Text type="secondary">Others can use this form as a template</Text>
                  </div>
                </div>
                <Switch 
                  checked={localPermissions.allowTemplating} 
                  onChange={value => handlePermissionChange('allowTemplating', value)}
                />
              </div>
              
              <div className={styles.permissionItem}>
                <div>
                  <Text strong>Allow comments</Text>
                  <div>
                    <Text type="secondary">Collaborators can add comments to this form</Text>
                  </div>
                </div>
                <Switch 
                  checked={localPermissions.allowComments} 
                  onChange={value => handlePermissionChange('allowComments', value)}
                />
              </div>
            </Space>
          </div>
        </TabPane>
        
        <TabPane tab={<span><UserOutlined /> Collaborators</span>} key="collaborators">
          <div className={styles.collaboratorsSection}>
            <Search
              placeholder="Search users by name or email"
              loading={searching}
              onSearch={handleSearch}
              className={styles.userSearch}
            />
            
            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                <Text strong>Search Results:</Text>
                <List
                  dataSource={searchResults}
                  renderItem={user => (
                    <List.Item
                      actions={[
                        <Button 
                          key="add" 
                          type="primary" 
                          size="small"
                          onClick={() => handleAddCollaborator(user.id)}
                        >
                          Add
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar src={user.photoURL}>
                            {user.displayName?.[0] || user.email?.[0]}
                          </Avatar>
                        }
                        title={user.displayName || user.email}
                        description={user.email}
                      />
                    </List.Item>
                  )}
                />
                <Divider />
              </div>
            )}
            
            <div className={styles.currentCollaborators}>
              <Text strong>Current Collaborators:</Text>
              
              {collaborators.length > 0 ? (
                <List
                  dataSource={collaborators}
                  renderItem={collaborator => (
                    <List.Item
                      actions={[
                        collaborator.userId !== currentUser?.uid && (
                          <Popconfirm
                            title="Remove this collaborator?"
                            onConfirm={() => handleRemoveCollaborator(collaborator.userId)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button 
                              danger 
                              type="text" 
                              icon={<DeleteOutlined />}
                            />
                          </Popconfirm>
                        )
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar src={collaborator.photoURL}>
                            {collaborator.displayName?.[0] || collaborator.email?.[0]}
                          </Avatar>
                        }
                        title={
                          <Space>
                            {collaborator.displayName || collaborator.email}
                            {collaborator.userId === currentUser?.uid && (
                              <Tag color="green">You</Tag>
                            )}
                          </Space>
                        }
                        description={collaborator.email}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">No collaborators yet. Search users above to add them.</Text>
              )}
            </div>
          </div>
        </TabPane>
        
        <TabPane 
          tab={<span><TeamOutlined /> Groups</span>} 
          key="groups"
        >
          <div className={styles.groupsSection}>
            {userGroups.length > 0 ? (
              <List
                dataSource={userGroups}
                renderItem={group => (
                  <List.Item
                    actions={[
                      <Button
                        key="share"
                        onClick={() => handleShareWithGroup(group.id)}
                      >
                        Share with Group
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<TeamOutlined />} />}
                      title={group.name}
                      description={`${group.members?.length || 0} members`}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">You don't have any groups yet. Create groups in user settings.</Text>
            )}
          </div>
        </TabPane>
      </Tabs>
      
      <Modal
        title="QR Code for Form"
        open={isQrModalVisible}
        onCancel={() => setIsQrModalVisible(false)}
        footer={[
          <Button key="download" onClick={() => {
            const canvas = document.getElementById('form-qr-code') as HTMLCanvasElement;
            if (canvas) {
              const link = document.createElement('a');
              link.download = `${formName.replace(/\s+/g, '_')}_qr.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
            }
          }}>
            Download QR
          </Button>,
          <Button key="close" type="primary" onClick={() => setIsQrModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        <div className={styles.qrCodeContainer}>
          <QRCodeCanvas 
            value={publicUrl} 
            size={200}
          />
          <div className={styles.qrCodeText}>
            <Text strong>{formName}</Text>
            <Text type="secondary">Scan to open form</Text>
          </div>
        </div>
      </Modal>
    </Card>
  );
} 