/**
 * This script checks database connectivity and setup for the shipping application
 * Run with: node scripts/check-db.js
 */

import { query } from '../db/db.js';

async function checkDatabaseSetup() {
  console.log('Starting database check...');
  
  try {
    // Test basic connection
    console.log('Testing database connection...');
    const connectionResult = await query('SELECT NOW() as current_time', []);
    console.log('✅ Database connection successful:', connectionResult.rows[0]);
    
    // Check shipping_records table
    console.log('\nChecking shipping_records table...');
    const tableExists = await query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipping_records')",
      []
    );
    
    if (!tableExists.rows[0].exists) {
      console.error('❌ shipping_records table does not exist!');
      console.log('\nPlease run the setup script:');
      console.log('psql -U zhangyongzhen99 -d shipping_db -f db/setup-db.sql');
      return;
    }
    
    console.log('✅ shipping_records table exists');
    
    // Check table structure
    console.log('\nChecking shipping_records table structure...');
    const columns = await query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shipping_records' ORDER BY ordinal_position",
      []
    );
    
    console.log('Current columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Required columns
    const requiredColumns = [
      'id', 'sender_name', 'recipient_name', 'zip_from', 'zip_to', 
      'occasion', 'ordered_date', 'delivery_date', 'shipping_method'
    ];
    
    const missingColumns = requiredColumns.filter(required => 
      !columns.rows.some(col => col.column_name === required)
    );
    
    if (missingColumns.length > 0) {
      console.error(`\n❌ Missing required columns: ${missingColumns.join(', ')}`);
      console.log('Please run the setup script to create the correct table structure');
      return;
    }
    
    console.log('✅ All required columns exist');
    
    // Check existing records
    console.log('\nChecking existing records...');
    const records = await query('SELECT * FROM shipping_records LIMIT 5', []);
    console.log(`Found ${records.rows.length} shipping records`);
    
    if (records.rows.length > 0) {
      console.log('Sample record:');
      console.log(records.rows[0]);
    } else {
      console.log('No records found. Try inserting a test record');
    }
    
    // Try inserting a test record
    console.log('\nInserting test record...');
    const testData = {
      sender_name: 'Test User',
      recipient_name: 'Test Recipient',
      zip_from: '12345',
      zip_to: '67890',
      occasion: 'Test',
      ordered_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      shipping_method: 'Standard'
    };
    
    const insertQuery = `
      INSERT INTO shipping_records
      (sender_name, recipient_name, zip_from, zip_to, occasion, ordered_date, delivery_date, shipping_method)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    
    const insertResult = await query(
      insertQuery,
      [
        testData.sender_name,
        testData.recipient_name,
        testData.zip_from,
        testData.zip_to,
        testData.occasion,
        testData.ordered_date,
        testData.delivery_date,
        testData.shipping_method
      ]
    );
    
    if (insertResult.rows.length > 0) {
      const insertedId = insertResult.rows[0].id;
      console.log(`✅ Test record inserted with ID: ${insertedId}`);
      
      // Delete the test record
      console.log('Cleaning up test record...');
      await query('DELETE FROM shipping_records WHERE id = $1', [insertedId]);
      console.log('✅ Test record cleaned up');
    } else {
      console.error('❌ Failed to insert test record');
    }
    
    console.log('\n✅ Database setup check completed successfully');
  } catch (error) {
    console.error('❌ Database check failed:', error);
    console.log('\nTroubleshooting steps:');
    console.log('1. Check database connection details in .env file');
    console.log('2. Make sure PostgreSQL service is running');
    console.log('3. Verify the user "zhangyongzhen99" has permission to connect');
    console.log('4. Ensure database "shipping_db" exists');
    console.log('5. Run setup script: psql -U zhangyongzhen99 -d shipping_db -f db/setup-db.sql');
  }
}

// Run the checks
checkDatabaseSetup();

console.log('\nThis script only checks database connectivity.');
console.log('To fully test the API, run the server and make a request to http://localhost:3001/estimates/test-db'); 