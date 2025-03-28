'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Select, 
  Input, 
  List, 
  Divider, 
  Empty,
  Tag,
  Modal,
  Form,
  Switch,
  Collapse
} from 'antd';
import { 
  CodeOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  ThunderboltOutlined,
  ArrowRightOutlined,
  QuestionOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import styles from './FormLogic.module.css';
import { v4 as uuidv4 } from 'uuid';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

interface FormLogicProps {
  formFields: any[];
  formLogic: any[];
  onChange: (updatedLogic: any[]) => void;
}

interface LogicCondition {
  id: string;
  fieldId: string;
  operator: string;
  value: any;
}

interface LogicAction {
  id: string;
  type: string;
  fieldId?: string;
  targetFieldId?: string;
  value?: any;
}

interface LogicRule {
  id: string;
  name: string;
  enabled: boolean;
  conditionType: 'all' | 'any';
  conditions: LogicCondition[];
  actions: LogicAction[];
}

export default function FormLogic({ formFields, formLogic = [], onChange }: FormLogicProps) {
  const [logicRules, setLogicRules] = useState<LogicRule[]>(formLogic);
  const [editingLogic, setEditingLogic] = useState<LogicRule | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Update parent component when logic changes
  useEffect(() => {
    onChange(logicRules);
  }, [logicRules, onChange]);
  
  // Logic condition types
  const conditionTypes = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Not Contains' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'isAnswered', label: 'Is Answered' },
    { value: 'isNotAnswered', label: 'Is Not Answered' }
  ];
  
  // Logic action types
  const actionTypes = [
    { value: 'show', label: 'Show Field' },
    { value: 'hide', label: 'Hide Field' },
    { value: 'require', label: 'Make Required' },
    { value: 'unrequire', label: 'Make Optional' },
    { value: 'setValue', label: 'Set Value' },
    { value: 'jumpTo', label: 'Jump To Field' }
  ];
  
  const handleAddLogic = () => {
    setEditingLogic({
      id: uuidv4(),
      name: 'New Logic Rule',
      enabled: true,
      conditionType: 'all',
      conditions: [],
      actions: []
    });
    setIsModalVisible(true);
  };
  
  const handleEditLogic = (logicItem) => {
    setEditingLogic(logicItem);
    setIsModalVisible(true);
  };
  
  const handleDeleteLogic = (logicId) => {
    setLogicRules(logicRules.filter(item => item.id !== logicId));
  };
  
  const handleSaveLogic = () => {
    if (!editingLogic) return;
    
    if (logicRules.find(item => item.id === editingLogic.id)) {
      // Update existing logic
      setLogicRules(logicRules.map(item => 
        item.id === editingLogic.id ? editingLogic : item
      ));
    } else {
      // Add new logic
      setLogicRules([...logicRules, editingLogic]);
    }
    
    setIsModalVisible(false);
    setEditingLogic(null);
  };
  
  const handleAddCondition = () => {
    setEditingLogic(prevLogic => {
      if (!prevLogic) return prevLogic;
      return {
        ...prevLogic,
        conditions: [
          ...prevLogic.conditions,
          {
            id: uuidv4(),
            fieldId: '',
            operator: 'equals',
            value: ''
          }
        ]
      };
    });
  };
  
  const handleDeleteCondition = (conditionId) => {
    setEditingLogic(prevLogic => {
      if (!prevLogic) return prevLogic;
      return {
        ...prevLogic,
        conditions: prevLogic.conditions.filter(
          condition => condition.id !== conditionId
        )
      };
    });
  };
  
  const handleAddAction = () => {
    setEditingLogic(prevLogic => {
      if (!prevLogic) return prevLogic;
      return {
        ...prevLogic,
        actions: [
          ...prevLogic.actions,
          {
            id: uuidv4(),
            type: 'show',
            targetFieldId: '',
            value: ''
          }
        ]
      };
    });
  };
  
  const handleDeleteAction = (actionId) => {
    setEditingLogic(prevLogic => {
      if (!prevLogic) return prevLogic;
      return {
        ...prevLogic,
        actions: prevLogic.actions.filter(
          action => action.id !== actionId
        )
      };
    });
  };
  
  // Helper to get field by ID
  const getFieldById = (fieldId) => {
    return formFields.find(field => field.id === fieldId);
  };
  
  // Helper to render logic summary
  const renderLogicSummary = (logicItem) => {
    const conditions = logicItem.conditions.map(condition => {
      const field = getFieldById(condition.fieldId);
      const fieldName = field ? field.label : 'Unknown field';
      
      if (condition.operator === 'isAnswered') {
        return `${fieldName} is answered`;
      } else if (condition.operator === 'isNotAnswered') {
        return `${fieldName} is not answered`;
      } else {
        return `${fieldName} ${condition.operator} ${condition.value}`;
      }
    }).join(logicItem.conditionType === 'all' ? ' AND ' : ' OR ');
    
    const actions = logicItem.actions.map(action => {
      const targetField = getFieldById(action.targetFieldId);
      const targetFieldName = targetField ? targetField.label : 'Unknown field';
      
      switch (action.type) {
        case 'show': return `Show ${targetFieldName}`;
        case 'hide': return `Hide ${targetFieldName}`;
        case 'require': return `Make ${targetFieldName} required`;
        case 'unrequire': return `Make ${targetFieldName} optional`;
        case 'setValue': return `Set ${targetFieldName} to "${action.value}"`;
        case 'jumpTo': return `Jump to ${targetFieldName}`;
        default: return 'Unknown action';
      }
    }).join(', ');
    
    return (
      <div>
        <div className={styles.logicConditions}>
          <Text strong>IF: </Text>
          <Text>{conditions}</Text>
        </div>
        <div className={styles.logicActions}>
          <Text strong>THEN: </Text>
          <Text>{actions}</Text>
        </div>
      </div>
    );
  };

  return (
    <Card
      title={<Space><CodeOutlined /> Form Logic</Space>}
      className={styles.logicCard}
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddLogic}
        >
          Add Logic Rule
        </Button>
      }
    >
      {logicRules.length > 0 ? (
        <List
          className={styles.logicList}
          dataSource={logicRules}
          renderItem={item => (
            <List.Item
              key={item.id}
              actions={[
                <Button 
                  icon={<EyeOutlined />} 
                  type="text"
                  onClick={() => handleEditLogic(item)}
                >
                  Edit
                </Button>,
                <Button 
                  icon={<DeleteOutlined />} 
                  type="text" 
                  danger
                  onClick={() => handleDeleteLogic(item.id)}
                >
                  Delete
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {item.name}
                    {!item.enabled && <Tag color="error">Disabled</Tag>}
                  </Space>
                }
                description={renderLogicSummary(item)}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" align="center">
              <Text>No logic rules defined yet</Text>
              <Text type="secondary">
                Logic rules allow you to create dynamic forms that respond to user input
              </Text>
            </Space>
          }
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddLogic}
          >
            Create your first logic rule
          </Button>
        </Empty>
      )}
      
      <Modal
        title={editingLogic?.id ? `Edit Logic: ${editingLogic.name}` : 'Create Logic Rule'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingLogic(null);
        }}
        width={800}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setIsModalVisible(false);
              setEditingLogic(null);
            }}
          >
            Cancel
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={handleSaveLogic}
          >
            Save Logic
          </Button>
        ]}
      >
        {editingLogic && (
          <Form layout="vertical">
            <Form.Item label="Logic Rule Name">
              <Input
                value={editingLogic.name}
                onChange={(e) => setEditingLogic(prevLogic => {
                  if (!prevLogic) return prevLogic;
                  return { ...prevLogic, name: e.target.value };
                })}
                placeholder="Enter a descriptive name"
              />
            </Form.Item>
            
            <Form.Item>
              <Switch
                checked={editingLogic.enabled}
                onChange={(checked) => setEditingLogic(prevLogic => {
                  if (!prevLogic) return prevLogic;
                  return { ...prevLogic, enabled: checked };
                })}
              /> <Text>Enable this logic rule</Text>
            </Form.Item>
            
            <Divider />
            
            <Form.Item label="Condition Type">
              <Select
                value={editingLogic.conditionType}
                onChange={(value) => setEditingLogic(prevLogic => {
                  if (!prevLogic) return prevLogic;
                  return { ...prevLogic, conditionType: value };
                })}
                style={{ width: 200 }}
              >
                <Option value="all">Match ALL conditions (AND)</Option>
                <Option value="any">Match ANY condition (OR)</Option>
              </Select>
            </Form.Item>
            
            <Collapse defaultActiveKey={['1']} className={styles.logicSection}>
              <Panel header="Conditions (IF)" key="1">
                {editingLogic.conditions.map((condition, index) => (
                  <div key={condition.id} className={styles.conditionRow}>
                    <Space align="baseline" style={{ width: '100%' }}>
                      {index > 0 && (
                        <Text strong className={styles.conditionJoiner}>
                          {editingLogic.conditionType === 'all' ? 'AND' : 'OR'}
                        </Text>
                      )}
                      
                      <Form.Item label="Field" style={{ marginBottom: 8, flex: 1 }}>
                        <Select
                          value={condition.fieldId}
                          onChange={(value) => {
                            const updatedConditions = [...editingLogic.conditions];
                            updatedConditions[index].fieldId = value;
                            setEditingLogic(prevLogic => {
                              if (!prevLogic) return prevLogic;
                              return {
                                ...prevLogic,
                                conditions: updatedConditions
                              };
                            });
                          }}
                          placeholder="Select field"
                          style={{ width: '100%' }}
                        >
                          {formFields.map(field => (
                            <Option key={field.id} value={field.id}>
                              {field.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item label="Operator" style={{ marginBottom: 8, flex: 1 }}>
                        <Select
                          value={condition.operator}
                          onChange={(value) => {
                            const updatedConditions = [...editingLogic.conditions];
                            updatedConditions[index].operator = value;
                            setEditingLogic(prevLogic => {
                              if (!prevLogic) return prevLogic;
                              return {
                                ...prevLogic,
                                conditions: updatedConditions
                              };
                            });
                          }}
                          style={{ width: '100%' }}
                        >
                          {conditionTypes.map(type => (
                            <Option key={type.value} value={type.value}>
                              {type.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      {condition.operator !== 'isAnswered' && condition.operator !== 'isNotAnswered' && (
                        <Form.Item label="Value" style={{ marginBottom: 8, flex: 1 }}>
                          <Input
                            value={condition.value}
                            onChange={(e) => {
                              const updatedConditions = [...editingLogic.conditions];
                              updatedConditions[index].value = e.target.value;
                              setEditingLogic(prevLogic => {
                                if (!prevLogic) return prevLogic;
                                return {
                                  ...prevLogic,
                                  conditions: updatedConditions
                                };
                              });
                            }}
                            placeholder="Enter value"
                          />
                        </Form.Item>
                      )}
                      
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteCondition(condition.id)}
                        disabled={editingLogic.conditions.length <= 1}
                      />
                    </Space>
                  </div>
                ))}
                
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddCondition}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  Add Condition
                </Button>
              </Panel>
            </Collapse>
            
            <Divider>
              <ArrowRightOutlined />
            </Divider>
            
            <Collapse defaultActiveKey={['1']} className={styles.logicSection}>
              <Panel header="Actions (THEN)" key="1">
                {editingLogic.actions.map((action, index) => (
                  <div key={action.id} className={styles.actionRow}>
                    <Space align="baseline" style={{ width: '100%' }}>
                      <Form.Item label="Action Type" style={{ marginBottom: 8, flex: 1 }}>
                        <Select
                          value={action.type}
                          onChange={(value) => {
                            const updatedActions = [...editingLogic.actions];
                            updatedActions[index].type = value;
                            setEditingLogic(prevLogic => {
                              if (!prevLogic) return prevLogic;
                              return {
                                ...prevLogic,
                                actions: updatedActions
                              };
                            });
                          }}
                          style={{ width: '100%' }}
                        >
                          {actionTypes.map(type => (
                            <Option key={type.value} value={type.value}>
                              {type.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item label="Target Field" style={{ marginBottom: 8, flex: 1 }}>
                        <Select
                          value={action.targetFieldId}
                          onChange={(value) => {
                            const updatedActions = [...editingLogic.actions];
                            updatedActions[index].targetFieldId = value;
                            setEditingLogic(prevLogic => {
                              if (!prevLogic) return prevLogic;
                              return {
                                ...prevLogic,
                                actions: updatedActions
                              };
                            });
                          }}
                          placeholder="Select target field"
                          style={{ width: '100%' }}
                        >
                          {formFields.map(field => (
                            <Option key={field.id} value={field.id}>
                              {field.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      {action.type === 'setValue' && (
                        <Form.Item label="Value" style={{ marginBottom: 8, flex: 1 }}>
                          <Input
                            value={action.value}
                            onChange={(e) => {
                              const updatedActions = [...editingLogic.actions];
                              updatedActions[index].value = e.target.value;
                              setEditingLogic(prevLogic => {
                                if (!prevLogic) return prevLogic;
                                return {
                                  ...prevLogic,
                                  actions: updatedActions
                                };
                              });
                            }}
                            placeholder="Enter value"
                          />
                        </Form.Item>
                      )}
                      
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteAction(action.id)}
                        disabled={editingLogic.actions.length <= 1}
                      />
                    </Space>
                  </div>
                ))}
                
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddAction}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  Add Action
                </Button>
              </Panel>
            </Collapse>
          </Form>
        )}
      </Modal>
    </Card>
  );
} 