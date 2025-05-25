import axios from 'axios';

// Create a custom axios instance with default settings
const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Enable credentials for CORS
  withCredentials: false
});

// Add a request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} request to ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}:`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('[API] Response error:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response'
    });
    return Promise.reject(error);
  }
);

// Interface definitions
export interface ShippingEstimateRequest {
  from_postal_code: string;
  to_postal_code: string;
  weight: {
    value: number;
    unit: string;
  };
  from_country_code?: string;
  to_country_code?: string;
  carrier_id?: string;
  event_date?: string;
  card_type?: string;
  shipping_method?: string;
}

export interface ShippingRate {
  carrier: string;
  service: string;
  days: number;
  amount: number;
  currency: string;
}

export interface Timeline {
  processing_days: number;
  estimated_delivery_days: number;
  days_until_event?: number;
  reminder_days?: number;
  estimated_delivery_date?: string;
  order_by_date?: string;
}

export interface ShippingEstimateResponse {
  from: string;
  to: string;
  weight: number;
  rates: ShippingRate[];
  timeline: Timeline;
  // Additional fields for order display
  id?: string;
  date?: string;
  zip_from?: string;
  zip_to?: string;
  amount?: number;
  occasion?: string;
  event_date?: string;
  sender_name?: string;
  recipient_name?: string;
  shipping_method?: string;
  status?: string;
  // New fields from database records
  ordered_date?: string;
  delivery_date?: string;
}

export interface AddressValidationRequest {
  address_line1: string;
  city_locality: string;
  state_province: string;
  postal_code: string;
  country_code: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API functions
export const getShippingEstimate = async (data: ShippingEstimateRequest): Promise<ShippingEstimateResponse> => {
  try {
    // Ensure all required fields are present
    if (!data.from_postal_code || !data.to_postal_code || !data.weight) {
      throw new Error('Missing required shipping parameters: from_postal_code, to_postal_code, and weight are required');
    }
    
    // Ensure request data matches the expected format
    const requestData = {
      from_country_code: data.from_country_code || "US",
      to_country_code: data.to_country_code || "US",
      from_postal_code: data.from_postal_code,
      to_postal_code: data.to_postal_code,
      weight: data.weight,
      event_date: data.event_date,
      card_type: data.card_type || 'standard_card',
      shipping_method: data.shipping_method || 'standard'
    };
    
    console.log('Shipping request:', requestData); // For debugging
    
    // Call backend endpoint
    const response = await api.post('/estimates/shipping-estimate', requestData);
    
    console.log('Raw shipping response:', response.data); // Debug the raw response

    // Check if the response contains the expected data structure
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response format from shipping estimate API');
    }
    
    // Extract shipping rates safely
    let rates: ShippingRate[] = [];
    if (response.data.shipping_rates && Array.isArray(response.data.shipping_rates)) {
      try {
        rates = response.data.shipping_rates.map((rate: any) => ({
          carrier: rate.carrier_friendly_name || rate.carrier_code || 'Unknown',
          service: rate.service_type || 'Standard',
          days: rate.delivery_days || 3,
          amount: typeof rate.shipping_amount === 'object' ? rate.shipping_amount.amount : 0,
          currency: typeof rate.shipping_amount === 'object' ? rate.shipping_amount.currency : 'usd'
        }));
      } catch (mapError) {
        console.error('Error mapping shipping rates:', mapError);
        // Create a fallback rate if mapping fails
        rates = [{
          carrier: 'Shipping Service',
          service: 'Standard',
          days: 3,
          amount: 0,
          currency: 'usd'
        }];
      }
    }
    
    // Create a safe timeline object
    const timeline = response.data.timeline || {
      processing_days: 1,
      estimated_delivery_days: 3
    };
    
    // Transform backend response to match our expected format
    const result: ShippingEstimateResponse = {
      from: data.from_postal_code,
      to: data.to_postal_code,
      weight: data.weight.value,
      rates: rates,
      timeline: timeline
    };
    
    console.log('Transformed shipping response:', result); // Debug the transformed response
    
    return result;
  } catch (error) {
    console.error('Error fetching shipping estimate:', error);
    throw error;
  }
};

export const validateAddress = async (address: AddressValidationRequest): Promise<any> => {
  try {
    console.log('Validating address:', address);
    // ShipEngine API expects an array of addresses
    const response = await api.post('/estimates/validate-address', address);
    console.log('Address validation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error validating address:', error);
    throw error;
  }
};

export const getShippingMethods = async (): Promise<string[]> => {
  try {
    const response = await api.get('/estimates/shipping-methods');
    return response.data;
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    throw error;
  }
};

