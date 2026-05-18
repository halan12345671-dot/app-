import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [searchParams] = useSearchParams();

  // Xử lý login thành công từ Google callback
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const firstName = searchParams.get('first_name');
  const lastName = searchParams.get('last_name');
  const role = searchParams.get('role');

  useEffect(() => {
    if (token && email) {
      const user = { email, first_name: firstName, last_name: lastName, role };
      login(user, token);
      message.success('Login with Google successful!');
      navigate('/', { replace: true });
    }
  }, [token, email, firstName, lastName, role, login, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', values);
      const { token, user } = response.data;
      login(user, token);
      message.success('Login successful');
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <h1>Sales & Warehouse Management</h1>

        {/* Nút Login Google */}
        <Button
          type="default"
          icon={<GoogleOutlined />}
          block
          size="large"
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </Button>

        <Divider plain>OR</Divider>

        {/* Form đăng nhập email/password */}
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            rules={[{ required: true, message: 'Please enter your email' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Login
          </Button>
        </Form>

        <div className="register-link">
          Don't have an account? <a onClick={handleRegister}>Register here</a>
        </div>
      </Card>
    </div>
  );
}

export default Login;