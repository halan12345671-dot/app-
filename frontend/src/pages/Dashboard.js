import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tabs } from 'antd';
import { ShoppingCartOutlined, ShopOutlined, UserOutlined, DatabaseOutlined } from '@ant-design/icons';
import apiClient from '../api/apiClient';

function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    activeOrders: 0,
    inventoryValue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [customersRes, productsRes, ordersRes, inventoryRes] = await Promise.all([
        apiClient.get('/customers', { params: { limit: 1 } }),
        apiClient.get('/products', { params: { limit: 1 } }),
        apiClient.get('/sales-orders', { params: { limit: 10 } }),
        apiClient.get('/inventory', { params: { limit: 1000 } }),
      ]);

      const customers = customersRes.data?.pagination?.total || customersRes.data?.length || 0;
      const products = productsRes.data?.pagination?.total || productsRes.data?.length || 0;
      const orders = ordersRes.data?.data || ordersRes.data || [];
      const inventory = inventoryRes.data?.data || inventoryRes.data || [];

      const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;
      const inventoryValue = inventory.reduce((sum, inv) => {
        const product = inv.Product || { unit_price: 0 };
        return sum + (inv.qty_on_hand * product.unit_price);
      }, 0);

      setStats({
        totalCustomers: customers,
        totalProducts: products,
        activeOrders: activeOrders,
        inventoryValue: inventoryValue,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'order_number',
      key: 'order_number',
    },
    {
      title: 'Customer',
      dataIndex: ['Customer', 'company_name'],
      key: 'customer',
      render: (text, record) => record.Customer?.company_name || 'N/A',
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total',
      render: (total) => `$${total?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          pending: '#1890ff',
          confirmed: '#faad14',
          shipped: '#1890ff',
          delivered: '#52c41a',
          cancelled: '#f5222d',
        };
        return <span style={{ color: colors[status] || '#000' }}>{status}</span>;
      },
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '24px' }}>Dashboard</h1>
      
      <Row gutter={16} style={{ marginBottom: '30px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Customers"
              value={stats.totalCustomers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Products"
              value={stats.totalProducts}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Active Orders"
              value={stats.activeOrders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Inventory Value"
              value={stats.inventoryValue}
              prefix={<DatabaseOutlined />}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Sales Orders" loading={loading}>
        <Table
          columns={columns}
          dataSource={recentOrders}
          pagination={false}
          rowKey="id"
          size="small"
        />
      </Card>
    </div>
  );
}

export default Dashboard;
