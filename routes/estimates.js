import express from 'express';
import axios from 'axios';
import { addShippingRecord, getAllShippingRecords, getShippingRecordById, getAllShippingRecordsByUserId } from '../db/shippingDAL.js';
import { query } from '../db/db.js';
import { verifyToken } from './auth.js';


console.log('Loaded database functions: addShippingRecord available:', typeof addShippingRecord === 'function');
console.log('Loaded database functions: getAllShippingRecords available:', typeof getAllShippingRecords === 'function');
console.log('Loaded database functions: getShippingRecordById available:', typeof getShippingRecordById === 'function');

const router = express.Router();

const SHIPENGINE_BASE_URL = 'https://api.shipengine.com/v1';

const errorHandler = (err, req, res, next) => {
    console.error('Shipping API Error:', err);
    
    if (err.response) {
      console.error('ShipEngine API error details:', err.response.data);
      return res.status(err.response.status).json({
        error: 'Shipping service error',
        details: err.response.data
      });
    }
    
    if (err.request) {
      return res.status(503).json({ error: 'Shipping service unavailable' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  };

const getShipEngineHeaders = () => {
  return {
    'API-Key': process.env.SHIPENGINE_API_KEY,
    'Content-Type': 'application/json'
  };
};

router.post('/validate-address', async (req, res, next) => {
  try {
    const address = req.body;
    
    console.log('Received address validation request:', address);
    
    if (!address.address_line1 || !address.city_locality || 
        !address.state_province || !address.postal_code || !address.country_code) {
      console.error('Missing required address fields:', address);
      return res.status(400).json({ error: 'Missing required address fields' });
    }
    
    const url = `${SHIPENGINE_BASE_URL}/addresses/validate`;
    // ShipEngine API expects an array of addresses
    const payload = [address];
    const headers = getShipEngineHeaders();
    
    console.log('Sending address validation request to ShipEngine:', payload);
    
    const response = await axios.post(url, payload, { headers });
    
    console.log('Received address validation response from ShipEngine');
    
    const validationResult = response.data[0];
    
    const isValid = validationResult && validationResult.status === 'verified';
    
    res.status(200).json({
      status: validationResult?.status || 'error',
      original_address: validationResult?.original_address,
      matched_address: validationResult?.matched_address,
      is_valid: isValid,
      messages: validationResult?.messages || []
    });
  } catch (error) {
    console.error('Error validating address with ShipEngine:', error);
    next(error);
  }
});

router.post('/shipping-estimate', async (req, res, next) => {
  try {
    const {
      carrier_id,
      from_country_code, 
      from_postal_code,
      to_country_code, 
      to_postal_code,
      weight,
      event_date,
      shipping_method,
      card_type
    } = req.body;
    
    console.log('Received shipping estimate request:', req.body);
    
    if (!from_postal_code || !to_postal_code || !weight) {
      console.error('Missing required shipping parameters:', req.body);
      return res.status(400).json({ error: 'Missing required shipping parameters' });
    }
    
    const cacheKey = `${from_postal_code}-${to_postal_code}-${JSON.stringify(weight)}`;
    const cache = req.app.get('cache');
    const cachedData = cache ? cache.get(cacheKey) : null;
    
    if (cachedData) {
      console.log("Cache hit", { cacheKey });
      console.log("Cached data structure:", JSON.stringify(cachedData, null, 2));
      return res.status(200).json(cachedData);
    }
    
    const url = `${SHIPENGINE_BASE_URL}/rates/estimate`;
    
    let formattedWeight;
    if (typeof weight === 'object' && weight.value !== undefined && weight.unit !== undefined) {
      formattedWeight = weight;
    } else if (typeof weight === 'number') {
      formattedWeight = {
        value: weight,
        unit: 'ounce'
      };
    } else {
      formattedWeight = {
        value: 1,
        unit: 'ounce'
      };
    }
    
    const payload = {
      carrier_ids: ["se-2219622"],
      from_country_code: from_country_code || "US",
      from_postal_code,
      to_country_code: to_country_code || "US",
      to_postal_code,
      weight: formattedWeight
    };
    
    console.log('Sending request to ShipEngine:', JSON.stringify(payload, null, 2));
    
    const headers = getShipEngineHeaders();
    
    try {
      const response = await axios.post(url, payload, { headers });
      console.log('ShipEngine response received successfully');
      
      // Ensure response.data exists and is valid
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response from ShipEngine:', response.data);
        throw new Error('Invalid response format from ShipEngine API');
      }
      
      const processingDays = getProcessingDays(card_type);
      
      let reminderInfo = {};
      if (event_date) {
        const rateInfo = response.data[0] || {};
        const deliveryDays = rateInfo.delivery_days || getDefaultDeliveryDays(shipping_method);
        
        const eventDateObj = new Date(event_date);
        const currentDate = new Date();
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysUntilEvent = Math.ceil((eventDateObj - currentDate) / msPerDay);
        
        const reminderDays = Math.max(0, daysUntilEvent - deliveryDays - processingDays);
        
        reminderInfo = {
          processing_days: processingDays,
          estimated_delivery_days: deliveryDays,
          days_until_event: daysUntilEvent,
          reminder_days: reminderDays,
          order_by_date: new Date(Date.now() + (reminderDays * msPerDay))
        };
      }
      
      const formattedRates = response.data.map(rate => ({
        carrier_code: rate.carrier_code || 'unknown',
        carrier_friendly_name: rate.carrier_friendly_name || 'Shipping Service',
        service_type: rate.service_type || 'Standard',
        delivery_days: rate.delivery_days || 5,
        shipping_amount: rate.shipping_amount || { amount: 0, currency: 'usd' }
      }));
      
      const result = {
        shipping_rates: formattedRates,
        timeline: reminderInfo
      };
      
      if (cache) {
        console.log("Caching data with structure:", JSON.stringify(result, null, 2));
        cache.set(cacheKey, result);
        console.log("Cache updated", { cacheKey });
      }
      
      res.status(200).json(result);
    } catch (apiError) {
      console.error('ShipEngine API error:', apiError.response?.data || apiError.message);
      throw apiError;
    }
  } catch (error) {
    console.error('Error calling ShipEngine:', error);
    next(error);
  }
});

function getProcessingDays(cardType) {
  const processingTimes = {
    'standard_card': 1,
    'custom_card': 2,
    'special_edition': 3,
    'bulk_order': 5
  };
  
  return processingTimes[cardType] || 1;
}

function getDefaultDeliveryDays(method) {
  const deliveryTimes = {
    'standard': 5,
    'priority': 3,
    'express': 2
  };
  
  return deliveryTimes[method] || 5;
}

// Get order history
router.get('/shipping-history', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    console.log('Received request for shipping history for user:', userId);
    
    const orders = await getAllShippingRecordsByUserId(userId);
    console.log(`Found ${orders.length} orders in database`);

    if (!orders || orders.length === 0) {
      console.log('No orders found, returning empty array');
      return res.status(200).json([]); 
    }

    const formattedOrders = orders.map(order => ({
      id: `SHP-${order.id}`,
      from: order.zip_from,
      to: order.zip_to,
      date: new Date(order.ordered_date).toISOString(),
      weight: 4,
      rates: [{
        carrier: 'UPS',
        service: order.shipping_method,
        days: order.shipping_method === 'Express' ? 1 :
              order.shipping_method === 'Priority' ? 2 : 3,
        amount: 45.99,
        currency: 'usd'
      }],
      timeline: {
        processing_days: 1,
        estimated_delivery_days: order.shipping_method === 'Express' ? 1 :
                                 order.shipping_method === 'Priority' ? 2 : 3,
        order_by_date: new Date(order.ordered_date).toISOString()
      }
    }));

    console.log('Returning formatted orders:', formattedOrders.length);
    return res.status(200).json(formattedOrders); 
  } catch (error) {
    console.error('Error fetching shipping history:', error);
    return res.status(500).json({ error: 'Failed to retrieve order history' });
  }
});

