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
    port: Number(process.env.MYSQL_PORT) || 3306,
    multipleStatements: true // Essential for running multiple queries
};

async function migrate() {
    console.log('🚀 Starting Database Migration...');
    const connection = await mysql.createConnection(dbConfig);

    try {
        // Disable foreign key checks to drop/create tables safely
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tables = [
            'distribution_records',
            'fuel_transactions',
            'supply_logs',
            'fuel_usages',
            'inventories',
            'quotas',
            'vehicles',
            'pumps',
            'users',
            'fuel_rates'
        ];

        for (const table of tables) {
            await connection.query(`DROP TABLE IF EXISTS ${table}`);
        }

        const schema = `
        -- 1. Fuel Rates Table
        CREATE TABLE IF NOT EXISTS fuel_rates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fuel_type ENUM('octane', 'petrol', 'diesel') UNIQUE NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            change_amount DECIMAL(10, 2) DEFAULT 0.00,
            trend ENUM('up', 'down', 'stable') DEFAULT 'stable',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        -- 2. Users Table
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            mobile_number VARCHAR(20) UNIQUE NOT NULL,
            email VARCHAR(255),
            password VARCHAR(255) NOT NULL,
            role ENUM('owner', 'operator', 'distributor') NOT NULL DEFAULT 'owner',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_mobile (mobile_number)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        -- 3. Vehicles Table
        CREATE TABLE IF NOT EXISTS vehicles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            uuid VARCHAR(36) UNIQUE NOT NULL,
            model_number VARCHAR(100) NOT NULL,
            type VARCHAR(50) NOT NULL,
            fuel_type VARCHAR(50) NOT NULL,
            model VARCHAR(100),
            color VARCHAR(50),
            engine_number VARCHAR(100),
            district VARCHAR(100),
            series VARCHAR(100),
            number VARCHAR(100),
            car_image_url TEXT,
            plate_image_url TEXT,
            bluebook_image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_uuid (uuid),
            INDEX idx_model_number (model_number)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        -- 4. Quotas Table
        CREATE TABLE IF NOT EXISTS quotas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vehicle_id INT NOT NULL,
            weekly_limit_liters DECIMAL(10,2) NOT NULL DEFAULT 30.00,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        -- 5. Fuel Usages
        CREATE TABLE IF NOT EXISTS fuel_usages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            vehicle_id INT NOT NULL,
            pump_id INT,
            amount_liters DECIMAL(10,2) NOT NULL,
            price_total DECIMAL(10,2),
            fuel_type VARCHAR(50),
            pump_name VARCHAR(255),
            pump_location TEXT,
            payment_method VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
            FOREIGN KEY (pump_id) REFERENCES pumps(id) ON DELETE SET NULL
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        -- 6. Pumps Table
        CREATE TABLE IF NOT EXISTS pumps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            owner_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            location TEXT NOT NULL,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        -- 7. Inventories Table
        CREATE TABLE IF NOT EXISTS inventories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pump_id INT NOT NULL,
            octane_liters DECIMAL(15,2) DEFAULT 0.00,
            diesel_liters DECIMAL(15,2) DEFAULT 0.00,
            petrol_liters DECIMAL(15,2) DEFAULT 0.00,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (pump_id) REFERENCES pumps(id) ON DELETE CASCADE
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        -- 8. Fuel Transactions Table
        CREATE TABLE IF NOT EXISTS fuel_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            vehicle_id INT NOT NULL,
            pump_id INT NOT NULL,
            operator_id INT NOT NULL,
            fuel_type ENUM('octane', 'diesel', 'petrol') NOT NULL,
            amount_liters DECIMAL(10,2) NOT NULL,
            price_total DECIMAL(12,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
            FOREIGN KEY (pump_id) REFERENCES pumps(id),
            FOREIGN KEY (operator_id) REFERENCES users(id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        -- 9. Supply Logs Table
        CREATE TABLE IF NOT EXISTS supply_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pump_id INT NOT NULL,
            distributor_id INT NOT NULL,
            fuel_type ENUM('octane', 'diesel', 'petrol') NOT NULL,
            amount_liters DECIMAL(15,2) NOT NULL,
            delivery_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pump_id) REFERENCES pumps(id),
            FOREIGN KEY (distributor_id) REFERENCES users(id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        -- 10. Distribution Records Table
        CREATE TABLE IF NOT EXISTS distribution_records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            distributor_id INT NOT NULL,
            depot_name VARCHAR(255) NOT NULL,
            fuel_type ENUM('octane', 'diesel', 'petrol') NOT NULL,
            amount_liters DECIMAL(15,2) NOT NULL,
            collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (distributor_id) REFERENCES users(id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `;

        await connection.query(schema);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
