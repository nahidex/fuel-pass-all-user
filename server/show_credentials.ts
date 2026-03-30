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

async function showCredentials() {
    const connection = await mysql.createConnection(dbConfig);
    const [users]: any = await connection.query('SELECT id, full_name, mobile_number, role FROM users');
    
    console.log('\n--- SEEDED USER CREDENTIALS ---');
    console.log('NOTE: All users share the same default password: password123\n');
    console.table(users);
    
    await connection.end();
}

showCredentials();
