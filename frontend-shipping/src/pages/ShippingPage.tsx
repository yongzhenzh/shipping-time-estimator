import React, { useState } from 'react';
import { message } from 'antd';
import MainLayout from '../components/layout/MainLayout';
import ShippingForm from '../components/shipping/ShippingForm';
import ShippingResults from '../components/shipping/ShippingResults';
import { shippingService } from '../utils/api';

const ShippingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      if (values.shippingResult) {
        setResult(values.shippingResult);
        message.success('Shipping estimate calculated!');
      } else {
        message.error('Failed to calculate shipping estimate.');
      }
    } catch (error) {
      console.error('Error handling shipping form submission:', error);
      message.error('Failed to calculate shipping estimate.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setResult(null);
  };

  return (
    <MainLayout>
      {result ? (
        <ShippingResults result={result} onBack={handleBack} />
      ) : (
        <ShippingForm onSubmit={handleSubmit} loading={loading} />
      )}
    </MainLayout>
  );
};

export default ShippingPage;
