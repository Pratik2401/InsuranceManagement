require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  const sqlPath = path.join(__dirname, '..', 'database', 'create-products.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  await connection.query(sql);
  console.log('Products table created and seeded');
  connection.end();
}

run().catch(console.error);
