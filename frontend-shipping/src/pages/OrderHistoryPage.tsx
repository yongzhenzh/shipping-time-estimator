import React, { useState, useEffect, ErrorInfo, Component } from 'react';
import MainLayout from '../components/layout/MainLayout';
import OrderList from '../components/order/OrderList';
import OrderDetail from '../components/order/OrderDetail';
import { getShippingHistory } from '../utils/api';
import { Alert, Button, Space } from 'antd';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Alert
            message="Error Occurred"
            description={
              <div>
                <p>Something went wrong while displaying this component.</p>
                <p>{this.state.error?.toString()}</p>
                <Space>
                  <Button onClick={this.resetError} type="primary">
                    Try Again
                  </Button>
                  <Button onClick={() => window.location.reload()}>
                    Reload Page
                  </Button>
                </Space>
              </div>
            }
            type="error"
            showIcon
          />
        </div>
      );
    }

    return this.props.children;
  }
}

const OrderHistoryPage: React.FC = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>(() => {
    try {
      const cachedOrders = sessionStorage.getItem('shipping_history_cache');
      if (cachedOrders) {
        const parsedData = JSON.parse(cachedOrders);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          console.log('Initializing with cached orders:', parsedData.length);
          return parsedData;
        }
      }
    } catch (e) {
      console.error('Failed to load cached orders during initialization:', e);
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const persistOrdersToSessionStorage = (orderData: any[]) => {
    if (Array.isArray(orderData) && orderData.length > 0) {
      try {
        sessionStorage.setItem('shipping_history_cache', JSON.stringify(orderData));
        console.log('Orders persisted to session storage:', orderData.length);
      } catch (e) {
        console.error('Failed to persist orders to session storage:', e);
      }
    }
  };

  // Fetch orders when component mounts
  useEffect(() => {
    console.log('OrderHistoryPage useEffect triggered');
    const lastFetchTime = sessionStorage.getItem('order_page_last_fetch');
    const currentTime = Date.now();
    
    if (!lastFetchTime || (currentTime - parseInt(lastFetchTime)) > 5000) {
      console.log('Fetching orders with debounce control');
      fetchOrders();
      sessionStorage.setItem('order_page_last_fetch', currentTime.toString());
    } else {
      console.log('Skipping initial fetch due to debounce, last fetch was', 
        Math.floor((currentTime - parseInt(lastFetchTime)) / 1000), 'seconds ago');
      
      const cachedOrders = sessionStorage.getItem('shipping_history_cache');
      if (cachedOrders) {
        try {
          const parsedOrders = JSON.parse(cachedOrders);
          if (Array.isArray(parsedOrders)) {
            console.log('Using cached orders from session storage');
            setOrders(parsedOrders);
          }
        } catch (e) {
          console.error('Error parsing cached orders:', e);
        }
      }
    }
    
    return () => {
      console.log('OrderHistoryPage unmounting');
    };
  }, []);

  const fetchOrders = async () => {
    const shouldShowLoading = orders.length === 0;
    if (shouldShowLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const data = await getShippingHistory();
      console.log('Fetched orders in OrderHistoryPage:', data);
      if (Array.isArray(data) && data.length > 0) {
        const safeData = data.map((order, index) => {
          if (!order || typeof order !== 'object') {
            return {
              id: `SHP-${10000 + index}`,
            };
          }
          return order;
        });
        
        setOrders(safeData);
        persistOrdersToSessionStorage(safeData);
      } else if (orders.length === 0) {
        setOrders([]);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (orders.length === 0) {
        setError(error.message || 'Failed to load orders');
      }
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  };

  const handleViewDetail = (orderId: string) => {
    console.log('Viewing order details for ID:', orderId);
    
    // Find the order in our loaded orders
    const foundOrder = orders.find(order => order.id === orderId);
    
    if (foundOrder) {
      console.log('Found order details:', foundOrder);
      setSelectedOrder(foundOrder);
    } else {
      // If not found (e.g. client-side only order), create a mock one
      console.log('Order not found in history, using mock data');
      const mockOrder = {
        id: orderId,
        date: new Date().toLocaleDateString(),
        from: 'Unknown origin',
        to: 'Unknown destination',
        amount: 0,
        status: 'Processing',
        deliveryMethod: 'Standard',
        estimatedDelivery: 'Calculating...'
      };
      setSelectedOrder(mockOrder);
    }
    
    setSelectedOrderId(orderId);
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
    setSelectedOrder(null);
    // Refresh the order list when returning to it
    fetchOrders();
  };

  return (
    <MainLayout>
      <ErrorBoundary>
        {selectedOrderId ? (
          <OrderDetail order={selectedOrder} onBack={handleBackToList} />
        ) : (
          <OrderList 
            onViewDetail={handleViewDetail} 
            initialOrders={orders}
            isLoading={loading}
            errorMessage={error}
            onRefresh={fetchOrders}
          />
        )}
      </ErrorBoundary>
    </MainLayout>
  );
};

export default OrderHistoryPage; 