router.get('/test-db', async (req, res) => {
  console.log('Testing database connection...');
  
  try {
    const result = await query('SELECT NOW() as time', []);
    console.log('Database connection successful:', result.rows[0]);
    
    try {
      console.log('Checking if shipping_records table exists...');
      const tableResult = await query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_records')",
        []
      );
      const tableExists = tableResult.rows[0].exists;
      console.log('shipping_records table exists:', tableExists);
      
      if (!tableExists) {
        return res.status(500).json({
          success: false,
          message: 'shipping_records table does not exist',
          fix: 'Run the setup-db.sql script to create the necessary tables'
        });
      }
      
      const columnsResult = await query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shipping_records'",
        []
      );
      console.log('shipping_records table structure:', columnsResult.rows);
      
      console.log('Attempting to insert test record...');
      const testData = {
        sender_name: 'Test Sender',
        recipient_name: 'Test Recipient',
        zip_from: '12345',
        zip_to: '67890',
        distance: null,
        zone: null,
        occasion: 'Test',
        ordered_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        shipping_method: 'Test',
      };
      
      const insertResult = await addShippingRecord(testData);
      console.log('Test record inserted:', insertResult);
      
      if (insertResult && insertResult.id) {
        await query('DELETE FROM shipping_records WHERE id = $1', [insertResult.id]);
        console.log('Test record deleted');
      }
      
      return res.status(200).json({
        success: true,
        message: 'Database connection and table structure are working correctly',
        table_exists: tableExists,
        columns: columnsResult.rows,
        test_insert: !!insertResult
      });
    } catch (tableError) {
      console.error('Error checking table:', tableError);
      return res.status(500).json({
        success: false,
        message: 'Error checking shipping_records table',
        error: tableError.message
      });
    }
  } catch (error) {
    console.error('Database connection test failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection test failed',
      error: error.message
    });
  }
});

