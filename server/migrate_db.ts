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
    charset: "utf8mb4",
  });

  try {
    console.log("Dropping existing tables...");
    await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
    const tables = [
      "distribution_records",
      "supply_logs",
      "fuel_transactions",
      "inventories",
      "pumps",
      "quotas",
      "vehicles",
      "users",
      "fuel_rates",
    ];
    for (const table of tables) {
      await pool.execute(`DROP TABLE IF EXISTS ${table}`);
    }
    await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

    console.log("0. Creating fuel_rates table...");
    await pool.execute(`
      CREATE TABLE fuel_rates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fuel_type ENUM('octane', 'petrol', 'diesel') UNIQUE NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        change_amount DECIMAL(10, 2) DEFAULT 0.00,
        trend ENUM('up', 'down', 'stable') DEFAULT 'stable',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("1. Creating users table...");
    await pool.execute(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role ENUM('owner', 'operator', 'distributor') NOT NULL DEFAULT 'owner',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("2. Creating vehicles table...");
    await pool.execute(`
      CREATE TABLE vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        model_number VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        fuel_type VARCHAR(50) NOT NULL,
        model VARCHAR(100),
        color VARCHAR(50),
        engine_number VARCHAR(100),
        district VARCHAR(100),
        series VARCHAR(100),
        number VARCHAR(100),
        uuid VARCHAR(36) UNIQUE NOT NULL,
        car_image_url TEXT,
        plate_image_url TEXT,
        bluebook_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("3. Creating quotas table...");
    await pool.execute(`
      CREATE TABLE quotas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        weekly_limit_liters DECIMAL(10,2) NOT NULL DEFAULT 30.00,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("4. Creating pumps table...");
    await pool.execute(`
      CREATE TABLE pumps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location TEXT NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        owner_id INT NOT NULL,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("5. Creating inventories table...");
    await pool.execute(`
      CREATE TABLE inventories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pump_id INT NOT NULL,
        octane_liters DECIMAL(15,2) DEFAULT 0.00,
        diesel_liters DECIMAL(15,2) DEFAULT 0.00,
        petrol_liters DECIMAL(15,2) DEFAULT 0.00,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (pump_id) REFERENCES pumps(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("6. Creating fuel_transactions table...");
    await pool.execute(`
      CREATE TABLE fuel_transactions (
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
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("7. Creating supply_logs table...");
    await pool.execute(`
      CREATE TABLE supply_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pump_id INT NOT NULL,
        distributor_id INT NOT NULL,
        fuel_type ENUM('octane', 'diesel', 'petrol') NOT NULL,
        amount_liters DECIMAL(15,2) NOT NULL,
        delivery_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pump_id) REFERENCES pumps(id),
        FOREIGN KEY (distributor_id) REFERENCES users(id)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log("8. Creating distribution_records table...");
    await pool.execute(`
      CREATE TABLE distribution_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        distributor_id INT NOT NULL,
        depot_name VARCHAR(255) NOT NULL,
        fuel_type ENUM('octane', 'diesel', 'petrol') NOT NULL,
        amount_liters DECIMAL(15,2) NOT NULL,
        collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (distributor_id) REFERENCES users(id)
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