export const getShippingHistory = async (): Promise<ShippingEstimateResponse[]> => {
  try {
    console.log('Fetching shipping history from /estimates/shipping-history...');
    
    const cacheKey = 'shipping_history_cache';
    const cacheTimeKey = 'shipping_history_cache_time';
    const cachedData = sessionStorage.getItem(cacheKey);
    const cachedTime = sessionStorage.getItem(cacheTimeKey);
    const currentTime = Date.now();
    
    if (cachedData && cachedTime && (currentTime - parseInt(cachedTime)) < 10000) {
      console.log('Using cached shipping history data, cache age:', 
        Math.floor((currentTime - parseInt(cachedTime)) / 1000), 'seconds');
      return JSON.parse(cachedData);
    }
    
    console.log('Cache expired or not found, making new API request');
    
    // Use the same base URL as in ShippingResults component
    const apiUrl = 'http://localhost:3001/estimates/shipping-history';
    console.log('Full API URL:', apiUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Shipping history response status:', response.status);
      
      if (!response.ok) {
        console.error(`Error fetching shipping history: ${response.status} ${response.statusText}`);
        if (cachedData) {
          console.log('Returning cached data due to API error');
          return JSON.parse(cachedData);
        }
        throw new Error(`Failed to fetch shipping history: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Shipping history response data:', data);
      
      if (!data) {
        console.error('No data returned from server');
        if (cachedData) {
          console.log('Returning cached data due to empty response');
          return JSON.parse(cachedData);
        }
        return [];
      }
      
      if (!Array.isArray(data)) {
        console.error('Invalid response format - data is not an array:', data);
        if (cachedData) {
          console.log('Returning cached data due to invalid response format');
          return JSON.parse(cachedData);
        }
        return [];
      }
      
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
      sessionStorage.setItem(cacheTimeKey, currentTime.toString());
      console.log('Cached new shipping history data');
      
      return data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Request timed out after 5 seconds');
      } else {
        console.error('Network fetch error:', fetchError.message);
      }
      
      if (cachedData) {
        console.log('Returning cached data due to network error');
        return JSON.parse(cachedData);
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Error fetching shipping history:', error.message);
    
    try {
      const lastResortCache = sessionStorage.getItem('shipping_history_cache');
      if (lastResortCache) {
        console.log('Using cached data as last resort after all errors');
        return JSON.parse(lastResortCache);
      }
    } catch (e) {
      console.error('Failed to load cache as last resort');
    }
    
    throw error;
  }
};

// Authentication services
export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (userData: any): Promise<User> => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
};

// Export services (maintain compatibility)
export const shippingService = {
  calculateShipping: getShippingEstimate,
  getShippingHistory,
  validateAddress
};

// Save order to backend
export const saveOrder = async (orderData: any): Promise<any> => {
  try {
    console.log('[API DEBUG] Saving order data:', orderData);
    
    // Make sure required fields are present
    if (!orderData.from_postal_code || !orderData.to_postal_code) {
      throw new Error('Missing postal codes in order data');
    }
    
    const apiUrl = 'http://localhost:3001/estimates/save-order';
    console.log('[API DEBUG] Using URL:', apiUrl);
    
    // Use a direct fetch call with maximum verbosity for debugging
    console.log('[API DEBUG] Preparing fetch request with data:', JSON.stringify(orderData, null, 2));
    
    try {
      // First, try the simplest possible request with minimal headers
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      console.log('[API DEBUG] Response status:', response.status);
      console.log('[API DEBUG] Response statusText:', response.statusText);
      
      // Try to read response headers
      try {
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        console.log('[API DEBUG] Response headers:', headers);
      } catch (headerErr) {
        console.error('[API DEBUG] Failed to read response headers:', headerErr);
      }
      
      if (!response.ok) {
        // Try to read the error body
        try {
          const errorText = await response.text();
          console.error('[API DEBUG] Error response body:', errorText);
          throw new Error(`Server returned ${response.status}: ${errorText || response.statusText}`);
        } catch (textErr) {
          console.error('[API DEBUG] Failed to read error response body:', textErr);
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
      }
      
      // Parse the success response
      try {
        const result = await response.json();
        console.log('[API DEBUG] Successfully parsed response:', result);
        return result;
      } catch (jsonErr) {
        console.error('[API DEBUG] Failed to parse success response as JSON:', jsonErr);
        const rawText = await response.text();
        console.log('[API DEBUG] Raw response text:', rawText);
        
        // Return a fabricated successful response
        return { 
          success: true,
          message: 'Successfully processed (but failed to parse response)',
          id: Date.now(),
          rawText
        };
      }
    } catch (fetchErr: any) {
      console.error('[API DEBUG] Fetch operation failed:', fetchErr.message);
      
      // If we get here, the fetch completely failed
      console.log('[API DEBUG] Trying alternative direct XMLHttpRequest...');
      
      // Return a promise that uses XMLHttpRequest as a fallback
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', apiUrl);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
          console.log('[API DEBUG] XHR response received:', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText
          });
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (e) {
              resolve({ 
                success: true, 
                message: 'Successfully processed (but failed to parse response)',
                id: Date.now(),
                rawText: xhr.responseText
              });
            }
          } else {
            reject(new Error(`XHR failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = function() {
          console.error('[API DEBUG] XHR network error');
          reject(new Error('Network error occurred while sending order'));
        };
        
        xhr.send(JSON.stringify(orderData));
        console.log('[API DEBUG] XHR request sent');
      });
    }
  } catch (error) {
    console.error('[API DEBUG] saveOrder error:', error);
    throw error;
  }
};

export default api;
