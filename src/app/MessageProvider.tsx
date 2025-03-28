'use client'

import React, { createContext, useContext } from 'react';
import { message, notification } from 'antd';
import { MessageInstance } from 'antd/es/message/interface';
import { NotificationInstance } from 'antd/es/notification/interface';

// Create context to provide message and notification globally
interface MessageContextType {
  message: MessageInstance;
  notification: NotificationInstance;
}

const MessageContext = createContext<MessageContextType | null>(null);

export const MessageProviderComponent: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [notificationApi, notificationHolder] = notification.useNotification();

  return (
    <MessageContext.Provider value={{ message: messageApi, notification: notificationApi }}>
      {contextHolder}
      {notificationHolder}
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within MessageProviderComponent');
  }
  return context;
}; 