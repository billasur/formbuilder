'use client'

import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Switch, 
  Select, 
  Card, 
  Typography, 
  Space, 
  Divider, 
  message, 
  Tabs, 
  Upload, 
  Radio,
  ColorPicker
} from 'antd';
import { 
  SettingOutlined, 
  UploadOutlined, 
  MailOutlined, 
  BgColorsOutlined, 
  SaveOutlined,
  GlobalOutlined,
  SecurityScanOutlined,
  ShareAltOutlined,
  CodeOutlined
} from '@ant-design/icons';
import { updateForm } from '../../firebase/formService';
import styles from './FormSettings.module.css';
import { fileToBase64 } from '../../utils/fileUtils';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

interface FormSettingsProps {
  formId: string;
  initialSettings: any;
  onUpdate: (updatedSettings: any) => void;
}

export default function FormSettings({ 
  formId, 
  initialSettings, 
  onUpdate 
}: FormSettingsProps) {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<any>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialSettings?.logo || null
  );
  
  // Set initial form values
  useEffect(() => {
    form.setFieldsValue(initialSettings || {});
  }, [form, initialSettings]);
  
  // Handle logo file change
  const handleLogoChange = async (info: any) => {
    if (info.file) {
      setLogoFile(info.file);
      try {
        const base64 = await fileToBase64(info.file);
        setLogoPreview(base64);
      } catch (error) {
        console.error('Error converting logo to base64:', error);
        message.error('Failed to preview logo');
      }
    }
  };
  
  // Handle form submit
  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);
      
      // Process logo if changed
      let logoUrl = initialSettings?.logo || null;
      if (logoFile) {
        logoUrl = await fileToBase64(logoFile);
      }
      
      // Combine form values with logo
      const updatedSettings = {
        ...values,
        logo: logoUrl,
        updatedAt: new Date()
      };
      
      // Update form in database
      await updateForm(formId, { settings: updatedSettings });
      
      // Call the update callback
      onUpdate(updatedSettings);
      
      message.success('Form settings saved successfully');
    } catch (error) {
      console.error('Error saving form settings:', error);
      message.error('Failed to save form settings');
    } finally {
      setSaving(false);
    }
  };
  
  const uploadProps = {
    beforeUpload: (file: any) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return Upload.LIST_IGNORE;
      }
      
      handleLogoChange({ file });
      return false;  // Prevent auto upload
    },
    showUploadList: false
  };
  
  return (
    <Card className={styles.settingsCard}>
      <Title level={4}>
        <SettingOutlined /> Form Settings
      </Title>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className={styles.tabs}
      >
        <TabPane 
          tab={<span><SettingOutlined /> General</span>} 
          key="general"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialSettings}
          >
            <Form.Item
              label="Submit Button Text"
              name="submitButtonText"
              rules={[{ required: true, message: 'Please enter submit button text' }]}
            >
              <Input placeholder="Submit" />
            </Form.Item>
            
            <Form.Item
              label="Success Message"
              name="successMessage"
              rules={[{ required: true, message: 'Please enter a success message' }]}
            >
              <TextArea 
                placeholder="Thank you for your submission!" 
                rows={3} 
              />
            </Form.Item>
            
            <Form.Item
              label="Show Progress Bar"
              name="showProgressBar"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="Form Logo"
              name="logo"
              getValueFromEvent={() => logoPreview}
            >
              <div className={styles.logoUploader}>
                {logoPreview && (
                  <div className={styles.logoPreview}>
                    <img 
                      src={logoPreview} 
                      alt="Form Logo" 
                      className={styles.logoImage} 
                    />
                  </div>
                )}
                
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                </Upload>
                
                {logoPreview && (
                  <Button 
                    type="text" 
                    danger 
                    onClick={() => {
                      setLogoPreview(null);
                      setLogoFile(null);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={saving}
              >
                Save Settings
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane 
          tab={<span><MailOutlined /> Notifications</span>} 
          key="notifications"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialSettings}
          >
            <Form.Item
              label="Send Email Notifications"
              name="sendEmailNotifications"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="Notification Email"
              name="notificationEmail"
              rules={[
                { 
                  required: form.getFieldValue('sendEmailNotifications'), 
                  message: 'Please enter notification email'
                },
                {
                  type: 'email',
                  message: 'Please enter a valid email'
                }
              ]}
            >
              <Input placeholder="your@email.com" />
            </Form.Item>
            
            <Form.Item
              label="Email Subject"
              name="emailSubject"
            >
              <Input placeholder="New form submission" />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={saving}
              >
                Save Notification Settings
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane 
          tab={<span><BgColorsOutlined /> Appearance</span>} 
          key="appearance"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialSettings}
          >
            <Form.Item
              label="Primary Color"
              name="primaryColor"
            >
              <ColorPicker />
            </Form.Item>
            
            <Form.Item
              label="Font Family"
              name="fontFamily"
            >
              <Select>
                <Option value="Inter, sans-serif">Inter</Option>
                <Option value="Roboto, sans-serif">Roboto</Option>
                <Option value="'Open Sans', sans-serif">Open Sans</Option>
                <Option value="'Montserrat', sans-serif">Montserrat</Option>
                <Option value="'Poppins', sans-serif">Poppins</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              label="Background Style"
              name="backgroundStyle"
            >
              <Radio.Group>
                <Radio value="plain">Plain</Radio>
                <Radio value="gradient">Gradient</Radio>
                <Radio value="pattern">Pattern</Radio>
              </Radio.Group>
            </Form.Item>
            
            <Form.Item
              label="Background Color"
              name="backgroundColor"
            >
              <ColorPicker />
            </Form.Item>
            
            <Form.Item
              label="Custom CSS"
              name="customCss"
            >
              <TextArea 
                rows={6} 
                placeholder=".form-container { background: #f5f5f5; }" 
              />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={saving}
              >
                Save Appearance Settings
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane 
          tab={<span><SecurityScanOutlined /> Security</span>}
          key="security"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialSettings}
          >
            <Form.Item
              label="Enable CAPTCHA"
              name="enableCaptcha"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="Limit Submissions"
              name="limitSubmissions"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="Max Submissions"
              name="maxSubmissions"
              dependencies={['limitSubmissions']}
            >
              <Input 
                type="number" 
                min={1} 
                disabled={!form.getFieldValue('limitSubmissions')} 
              />
            </Form.Item>
            
            <Form.Item
              label="Prevent Multiple Submissions"
              name="preventMultipleSubmissions"
              valuePropName="checked"
              tooltip="Prevents the same user from submitting multiple times"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={saving}
              >
                Save Security Settings
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane 
          tab={<span><ShareAltOutlined /> Sharing</span>}
          key="sharing"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialSettings}
          >
            <Form.Item
              label="Form Visibility"
              name="visibility"
            >
              <Radio.Group>
                <Radio value="public">Public (anyone with the link)</Radio>
                <Radio value="private">Private (require login)</Radio>
                <Radio value="restricted">Restricted (specific users/groups)</Radio>
              </Radio.Group>
            </Form.Item>
            
            <Form.Item
              label="Allow Embedding"
              name="allowEmbedding"
              valuePropName="checked"
              tooltip="Allow embedding form on other websites"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="Embed Code"
              tooltip="Copy and paste this code to embed your form"
            >
              <Input.TextArea
                readOnly
                value={`<iframe src="${window.location.origin}/form/embedded/${formId}" width="100%" height="600" frameborder="0"></iframe>`}
                rows={3}
              />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={saving}
              >
                Save Sharing Settings
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane 
          tab={<span><CodeOutlined /> Advanced</span>}
          key="advanced"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={initialSettings}
          >
            <Form.Item
              label="Custom Redirect URL"
              name="redirectUrl"
              tooltip="Redirect users to this URL after form submission"
            >
              <Input placeholder="https://your-website.com/thank-you" />
            </Form.Item>
            
            <Form.Item
              label="Auto Save Responses"
              name="autoSaveResponses"
              valuePropName="checked"
              tooltip="Automatically save form progress as users type"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="Save IP Address"
              name="saveIpAddress"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              label="Custom Form ID"
              name="customFormId"
            >
              <Input placeholder="my-custom-form-id" />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={saving}
              >
                Save Advanced Settings
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </Card>
  );
} 