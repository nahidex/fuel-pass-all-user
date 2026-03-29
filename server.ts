import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const sqliteDb = new Database("fuelpass.db");
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    mobile_number TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    district TEXT,
    series TEXT,
    number TEXT,
    type TEXT,
    model TEXT,
    color TEXT,
    engine_number TEXT,
    car_image_url TEXT,
    plate_image_url TEXT,
    bluebook_image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fuel_usages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    amount_liters REAL NOT NULL,
    price_total REAL,
    fuel_type TEXT,
    pump_name TEXT,
    pump_location TEXT,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );
`);

// Migration for SQLite: Adjust schema to support normalized 3-table structure
try {
  const tableInfo = sqliteDb.prepare("PRAGMA table_info(vehicles)").all();
  const columnsToAdd = [
    { name: 'user_id', type: 'INTEGER' },
    { name: 'password', type: 'TEXT' },
    { name: 'car_image_url', type: 'TEXT' },
    { name: 'plate_image_url', type: 'TEXT' },
    { name: 'bluebook_image_url', type: 'TEXT' }
  ];
  
  columnsToAdd.forEach(col => {
    const exists = tableInfo.some((existingCol: any) => existingCol.name === col.name);
    if (!exists) {
      sqliteDb.exec(`ALTER TABLE vehicles ADD COLUMN ${col.name} ${col.type}`);
      console.log(`SQLite: Added missing column '${col.name}' to 'vehicles' table`);
    }
  });
} catch (err) {
  console.error("SQLite migration error:", err);
}

// Seed SQLite with dummy data
try {
  const hashedPassword = bcrypt.hashSync('password123', 10);
  const dummyUsers = [
    { name: 'হবিবুল্লাহ নাহিদ', mobile: '01700000000', email: 'nahid@example.com', district: 'ঢাকা মেট্রো', series: 'ঘ', number: '১২৩৪', type: 'car', model: 'Toyota Premio', color: 'Silver', engine: 'A123456' },
    { name: 'হাসান মাহমুদ', mobile: '01700000001', email: 'hasan@example.com', district: 'ঢাকা মেট্রো', series: 'ল', 'number': '৫৬৭৮', type: 'bike', model: 'Honda Hornet', color: 'Red', engine: 'B987654' },
    { name: 'রাহাত আলী', mobile: '01700000002', email: 'rahat@example.com', district: 'চট্টগ্রাম মেট্রো', series: 'ট', 'number': '৯১০১', type: 'truck', model: 'Tata LPT', color: 'Blue', engine: 'C456789' },
    { name: 'আরিফ আহমেদ', mobile: '01700000003', email: 'arif@example.com', district: 'ঢাকা মেট্রো', series: 'চ', 'number': '২৩৪৫', type: 'car', model: 'Toyota Noah', color: 'White', engine: 'D567890' },
    { name: 'সুজন বিশ্বাস', mobile: '01700000004', email: 'sujon@example.com', district: 'রাজশাহী মেট্রো', series: 'হ', 'number': '৬৭৮৯', type: 'bike', model: 'Suzuki Gixxer', color: 'Black', engine: 'E123456' }
  ];

  for (const u of dummyUsers) {
    const existing: any = sqliteDb.prepare("SELECT id FROM users WHERE mobile_number = ?").get(u.mobile);
    if (!existing) {
      const userResult = sqliteDb.prepare("INSERT INTO users (full_name, mobile_number, email, password) VALUES (?, ?, ?, ?)").run(u.name, u.mobile, u.email, hashedPassword);
      const userId = userResult.lastInsertRowid;
      sqliteDb.prepare(`
        INSERT INTO vehicles (user_id, district, series, number, type, model, color, engine_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, u.district, u.series, u.number, u.type, u.model, u.color, u.engine);
      console.log(`SQLite: Seeded dummy user and vehicle for ${u.name}`);
    }
  }
} catch (err) {
  console.error("SQLite seeding error:", err);
}

