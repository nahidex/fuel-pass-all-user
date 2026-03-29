import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

async function seed() {
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
    console.log("Starting full database seeding...");

    // Clean up existing data to avoid duplicates (optional but recommended for a clean seed)
    await pool.execute("SET FOREIGN_KEY_CHECKS = 0");
    await pool.execute("TRUNCATE TABLE fuel_usages");
    await pool.execute("TRUNCATE TABLE vehicles");
    await pool.execute("TRUNCATE TABLE users");
    await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

    // Add role column if not exists (handling migration within seed if needed, but normally server.ts handles it)
    try {
      await pool.execute("ALTER TABLE users ADD COLUMN role ENUM('owner', 'operator') NOT NULL DEFAULT 'owner' AFTER password");
    } catch (e) {}

    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const dummyData = [
      { 
        name: 'হবিবুল্লাহ নাহিদ', 
        mobile: '01700000000', 
        email: 'nahid@example.com', 
        vehicle: { district: 'ঢাকা মেট্রো', series: 'ঘ', number: '১২৩৪', type: 'car', model: 'Toyota Premio', color: 'Silver', engine: 'A123456' },
        usages: [
          { amount: 10, price: 1350, type: 'Octane', pump: 'পদ্মা ফিলিং স্টেশন', location: 'কারওয়ান বাজার, ঢাকা', method: 'বিকাশ' },
          { amount: 5, price: 675, type: 'Octane', pump: 'মেঘনা পেট্রোলিয়াম', location: 'উত্তরা, ঢাকা', method: 'নগদ' }
        ]
      },
      { 
        name: 'হাসান মাহমুদ', 
        mobile: '01700000001', 
        email: 'hasan@example.com', 
        vehicle: { district: 'ঢাকা মেট্রো', series: 'ল', number: '৫৬৭৮', type: 'bike', model: 'Honda Hornet', color: 'Red', engine: 'B987654' },
        usages: [
          { amount: 3, price: 390, type: 'Petrol', pump: 'যমুনা পেট্রোলিয়াম', location: 'মতিঝিল, ঢাকা', method: 'কার্ড' }
        ]
      },
      { 
        name: 'রাহাত আলী', 
        mobile: '01700000002', 
        email: 'rahat@example.com', 
        vehicle: { district: 'চট্টগ্রাম মেট্রো', series: 'ট', number: '৯১০১', type: 'truck', model: 'Tata LPT', color: 'Blue', engine: 'C456789' },
        usages: [
          { amount: 50, price: 5300, type: 'Diesel', pump: 'সোনারগাঁও ফিলিং স্টেশন', location: 'চট্টগ্রাম পোর্ট', method: 'বিকাশ' }
        ]
      },
      { 
        name: 'আরিফ আহমেদ', 
        mobile: '01700000003', 
        email: 'arif@example.com', 
        vehicle: { district: 'ঢাকা মেট্রো', series: 'চ', number: '২৩৪৫', type: 'car', model: 'Toyota Noah', color: 'White', engine: 'D567890' },
        usages: [
          { amount: 12, price: 1620, type: 'Octane', pump: 'পদ্মা ফিলিং স্টেশন', location: 'বনানী, ঢাকা', method: 'নগদ' }
        ]
      },
      { 
        name: 'সুজন বিশ্বাস', 
        mobile: '01700000004', 
        email: 'sujon@example.com', 
        vehicle: { district: 'রাজশাহী মেট্রো', series: 'হ', number: '৬৭৮৯', type: 'bike', model: 'Suzuki Gixxer', color: 'Black', engine: 'E123456' },
        usages: [
          { amount: 4, price: 520, type: 'Petrol', pump: 'উত্তরা ফিলিং স্টেশন', location: 'রাজশাহী', method: 'বিকাশ' }
        ]
      },
      { 
        name: 'করিম মিঞা', 
        mobile: '01800000000', 
        email: 'operator@fuelpass.com', 
        role: 'operator',
        vehicle: null,
        usages: []
      }
    ];

    for (const data of dummyData) {
      // Insert User
      const [userResult] = await pool.execute(
        "INSERT INTO users (full_name, mobile_number, email, password, role) VALUES (?, ?, ?, ?, ?)",
        [data.name, data.mobile, data.email, hashedPassword, data.role || 'owner']
      ) as any;
      const userId = userResult.insertId;

      if (data.vehicle) {
        // Insert Vehicle
        const [vehicleResult] = await pool.execute(
          `INSERT INTO vehicles (user_id, district, series, number, type, model, color, engine_number)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, data.vehicle.district, data.vehicle.series, data.vehicle.number, data.vehicle.type, data.vehicle.model, data.vehicle.color, data.vehicle.engine]
        ) as any;
        const vehicleId = vehicleResult.insertId;

        // Insert Usages
        for (const usage of data.usages) {
          await pool.execute(
            `INSERT INTO fuel_usages (user_id, vehicle_id, amount_liters, price_total, fuel_type, pump_name, pump_location, payment_method)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, vehicleId, usage.amount, usage.price, usage.type, usage.pump, usage.location, usage.method]
          );
        }
      }

      console.log(`Seeded user, vehicle, and fuel usages for: ${data.name}`);
    }

    console.log("Full database seeding successfully completed!");

  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await pool.end();
  }
}

seed();
