'use client'

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Space, 
  Card, 
  Empty, 
  Divider,
  Modal,
  Tooltip,
  Menu,
  Dropdown,
  Typography,
  message
} from 'antd';
import { 
  PlusOutlined, 
  DragOutlined, 
  DeleteOutlined, 
  CopyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EditOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { nanoid } from 'nanoid';
import FormFieldEditor from './FormFieldEditor';

const { Text } = Typography;

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  tooltip?: string;
}

interface FormBuilderProps {
  fields: FormField[];
  onUpdate: (fields: FormField[]) => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ fields = [], onUpdate }) => {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [localFields, setLocalFields] = useState<FormField[]>([]);
  
  // Initialize local fields from props
  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);
  
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    // Reorder field list
    const items = Array.from(localFields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setLocalFields(items);
    onUpdate(items);
  };
  
  const handleAddField = (fieldType) => {
    // Create a new field with default values
    const newField: FormField = {
      id: nanoid(), 
      type: fieldType,
      label: `New ${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} Field`,
      placeholder: 'Enter a value',
      required: false,
      options: fieldType === 'select' || fieldType === 'radio' || fieldType === 'checkbox' ? ['Option 1', 'Option 2'] : undefined
    };
    
    // Open the editor with the new field
    setEditingField(newField);
    setIsEditorVisible(true);
  };
  
  const handleEditField = (field) => {
    setEditingField({...field});
    setIsEditorVisible(true);
  };

  const handleDeleteField = (fieldId) => {
    const updatedFields = localFields.filter(f => f.id !== fieldId);
    setLocalFields(updatedFields);
    onUpdate(updatedFields);
    message.success('Field deleted');
  };
  
  const handleDuplicateField = (field) => {
    const newField = {
      ...field,
      id: nanoid(),
      label: `${field.label} (Copy)`,
    };
    
    const updatedFields = [...localFields, newField];
    setLocalFields(updatedFields);
    onUpdate(updatedFields);
    message.success('Field duplicated');
  };
  
  const handleMoveField = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === localFields.length - 1)
    ) {
      return;
    }
    
    const newFields = [...localFields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    
    setLocalFields(newFields);
    onUpdate(newFields);
  };

  const handleSaveField = (updatedField) => {
    let newFields;
    
    if (localFields.some(f => f.id === updatedField.id)) {
      // Update existing field
      newFields = localFields.map(f => 
        f.id === updatedField.id ? updatedField : f
      );
    } else {
      // Add new field
      newFields = [...localFields, updatedField];
    }
    
    setLocalFields(newFields);
    onUpdate(newFields);
    setIsEditorVisible(false);
    setEditingField(null);
    message.success('Field saved');
  };
  
  // Field type menu items for dropdown
  const fieldTypeItems = [
    {
      key: '1',
      label: 'Text Input',
      onClick: () => handleAddField('text'),
    },
    {
      key: '2',
      label: 'Email Input',
      onClick: () => handleAddField('email'),
    },
    {
      key: '3',
      label: 'Number Input',
      onClick: () => handleAddField('number'),
    },
    {
      key: '4',
      label: 'Textarea',
      onClick: () => handleAddField('textarea'),
    },
    {
      key: '5',
      label: 'Select Dropdown',
      onClick: () => handleAddField('select'),
    },
    {
      key: '6',
      label: 'Checkbox',
      onClick: () => handleAddField('checkbox'),
    },
    {
      key: '7',
      label: 'Radio Group',
      onClick: () => handleAddField('radio'),
    },
    {
      key: '8',
      label: 'Date Picker',
      onClick: () => handleAddField('date'),
    },
    {
      key: '9',
      label: 'File Upload',
      onClick: () => handleAddField('file'),
    },
  ];
  
  return (
    <div className="form-builder">
      <div className="add-field-button" style={{ marginBottom: 16 }}>
        <Dropdown menu={{ items: fieldTypeItems }} trigger={['click']}>
          <Button type="primary" icon={<PlusOutlined />}>
            Add Field
          </Button>
        </Dropdown>
      </div>
      
      {localFields.length === 0 ? (
        <Empty 
          description="No fields yet. Add some fields to your form."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="form-fields">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="form-fields-container"
              >
                {localFields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="form-field-item"
                        style={{ marginBottom: 8, ...provided.draggableProps.style }}
                      >
                        <Card
                          className="form-field-card"
                          size="small"
                          title={
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div {...provided.dragHandleProps} style={{ marginRight: 8, cursor: 'grab' }}>
                                <DragOutlined />
                              </div>
                              <span>{field.label}</span>
                              <Text type="secondary" style={{ marginLeft: 8 }}>
                                ({field.type})
                              </Text>
                            </div>
                          }
                          extra={
                            <Space>
                              <Tooltip title="Edit">
                                <Button 
                                  icon={<EditOutlined />} 
                                  size="small" 
                                  onClick={() => handleEditField(field)}
                                />
                              </Tooltip>
                              <Tooltip title="Duplicate">
                                <Button 
                                  icon={<CopyOutlined />} 
                                  size="small" 
                                  onClick={() => handleDuplicateField(field)}
                                />
                              </Tooltip>
                              <Tooltip title="Move Up">
                                <Button 
                                  icon={<ArrowUpOutlined />} 
                                  size="small" 
                                  disabled={index === 0}
                                  onClick={() => handleMoveField(index, 'up')}
                                />
                              </Tooltip>
                              <Tooltip title="Move Down">
                                <Button 
                                  icon={<ArrowDownOutlined />} 
                                  size="small" 
                                  disabled={index === localFields.length - 1}
                                  onClick={() => handleMoveField(index, 'down')}
                                />
                              </Tooltip>
                              <Tooltip title="Delete">
                                <Button 
                                  icon={<DeleteOutlined />} 
                                  size="small" 
                                  danger
                                  onClick={() => handleDeleteField(field.id)}
                                />
                              </Tooltip>
                            </Space>
                          }
                        >
                          {/* Field properties preview */}
                          <div className="field-property">
                            <strong>Required:</strong> {field.required ? 'Yes' : 'No'}
                          </div>
                          {field.placeholder && (
                            <div className="field-property">
                              <strong>Placeholder:</strong> {field.placeholder}
                            </div>
                          )}
                          {field.options && (
                            <div className="field-property">
                              <strong>Options:</strong> {field.options.join(', ')}
                            </div>
                          )}
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      
      {/* Field editor modal */}
      <Modal
        title="Edit Field"
        open={isEditorVisible}
        onCancel={() => {
          setIsEditorVisible(false);
          setEditingField(null);
        }}
        footer={null}
        destroyOnClose
      >
        {editingField && (
          <FormFieldEditor 
            field={editingField}
            onSave={handleSaveField}
            onCancel={() => {
              setIsEditorVisible(false);
              setEditingField(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default FormBuilder; 