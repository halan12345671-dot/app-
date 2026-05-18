import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Tag, Statistic, Alert, Spin, Button, Space, Progress, Tooltip } from 'antd';
import { WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined, ShoppingOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import apiClient from '../api/apiClient';
import dayjs from 'dayjs';

function AIDashboard() {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/ai/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Error fetching AI dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'red',
      urgent: 'red',
      high: 'orange',
      medium: 'blue',
      normal: 'default',
      low: 'green'
    };
    return colors[priority] || 'default';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'high': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'medium': return <WarningOutlined style={{ color: '#1890ff' }} />;
      default: return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const reorderColumns = [
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
    },
    { title: 'Product', dataIndex: 'product_name', key: 'product_name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    {
      title: 'Current Stock',
      dataIndex: 'current_stock',
      key: 'current_stock',
      width: 120,
      align: 'right'
    },
    {
      title: 'Predicted Demand (30d)',
      dataIndex: 'predicted_demand',
      key: 'predicted_demand',
      width: 150,
      align: 'right'
    },
    {
      title: 'Suggested Order Qty',
      dataIndex: 'suggested_order_quantity',
      key: 'suggested_order_quantity',
      width: 150,
      align: 'right',
      render: (qty) => <strong style={{ color: '#1890ff' }}>{qty}</strong>
    },
    {
      title: 'Days Until Stockout',
      dataIndex: 'days_until_stockout',
      key: 'days_until_stockout',
      width: 140,
      align: 'right',
      render: (days) => days === Infinity ? 'N/A' : `${days} days`
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      width: 100,
      render: (trend) => {
        const icons = {
          increasing: <RiseOutlined style={{ color: '#52c41a' }} />,
          decreasing: <FallOutlined style={{ color: '#ff4d4f' }} />,
          stable: <span style={{ color: '#1890ff' }}>→</span>
        };
        return (
          <Space>
            {icons[trend]}
            <span>{trend}</span>
          </Space>
        );
      }
    }
  ];

  const orderColumns = [
    { title: 'Order #', dataIndex: 'order_number', key: 'order_number', width: 120 },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      align: 'right',
      render: (amount) => `$${amount?.toFixed(2) || '0.00'}`
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: 'Days Left',
      dataIndex: 'days_until_due',
      key: 'days_until_due',
      width: 100,
      align: 'right',
      render: (days) => (
        <Tag color={days <= 3 ? 'red' : days <= 7 ? 'orange' : 'blue'}>
          {days} days
        </Tag>
      )
    },
    {
      title: 'AI Score',
      dataIndex: 'ai_score',
      key: 'ai_score',
      width: 120,
      align: 'center',
      render: (score) => (
        <Tooltip title={`Priority score: ${score}/100`}>
          <Progress
            type="circle"
            percent={score}
            size={40}
            strokeColor={score >= 80 ? '#ff4d4f' : score >= 60 ? '#faad14' : '#52c41a'}
          />
        </Tooltip>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
    },
    {
      title: 'Inventory Risk',
      dataIndex: 'inventory_risk',
      key: 'inventory_risk',
      width: 120,
      render: (risk) => (
        <Tag color={risk === 'High' ? 'red' : 'green'}>{risk}</Tag>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spin size="large" tip="AI is analyzing your data..." />
      </div>
    );
  }

  if (!dashboard) {
    return <Alert message="Error" description="Failed to load AI dashboard" type="error" />;
  }

  const { reorder_suggestions, order_priorities, inventory_health } = dashboard;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>AI Management Dashboard</h1>
        <Button type="primary" icon={<ReloadOutlined />} onClick={fetchDashboard}>
          Refresh Analysis
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Inventory Value"
              value={inventory_health.total_inventory_value}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Healthy Products"
              value={inventory_health.health_summary.healthy}
              suffix={`/ ${inventory_health.total_products}`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={inventory_health.health_summary.low_stock}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Orders"
              value={order_priorities.total_count}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {inventory_health.alerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2>Inventory Alerts</h2>
          <Space direction="vertical" style={{ width: '100%' }}>
            {inventory_health.alerts.slice(0, 10).map((alert, index) => (
              <Alert
                key={index}
                message={alert.message}
                description={
                  <div>
                    <p><strong>Action:</strong> {alert.recommended_action}</p>
                  </div>
                }
                type={alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info'}
                icon={getSeverityIcon(alert.severity)}
                showIcon
                style={{ marginBottom: '8px' }}
              />
            ))}
          </Space>
        </div>
      )}

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="AI Order Prioritization" style={{ marginBottom: '16px' }}>
            <Table
              columns={orderColumns}
              dataSource={order_priorities.orders}
              rowKey="order_id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200 }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="AI Reorder Suggestions">
            {reorder_suggestions.suggestions.length > 0 ? (
              <Table
                columns={reorderColumns}
                dataSource={reorder_suggestions.suggestions}
                rowKey="product_id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
              />
            ) : (
              <Alert
                message="All Stock Levels Healthy"
                description="No reorder suggestions at this time. All products have sufficient inventory."
                type="success"
                showIcon
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AIDashboard;
