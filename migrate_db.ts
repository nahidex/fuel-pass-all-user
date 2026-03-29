import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function migrate() {
  if (!process.env.MYSQL_HOST) {
    console.error("MYSQL_HOST not found");
    return;
  }

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    charset: 'utf8mb4',
  });

  try {
    console.log("Dropping existing tables...");
    await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
    await pool.execute("DROP TABLE IF EXISTS fuel_usages");
    await pool.execute("DROP TABLE IF EXISTS vehicles");
    await pool.execute("DROP TABLE IF EXISTS users");
    await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Creating users table with utf8mb4 support...");
    await pool.execute(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("Creating vehicles table (simplified schema) with utf8mb4 support...");
    await pool.execute(`
      CREATE TABLE vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        district VARCHAR(100),
        series VARCHAR(100),
        number VARCHAR(100),
        type VARCHAR(50),
        model VARCHAR(100),
        color VARCHAR(50),
        engine_number VARCHAR(100),
        car_image_url TEXT,
        plate_image_url TEXT,
        bluebook_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("Creating fuel_usages table with utf8mb4 support...");
    await pool.execute(`
      CREATE TABLE fuel_usages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        amount_liters DECIMAL(10,2) NOT NULL,
        price_total DECIMAL(10,2),
        fuel_type VARCHAR(50),
        pump_name VARCHAR(255),
        pump_location TEXT,
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("Migration complete!");

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

migrate();
