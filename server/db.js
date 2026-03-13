const { Pool } = require('pg');
require('dotenv').config();

// Build connection string with Pacific Time timezone
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?timezone=America/Los_Angeles`;

const pool = new Pool({
  connectionString: connectionString,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
