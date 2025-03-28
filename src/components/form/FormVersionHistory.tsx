'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Timeline, 
  Button, 
  Typography, 
  Space, 
  Modal, 
  Empty, 
  Tag, 
  List,
  message,
  Tooltip,
  Popconfirm,
  Divider
} from 'antd';
import { 
  HistoryOutlined, 
  RollbackOutlined, 
  DiffOutlined, 
  ExclamationCircleOutlined,
  SaveOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getFormVersions, 
  restoreFormVersion, 
  createFormVersion, 
  deleteFormVersion 
} from '../../firebase/formService';
import styles from './FormVersionHistory.module.css';

const { Title, Text, Paragraph } = Typography;

interface FormVersionHistoryProps {
  formId: string;
  currentForm: any;
  onVersionRestore: (restoredForm: any) => void;
}

interface FormVersion {
  id: string;
  formId: string;
  version: number;
  createdAt: Date;
  createdBy: string;
  createdByName?: string;
  notes?: string;
  data: any;
  name?: string;
}

export default function FormVersionHistory({ 
  formId, 
  currentForm, 
  onVersionRestore 
}: FormVersionHistoryProps) {
  const { currentUser } = useAuth();
  const [versions, setVersions] = useState<FormVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [diffModalVisible, setDiffModalVisible] = useState(false);
  const [confirmRestoreVisible, setConfirmRestoreVisible] = useState(false);
  const [changeTypes, setChangeTypes] = useState<string[]>([
    'Added new field',
    'Removed field',
    'Modified field properties',
    'Form settings updated'
  ]);
  
  useEffect(() => {
    const loadVersions = async () => {
      try {
        const formVersions = await getFormVersions(formId);
        setVersions(formVersions);
      } catch (error) {
        console.error('Error loading form versions:', error);
        message.error('Failed to load version history');
      } finally {
        setLoading(false);
      }
    };
    
    loadVersions();
  }, [formId]);
  
  const handleSaveVersion = async () => {
    try {
      setLoading(true);
      const versionName = `Manual save - ${new Date().toLocaleString()}`;
      
      await createFormVersion(formId, currentForm, {
        name: versionName,
        notes: 'Manual snapshot created by user',
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email
      });
      
      message.success('Form version saved successfully');
      
      // Refresh versions
      const formVersions = await getFormVersions(formId);
      setVersions(formVersions);
    } catch (error) {
      console.error('Error saving form version:', error);
      message.error('Failed to save form version');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDiff = (version) => {
    setSelectedVersion(version);
    setDiffModalVisible(true);
  };
  
  const handleRestoreConfirm = (version) => {
    setSelectedVersion(version);
    setConfirmRestoreVisible(true);
  };
  
  const handleRestore = async () => {
    try {
      setLoading(true);
      
      // First save current state as a version
      await createFormVersion(formId, currentForm, {
        name: `Auto-save before restore - ${new Date().toLocaleString()}`,
        notes: 'Automatic snapshot created before version restore',
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email
      });
      
      // Then restore the selected version
      const restoredForm = await restoreFormVersion(formId, selectedVersion.id);
      
      // Call the onVersionRestore callback with the restored form
      onVersionRestore(restoredForm);
      
      message.success('Form version restored successfully');
      setConfirmRestoreVisible(false);
      
      // Refresh versions
      const formVersions = await getFormVersions(formId);
      setVersions(formVersions);
    } catch (error) {
      console.error('Error restoring form version:', error);
      message.error('Failed to restore form version');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteVersion = async (versionId) => {
    try {
      setLoading(true);
      
      await deleteFormVersion(formId, versionId);
      
      message.success('Form version deleted successfully');
      
      // Refresh versions
      const formVersions = await getFormVersions(formId);
      setVersions(formVersions);
    } catch (error) {
      console.error('Error deleting form version:', error);
      message.error('Failed to delete form version');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to get changes description
  const getChangeDescription = (version) => {
    const changes = [];
    
    if (version.changes) {
      if (version.changes.fieldsAdded > 0) {
        changes.push(`${version.changes.fieldsAdded} field(s) added`);
      }
      if (version.changes.fieldsRemoved > 0) {
        changes.push(`${version.changes.fieldsRemoved} field(s) removed`);
      }
      if (version.changes.fieldsModified > 0) {
        changes.push(`${version.changes.fieldsModified} field(s) modified`);
      }
      if (version.changes.settingsChanged) {
        changes.push('Form settings updated');
      }
    }
    
    return changes.length > 0 
      ? changes.join(', ') 
      : 'No detailed change information available';
  };
  
  const renderDiffContent = () => {
    if (!selectedVersion || !selectedVersion.data) {
      return <Empty description="Version data not available" />;
    }
    
    const versionData = selectedVersion.data;
    
    return (
      <div className={styles.diffContent}>
        <Paragraph>
          <Text strong>Name:</Text> {versionData.name}
        </Paragraph>
        
        <Paragraph>
          <Text strong>Description:</Text> {versionData.description || 'No description'}
        </Paragraph>
        
        <div className={styles.fieldsDiff}>
          <Title level={5}>Fields ({versionData.fields?.length || 0})</Title>
          {versionData.fields && versionData.fields.length > 0 ? (
            <List
              size="small"
              bordered
              dataSource={versionData.fields}
              renderItem={(field: any) => (
                <List.Item>
                  <Space>
                    <Tag color="blue">{field.type}</Tag>
                    <Text>{field.label}</Text>
                    {field.required && <Tag color="red">Required</Tag>}
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No fields" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
        
        <div className={styles.settingsDiff}>
          <Title level={5}>Settings</Title>
          {versionData.settings ? (
            <List
              size="small"
              bordered
              dataSource={Object.entries(versionData.settings).map(([key, value]) => ({
                key,
                value
              }))}
              renderItem={(item: any) => (
                <List.Item>
                  <Text strong>{item.key}: </Text>
                  <Text>{JSON.stringify(item.value)}</Text>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No settings" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      </div>
    );
  };
  
  return (
    <Card className={styles.versionHistoryCard}>
      <div className={styles.cardHeader}>
        <Title level={4}>
          <HistoryOutlined /> Version History
        </Title>
        
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSaveVersion}
          loading={loading}
        >
          Save Current Version
        </Button>
      </div>
      
      {versions.length === 0 ? (
        <Empty 
          description="No version history yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Timeline className={styles.timeline}>
          {versions.map((version) => (
            <Timeline.Item 
              key={version.id}
              dot={<ClockCircleOutlined className={styles.timelineDot} />}
            >
              <div className={styles.versionItem}>
                <div className={styles.versionInfo}>
                  <Text strong>{version.name || 'Untitled Form'}</Text>
                  <div className={styles.versionMeta}>
                    <Tag color="blue">
                      {formatDistanceToNow(typeof version.createdAt === 'object' && 'toDate' in version.createdAt 
                        ? version.createdAt.toDate() 
                        : new Date(version.createdAt), { addSuffix: true })}
                    </Tag>
                    <Text type="secondary">
                      By {version.createdByName || version.createdBy || 'Unknown user'}
                    </Text>
                  </div>
                  {version.notes && (
                    <Paragraph className={styles.versionNotes}>
                      <InfoCircleOutlined /> {version.notes}
                    </Paragraph>
                  )}
                </div>
                
                <div className={styles.versionActions}>
                  <Space>
                    <Tooltip title="View Changes">
                      <Button 
                        icon={<DiffOutlined />} 
                        onClick={() => handleViewDiff(version)}
                      />
                    </Tooltip>
                    
                    <Tooltip title="Restore This Version">
                      <Button 
                        icon={<RollbackOutlined />} 
                        onClick={() => handleRestoreConfirm(version)}
                      />
                    </Tooltip>
                    
                    <Popconfirm
                      title="Delete Version"
                      description="Are you sure you want to delete this version?"
                      onConfirm={() => handleDeleteVersion(version.id)}
                      okText="Yes, Delete"
                      cancelText="Cancel"
                    >
                      <Button 
                        icon={<DeleteOutlined />} 
                        danger
                      />
                    </Popconfirm>
                  </Space>
                </div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      )}
      
      <Modal
        title="Form Differences"
        open={diffModalVisible}
        onCancel={() => setDiffModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedVersion && (
          <div className={styles.diffContainer}>
            <Paragraph>
              Comparing current form with version from{' '}
              <Text strong>
                {formatDistanceToNow(typeof selectedVersion.createdAt === 'object' && 'toDate' in selectedVersion.createdAt 
                  ? selectedVersion.createdAt.toDate() 
                  : new Date(selectedVersion.createdAt), { addSuffix: true })}
              </Text>
            </Paragraph>
            
            <div className={styles.diffSections}>
              <div className={styles.diffSection}>
                <Title level={5}>Basic Information</Title>
                <List>
                  <List.Item>
                    <Text strong>Form Name: </Text>
                    <div className={styles.diffValue}>
                      <Text delete={currentForm.name !== selectedVersion.data.name}>
                        {currentForm.name || 'Untitled Form'}
                      </Text>
                      {currentForm.name !== selectedVersion.data.name && (
                        <>
                          <Text> → </Text>
                          <Text>{selectedVersion.data.name || 'Untitled Form'}</Text>
                        </>
                      )}
                    </div>
                  </List.Item>
                  <List.Item>
                    <Text strong>Description: </Text>
                    <div className={styles.diffValue}>
                      <Text delete={currentForm.description !== selectedVersion.data.description}>
                        {currentForm.description || 'No description'}
                      </Text>
                      {currentForm.description !== selectedVersion.data.description && (
                        <>
                          <Text> → </Text>
                          <Text>{selectedVersion.data.description || 'No description'}</Text>
                        </>
                      )}
                    </div>
                  </List.Item>
                </List>
              </div>
              
              <Divider />
              
              <div className={styles.diffSection}>
                <Title level={5}>Fields</Title>
                <List>
                  {currentForm.fields?.map((field, index) => {
                    const oldField = selectedVersion.data.fields?.find(f => f.id === field.id);
                    const hasChanges = !oldField || JSON.stringify(field) !== JSON.stringify(oldField);
                    
                    return (
                      <List.Item key={field.id} className={hasChanges ? styles.changedField : ''}>
                        <div className={styles.fieldDiff}>
                          <div>
                            <Text strong>Field {index + 1}: {field.label}</Text>
                            {!oldField && <Tag color="green">New</Tag>}
                            {oldField && hasChanges && <Tag color="orange">Modified</Tag>}
                          </div>
                          
                          {oldField && hasChanges && (
                            <div className={styles.fieldChanges}>
                              <Text type="secondary">Changes in this field:</Text>
                              <ul className={styles.changesList}>
                                {field.label !== oldField.label && (
                                  <li>
                                    <Text>Label: </Text>
                                    <Text delete>{oldField.label}</Text>
                                    <Text> → </Text>
                                    <Text>{field.label}</Text>
                                  </li>
                                )}
                                {field.type !== oldField.type && (
                                  <li>
                                    <Text>Type: </Text>
                                    <Text delete>{oldField.type}</Text>
                                    <Text> → </Text>
                                    <Text>{field.type}</Text>
                                  </li>
                                )}
                                {field.required !== oldField.required && (
                                  <li>
                                    <Text>Required: </Text>
                                    <Text delete>{oldField.required ? 'Yes' : 'No'}</Text>
                                    <Text> → </Text>
                                    <Text>{field.required ? 'Yes' : 'No'}</Text>
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </List.Item>
                    );
                  })}
                  
                  {/* Show deleted fields */}
                  {selectedVersion.data.fields?.filter(
                    oldField => !currentForm.fields?.some(f => f.id === oldField.id)
                  ).map((deletedField) => (
                    <List.Item key={deletedField.id} className={styles.deletedField}>
                      <div className={styles.fieldDiff}>
                        <div>
                          <Text delete strong>
                            {deletedField.label}
                          </Text>
                          <Tag color="red">Deleted</Tag>
                        </div>
                      </div>
                    </List.Item>
                  ))}
                </List>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      <Modal
        title="Restore Form Version"
        open={confirmRestoreVisible}
        onCancel={() => setConfirmRestoreVisible(false)}
        onOk={handleRestore}
        confirmLoading={loading}
        okText="Yes, Restore"
        okButtonProps={{ danger: true }}
      >
        <div className={styles.restoreConfirm}>
          <ExclamationCircleOutlined className={styles.warningIcon} />
          <Paragraph>
            Are you sure you want to restore this version? This will replace your current form with the selected version.
          </Paragraph>
          <Paragraph>
            <Text strong>Note:</Text> Your current form will be automatically saved as a version before restoring.
          </Paragraph>
        </div>
      </Modal>
    </Card>
  );
} 