'use client'

import React, { useState } from 'react'
import { Form, Input, Button, Divider, Card, message, Typography } from 'antd'
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons'
import { signIn, signInWithGoogle } from '../../../firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const { Title, Text } = Typography

export default function SignIn() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  
  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      await signIn(values.email, values.password)
      message.success('Signed in successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      message.error(error.message || 'Failed to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      message.success('Signed in with Google successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      if (error.message !== 'Sign-in popup was closed before completing the sign-in process.') {
        message.error(error.message || 'Failed to sign in with Google. Please try again.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>Welcome Back</Title>
          <Text type="secondary">Sign in to continue to your account</Text>
        </div>
        
        <Form
          name="signin_form"
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Password" 
              size="large" 
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 12 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block 
              loading={loading}
            >
              Sign In
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Link href="/auth/forgot-password">
              Forgot password?
            </Link>
          </div>
        </Form>
        
        <Divider plain>or</Divider>
        
        <Button 
          icon={<GoogleOutlined />} 
          size="large" 
          block 
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          style={{ marginBottom: 16 }}
        >
          Sign in with Google
        </Button>
        
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Don't have an account?{' '}
            <Link href="/auth/signup">
              Sign up
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  )
} 