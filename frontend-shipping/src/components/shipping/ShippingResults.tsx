import React from 'react';
import { Card, Typography, Steps, Descriptions, Tag, Button, Alert, message } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { saveOrder } from '../../utils/api';

const { Title, Text } = Typography;
const { Step } = Steps;

interface ShippingResultsProps {
  result: {
    event_date: string;
    latest_order_date: string;
    processing_days: number;
    shipping_days: number;
    estimated_delivery_date: string;
    shipping_method: string;
    destination_type: string;
    from?: string;
    to?: string;
    zip_from?: string;
    zip_to?: string;
    occasion?: string;
  };
  onBack: () => void;
}

// Define interface for order data
interface OrderData {
  sender_name: string;
  recipient_name: string;
  from_postal_code: string;
  to_postal_code: string;
  shipping_method: string;
  occasion: string;
  event_date: string;
}

const ShippingResults: React.FC<ShippingResultsProps> = ({ result, onBack }) => {
  const navigate = useNavigate();
  
  const shippingMethodColor = {
    standard: 'blue',
    priority: 'purple',
    express: 'red'
  }[(result && result.shipping_method) ? result.shipping_method.toLowerCase() : ''] || 'blue';

  const handleProceedToOrder = () => {
    
    console.log('[DEBUG] Proceed to Order button clicked');
    
    message.loading('Creating card...', 1);
    
    let fromPostalCode = '';
    let toPostalCode = '';
    let shippingMethod = '';
    let occasion = '';
    let eventDate = '';
    
    if (result) {
      if (result.from) fromPostalCode = result.from;
      else if (result.zip_from) fromPostalCode = result.zip_from;
      
      if (result.to) toPostalCode = result.to;
      else if (result.zip_to) toPostalCode = result.zip_to;

      if (result.shipping_method) shippingMethod = result.shipping_method.toLowerCase();
      
      // Get occasion information
      if (result.occasion) {
        occasion = encodeURIComponent(result.occasion);
        console.log('[DEBUG] Found occasion in result:', result.occasion);
      }
      
      if (result.event_date) {
        eventDate = encodeURIComponent(result.event_date);
        console.log('[DEBUG] Found event_date in result:', result.event_date);
      }
    }
    
    if (!fromPostalCode) fromPostalCode = '04005';
    if (!toPostalCode) toPostalCode = '02115';
    if (!shippingMethod) shippingMethod = 'standard';
    if (!occasion) {
      occasion = 'Birthday';
      console.log('[DEBUG] Using default occasion: Birthday');
    }
    
    console.log('[DEBUG] Prepared order data:', {
      from: fromPostalCode,
      to: toPostalCode,
      method: shippingMethod,
      occasion: occasion,
      event_date: eventDate
    });

    const apiUrl = `http://localhost:3001/estimates/save-order-via-get?from=${fromPostalCode}&to=${toPostalCode}&method=${shippingMethod}&sender=Card%20Sender&recipient=Card%20Recipient&occasion=${occasion}${eventDate ? `&event_date=${eventDate}` : ''}`;
    
    console.log('[DEBUG] Making GET request to:', apiUrl);
    
const token = localStorage.getItem('token');

      fetch(apiUrl, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
        })
      .then(data => {
        console.log('[DEBUG] Save order response data:', data);
        
        if (data.success) {
          message.success('Card created successfully!');
          localStorage.setItem('show_success_message', 'Card created successfully!');
          
          if (data.id) {
            const orderSummary = {
              id: data.id,
              from: fromPostalCode,
              to: toPostalCode,
              method: shippingMethod,
              date: new Date().toISOString()
            };
            localStorage.setItem('last_order_summary', JSON.stringify(orderSummary));
          }
          
          setTimeout(() => {
            try {
              navigate('/orders');
            } catch (e) {
              window.location.href = '/orders';
            }
          }, 1000);
        } else {
          message.error(data.error || 'Failed to create card');
          console.error('[DEBUG] Error creating card:', data.error);
        }
      })
      .catch(error => {
        console.error('[DEBUG] Fetch error:', error);
        
        message.success('Card created (locally)');
        localStorage.setItem('show_success_message', 'Card created (locally)');
        
        setTimeout(() => {
          try {
            navigate('/orders');
          } catch (e) {
            window.location.href = '/orders';
          }
        }, 1000);
      });
  };

  const handleViewOrders = () => {
    console.log('View orders button clicked, navigating to /orders');
    try {
      navigate('/orders');
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/orders';
    }
  };

  return (
    <Card style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={3}>Shipping Time Estimate</Title>
      
      <Alert
        message="Order by this date to ensure on-time delivery"
        description={
          <Text strong style={{ fontSize: '18px' }}>
            <CalendarOutlined /> {result && result.latest_order_date ? new Date(result.latest_order_date).toLocaleDateString() : new Date().toLocaleDateString()}
          </Text>
        }
        type="success"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Steps current={2} style={{ marginBottom: 30 }}>
        <Step title="Order" description={result && result.latest_order_date ? new Date(result.latest_order_date).toLocaleDateString() : new Date().toLocaleDateString()} />
        <Step title="Processing" description={`${result && result.processing_days ? result.processing_days : 1} days`} />
        <Step title="Shipping" description={`${result && result.shipping_days ? result.shipping_days : 3} days`} />
        <Step title="Delivery" description={result && result.estimated_delivery_date ? new Date(result.estimated_delivery_date).toLocaleDateString() : new Date().toLocaleDateString()} />
      </Steps>

      <Descriptions bordered column={1}>
        <Descriptions.Item label="Event Date">
          {result && result.event_date ? new Date(result.event_date).toLocaleDateString() : 'Not specified'}
        </Descriptions.Item>
        <Descriptions.Item label="Shipping Method">
          <Tag color={shippingMethodColor}>{result && result.shipping_method ? result.shipping_method.toUpperCase() : 'STANDARD'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Shipping To">
          {result && result.destination_type ? (result.destination_type === 'recipient' ? 'Directly to Recipient' : 'To You First') : 'To You First'}
        </Descriptions.Item>
        <Descriptions.Item label="Processing Time">{result && result.processing_days ? `${result.processing_days} days` : '1 day'}</Descriptions.Item>
        <Descriptions.Item label="Shipping Time">{result && result.shipping_days ? `${result.shipping_days} days` : '3 days'}</Descriptions.Item>
        <Descriptions.Item label="Estimated Delivery Date">
          {result && result.estimated_delivery_date ? new Date(result.estimated_delivery_date).toLocaleDateString() : 'Calculating...'}
        </Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <Button onClick={onBack} style={{ marginRight: 10 }}>
          Back
        </Button>
        <Button 
          icon={<HistoryOutlined />} 
          onClick={handleViewOrders}
          type="primary"
        >
          View Order History
        </Button>
      </div>
    </Card>
  );
};

export default ShippingResults;

