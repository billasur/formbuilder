import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  tip?: string;
  fullscreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  fullscreen = false,
  tip = 'Loading...'
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  if (fullscreen) {
    return (
      <div className={`flex flex-col items-center justify-center fixed inset-0 bg-white/80 dark:bg-gray-900/80 z-50`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        {tip && <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">{tip}</div>}
      </div>
    );
  }

  return (
    <div className="loading-container" style={{ padding: '50px 0' }}>
      <Spin indicator={antIcon} tip={tip} size="large" />
    </div>
  );
};

export default LoadingSpinner; 