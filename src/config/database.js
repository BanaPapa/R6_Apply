const { Pool } = require('pg');
const logger = require('../utils/logger');

// Database connection pool
let pool = null;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'r6_apply',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
};

async function connectDB() {
  try {
    pool = new Pool(dbConfig);
    
    // Test connection
    const client = await pool.connect();
    logger.info('Database connected successfully');
    client.release();
    
    // Create tables if they don't exist
    await createTables();
    
    return pool;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

async function createTables() {
  const client = await pool.connect();
  
  try {
    // Create apartments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS apartments (
        id SERIAL PRIMARY KEY,
        house_manage_no VARCHAR(50) UNIQUE NOT NULL,
        region VARCHAR(100) NOT NULL,
        house_name VARCHAR(200) NOT NULL,
        constructor VARCHAR(100),
        address TEXT,
        coordinates POINT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create supply_info table
    await client.query(`
      CREATE TABLE IF NOT EXISTS supply_info (
        id SERIAL PRIMARY KEY,
        apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
        notice_date DATE,
        subscription_start DATE,
        subscription_end DATE,
        announcement_date DATE,
        total_units INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create competition_data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS competition_data (
        id SERIAL PRIMARY KEY,
        apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
        record_date DATE DEFAULT CURRENT_DATE,
        first_round_applications INTEGER,
        average_competition_rate DECIMAL(10,2),
        max_competition_rate DECIMAL(10,2),
        subscription_result VARCHAR(50),
        status_breakdown JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_apartments_region ON apartments(region)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_apartments_house_name ON apartments(house_name)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_competition_data_record_date ON competition_data(record_date)
    `);

    logger.info('Database tables created/verified successfully');
  } catch (error) {
    logger.error('Failed to create database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function getPool() {
  return pool;
}

module.exports = {
  connectDB,
  query,
  transaction,
  getPool
};