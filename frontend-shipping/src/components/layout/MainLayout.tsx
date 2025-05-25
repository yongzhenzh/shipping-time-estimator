import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import { 
  UserOutlined, 
  HomeOutlined, 
  MailOutlined, 
  LogoutOutlined, 
  HistoryOutlined, 
  ShoppingOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Footer } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'admin';

  const handleNavigate = (path: string) => {
    console.log(`Navigating to ${path}`);
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = path;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Profile
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo" style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
          Shipping Time Estimator
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          style={{ flex: 1, minWidth: 0, marginLeft: 20 }}
        >
          <Menu.Item key="/home" icon={<HomeOutlined />} onClick={() => handleNavigate('/home')}>
            Home
          </Menu.Item>
          <Menu.Item key="/shipping" icon={<MailOutlined />} onClick={() => handleNavigate('/shipping')}>
            Ship a Card
          </Menu.Item>
          <Menu.Item key="/orders" icon={<HistoryOutlined />} onClick={() => handleNavigate('/orders')}>
            Order History
          </Menu.Item>
          {isAdmin && (
            <Menu.Item key="/admin" icon={<ShoppingOutlined />} onClick={() => handleNavigate('/admin')}>
              Admin Panel
            </Menu.Item>
          )}
        </Menu>
        <Dropdown overlay={userMenu} trigger={['click']}>
          <a onClick={(e) => e.preventDefault()}>
            <Avatar icon={<UserOutlined />} />
          </a>
        </Dropdown>
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 20 }}>
        {children}
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Shipping Time Estimator ©{new Date().getFullYear()} Created by Your Team
      </Footer>
    </Layout>
  );
};

export default MainLayout;
