import path from "path";
import dotenv from "dotenv";

const { Pool } = require('pg');
const fs = require('fs');

dotenv.config();
const pool = new Pool({
  user: process.env.PSQL_USER,
  password: process.env.PSQL_PASSWORD,
  host: process.env.PSQL_HOST,
  port: process.env.PSQL_PORT,
  database: process.env.PSQL_DATABASE
});

process.chdir(path.dirname(__filename));


const initSQLScript = fs.readFileSync('./init.sql', 'utf8');

pool.query(initSQLScript)
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch((error: any) => {
    console.error('Error initializing database:', error);
  });


module.exports = {
  query: (text: string, params: any) => {
    try {
      return pool.query(text, params)
    } catch (err: any) {
      console.log(err.stack)
    }
  }
};