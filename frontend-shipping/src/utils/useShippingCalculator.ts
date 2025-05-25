import { useState } from 'react';
import type { ShippingEstimateRequest, ShippingEstimateResponse } from './api';
import { getShippingEstimate, validateAddress } from './api';

export const useShippingCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingData, setShippingData] = useState<ShippingEstimateResponse | null>(null);
  const [addressValidationResult, setAddressValidationResult] = useState<any>(null);

  const validateShippingAddress = async (
    address: {
      street1: string;
      street2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const requestData = {
        address_line1: address.street1,
        address_line2: address.street2 || '',
        city_locality: address.city,
        state_province: address.state,
        postal_code: address.postalCode,
        country_code: address.country
      };
      
      console.log('Sending address validation request:', requestData);
      
      const response = await Promise.race([
        validateAddress(requestData),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Address validation request timed out')), 15000)
        )
      ]);
      
      console.log('Address validation response:', response);
      
      if (!response) {
        throw new Error('Empty response from address validation');
      }
      
      setAddressValidationResult({
        isValid: response.is_valid,
        status: response.status,
        originalAddress: response.original_address,
        matchedAddress: response.matched_address,
        messages: response.messages
      });
      
      if (!response.is_valid) {
        setError('The provided address appears to be invalid. Please check and correct.');
      }
      
      return response;
    } catch (err: any) {
      console.error('Full address validation error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to validate address';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculateShipping = async (
    formData: {
      senderAddress: {
        postalCode: string;
        country: string;
      };
      recipientAddress: {
        postalCode: string;
        country: string;
      };
      package: {
        weight: {
          value: number;
          unit: 'pound' | 'ounce' | 'gram' | 'kilogram';
        };
        dimensions?: {
          length: number;
          width: number;
          height: number;
          unit: 'inch' | 'centimeter';
        };
      };
      shippingMethod?: string;
      eventDate?: string;
      cardType?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a flattened request that matches the backend API expectations
      const requestData = {
        from_country_code: formData.senderAddress.country,
        from_postal_code: formData.senderAddress.postalCode,
        to_country_code: formData.recipientAddress.country,
        to_postal_code: formData.recipientAddress.postalCode,
        weight: formData.package.weight,
        event_date: formData.eventDate,
        card_type: formData.cardType || 'standard_card',
        shipping_method: formData.shippingMethod || 'standard'
      };
      
      console.log('Sending shipping calculation request:', requestData);
      
      try {
        // Add timeout handling for shipping estimate
        const response = await Promise.race([
          getShippingEstimate(requestData),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Shipping calculation request timed out')), 15000)
          )
        ]);
        
        console.log('Received shipping calculation response:', response);
        
        if (!response) {
          throw new Error('Empty response from shipping calculation');
        }
        
        if (!response.rates || response.rates.length === 0) {
          setError('No shipping rates available for this route');
        } else {
          setShippingData(response);
        }
        
        return response;
      } catch (apiError: any) {
        console.error('API error in shipping calculation:', apiError);
        throw apiError;
      }
    } catch (err: any) {
      console.error('Full shipping error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to calculate shipping rates';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    shippingData,
    addressValidationResult,
    calculateShipping,
    validateShippingAddress
  };
};

export default useShippingCalculator;
