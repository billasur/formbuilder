'use client'

import React from 'react'
import { Layout, Typography } from 'antd'
import Link from 'next/link'

const { Content } = Layout
const { Title } = Typography

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Layout className="auth-layout">
      <Content className="auth-content">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">
              <Link href="/">
                <img src="/logo.png" alt="FormBuilder Logo" height={40} />
              </Link>
            </div>
            <Title level={3}>FormBuilder</Title>
          </div>
          <div className="auth-card">
            {children}
          </div>
          <div className="auth-footer">
            <p>© {new Date().getFullYear()} FormBuilder. All rights reserved.</p>
          </div>
        </div>
      </Content>
    </Layout>
  )
} 