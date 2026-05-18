import React from 'react';
import { Layout, Menu } from 'antd';
import { DashboardOutlined, ShoppingCartOutlined, ShopOutlined, DatabaseOutlined, FileDoneOutlined, LogoutOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import './Layout.css';

const { Header, Sider, Content } = Layout;

function LayoutComponent({ children }) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Dashboard</Link> },
    { key: '/customers', icon: <ShopOutlined />, label: <Link to="/customers">Customers</Link> },
    { key: '/products', icon: <DatabaseOutlined />, label: <Link to="/products">Products</Link> },
    { key: '/inventory', icon: <DatabaseOutlined />, label: <Link to="/inventory">Inventory</Link> },
    { key: '/sales-orders', icon: <ShoppingCartOutlined />, label: <Link to="/sales-orders">Sales Orders</Link> },
    { key: '/purchase-orders', icon: <FileDoneOutlined />, label: <Link to="/purchase-orders">Purchase Orders</Link> },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible>
        <div style={{ padding: '20px', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Sales & Warehouse Mgmt
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['/']} items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', paddingLeft: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: 0 }}>Inventory Management System</h2>
        </Header>
        <Content style={{ margin: '0', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default LayoutComponent;
