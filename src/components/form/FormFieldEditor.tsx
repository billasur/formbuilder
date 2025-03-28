'use client'

import React, { useState } from 'react';
import { Form, Input, Switch, Button, Space, Select, Divider, Typography, Upload } from 'antd';
import { PlusOutlined, MinusCircleOutlined, UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

// Basic placeholder component
const FormFieldEditor = ({ field, onSave, onCancel }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  
  const handleSubmit = (values) => {
    onSave({
      ...field,
      ...values
    });
  };
  
  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={field}
      onFinish={handleSubmit}
    >
      <Form.Item
        label="Label"
        name="label"
        rules={[{ required: true, message: 'Please enter field label' }]}
      >
        <Input />
      </Form.Item>
      
      <Form.Item
        label="Field Type"
        name="type"
      >
        <Select disabled>
          <Option value="text">Text Input</Option>
          <Option value="textarea">Text Area</Option>
          <Option value="email">Email</Option>
          <Option value="number">Number</Option>
          <Option value="select">Dropdown</Option>
          <Option value="radio">Radio Group</Option>
          <Option value="checkbox">Checkboxes</Option>
          <Option value="date">Date Picker</Option>
          <Option value="file">File Upload</Option>
        </Select>
      </Form.Item>
      
      <Form.Item
        label="Placeholder"
        name="placeholder"
      >
        <Input />
      </Form.Item>
      
      <Form.Item
        label="Required"
        name="required"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      
      {['select', 'radio', 'checkbox'].includes(field.type) && (
        <Form.List name="options">
          {(fields, { add, remove }) => (
            <>
              <Typography.Text strong>Options</Typography.Text>
              <Divider style={{ margin: '8px 0' }} />
              
              {fields.map((field, index) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...field}
                    rules={[{ required: true, message: 'Option is required' }]}
                  >
                    <Input placeholder={`Option ${index + 1}`} />
                  </Form.Item>
                  
                  <MinusCircleOutlined onClick={() => remove(field.name)} />
                </Space>
              ))}
              
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Option
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      )}
      
      <Form.Item>
        <Upload 
          fileList={fileList} 
          onChange={handleChange}
          beforeUpload={() => false}
        >
          <Button icon={<UploadOutlined />}>Upload</Button>
        </Upload>
      </Form.Item>
      
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            Save
          </Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default FormFieldEditor; 