import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Card, Typography, Empty, Spin, Alert, message } from 'antd';
import { EyeOutlined, FileSearchOutlined, PlusOutlined } from '@ant-design/icons';
import { getShippingHistory } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import type { ColumnType, ColumnGroupType } from 'antd/es/table';
import type { Breakpoint } from 'antd/es/_util/responsiveObserver';

const { Title } = Typography;

interface OrderListProps {
  onViewDetail: (orderId: string) => void;
  initialOrders?: any[];
  isLoading?: boolean;
  errorMessage?: string | null;
  onRefresh?: () => void;
}

interface OrderDataFromLocalStorage {
  sender_name: string;
  recipient_name: string;
  from_postal_code: string;
  to_postal_code: string;
  shipping_method: string;
  occasion: string;
  event_date: string;
}

const OrderList: React.FC<OrderListProps> = ({ 
  onViewDetail,
  initialOrders,
  isLoading,
  errorMessage,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(isLoading || false);
  const [orders, setOrders] = useState<any[]>(initialOrders || []);
  const [error, setError] = useState<string | null>(errorMessage || null);

  // Update state when props change
  useEffect(() => {
    if (initialOrders) {
      setOrders(initialOrders);
    }
    if (isLoading !== undefined) {
      setLoading(isLoading);
    }
    if (errorMessage !== undefined) {
      setError(errorMessage);
    }
  }, [initialOrders, isLoading, errorMessage]);

  const saveOrderToBackend = async (orderData: OrderDataFromLocalStorage): Promise<boolean> => {
    try {
      console.log('Attempting to save order to backend:', orderData);
      
      // Use the full URL including protocol and port
      const apiUrl = 'http://localhost:3001/estimates/save-order';
      console.log('Using full URL for API call:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Order saved to backend successfully:', responseData);
        
        // Refresh the orders list after saving
        fetchOrders();
        return true;
      } else {
        console.error('Failed to save order to backend:', response.status);
        // Try to parse error message
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
        return false;
      }
    } catch (error) {
      console.error('Error saving order to backend:', error);
      return false;
    }
  };

  useEffect(() => {
    // Show success message if it exists in localStorage
    const successMessage = localStorage.getItem('show_success_message');
    if (successMessage) {
      message.success(successMessage);
      localStorage.removeItem('show_success_message');
    }
    
    const hasAlreadyFetched = sessionStorage.getItem('orders_fetched_timestamp');
    const currentTime = Date.now();
    
    if (!hasAlreadyFetched || (currentTime - parseInt(hasAlreadyFetched)) > 5000) {
      console.log('Fetching orders with throttling control');
      fetchOrders();
      sessionStorage.setItem('orders_fetched_timestamp', currentTime.toString());
    } else {
      console.log('Skipping fetchOrders due to throttling, last fetch was', 
        Math.floor((currentTime - parseInt(hasAlreadyFetched)) / 1000), 'seconds ago');
    }
    
    // Check if there's order data in localStorage from a recent creation
    const lastOrderData = localStorage.getItem('last_order_data');
    if (lastOrderData) {
      try {
        console.log('Found last order data in localStorage:', lastOrderData);
        const orderData = JSON.parse(lastOrderData) as OrderDataFromLocalStorage;
        
        // Create a mock order from the localStorage data
        const mockOrder = {
          key: `order-local-${Date.now()}`,
          id: `SHP-${10000 + Math.floor(Math.random() * 1000)}`,
          date: new Date().toLocaleDateString(),
          from: orderData.from_postal_code || 'Unknown',
          to: orderData.to_postal_code || 'Unknown',
          amount: 25.99,
          status: 'Processing',
          deliveryMethod: orderData.shipping_method || 'Standard',
          estimatedDelivery: '3 day(s)'
        };
        
        console.log('Created mock order:', mockOrder);
        setOrders([mockOrder]);
        
        saveOrderToBackend(orderData);
        
        // Clear the localStorage data so it doesn't show up again on refresh
        localStorage.removeItem('last_order_data');
      } catch (error) {
        console.error('Error parsing last order data:', error);
      }
    }
  }, []);

  const handleCreateNewCard = () => {
    console.log('Navigating to shipping form...');
    try {
      navigate('/shipping');
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/shipping';
    }
  };

  const fetchOrders = async () => {
    if (loading) {
      console.log('Already loading orders, skipping duplicate request');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting to fetch orders...');
      
      // Get order history
      try {
        const data = await getShippingHistory();
        console.log('Fetched order history data:', data);
        
        if (!data) {
          console.error('No data returned from getShippingHistory');
          setError('Failed to load order history: No data returned');
          setOrders([]);
          setLoading(false);
          return;
        }
        
        if (!Array.isArray(data)) {
          console.error('Invalid response format - not an array:', data);
          setError('Failed to load order history: Invalid response format');
          setOrders([]);
          setLoading(false);
          return;
        }
        
        if (data.length === 0) {
          console.log('No orders found - empty array');
          setOrders([]);
          setLoading(false);
          return;
        }
        
        console.log('Processing orders data, length:', data.length);
        
        // Transform data for display
        const formattedOrders = data.map((order, index) => {
          console.log(`Processing order ${index}:`, order);
          
          if (!order || typeof order !== 'object') {
            console.warn(`Invalid order at index ${index}, using default placeholder`);
            return {
              key: `placeholder-${index}-${Date.now()}`,
              id: `SHP-${10000 + index}`,
              date: safeDate(new Date()),
              from: 'Unknown',
              to: 'Unknown',
              amount: 0,
              status: 'Pending',
              deliveryMethod: 'Standard',
              estimatedDelivery: 'Calculating...',
              event_date: 'Not specified',
              occasion: 'Not specified',
              sender_name: 'Customer',
              recipient_name: 'Recipient',
              shipping_method: 'Standard',
              original: {}
            };
          }
          
          // Extract shipping cost - handle different possible formats
          let shippingAmount = 0;
          if (order.rates && Array.isArray(order.rates) && order.rates[0] && order.rates[0].amount) {
            shippingAmount = order.rates[0].amount;
          } else if (order.amount && !isNaN(order.amount)) {
            shippingAmount = order.amount;
          } else {
            shippingAmount = 15.99; // Default fallback
          }
          
          // Get occasion and event date with fallbacks
          const occasion = order.occasion || 'Not specified';
          
          // Handle different date formats
          let eventDate = 'Not specified';
          try {
            if (order.event_date) {
              eventDate = new Date(order.event_date).toLocaleDateString();
            } else if (order.delivery_date) {
              eventDate = new Date(order.delivery_date).toLocaleDateString();
            }
          } catch (e) {
            console.error('Error formatting date:', e);
          }
          
          // Extract ID, with fallback to database ID
          const orderId = (order.id && typeof order.id === 'string') ? 
                         order.id : 
                         `SHP-${order.id || (10000 + index)}`;
          
          const uniqueKey = `order-${orderId}-${index}-${Date.now().toString().slice(-6)}`;
          
          return {
            key: uniqueKey,
            id: orderId,
            date: order.ordered_date ? 
                safeDate(order.ordered_date) : 
                safeDate(order.date || Date.now()),
            from: order.zip_from || order.from || 'Unknown',
            to: order.zip_to || order.to || 'Unknown',
            amount: shippingAmount,
            status: order.status || 'Processing',
            deliveryMethod: order.shipping_method || 
                          (order.rates && order.rates[0] ? order.rates[0].service : 'Standard'),
            estimatedDelivery: '3 day(s)',
            event_date: eventDate,
            occasion: occasion,
            sender_name: order.sender_name || 'Customer',
            recipient_name: order.recipient_name || 'Recipient',
            shipping_method: order.shipping_method || 'Standard',
            original: order
          };
        });
        
        function safeDate(dateInput: any): string {
          try {
            if (!dateInput) return new Date().toLocaleString();
            
            const date = new Date(dateInput);
            return date.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              timeZoneName: 'short'
            });
          } catch (e) {
            console.error('Error formatting date:', e, dateInput);
            return new Date().toLocaleString();
          }
        }
        
        console.log('Formatted orders:', formattedOrders);
        setOrders(formattedOrders);
      } catch (apiError: any) {
        console.error('API error fetching orders:', apiError);
        if (apiError.message && apiError.message.includes('ECONNREFUSED')) {
          setError('Cannot connect to server. Please ensure the backend server is running.');
        } else {
          setError(`Failed to load order history: ${apiError.message || 'Unknown error'}`);
        }
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch order history:', error);
      setError('Failed to load order history: Network error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchOrders();
    }
  };

  const columns: (ColumnGroupType<any> | ColumnType<any>)[] = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Event',
      dataIndex: 'event_date',
      key: 'event_date',
      responsive: ['md' as Breakpoint],
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
    },
    {
      title: 'Shipping Cost',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `$${Number(amount || 0).toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Processing' ? 'blue' : status === 'Shipped' ? 'green' : 'default'}>
          {status ? status.toUpperCase() : 'PENDING'}
        </Tag>
      ),
    },
    {
      title: 'Shipping Method',
      dataIndex: 'deliveryMethod',
      key: 'deliveryMethod',
      responsive: ['lg' as Breakpoint],
    },
    {
      title: 'Est. Delivery',
      dataIndex: 'estimatedDelivery',
      key: 'estimatedDelivery',
      responsive: ['md' as Breakpoint],
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => onViewDetail(record.id)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  const safeOrders = orders.map((order, index) => {
    const uniqueKey = order.key || order.id || `order-${index}-${Date.now()}`;
    
    return {
      ...order,
      key: uniqueKey,
      id: order.id || `SHP-${10000 + index}`,
      status: order.status || 'Pending',
      date: order.date || new Date().toLocaleDateString(),
      from: order.from || 'N/A',
      to: order.to || 'N/A',
      amount: order.amount || 0,
      deliveryMethod: order.deliveryMethod || 'Standard',
      estimatedDelivery: order.estimatedDelivery || 'Calculating...',
      event_date: order.event_date || 'Not specified',
      occasion: order.occasion || 'Not specified'
    };
  });

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>Your Orders</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreateNewCard}
          >
            Ship a New Card
          </Button>
          <Button type="default" onClick={handleRefresh}>Refresh</Button>
        </Space>
      </div>
      
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      
      {loading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin tip="Loading orders..." />
        </div>
      ) : orders.length > 0 ? (
        <Table 
          columns={columns} 
          dataSource={safeOrders} 
          loading={loading}
          pagination={{ 
            defaultPageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total) => `Total ${total} orders`
          }}
          rowKey={record => record.key || record.id || Math.random().toString()}
        />
      ) : (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="No orders found"
          style={{ margin: '40px 0' }}
        />
      )}
    </Card>
  );
};

export default OrderList; 