router.options('*', (req, res, next) => {
  console.log('Handling OPTIONS request');
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  
  res.sendStatus(204);
});

// New: Save order record - with more debugging
router.post('/save-order', verifyToken, async (req, res, next) => {
  const userId = req.user?.id;
  console.log('\n\n===== SAVE ORDER ENDPOINT CALLED =====');
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Request path:', req.path);
  console.log('Request method:', req.method);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin, X-Requested-With');
  
  try {
    console.log('Processing save-order request...');
    
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Empty request body received');
      return res.status(400).json({ error: 'Empty request body' });
    }
    
    const {
      sender_name,
      recipient_name,
      from_postal_code,
      to_postal_code,
      shipping_method,
      occasion,
      event_date
    } = req.body;
    
    console.log('Extracted values:', {
      sender_name,
      recipient_name,
      from_postal_code,
      to_postal_code,
      shipping_method,
      occasion,
      event_date
    });
    
    if (!from_postal_code || !to_postal_code || !shipping_method) {
      console.error('Missing required order parameters:', req.body);
      return res.status(400).json({ error: 'Missing required order parameters' });
    }
    
    const sanitizedPostalCode = (code) => {
      if (!code || code === '') return '00000';
      return code.replace(/[^\d]/g, '').substring(0, 10);
    };
    
    const orderData = {
      sender_name: sender_name || 'Customer',
      recipient_name: recipient_name || 'Recipient',
      zip_from: sanitizedPostalCode(from_postal_code),
      zip_to: sanitizedPostalCode(to_postal_code),
      distance: null,
      zone: null,
      occasion: occasion || 'Not specified',
      ordered_date: new Date().toISOString().split('T')[0],
      delivery_date: event_date ? new Date(event_date).toISOString().split('T')[0] : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      shipping_method: shipping_method,
      user_id: userId
    };
    
    console.log('Attempting to save order with data:', JSON.stringify(orderData, null, 2));
    
    try {
      const dbCheck = await query('SELECT NOW() as time', []);
      console.log('Database connection check result:', dbCheck.rows[0]);
      
      const tableCheck = await query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_records')",
        []
      );
      const tableExists = tableCheck.rows[0].exists;
      console.log('shipping_records table exists:', tableExists);
      
      if (!tableExists) {
        throw new Error('shipping_records table does not exist');
      }
      
      console.log('Calling addShippingRecord with data:', JSON.stringify(orderData, null, 2));
      const savedOrder = await addShippingRecord(orderData);
      console.log('Order saved successfully to database, ID:', savedOrder.id);
      
      const response = {
        success: true,
        id: savedOrder.id,
        message: 'Card created successfully!',
        order: savedOrder
      };
      
      console.log('Sending success response:', JSON.stringify(response, null, 2));
      return res.status(201).json(response);
    } catch (dbError) {
      console.error('Database error saving order:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save order to database: ' + dbError.message
      });
    }
  } catch (error) {
    console.error('Error in save-order endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred: ' + error.message
    });
  }
});

