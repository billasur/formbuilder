'use client'

import React from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import { ConfigProvider } from 'antd'
import { MessageProviderComponent } from './MessageProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 6,
        },
      }}
    >
      <AuthProvider>
        <MessageProviderComponent>
          {children}
        </MessageProviderComponent>
      </AuthProvider>
    </ConfigProvider>
  )
} 