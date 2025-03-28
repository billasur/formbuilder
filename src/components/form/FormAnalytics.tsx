'use client'

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Typography, 
  Spin, 
  Empty, 
  DatePicker, 
  Button, 
  Tabs, 
  Space, 
  Tooltip
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, differenceInDays, addDays } from 'date-fns';
import { subscribeToFormSubmissions } from '../../firebase/firestore';
import styles from './FormAnalytics.module.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface FormAnalyticsProps {
  formId: string;
}

export default function FormAnalytics({ formId }: FormAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    subDays(new Date(), 30),
    new Date()
  ]);
  
  // Statistics data
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    submissionsInRange: 0,
    completionRate: 0,
    averageSubmissionTime: 0,
    fieldsWithMostErrors: [] as Array<{field: string, errorCount: number}>,
    deviceBreakdown: [] as Array<{name: string, value: number}>,
    submissionsByDay: [] as Array<{date: string, count: number}>,
    submissionsByHour: [] as Array<{hour: string, count: number}>
  });
  
  useEffect(() => {
    const unsubscribe = subscribeToFormSubmissions(formId, (data) => {
      setSubmissions(data);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [formId]);
  
  useEffect(() => {
    if (submissions.length > 0) {
      calculateStats();
    }
  }, [submissions, dateRange]);
  
  const calculateStats = () => {
    const [startDate, endDate] = dateRange;
    
    // Filter submissions by date range
    const filteredSubmissions = submissions.filter(sub => {
      const submissionDate = sub.createdAt.toDate();
      return submissionDate >= startDate && submissionDate <= endDate;
    });
    
    // Calculate basic stats
    const totalInRange = filteredSubmissions.length;
    
    // Calculate completion rate
    const completed = filteredSubmissions.filter(sub => sub.isCompleted).length;
    const completionRate = totalInRange > 0 ? (completed / totalInRange) * 100 : 0;
    
    // Calculate average submission time (in seconds)
    const submissionTimes = filteredSubmissions
      .filter(sub => sub.startTime && sub.endTime)
      .map(sub => {
        const startTime = sub.startTime.toDate();
        const endTime = sub.endTime.toDate();
        return (endTime.getTime() - startTime.getTime()) / 1000; // in seconds
      });
    
    const avgTime = submissionTimes.length > 0 
      ? submissionTimes.reduce((acc, time) => acc + time, 0) / submissionTimes.length 
      : 0;
    
    // Fields with most errors
    const fieldErrors = {};
    filteredSubmissions.forEach(sub => {
      if (sub.errors && Array.isArray(sub.errors)) {
        sub.errors.forEach(error => {
          if (error.fieldId) {
            if (!fieldErrors[error.fieldId]) {
              fieldErrors[error.fieldId] = {
                fieldId: error.fieldId,
                fieldLabel: error.fieldLabel || error.fieldId,
                count: 0
              };
            }
            fieldErrors[error.fieldId].count++;
          }
        });
      }
    });
    
    const fieldsWithErrors = Object.values(fieldErrors)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
    
    // Device breakdown
    const devices = {};
    filteredSubmissions.forEach(sub => {
      const device = sub.metadata?.device || 'Unknown';
      if (!devices[device]) {
        devices[device] = 0;
      }
      devices[device]++;
    });
    
    const deviceData = Object.entries(devices).map(([name, value]) => ({
      name,
      value
    }));
    
    // Submissions by day
    const dayCount = {};
    const days = differenceInDays(endDate, startDate) + 1;
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const day = format(addDays(startDate, i), 'yyyy-MM-dd');
      dayCount[day] = 0;
    }
    
    // Count submissions per day
    filteredSubmissions.forEach(sub => {
      const day = format(sub.createdAt.toDate(), 'yyyy-MM-dd');
      if (dayCount[day] !== undefined) {
        dayCount[day]++;
      }
    });
    
    const dailyData = Object.entries(dayCount).map(([date, count]) => ({
      date,
      count
    }));
    
    // Submissions by hour
    const hourCount = {};
    for (let i = 0; i < 24; i++) {
      hourCount[i] = 0;
    }
    
    filteredSubmissions.forEach(sub => {
      const hour = sub.createdAt.toDate().getHours();
      hourCount[hour]++;
    });
    
    const hourlyData = Object.entries(hourCount).map(([hour, count]) => ({
      hour: `${hour}:00`,
      count
    }));
    
    setStats({
      totalSubmissions: submissions.length,
      submissionsInRange: totalInRange,
      completionRate,
      averageSubmissionTime: avgTime,
      fieldsWithMostErrors: fieldErrors as Array<{field: string, errorCount: number}>,
      deviceBreakdown: deviceData as Array<{name: string, value: number}>,
      submissionsByDay: dailyData as Array<{date: string, count: number}>,
      submissionsByHour: hourlyData as Array<{hour: string, count: number}>
    });
  };
  
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0].toDate(), dates[1].toDate()]);
    }
  };
  
  const handleRefresh = () => {
    setLoading(true);
    // The real-time listener will update automatically, but this gives visual feedback
    setTimeout(() => setLoading(false), 500);
  };
  
  if (loading) {
    return (
      <Card className={styles.analyticsCard}>
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <Text>Loading analytics data...</Text>
        </div>
      </Card>
    );
  }
  
  if (submissions.length === 0) {
    return (
      <Card className={styles.analyticsCard}>
        <Empty 
          description="No form submissions yet" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <div className={styles.emptyStateMessage}>
          <Text type="secondary">
            Analytics will be available once your form receives submissions
          </Text>
        </div>
      </Card>
    );
  }
  
  return (
    <Card 
      className={styles.analyticsCard}
      title={
        <div className={styles.cardHeader}>
          <Space>
            <BarChartOutlined />
            <Title level={4} style={{ margin: 0 }}>Form Analytics</Title>
          </Space>
          <Space>
            <RangePicker 
              value={[
                dateRange[0] && format(dateRange[0], 'MMM dd, yyyy'), 
                dateRange[1] && format(dateRange[1], 'MMM dd, yyyy')
              ]}
              onChange={handleDateRangeChange}
            />
            <Tooltip title="Refresh data">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
              />
            </Tooltip>
          </Space>
        </div>
      }
    >
      <Row gutter={[16, 16]} className={styles.statsRow}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic 
              title="Total Submissions" 
              value={stats.totalSubmissions} 
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic 
              title="Completion Rate" 
              value={stats.completionRate} 
              precision={2}
              suffix="%" 
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic 
              title="Avg. Time to Complete" 
              value={stats.averageSubmissionTime} 
              precision={1}
              suffix="s" 
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard}>
            <Statistic 
              title="Submissions in Range" 
              value={stats.submissionsInRange} 
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Tabs defaultActiveKey="timeline" className={styles.chartsContainer}>
        <TabPane tab={<span><LineChartOutlined /> Submission Timeline</span>} key="timeline">
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.submissionsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MM/dd')}
                />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value, name) => [`${value} submissions`, 'Count']}
                  labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#0088FE" 
                  name="Submissions" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabPane>
        
        <TabPane tab={<span><BarChartOutlined /> Submissions by Hour</span>} key="hourly">
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.submissionsByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="Submissions" 
                  fill="#00C49F" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabPane>
        
        <TabPane tab={<span><PieChartOutlined /> Device Breakdown</span>} key="devices">
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.deviceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.deviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </TabPane>
        
        <TabPane tab={<span><InfoCircleOutlined /> Field Errors</span>} key="errors">
          {stats.fieldsWithMostErrors.length > 0 ? (
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={stats.fieldsWithMostErrors}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="fieldLabel" 
                    width={150}
                  />
                  <RechartsTooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    name="Error Count" 
                    fill="#FF8042" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty description="No field errors recorded" />
          )}
        </TabPane>
      </Tabs>
    </Card>
  );
} 