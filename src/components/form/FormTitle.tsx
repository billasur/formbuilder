'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Input, Typography, Button, Space, Tooltip } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './FormTitle.module.css';

const { Title } = Typography;

interface FormTitleProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
}

export default function FormTitle({ title, onTitleChange }: FormTitleProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Focus the input when editing starts
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);
  
  const handleEdit = () => {
    setEditing(true);
  };
  
  const handleSave = () => {
    if (inputValue.trim()) {
      onTitleChange(inputValue);
      setEditing(false);
    }
  };
  
  const handleCancel = () => {
    setInputValue(title);
    setEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  return (
    <div className={styles.titleContainer}>
      {editing ? (
        <Space className={styles.editingContainer}>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            size="large"
            className={styles.titleInput}
          />
          <Space>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={handleSave}
            />
            <Button 
              icon={<CloseOutlined />} 
              onClick={handleCancel}
            />
          </Space>
        </Space>
      ) : (
        <div className={styles.titleDisplay}>
          <Title level={2} className={styles.title}>{title}</Title>
          <Tooltip title="Edit form title">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={handleEdit}
              className={styles.editButton}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
} 