// MySQL Connection Pool
let mysqlPool: mysql.Pool | null = null;

if (process.env.MYSQL_HOST) {
  mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const initializeMySQL = async () => {
    try {
      await mysqlPool?.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          mobile_number VARCHAR(20) UNIQUE NOT NULL,
          email VARCHAR(255),
          password VARCHAR(255) NOT NULL,
          role ENUM('owner', 'operator') NOT NULL DEFAULT 'owner',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);

      await mysqlPool?.execute(`
        CREATE TABLE IF NOT EXISTS vehicles (
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

      await mysqlPool?.execute(`
        CREATE TABLE IF NOT EXISTS fuel_usages (
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

      console.log("MySQL: Normalized tables verified (users, vehicles, fuel_usages)");

      await mysqlPool?.execute("SET NAMES utf8mb4");

      const hashedPassword = await bcrypt.hash('password123', 10);
      const dummyUsers = [
        { name: 'হবিবুল্লাহ নাহিদ', mobile: '01700000000', email: 'nahid@example.com', district: 'ঢাকা মেট্রো', series: 'ঘ', number: '১২৩৪', type: 'car', model: 'Toyota Premio', color: 'Silver', engine: 'A123456' },
        { name: 'হাসান মাহমুদ', mobile: '01700000001', email: 'hasan@example.com', district: 'ঢাকা মেট্রো', series: 'ল', number: '৫৬৭৮', type: 'bike', model: 'Honda Hornet', color: 'Red', engine: 'B987654' },
        { name: 'রাহাত আলী', mobile: '01700000002', email: 'rahat@example.com', district: 'চট্টগ্রাম মেট্রো', series: 'ট', number: '৯১০১', type: 'truck', model: 'Tata LPT', color: 'Blue', engine: 'C456789' },
        { name: 'আরিফ আহমেদ', mobile: '01700000003', email: 'arif@example.com', district: 'ঢাকা মেট্রো', series: 'চ', number: '২৩৪৫', type: 'car', model: 'Toyota Noah', color: 'White', engine: 'D567890' },
        { name: 'সুজন বিশ্বাস', mobile: '01700000004', email: 'sujon@example.com', district: 'রাজশাহী মেট্রো', series: 'হ', number: '৬৭৮৯', type: 'bike', model: 'Suzuki Gixxer', color: 'Black', engine: 'E123456' }
      ];

      for (const u of dummyUsers) {
        const [rows]: any = await mysqlPool?.execute("SELECT id FROM users WHERE mobile_number = ?", [u.mobile]);
        if (rows.length === 0) {
          const [userResult] = await mysqlPool?.execute("INSERT INTO users (full_name, mobile_number, email, password) VALUES (?, ?, ?, ?)", [u.name, u.mobile, u.email, hashedPassword]) as any;
          const userId = userResult.insertId;
          await mysqlPool?.execute(`
            INSERT INTO vehicles (user_id, district, series, number, type, model, color, engine_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [userId, u.district, u.series, u.number, u.type, u.model, u.color, u.engine]);
          console.log(`MySQL: Seeded dummy user and vehicle for ${u.name}`);
        }
      }
    } catch (err) {
      console.error("MySQL initialization error:", err);
    }
  };

  initializeMySQL();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure Multer for local storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = './uploads';
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage: storage });

  app.use(express.json());
  app.use('/uploads', express.static('uploads'));

  // Simple Request Logging Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // Example API route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Server is running", 
      db: mysqlPool ? "MySQL" : "SQLite (Fallback)" 
    });
  });

  // API to register vehicle
  app.post("/api/register-vehicle", async (req, res) => {
    const { fullName, mobileNumber, email, password, district, series, number, type, model, color, engineNumber } = req.body;
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      if (mysqlPool) {
        // MySQL Registration
        const connection = await mysqlPool.getConnection();
        try {
          await connection.beginTransaction();
          const [userResult] = await connection.execute(
            `INSERT INTO users (full_name, mobile_number, email, password, role) VALUES (?, ?, ?, ?, 'owner')`,
            [fullName, mobileNumber, email, hashedPassword]
          ) as any;
          const userId = userResult.insertId;
          
          await connection.execute(
            `INSERT INTO vehicles (user_id, district, series, number, type, model, color, engine_number) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, district, series, number, type, model, color, engineNumber]
          );
          
          await connection.commit();
          const token = jwt.sign({ userId, mobileNumber }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
          res.json({ success: true, id: userId, token });
        } catch (err) {
          await connection.rollback();
          throw err;
        } finally {
          connection.release();
        }
      } else {
        // SQLite Registration
        try {
          const trans = sqliteDb.transaction(() => {
            const userResult = sqliteDb.prepare(
              `INSERT INTO users (full_name, mobile_number, email, password) VALUES (?, ?, ?, ?)`
            ).run(fullName, mobileNumber, email, hashedPassword);
            const userId = userResult.lastInsertRowid;
            
            sqliteDb.prepare(
              `INSERT INTO vehicles (user_id, district, series, number, type, model, color, engine_number) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).run(userId, district, series, number, type, model, color, engineNumber);
            return userId;
          });
          
          const userId = trans();
          const token = jwt.sign({ userId, mobileNumber }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
          res.json({ success: true, id: userId, token });
        } catch (err) {
          throw err;
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ success: false, error: "Database error or mobile number already exists" });
    }
  });

  // API to upload vehicle images
  app.post("/api/upload-vehicle-images", upload.fields([
    { name: 'car', maxCount: 1 },
    { name: 'plate', maxCount: 1 },
    { name: 'bluebook', maxCount: 1 }
  ]), async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: "টোকেন নেই" });

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const carUrl = files['car'] ? `/uploads/${files['car'][0].filename}` : null;
      const plateUrl = files['plate'] ? `/uploads/${files['plate'][0].filename}` : null;
      const bluebookUrl = files['bluebook'] ? `/uploads/${files['bluebook'][0].filename}` : null;

      if (mysqlPool) {
        await mysqlPool.execute(
          `UPDATE vehicles SET car_image_url = ?, plate_image_url = ?, bluebook_image_url = ? WHERE user_id = ?`,
          [carUrl, plateUrl, bluebookUrl, decoded.userId]
        );
      } else {
        sqliteDb.prepare(
          `UPDATE vehicles SET car_image_url = ?, plate_image_url = ?, bluebook_image_url = ? WHERE user_id = ?`
        ).run(carUrl, plateUrl, bluebookUrl, decoded.userId);
      }

      res.json({ success: true, carUrl, plateUrl, bluebookUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ success: false, error: "সার্ভার ত্রুটি" });
    }
  });

  // API to get dashboard dummy data (protected)
  app.get("/api/dashboard-data", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: "টোকেন নেই" });

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      
      // Dummy data for dashboard
      const dashboardData = {
        fuelRates: [
          { type: 'অকটেন', price: 135, unit: 'টাকা' },
          { type: 'ডিজেল', price: 106, unit: 'টাকা' },
          { type: 'পেট্রোল', price: 130, unit: 'টাকা' }
        ],
        limits: {
          daily: { used: 1.5, total: 5.0 },
          monthly: { used: 45, total: 100, renewalDate: '০১ এপ্রিল ২০২৬' }
        },
        recentTransactions: [
          { id: 1, company: 'পদ্মা ফিলিং স্টেশন', date: '২০ মার্চ ২০২৪', time: '১১:২৫ AM', amount: '১০ লিটার', price: '১,৩৫০ টাকা', method: 'বিকাশ', type: 'Octane', location: 'কারওয়ান বাজার, ঢাকা' },
          { id: 2, company: 'মেঘনা পেট্রোলিয়াম', date: '১৮ মার্চ ২০২৪', time: '০৩:৪৫ PM', amount: '৫ লিটার', price: '৫৩০ টাকা', method: 'নগদ', type: 'Diesel', location: 'উত্তরা, ঢাকা' },
          { id: 3, company: 'যমুনা পেট্রোলিয়াম', date: '১৫ মার্চ ২০২৪', time: '০৯:১০ AM', amount: '১২ লিটার', price: '১,৫৬০ টাকা', method: 'কার্ড', type: 'Petrol', location: 'মতিঝিল, ঢাকা' }
        ]
      };

      res.json({ success: true, data: dashboardData });
    } catch (error) {
      res.status(401).json({ success: false, error: "অবৈধ টোকেন" });
    }
  });

  // API to login
  app.post("/api/login", async (req, res) => {
    const { mobileNumber, password } = req.body;
    
    try {
      let user: any = null;
      if (mysqlPool) {
        const [rows]: any = await mysqlPool.execute(`
          SELECT u.*, v.district, v.series, v.number, v.type, v.model, v.color, v.engine_number, v.car_image_url, v.plate_image_url, v.bluebook_image_url 
          FROM users u 
          LEFT JOIN vehicles v ON u.id = v.user_id 
          WHERE u.mobile_number = ?
        `, [mobileNumber]);
        user = rows[0];
      } else {
        user = sqliteDb.prepare(`
          SELECT u.*, v.district, v.series, v.number, v.type, v.model, v.color, v.engine_number, v.car_image_url, v.plate_image_url, v.bluebook_image_url 
          FROM users u 
          LEFT JOIN vehicles v ON u.id = v.user_id 
          WHERE u.mobile_number = ?
        `).get(mobileNumber);
      }

      if (!user) {
        return res.status(401).json({ success: false, error: "ব্যবহারকারী পাওয়া যায়নি" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: "ভুল পাসওয়ার্ড" });
      }

      const token = jwt.sign({ userId: user.id, mobileNumber: user.mobile_number }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      res.json({ success: true, token, user: {
        id: user.id,
        fullName: user.full_name,
        mobileNumber: user.mobile_number,
        email: user.email,
        role: user.role,
        district: user.district,
        series: user.series,
        number: user.number,
        type: user.type,
        model: user.model,
        color: user.color,
        engineNumber: user.engine_number,
        carImageUrl: user.car_image_url,
        plateImageUrl: user.plate_image_url,
        bluebookImageUrl: user.bluebook_image_url
      }});
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, error: "সার্ভার ত্রুটি" });
    }
  });

  // API to get current user info
  app.get("/api/me", async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: "টোকেন নেই" });

    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      let user: any = null;
      if (mysqlPool) {
        const [rows]: any = await mysqlPool.execute(`
          SELECT u.*, v.district, v.series, v.number, v.type, v.model, v.color, v.engine_number, v.car_image_url, v.plate_image_url, v.bluebook_image_url 
          FROM users u 
          LEFT JOIN vehicles v ON u.id = v.user_id 
          WHERE u.id = ?
        `, [decoded.userId]);
        user = rows[0];
      } else {
        user = sqliteDb.prepare(`
          SELECT u.*, v.district, v.series, v.number, v.type, v.model, v.color, v.engine_number, v.car_image_url, v.plate_image_url, v.bluebook_image_url 
          FROM users u 
          LEFT JOIN vehicles v ON u.id = v.user_id 
          WHERE u.id = ?
        `).get(decoded.userId);
      }

      if (!user) return res.status(404).json({ success: false, error: "ব্যবহারকারী পাওয়া যায়নি" });

      res.json({ success: true, user: {
        id: user.id,
        fullName: user.full_name,
        mobileNumber: user.mobile_number,
        email: user.email,
        role: user.role,
        district: user.district,
        series: user.series,
        number: user.number,
        type: user.type,
        model: user.model,
        color: user.color,
        engineNumber: user.engine_number,
        carImageUrl: user.car_image_url,
        plateImageUrl: user.plate_image_url,
        bluebookImageUrl: user.bluebook_image_url
      }});
    } catch (error) {
      res.status(401).json({ success: false, error: "অবৈধ টোকেন" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
