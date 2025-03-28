'use client'

import React, { useState } from 'react';
import { 
  Form, 
  Button, 
  Input, 
  Select, 
  Checkbox, 
  Radio, 
  DatePicker, 
  Upload, 
  Typography, 
  Divider,
  message, 
  Alert
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { submitFormResponse } from '../../firebase/responseService';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface FormPreviewProps {
  form: any;  // The form configuration
  previewMode?: boolean;
  onSubmitted?: () => void;
}

const FormPreview: React.FC<FormPreviewProps> = ({ form, previewMode = false, onSubmitted = null }) => {
  const [formInstance] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!form) {
    return <div>No form data available</div>;
  }

  const { fields = [], settings = {} } = form;

  const handleSubmit = async (values) => {
    if (previewMode) {
      message.info('This is just a preview. Form submission is disabled.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const responseId = await submitFormResponse(form.id, values);
      
      setSubmitted(true);
      formInstance.resetFields();
      
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    // Don't attempt to render fields without an ID
    if (!field.id) {
      console.warn('Field without ID detected:', field);
      return null;
    }

    const { id, type, label, placeholder, required, options = [], tooltip } = field;

    // Handling different field types
    switch (type?.toLowerCase()) {
      case 'text':
        return (
          <Form.Item
            key={id}
            label={label}
            name={id}
            tooltip={tooltip}
            rules={required ? [{ required: true, message: `${label} is required` }] : undefined}
          >
            <Input placeholder={placeholder} />
          </Form.Item>
        );
      
      case 'textarea':
        return (
          <Form.Item
            key={id}
            label={label}
            name={id}
            tooltip={tooltip}
            rules={required ? [{ required: true, message: `${label} is required` }] : undefined}
          >
            <TextArea placeholder={placeholder} rows={4} />
          </Form.Item>
        );
      
      case 'email':
        return (
          <Form.Item
            key={id}
            label={label}
            name={id}
            tooltip={tooltip}
            rules={[
              { required: required, message: `${label} is required` },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder={placeholder} type="email" />
          </Form.Item>
        );
      
      case 'number':
        return (
          <Form.Item
            key={id}
            label={label}
            name={id}
            tooltip={tooltip}
            rules={[
              { required: required, message: `${label} is required` },
              { type: 'number', message: 'Please enter a valid number', transform: (val) => Number(val) }
            ]}
          >
            <Input placeholder={placeholder} type="number" />
          </Form.Item>
        );
      
      case 'select':
        return (
          <Form.Item
            key={id}
            label={label}
            name={id}
            tooltip={tooltip}
            rules={required ? [{ required: true, message: `${label} is required` }] : undefined}
          >
            <Select placeholder={placeholder}>
              {options.map((option, index) => (
                <Option key={`${id}-option-${index}`} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );
      
      case 'radio':
        return (
          <Form.Item
            key={id}
            label={label}
            name={id}
            tooltip={tooltip}
            rules={required ? [{ required: true, message: `${label} is required` }] : undefined}
          >
            <Radio.Group>
              {options.map((option, index) => (
                <Radio key={`${id}-option-${index}`} value={option}>
                  {option}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        );
      
      case 'checkbox':
        return (
          <Form.Item
            key={id}
            label={label}
            name={id}
            valuePropName="checked"
            tooltip={tooltip}
            rules={required ? [{ required: true, message: `${label} is required` }] : undefined}
          >
            <Checkbox.Group>
              {options.map((option, index) => (
                <Checkbox key={`${id}-option-${index}`} value={option}>
                  {option}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
        );
      
      case 'date':
        return (
          <Form.Item
            key={id}
            label={label}
            name={id}
            tooltip={tooltip}
            rules={required ? [{ required: true, message: `${label} is required` }] : undefined}
          >
            <DatePicker placeholder={placeholder} style={{ width: '100%' }} />
          </Form.Item>
        );
      
      case 'file':
        return (
          <Form.Item
            key={id}
            label={label}
            name={id}
            tooltip={tooltip}
            rules={required ? [{ required: true, message: `${label} is required` }] : undefined}
          >
            <Upload name={id} listType="text" action="/api/upload" maxCount={1}>
              <Button icon={<UploadOutlined />}>{placeholder || 'Click to Upload'}</Button>
            </Upload>
          </Form.Item>
        );
      
      default:
        console.warn(`Unsupported field type: ${type}`);
        return (
          <Form.Item key={id} label={`${label} (${type})`}>
            <Input disabled placeholder="Unsupported field type" />
          </Form.Item>
        );
    }
  };

  if (submitted) {
    return (
      <div className="form-submitted">
        <Alert
          message="Form Submitted"
          description="Thank you for your submission!"
          type="success"
          showIcon
        />
        <div style={{ marginTop: 16 }}>
          <Button onClick={() => setSubmitted(false)}>Submit Another Response</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-preview">
      <Typography.Title level={4}>{form.name}</Typography.Title>
      {form.description && <Typography.Paragraph>{form.description}</Typography.Paragraph>}
      
      <Divider />
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form 
        form={formInstance}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={previewMode}
      >
        {fields && fields.length > 0 ? (
          fields.map(field => renderField(field))
        ) : (
          <Alert 
            message="No fields in this form" 
            description="This form doesn't have any fields yet."
            type="info"
            showIcon
          />
        )}
        
        {fields && fields.length > 0 && (
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
              disabled={previewMode}
            >
              {settings.submitButtonText || 'Submit'}
            </Button>
            {previewMode && (
              <span style={{ marginLeft: 8, color: '#888' }}>
                (Preview mode - submission disabled)
              </span>
            )}
          </Form.Item>
        )}
      </Form>
    </div>
  );
};

export default FormPreview; 