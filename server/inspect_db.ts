import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT) || 3306
};

async function check() {
    const connection = await mysql.createConnection(dbConfig);
    console.log('--- Vehicles Table Structure ---');
    const [cols] = await connection.query('DESCRIBE vehicles');
    console.table(cols);
    
    console.log('\n--- Triggers in DB ---');
    const [triggers] = await connection.query('SHOW TRIGGERS');
    console.table(triggers);
    
    await connection.end();
}

check();
