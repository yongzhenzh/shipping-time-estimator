import React from 'react';
import { Typography, Card, Button, Row, Col, Statistic } from 'antd';
import { MailOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div style={{ padding: '20px 0' }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={12}>
            <Title>Shipping Time Estimator</Title>
            <Paragraph style={{ fontSize: '16px' }}>
              Never miss an important event again! Our shipping time estimator helps you
              determine the optimal time to send greeting cards based on delivery routes,
              lead times, and shipping methods.
            </Paragraph>
            <Button 
              type="primary" 
              size="large" 
              icon={<MailOutlined />} 
              onClick={() => navigate('/shipping')}
            >
              Send a Card
            </Button>
          </Col>
          <Col xs={24} md={12}>
            <img 
              src="https://via.placeholder.com/500x300" 
              alt="Shipping illustration" 
              style={{ width: '100%', height: 'auto' }} 
            />
          </Col>
        </Row>

        <div style={{ margin: '40px 0' }}>
          <Title level={2}>How It Works</Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic 
                  title="Step 1: Enter Event Details" 
                  value="1" 
                  prefix={<CalendarOutlined />} 
                />
                <Paragraph style={{ marginTop: 16 }}>
                  Tell us about the occasion and when it's happening
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic 
                  title="Step 2: Shipping Information" 
                  value="2" 
                  prefix={<MailOutlined />} 
                />
                <Paragraph style={{ marginTop: 16 }}>
                  Provide shipping details and choose your preferred method
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic 
                  title="Step 3: Get Your Timeline" 
                  value="3" 
                  prefix={<ClockCircleOutlined />} 
                />
                <Paragraph style={{ marginTop: 16 }}>
                  We'll tell you exactly when to order to ensure on-time delivery
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </MainLayout>
  );
};

export default HomePage;
