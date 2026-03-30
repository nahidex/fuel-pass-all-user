import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

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
      "fuel_rates",
    ];
    for (const table of tables) {
      await pool.execute(`TRUNCATE TABLE ${table}`);
    }
    await pool.execute("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Seeding Fuel Rates...");
    const fuelRates = [
      ["octane", 135.00, 2.50, "up"],
      ["petrol", 130.00, 0.00, "stable"],
      ["diesel", 106.00, -1.00, "down"],
    ];
    for (const rate of fuelRates) {
      await pool.execute(
        "INSERT INTO fuel_rates (fuel_type, price, change_amount, trend) VALUES (?, ?, ?, ?)",
        rate,
      );
    }

    const hashedPassword = await bcrypt.hash("password", 10);

    console.log("Seeding 40 Users...");
    const baseUsers = [
      ["নাহিদ ওনার", "01700000000", "owner@test.com", hashedPassword, "owner"],
      ["রহিম অপারেটর", "01700000001", "op1@pump.com", hashedPassword, "operator"],
      ["করিম অপারেটর", "01700000002", "op2@pump.com", hashedPassword, "operator"],
      ["জাহিদ ডিস্ট্রিবিউটর", "01700000005", "dist@depot.com", hashedPassword, "distributor"],
      ["সালাম ওনার", "01700000003", "owner2@test.com", hashedPassword, "owner"],
    ];

    // Generate 35 more users to make it 40
    for (let i = 6; i <= 40; i++) {
      const role = i % 3 === 0 ? "operator" : i % 7 === 0 ? "distributor" : "owner";
      const phone = `017${i.toString().padStart(8, "0")}`;
      baseUsers.push([`User ${i}`, phone, `user${i}@test.com`, hashedPassword, role]);
    }

    for (const u of baseUsers) {
      await pool.execute(
        "INSERT INTO users (full_name, mobile_number, email, password, role) VALUES (?, ?, ?, ?, ?)",
        u,
      );
    }

    const [[owner1]]: any = await pool.execute("SELECT id FROM users WHERE mobile_number = '01700000000'");
    const [[owner2]]: any = await pool.execute("SELECT id FROM users WHERE mobile_number = '01700000003'");
    
    // Get all owner IDs for vehicle distribution
    const [allOwners]: any = await pool.execute("SELECT id FROM users WHERE role = 'owner'");

    console.log("Seeding 40 Vehicles & Quotas...");
    const vehicleTypes = ["car", "bike", "truck"];
    const fuelTypes = ["octane", "petrol", "diesel"];
    const districts = ["ঢাকা মেট্রো", "চট্টগ্রাম মেট্রো", "রাজশাহী মেট্রো", "সিলেট মেট্রো"];
    const seriesList = ["গ", "ল", "ট", "চ", "হ", "খ", "ম"];

    for (let i = 1; i <= 40; i++) {
        const type = vehicleTypes[i % 3];
        const fuel = fuelTypes[i % 3];
        const owner = allOwners[i % allOwners.length];
        const district = districts[i % districts.length];
        const series = seriesList[i % seriesList.length];
        const regNum = `${district}-${series}-${1000 + i}`;
        
        const [vResult]: any = await pool.execute(
            "INSERT INTO vehicles (user_id, model_number, type, fuel_type, model, color, engine_number, district, series, uuid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [owner.id, regNum, type, fuel, `Model ${i}`, "Color", `ENG${1000+i}`, district, series, uuidv4()]
        );
        
        await pool.execute(
            "INSERT INTO quotas (vehicle_id, weekly_limit_liters) VALUES (?, ?)",
            [vResult.insertId, type === "truck" ? 100 : type === "car" ? 40 : 15]
        );
    }

    console.log("Seeding 40 Pumps...");
    console.log("Seeding 40 Pumps & Inventories...");
    for (let i = 1; i <= 40; i++) {
        const owner = allOwners[i % allOwners.length];
        const [pResult]: any = await pool.execute(
            "INSERT INTO pumps (name, location, latitude, longitude, owner_id, status) VALUES (?, ?, ?, ?, ?, ?)",
            [`পাম্প স্টেশন ${i}`, `লোকেশন ${i}`, 23.7 + (i * 0.01), 90.3 + (i * 0.01), owner.id, "active"]
        );
        await pool.execute(
            "INSERT INTO inventories (pump_id, octane_liters, diesel_liters, petrol_liters) VALUES (?, ?, ?, ?)",
            [pResult.insertId, 10000 + (i * 100), 15000 + (i * 100), 5000 + (i * 100)]
        );
    }

    const [[pump1]]: any = await pool.execute("SELECT id FROM pumps LIMIT 1");
    const [[veh1]]: any = await pool.execute("SELECT id FROM vehicles LIMIT 1");
    const [[op1]]: any = await pool.execute("SELECT id FROM users WHERE role = 'operator' LIMIT 1");
    const [[dist1]]: any = await pool.execute("SELECT id FROM users WHERE role = 'distributor' LIMIT 1");

    console.log("Seeding 40 Transactions & Logs...");
    // 40 Transactions
    for (let i = 1; i <= 40; i++) {
      const [[v]]: any = await pool.execute("SELECT id, fuel_type FROM vehicles ORDER BY RAND() LIMIT 1");
      const [[p]]: any = await pool.execute("SELECT id FROM pumps ORDER BY RAND() LIMIT 1");
      await pool.execute(
        "INSERT INTO fuel_transactions (vehicle_id, pump_id, operator_id, fuel_type, amount_liters, price_total) VALUES (?, ?, ?, ?, ?, ?)",
        [v.id, p.id, op1.id, v.fuel_type, 5 + (i % 10), 135 * (5 + (i % 10))],
      );
    }

    // 40 Supply Logs (Distributor to Pump)
    for (let i = 1; i <= 40; i++) {
      const [[p]]: any = await pool.execute("SELECT id FROM pumps ORDER BY RAND() LIMIT 1");
      await pool.execute(
        "INSERT INTO supply_logs (pump_id, distributor_id, fuel_type, amount_liters) VALUES (?, ?, ?, ?)",
        [p.id, dist1.id, "octane", 5000],
      );
    }

    // 40 Distribution Records (Depot to Distributor)
    for (let i = 1; i <= 40; i++) {
      await pool.execute(
        "INSERT INTO distribution_records (distributor_id, depot_name, fuel_type, amount_liters) VALUES (?, ?, ?, ?)",
        [dist1.id, `Depot ${i}`, "octane", 5000 * i],
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
