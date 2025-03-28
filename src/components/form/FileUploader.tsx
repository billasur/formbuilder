'use client'

import React, { useState } from 'react';
import { 
  Upload, 
  Button, 
  message, 
  Progress, 
  Card, 
  Space, 
  Typography, 
  Alert 
} from 'antd';
import { 
  UploadOutlined, 
  FileOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  LoadingOutlined,
  InboxOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileZipOutlined,
  FileUnknownOutlined
} from '@ant-design/icons';
import { uploadFileWithCompression, downloadCompressedFile } from '../../utils/fileUtils';
import styles from './FileUploader.module.css';

const { Text } = Typography;

interface FileUploaderProps {
  onChange?: (fileData: any) => void;
  value?: any;
  maxSize?: number; // In MB
  accept?: string;
  disabled?: boolean;
  multiple?: boolean;
  listType?: 'text' | 'picture' | 'picture-card';
}

export default function FileUploader({
  onChange,
  value,
  maxSize = 10, // Default 10MB
  accept,
  disabled = false,
  multiple = false,
  listType = 'text'
}: FileUploaderProps) {
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Get file icon based on file type
  const getFileIcon = (fileName: string) => {
    if (!fileName) return <FileUnknownOutlined />;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FilePdfOutlined />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return <FileImageOutlined />;
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
        return <FileTextOutlined />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileExcelOutlined />;
      case 'zip':
      case 'rar':
      case '7z':
        return <FileZipOutlined />;
      default:
        return <FileOutlined />;
    }
  };
  
  // Handle file change
  const handleChange = async (info: any) => {
    // Reset error
    setError(null);
    
    if (info.file.status === 'uploading') {
      setUploading(true);
      
      // Simulate progress for better UX
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.floor(Math.random() * 10);
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 200);
      
      try {
        // Check file size
        if (info.file.size > maxSize * 1024 * 1024) {
          throw new Error(`File size exceeds ${maxSize}MB limit`);
        }
        
        // Process the file
        const compressedData = await uploadFileWithCompression(info.file);
        
        // Create file object to store
        const fileData = {
          data: compressedData,
          name: info.file.name,
          type: info.file.type,
          size: info.file.size,
          compressed: true,
          uploadedAt: new Date()
        };
        
        // Update file list for display
        const newFileList = [{
          uid: '-1',
          name: info.file.name,
          status: 'done',
          url: '#', // Placeholder
          thumbUrl: info.file.type.startsWith('image/') ? compressedData : undefined,
          originalFileObj: info.file
        }];
        
        setFileList(newFileList);
        setProgress(100);
        
        // Call onChange callback
        if (onChange) {
          onChange(fileData);
        }
        
        message.success(`${info.file.name} uploaded successfully`);
      } catch (error) {
        console.error('Error uploading file:', error);
        setFileList([]);
        setError(error.message || 'Failed to upload file');
        message.error(`${info.file.name} upload failed: ${error.message}`);
      } finally {
        clearInterval(interval);
        setUploading(false);
      }
    }
  };
  
  // Handle file preview
  const handlePreview = (file: any) => {
    if (value && value.data) {
      try {
        downloadCompressedFile({
          data: value.data,
          name: value.name,
          type: value.type,
          compressed: value.compressed
        });
      } catch (error) {
        console.error('Error previewing file:', error);
        message.error('Failed to preview file');
      }
    }
  };
  
  // Handle file removal
  const handleRemove = () => {
    setFileList([]);
    if (onChange) {
      onChange(undefined);
    }
  };
  
  return (
    <div className={styles.uploaderContainer}>
      {error && (
        <Alert 
          message={error} 
          type="error" 
          showIcon 
          closable 
          style={{ marginBottom: 16 }}
        />
      )}
      
      {value && value.name ? (
        <Card size="small" className={styles.fileCard}>
          <Space>
            {getFileIcon(value.name)}
            <div className={styles.fileInfo}>
              <Text ellipsis>{value.name}</Text>
              <Text type="secondary" className={styles.fileSize}>
                {Math.round(value.size / 1024)} KB
              </Text>
            </div>
            <Space>
              <Button 
                icon={<EyeOutlined />} 
                size="small" 
                onClick={handlePreview}
              />
              <Button 
                icon={<DeleteOutlined />} 
                size="small" 
                danger 
                onClick={handleRemove}
                disabled={disabled}
              />
            </Space>
          </Space>
        </Card>
      ) : (
        <Upload.Dragger
          name="file"
          multiple={multiple}
          accept={accept}
          fileList={fileList}
          onChange={handleChange}
          onRemove={handleRemove}
          disabled={disabled || uploading}
          beforeUpload={() => false}
          className={styles.uploader}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            {uploading ? <LoadingOutlined /> : <InboxOutlined />}
          </p>
          <p className="ant-upload-text">
            Click or drag file to upload
          </p>
          <Text type="secondary" className={styles.helperText}>
            (Max: {maxSize}MB)
          </Text>
        </Upload.Dragger>
      )}
      
      {uploading && (
        <Progress 
          percent={progress} 
          status="active" 
          className={styles.progressBar}
        />
      )}
    </div>
  );
} 