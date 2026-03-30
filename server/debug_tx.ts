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
    
    console.log('\n--- Recent 5 Transactions (fuel_transactions) ---');
    const [transactions] = await connection.query('SELECT id, vehicle_id, pump_id, fuel_type, amount_liters, created_at FROM fuel_transactions ORDER BY created_at DESC LIMIT 5');
    console.table(transactions);

    console.log('\n--- Current Inventory Status (inventories) ---');
    const [inventory] = await connection.query('SELECT pump_id, octane_liters, diesel_liters, petrol_liters FROM inventories');
    console.table(inventory);
    
    await connection.end();
}

check();
