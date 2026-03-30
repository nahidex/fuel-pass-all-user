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
    charset: "utf8mb4",
  });

  try {
    console.log("Starting full database seeding for 9 core tables...");

    // Clean up existing data to avoid duplicates
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
    ];
    for (const table of tables) {
      await pool.execute(`TRUNCATE TABLE ${table}`);
    }
    await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

    const hashedPassword = await bcrypt.hash("password", 10);

    console.log("Seeding Users...");
    const users = [
      ["নাহিদ ওনার", "01700000000", "owner@test.com", hashedPassword, "owner"],
      [
        "রহিম অপারেটর",
        "01700000001",
        "op1@pump.com",
        hashedPassword,
        "operator",
      ],
      [
        "করিম অপারেটর",
        "01700000002",
        "op2@pump.com",
        hashedPassword,
        "operator",
      ],
      [
        "জাহিদ ডিস্ট্রিবিউটর",
        "01700000005",
        "dist@depot.com",
        hashedPassword,
        "distributor",
      ],
      ["সালাম ওনার", "01700000003", "owner2@test.com", hashedPassword, "owner"],
    ];

    for (const u of users) {
      await pool.execute(
        "INSERT INTO users (full_name, mobile_number, email, password, role) VALUES (?, ?, ?, ?, ?)",
        u,
      );
    }

    const [[owner1]]: any = await pool.execute(
      "SELECT id FROM users WHERE mobile_number = '01700000000'",
    );
    const [[owner2]]: any = await pool.execute(
      "SELECT id FROM users WHERE mobile_number = '01700000003'",
    );
    const [[op1]]: any = await pool.execute(
      "SELECT id FROM users WHERE mobile_number = '01700000001'",
    );
    const [[dist1]]: any = await pool.execute(
      "SELECT id FROM users WHERE mobile_number = '01700000005'",
    );

    console.log("Seeding Vehicles & Quotas...");
    const vehicles = [
      [
        owner1.id,
        "Dhaka Metro-GA-1234",
        "car",
        "octane",
        "Toyota Premio",
        "Silver",
        "ENG123",
        "ঢাকা মেট্রো",
        "গ",
      ],
      [
        owner1.id,
        "Dhaka Metro-LA-5678",
        "bike",
        "petrol",
        "Honda Hornet",
        "Red",
        "ENG456",
        "ঢাকা মেট্রো",
        "ল",
      ],
      [
        owner2.id,
        "Ctg Metro-TA-9012",
        "truck",
        "diesel",
        "Tata LPT",
        "Blue",
        "ENG789",
        "চট্টগ্রাম মেট্রো",
        "ট",
      ],
      [
        owner2.id,
        "Dhaka Metro-CHA-3456",
        "car",
        "octane",
        "Toyota Noah",
        "White",
        "ENG012",
        "ঢাকা মেট্রো",
        "চ",
      ],
      [
        owner1.id,
        "Rajshahi Metro-HA-6789",
        "bike",
        "petrol",
        "Suzuki Gixxer",
        "Black",
        "ENG345",
        "রাজশাহী মেট্রো",
        "হ",
      ],
    ];

    for (const v of vehicles) {
      const [vResult]: any = await pool.execute(
        "INSERT INTO vehicles (user_id, reg_number, type, fuel_type, model, color, engine_number, district, series) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        v,
      );
      await pool.execute(
        "INSERT INTO quotas (vehicle_id, weekly_limit_liters) VALUES (?, ?)",
        [vResult.insertId, v[2] === "truck" ? 100 : v[2] === "car" ? 40 : 15],
      );
    }

    console.log("Seeding Pumps & Inventories...");
    const pumps = [
      ["পদ্মা ফিলিং স্টেশন", "কারওয়ান বাজার, ঢাকা", owner1.id, "active"],
      ["মেঘনা পেট্রোলিয়াম", "উত্তরা, ঢাকা", owner1.id, "active"],
      ["যমুনা ফিলিং সেন্টার", "মতিঝিল, ঢাকা", owner1.id, "active"],
      ["শাপলা ফুয়েলস", "চট্টগ্রাম পোর্ট", owner2.id, "active"],
      ["সোনারগাঁও স্টেশন", "সাভার, ঢাকা", owner2.id, "active"],
    ];

    for (const p of pumps) {
      const [pResult]: any = await pool.execute(
        "INSERT INTO pumps (name, location, owner_id, status) VALUES (?, ?, ?, ?)",
        p,
      );
      await pool.execute(
        "INSERT INTO inventories (pump_id, octane_liters, diesel_liters, petrol_liters) VALUES (?, ?, ?, ?)",
        [pResult.insertId, 5000, 8000, 3000],
      );
    }

    const [[pump1]]: any = await pool.execute("SELECT id FROM pumps LIMIT 1");
    const [[veh1]]: any = await pool.execute("SELECT id FROM vehicles LIMIT 1");

    console.log("Seeding Transactions & Logs...");
    // 5 Transactions
    for (let i = 1; i <= 5; i++) {
      await pool.execute(
        "INSERT INTO fuel_transactions (vehicle_id, pump_id, operator_id, fuel_type, amount_liters, price_total) VALUES (?, ?, ?, ?, ?, ?)",
        [veh1.id, pump1.id, op1.id, "octane", 5 * i, 135 * 5 * i],
      );
    }

    // 5 Supply Logs (Distributor to Pump)
    for (let i = 1; i <= 5; i++) {
      await pool.execute(
        "INSERT INTO supply_logs (pump_id, distributor_id, fuel_type, amount_liters) VALUES (?, ?, ?, ?)",
        [pump1.id, dist1.id, "diesel", 1000 * i],
      );
    }

    // 5 Distribution Records (Depot to Distributor)
    for (let i = 1; i <= 5; i++) {
      await pool.execute(
        "INSERT INTO distribution_records (distributor_id, depot_name, fuel_type, amount_liters) VALUES (?, ?, ?, ?)",
        [dist1.id, "Fatullah Depot", "octane", 5000 * i],
      );
    }

    console.log("Seeding complete successfully!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await pool.end();
  }
}

seed();
