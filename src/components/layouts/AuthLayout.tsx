import React from 'react';
import { Layout, Typography } from 'antd';
import { Outlet, Link } from 'react-router-dom';

const { Content } = Layout;
const { Title } = Typography;

export const AuthLayout: React.FC = () => {
  return (
    <Layout className="auth-layout">
      <Content className="auth-content">
        <div className="auth-container">
          <div className="auth-header">
            <div className="auth-logo">
              <Link to="/">
                <img src="/logo.png" alt="FormBuilder Logo" height={40} />
              </Link>
            </div>
            <Title level={3}>FormBuilder</Title>
          </div>
          <div className="auth-card">
            <Outlet />
          </div>
          <div className="auth-footer">
            <p>© {new Date().getFullYear()} FormBuilder. All rights reserved.</p>
          </div>
        </div>
      </Content>
    </Layout>
  );
}; 