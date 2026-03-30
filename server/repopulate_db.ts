import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import crypto from "crypto";

dotenv.config();

const config = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: parseInt(process.env.MYSQL_PORT || "3306"),
};

const repopulateDb = async () => {
  const connection = await mysql.createConnection(config);
  console.log("Connected to MySQL for repopulation...");

  try {
    // 1. Clear existing data
    console.log("Cleaning existing data...");
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");
    const tablesToTruncate = [
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
    for (const table of tablesToTruncate) {
      await connection.execute(`TRUNCATE TABLE ${table}`);
    }
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // 2. Create 10 Users
    console.log("Creating 10 users...");
    const userIds: number[] = [];
    const names = [
      "নাহিদ হাসান", "আরিফ রহমান", "সাদেকুল ইসলাম", "তানভীর আহমেদ", "কামরুল হাসান",
      "জসিম উদ্দিন", "মাহবুব আলম", "অপারেটর হাসান", "অপারেটর রহিম", "ডিস্ট্রিবিউটর ১"
    ];

    for (let i = 0; i < 10; i++) {
      const role = i === 9 ? "distributor" : (i >= 7 ? "operator" : "owner");
      const [result]: any = await connection.execute(
        "INSERT INTO users (full_name, mobile_number, email, password, role) VALUES (?, ?, ?, ?, ?)",
        [names[i], `0170000000${i}`, `user${i}@example.com`, hashedPassword, role]
      );
      userIds.push(result.insertId);
    }

    // 3. Create Pumps and Inventories
    console.log("Seeding pumps and inventories...");
    const pumpIds: number[] = [];
    const pumps = [
      { name: "পদ্মা ফিলিং স্টেশন", lat: 23.7509, lng: 90.3935 },
      { name: "মেঘনা পেট্রোলিয়াম", lat: 23.8103, lng: 90.4125 },
      { name: "যমুনা পেট্রোলিয়াম", lat: 23.7944, lng: 90.4042 }
    ];

    for (const p of pumps) {
      const [pResult]: any = await connection.execute(
        "INSERT INTO pumps (owner_id, name, location, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
        [userIds[0], p.name, "ঢাকা, বাংলাদেশ", p.lat, p.lng]
      );
      const pId = pResult.insertId;
      pumpIds.push(pId);
      await connection.execute(
        "INSERT INTO inventories (pump_id, octane_liters, diesel_liters, petrol_liters) VALUES (?, ?, ?, ?)",
        [pId, 5000, 10000, 4000]
      );
    }

    // 4. Create Vehicles for owners (3 users, each with 1 vehicle = 3 vehicles total)
    console.log("Creating 1 vehicle for each of the first 3 owners...");
    const vehicleIds: number[] = [];
    const districts = ["ঢাকা মেট্রো", "চট্টগ্রাম মেট্রো", "খুলনা মেট্রো"];
    const types = ["car", "bike", "truck"];

    for (let uIdx = 0; uIdx < 3; uIdx++) {
      const type = types[uIdx];
      const district = districts[uIdx];
      const series = "ক";
      const number = `${1000 + uIdx}`;
      const [vResult]: any = await connection.execute(
        `INSERT INTO vehicles (user_id, uuid, district, series, number, model_number, type, fuel_type, model, color, engine_number) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userIds[uIdx],
          crypto.randomUUID(),
          district,
          series,
          number,
          `${district}-${series}-${number}`,
          type,
          type === "bike" ? "petrol" : "octane",
          uIdx === 0 ? "Toyota Premio" : uIdx === 1 ? "Honda Hornet" : "Mitsubishi Fuso",
          uIdx === 0 ? "White" : uIdx === 1 ? "Red" : "Blue",
          `ENG${123456 + uIdx}`
        ]
      );
      const vId = vResult.insertId;
      vehicleIds.push(vId);

      // Create Quota
      await connection.execute(
        "INSERT INTO quotas (vehicle_id, weekly_limit_liters) VALUES (?, ?)",
        [vId, type === "truck" ? 100 : type === "car" ? 40 : 15]
      );
    }

    // 5. Create Fuel Rates
    console.log("Seeding fuel rates...");
    await connection.execute("INSERT INTO fuel_rates (fuel_type, price, change_amount, trend) VALUES (?, ?, ?, ?)", ["octane", 135, 2.50, "up"]);
    await connection.execute("INSERT INTO fuel_rates (fuel_type, price, change_amount, trend) VALUES (?, ?, ?, ?)", ["petrol", 130, 0.00, "stable"]);
    await connection.execute("INSERT INTO fuel_rates (fuel_type, price, change_amount, trend) VALUES (?, ?, ?, ?)", ["diesel", 106, -1.00, "down"]);

    // 6. Create 20 Fuel Usage records
    console.log("Creating 20 fuel usage records...");
    const methods = ["বিকাশ", "নগদ", "কার্ড"];

    for (let i = 0; i < 20; i++) {
      const vIdx = i % vehicleIds.length;
      const pIdx = i % pumpIds.length;
      const amount = (Math.random() * 10 + 2).toFixed(2);
      const fuelType = i % 2 === 0 ? "octane" : "petrol";
      const pricePerLiter = fuelType === "octane" ? 135 : 130;
      const price = (parseFloat(amount) * pricePerLiter).toFixed(2);
      
      await connection.execute(
        `INSERT INTO fuel_usages (user_id, vehicle_id, pump_id, amount_liters, price_total, fuel_type, pump_name, pump_location, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userIds[vIdx],
          vehicleIds[vIdx],
          pumpIds[pIdx],
          amount,
          price,
          fuelType,
          pumps[pIdx].name,
          "ঢাকা, বাংলাদেশ",
          methods[i % 3]
        ]
      );
    }

    // 7. Create 15 Fuel Transaction records
    console.log("Creating 15 fuel transaction records...");
    const operatorIds = userIds.filter((_, idx) => idx >= 7 && idx < 9); // Operators are index 7 and 8

    for (let i = 0; i < 15; i++) {
      const vIdx = i % vehicleIds.length; // Across all 3 vehicle owners
      const pIdx = i % pumpIds.length;
      const opIdx = i % operatorIds.length;
      
      const vehicleType = types[vIdx];
      const fuelType = vehicleType === "bike" ? "petrol" : (vehicleType === "truck" ? "diesel" : "octane");
      const pricePerLiter = fuelType === "octane" ? 135 : (fuelType === "petrol" ? 130 : 106);
      
      const amount = (Math.random() * 10 + 5).toFixed(2);
      const priceTotal = (parseFloat(amount) * pricePerLiter).toFixed(2);

      await connection.execute(
        `INSERT INTO fuel_transactions (vehicle_id, pump_id, operator_id, fuel_type, amount_liters, price_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          vehicleIds[vIdx],
          pumpIds[pIdx],
          operatorIds[opIdx],
          fuelType,
          amount,
          priceTotal
        ]
      );
    }

    console.log("Database repopulated successfully with ALL tables!");
  } catch (err) {
    console.error("Repopulation error:", err);
  } finally {
    await connection.end();
  }
};


repopulateDb();
