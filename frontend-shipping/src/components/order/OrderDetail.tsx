import React from 'react';
import { Card, Descriptions, Tag, Steps, Button, Typography, Divider, Row, Col } from 'antd';
import { MailOutlined, CheckCircleOutlined, ClockCircleOutlined, TruckOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons';

const { Step } = Steps;
const { Title, Text } = Typography;

interface OrderDetailProps {
  order: any;
  onBack: () => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ order, onBack }) => {
  // Process order status
  const currentStep = order.status === 'Processing' ? 0 : 
                     order.status === 'Shipped' ? 1 : 
                     order.status === 'Delivered' ? 2 : 0;
  
  // Extract shipping cost from order data - handle different possible formats
  let shippingCost = '$0.00';
  try {
    if (order.rates && order.rates[0] && order.rates[0].amount) {
      shippingCost = `$${Number(order.rates[0].amount).toFixed(2)} ${order.rates[0].currency.toUpperCase()}`;
    } else if (order.amount && !isNaN(Number(order.amount))) {
      shippingCost = `$${Number(order.amount).toFixed(2)}`;
    } else if (order.original && order.original.amount) {
      shippingCost = `$${Number(order.original.amount).toFixed(2)}`;
    }
  } catch (e) {
    console.error('Error formatting shipping cost:', e);
  }
  
  // Format dates for better readability
  const orderDate = order.date ? new Date(order.date).toLocaleString() : 
                   order.ordered_date ? new Date(order.ordered_date).toLocaleString() : 'N/A';
  
  // Get event date from multiple possible sources
  let eventDate = 'Not specified';
  try {
    if (order.event_date) {
      eventDate = new Date(order.event_date).toLocaleDateString();
    } else if (order.delivery_date) {
      eventDate = new Date(order.delivery_date).toLocaleDateString();
    } else if (order.original && order.original.event_date) {
      eventDate = new Date(order.original.event_date).toLocaleDateString();
    } else if (order.timeline && order.timeline.order_by_date) {
      eventDate = new Date(order.timeline.order_by_date).toLocaleDateString();
    }
  } catch (e) {
    console.error('Error formatting event date:', e);
  }
  
  // Get occasion from multiple possible sources                
  const occasion = order.occasion || 
                  (order.original ? order.original.occasion : null) || 
                  'Not specified';
  
  // Get shipping method
  const shippingMethod = order.deliveryMethod || 
                        order.shipping_method || 
                        (order.original ? order.original.shipping_method : null) || 
                        'Standard';
                     
  // Get estimated delivery date
  const estimatedDelivery = order.estimatedDelivery ? order.estimatedDelivery :
                           order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() :
                           (order.timeline && order.timeline.estimated_delivery_date ? 
                            new Date(order.timeline.estimated_delivery_date).toLocaleDateString() : 
                            'Calculating...');
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return 'blue';
      case 'Shipped': return 'green';
      case 'Delivered': return 'green';
      case 'Cancelled': return 'red';
      default: return 'gold';
    }
  };

  return (
    <div>
      <Button type="primary" onClick={onBack} style={{ marginBottom: 16 }}>
        Back to Order List
      </Button>
      
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4}>Order {order.id}</Title>
          <Tag color={getStatusColor(order.status || 'Processing')}>{(order.status || 'Processing').toUpperCase()}</Tag>
        </div>
        
        <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}>
          <Descriptions.Item label="Order Date">{orderDate}</Descriptions.Item>
          <Descriptions.Item label="Event Date" span={1}>
            <CalendarOutlined style={{ marginRight: 8 }} />{eventDate}
          </Descriptions.Item>
          <Descriptions.Item label="Occasion" span={1}>{occasion}</Descriptions.Item>
          <Descriptions.Item label="Shipping Cost" span={1}>{shippingCost}</Descriptions.Item>
          <Descriptions.Item label="Shipping Method">{shippingMethod}</Descriptions.Item>
          <Descriptions.Item label="Estimated Delivery">{estimatedDelivery}</Descriptions.Item>
          <Descriptions.Item label="From" span={2}>{order.from}</Descriptions.Item>
          <Descriptions.Item label="To" span={2}>{order.to}</Descriptions.Item>
        </Descriptions>
        
        <Divider />
        
        <Title level={5}>Delivery Status</Title>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Processing" icon={<ClockCircleOutlined />} description="Order is being processed" />
          <Step title="Shipped" icon={<TruckOutlined />} description="Package is on its way" />
          <Step title="Delivered" icon={<HomeOutlined />} description="Package has been delivered" />
        </Steps>
        
        <Divider />
        
        <Row gutter={24}>
          <Col xs={24} sm={24} md={12}>
            <Card title="Sender Information" size="small">
              <p><strong>Name:</strong> {order.sender_name || 'Customer'}</p>
              <p><strong>Zip Code:</strong> {order.from}</p>
              <p><strong>Order Date:</strong> {orderDate}</p>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={12}>
            <Card title="Recipient Information" size="small">
              <p><strong>Name:</strong> {order.recipient_name || 'Recipient'}</p>
              <p><strong>Zip Code:</strong> {order.to}</p>
              <p><strong>Event Date:</strong> {eventDate}</p>
            </Card>
          </Col>
        </Row>
        
        <Divider />
        
        <Card title="Shipping Information" size="small">
          <p><strong>Card Type:</strong> Standard Greeting Card</p>
          <p><strong>Weight:</strong> 4 oz</p>
          <p><strong>Shipping Method:</strong> {shippingMethod}</p>
          <p><strong>Shipping Cost:</strong> {shippingCost}</p>
          <p><strong>Processing Time:</strong> 1 day(s)</p>
          <p><strong>Delivery Time:</strong> 3 day(s)</p>
        </Card>
        
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="default" onClick={onBack} style={{ marginRight: 8 }}>
            Back to Orders
          </Button>
          <Button type="primary">
            Track Package
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default OrderDetail; 