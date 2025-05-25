import React from 'react';
import { Form, Input, Button, Checkbox, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface LoginFormProps {
  onLogin: (values: { username: string; password: string }) => void;
  loading: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading }) => {
  const navigate = useNavigate();

  return (
    <Card style={{ maxWidth: 400, margin: '0 auto', marginTop: 50 }}>
      <Title level={2} style={{ textAlign: 'center' }}>Shipping Time Estimator</Title>
      <Form
        name="login"
        initialValues={{ remember: true }}
        onFinish={onLogin}
        autoComplete="off"
        layout="vertical"
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large">
            Log in
          </Button>
        </Form.Item>
        
        <div style={{ textAlign: 'center' }}>
          Don't have an account?{' '}
          <Button type="link" onClick={() => navigate('/register')} style={{ padding: 0 }}>
            Register now
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default LoginForm;