router.post('/simple-save', async (req, res) => {
  console.log('==== SIMPLE SAVE ENDPOINT CALLED ====');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  
  return res.status(200).json({
    success: true,
    message: 'Test endpoint called successfully',
    received_data: req.body
  });
});

router.get('/insert-test-record', async (req, res) => {
  console.log('==== INSERT TEST RECORD ENDPOINT CALLED ====');
  
  try {
    const testData = {
      sender_name: 'Direct Test Sender',
      recipient_name: 'Direct Test Recipient',
      zip_from: '04005',
      zip_to: '02115',
      distance: null,
      zone: null,
      occasion: 'Direct Test',
      ordered_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      shipping_method: 'Standard'
    };
    
    console.log('Attempting to insert test record directly:', JSON.stringify(testData, null, 2));
    
    const savedRecord = await addShippingRecord(testData);
    console.log('Test record inserted successfully, ID:', savedRecord.id);
    
    return res.status(200).json({
      success: true,
      message: 'Test record inserted successfully',
      record: savedRecord
    });
  } catch (error) {
    console.error('Error inserting test record:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to insert test record: ' + error.message
    });
  }
});

router.get('/save-order-via-get', verifyToken,async (req, res) => {
  const userId = req.user?.id;
  console.log('[DEBUG] req.user:', req.user);

  console.log('User ID for insert:', userId);

  console.log('==== SAVE ORDER VIA GET ENDPOINT CALLED ====');
  console.log('Request query params:', JSON.stringify(req.query, null, 2));
  
  try {
    const { from, to, method, occasion, event_date } = req.query;
    
    console.log('Extracted occasion:', occasion);
    console.log('Extracted event_date:', event_date);
    
    if (!from || !to) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: from and to postal codes are required'
      });
    }
    
    // Ensure occasion has a value and is not undefined/null
    const occasionValue = occasion || 'Birthday';
    console.log('Final occasion value for database:', occasionValue);
    
    const orderData = {
      user_id: userId,
      sender_name: req.query.sender || 'Customer',
      recipient_name: req.query.recipient || 'Recipient',
      zip_from: from,
      zip_to: to,
      distance: null,
      zone: null,
      occasion: occasionValue,
      ordered_date: new Date().toISOString().split('T')[0],
      delivery_date: event_date ? 
                     new Date(event_date).toISOString().split('T')[0] : 
                     new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      shipping_method: method || 'Standard',
      
    };
    
    console.log('Attempting to save order with data:', JSON.stringify(orderData, null, 2));
    
    try {
      const query = `
        INSERT INTO shipping_records 
        (user_id, sender_name, recipient_name, zip_from, zip_to, distance, zone, occasion, ordered_date, delivery_date, shipping_method) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING *
      `;
      
      const values = [
        orderData.user_id,
        orderData.sender_name,
        orderData.recipient_name,
        orderData.zip_from,
        orderData.zip_to,
        orderData.distance,
        orderData.zone,
        orderData.occasion,
        orderData.ordered_date,
        orderData.delivery_date,
        orderData.shipping_method
      ];
      
      console.log('Executing SQL with values:', values);
      
      const { query: executeQuery } = await import('../db/db.js');
      const result = await executeQuery(query, values);
      const savedOrder = result.rows[0];
      
      console.log('Order saved successfully to database, ID:', savedOrder.id);
      console.log('Saved order details:', JSON.stringify(savedOrder, null, 2));
      
      const response = {
        success: true,
        id: savedOrder.id,
        message: 'Card created successfully!',
        order: savedOrder
      };
      
      return res.status(200).json(response);
    } catch (dbError) {
      console.error('Database error saving order:', dbError);
      try {
        console.log('Trying alternative method with addShippingRecord');
        const savedOrder = await addShippingRecord(orderData);
        console.log('Order saved successfully with alternative method, ID:', savedOrder.id);
        return res.status(200).json({
          success: true,
          id: savedOrder.id,
          message: 'Card created successfully!',
          order: savedOrder
        });
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save order to database: ' + dbError.message
        });
      }
    }
  } catch (error) {
    console.error('Error in save-order-via-get endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred: ' + error.message
    });
  }
});

router.use(errorHandler);

export default router;
