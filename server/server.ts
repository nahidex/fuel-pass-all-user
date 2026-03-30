import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MySQL Connection Pool
const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initializeMySQL = async () => {
  try {
    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role ENUM('owner', 'operator', 'distributor') NOT NULL DEFAULT 'owner',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    await mysqlPool.execute(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        district VARCHAR(100),
        series VARCHAR(100),
        number VARCHAR(100),
        model_number VARCHAR(100),
        type VARCHAR(50),
        fuel_type VARCHAR(50),
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

    await mysqlPool.execute(`
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

    console.log(
      "MySQL: Normalized tables verified (users, vehicles, fuel_usages)",
    );

    await mysqlPool.execute("SET NAMES utf8mb4");

    const hashedPassword = await bcrypt.hash("password123", 10);
    const dummyUsers = [
      {
        name: "হবিবুল্লাহ নাহিদ",
        mobile: "01700000000",
        email: "nahid@example.com",
        role: "owner",
        district: "ঢাকা মেট্রো",
        series: "ঘ",
        number: "১২৩৪",
        type: "car",
        model: "Toyota Premio",
        color: "Silver",
        engine: "A123456",
      },
      {
        name: "হাসান মাহমুদ",
        mobile: "01700000001",
        email: "hasan@example.com",
        role: "operator",
        district: "ঢাকা মেট্রো",
        series: "ল",
        number: "৫৬৭৮",
        type: "bike",
        model: "Honda Hornet",
        color: "Red",
        engine: "B987654",
      },
      {
        name: "ডিস্ট্রিবিউটর ইউজার",
        mobile: "01700000005",
        email: "distributor@example.com",
        role: "distributor",
        district: "ঢাকা মেট্রো",
        series: "ক",
        number: "১১১১",
        type: "car",
        model: "Admin",
        color: "White",
        engine: "X000000",
      },
    ];

    for (const u of dummyUsers) {
      const [rows]: any = await mysqlPool.execute(
        "SELECT id FROM users WHERE mobile_number = ?",
        [u.mobile],
      );
      if (rows.length === 0) {
        const [userResult] = (await mysqlPool.execute(
          "INSERT INTO users (full_name, mobile_number, email, password, role) VALUES (?, ?, ?, ?, ?)",
          [u.name, u.mobile, u.email, hashedPassword, u.role],
        )) as any;
        const userId = userResult.insertId;

        if (u.role === "owner") {
          await mysqlPool.execute(
            `
            INSERT INTO vehicles (user_id, district, series, number, type, model, color, engine_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              userId,
              u.district,
              u.series,
              u.number,
              u.type,
              u.model,
              u.color,
              u.engine,
            ],
          );
        }
        console.log(`MySQL: Seeded dummy user (${u.role}) for ${u.name}`);
      }
    }
  } catch (err) {
    console.error("MySQL initialization error:", err);
  }
};

initializeMySQL();

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  const PORT = 3000;

  // Configure Multer for local storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = "./uploads";
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
      );
    },
  });

  const upload = multer({ storage: storage });

  // Simple Request Logging Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `[API] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`,
      );
    });
    next();
  });

  // Example API route
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Server is running",
      db: mysqlPool ? "MySQL" : "SQLite (Fallback)",
    });
  });

  // API to register vehicle
  app.post(
    "/api/register-vehicle",
    upload.fields([
      { name: "car", maxCount: 1 },
      { name: "plate", maxCount: 1 },
      { name: "bluebook", maxCount: 1 },
    ]),
    async (req, res) => {
      console.log("[DEBUG] Registration request received");
      console.log("[DEBUG] Body:", req.body);
      console.log("[DEBUG] Files:", req.files ? Object.keys(req.files) : "No files");

      const {
        fullName,
        mobileNumber,
        email,
        password,
        district,
        series,
        number,
        type,
        model,
        color,
        engineNumber,
      } = req.body;

      try {
        if (!password || password === "undefined") {
          console.error("[ERROR] Password is missing or 'undefined'");
          return res.status(400).json({ success: false, error: "পাসওয়ার্ড প্রদান করুন" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        if (mysqlPool) {
          // MySQL Registration
          const connection = await mysqlPool.getConnection();
          try {
            await connection.beginTransaction();

            const [userResult] = (await connection.execute(
              `INSERT INTO users (full_name, mobile_number, email, password, role) VALUES (?, ?, ?, ?, 'owner')`,
              [fullName, mobileNumber, email, hashedPassword],
            )) as any;
            const userId = userResult.insertId;

            const files = req.files as {
              [fieldname: string]: Express.Multer.File[];
            };

            const carUrl =
              files && files["car"]
                ? `/uploads/${files["car"][0].filename}`
                : null;
            const plateUrl =
              files && files["plate"]
                ? `/uploads/${files["plate"][0].filename}`
                : null;
            const bluebookUrl =
              files && files["bluebook"]
                ? `/uploads/${files["bluebook"][0].filename}`
                : null;

            const vehicleUuid = crypto.randomUUID();
            const [vResult]: any = await connection.execute(
              `INSERT INTO vehicles (user_id, uuid, district, series, number, model_number, type, fuel_type, model, color, engine_number, car_image_url, plate_image_url, bluebook_image_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                userId,
                vehicleUuid,
                district,
                series,
                number,
                `${district}-${series}-${number}`,
                type,
                type === "bike" ? "petrol" : "octane", // Default fuel type based on vehicle type
                model || "Toyota",
                color || "White",
                engineNumber || "123456",
                carUrl,
                plateUrl,
                bluebookUrl,
              ],
            );

            // Create default quota for new vehicle (30L weekly)
            await connection.execute(
              "INSERT INTO quotas (vehicle_id, weekly_limit_liters) VALUES (?, ?)",
              [
                vResult.insertId,
                type === "truck" ? 100 : type === "car" ? 40 : 15,
              ],
            );

            await connection.commit();
            const token = jwt.sign(
              { userId, mobileNumber },
              process.env.JWT_SECRET || "secret",
              { expiresIn: "7d" },
            );
            res.json({ success: true, id: userId, token });
          } catch (err) {
            await connection.rollback();
            throw err;
          } finally {
            connection.release();
          }
        } else {
          throw new Error("MySQL not initialized");
        }
      } catch (error: any) {
        console.error("Registration error:", error);
        res.status(500).json({
          success: false,
          error:
            error.message || "Database error or mobile number already exists",
        });
      }
    },
  );

  // API to upload vehicle images
  app.post(
    "/api/upload-vehicle-images",
    upload.fields([
      { name: "car", maxCount: 1 },
      { name: "plate", maxCount: 1 },
      { name: "bluebook", maxCount: 1 },
    ]),
    async (req, res) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token)
        return res.status(401).json({ success: false, error: "টোকেন নেই" });

      try {
        const decoded: any = jwt.verify(
          token,
          process.env.JWT_SECRET || "secret",
        );
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };

        const carUrl = files["car"]
          ? `/uploads/${files["car"][0].filename}`
          : null;
        const plateUrl = files["plate"]
          ? `/uploads/${files["plate"][0].filename}`
          : null;
        const bluebookUrl = files["bluebook"]
          ? `/uploads/${files["bluebook"][0].filename}`
          : null;

        if (mysqlPool) {
          await mysqlPool.execute(
            `UPDATE vehicles SET car_image_url = ?, plate_image_url = ?, bluebook_image_url = ? WHERE user_id = ?`,
            [carUrl, plateUrl, bluebookUrl, decoded.userId],
          );
        }

        res.json({ success: true, carUrl, plateUrl, bluebookUrl });
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ success: false, error: "সার্ভার ত্রুটি" });
      }
    },
  );

  // API to get transactions for a vehicle
  app.get("/api/transactions", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, error: "টোকেন নেই" });

    try {
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret",
      );
      const userId = decoded.userId;

      if (mysqlPool) {
        // First find the vehicle associated with this user
        const [vehicles]: any = await mysqlPool.execute(
          "SELECT id FROM vehicles WHERE user_id = ?",
          [userId]
        );

        if (vehicles.length === 0) {
          return res.json({ success: true, transactions: [] });
        }

        const vehicleId = vehicles[0].id;

        // Fetch transactions from fuel_transactions table with pump info
        const [rows]: any = await mysqlPool.execute(
          `SELECT t.*, p.name as pump_name, p.location as pump_location 
           FROM fuel_transactions t
           JOIN pumps p ON t.pump_id = p.id
           WHERE t.vehicle_id = ?
           ORDER BY t.created_at DESC
           LIMIT 20`,
          [vehicleId]
        );

        // Map database fields to what the mobile app expects
        const transactions = rows.map((row: any) => ({
          id: row.id,
          type: row.fuel_type === 'octane' ? 'অকটেন' : row.fuel_type === 'diesel' ? 'ডিজেল' : 'পেট্রোল',
          amount: row.amount_liters.toString(),
          price: row.price_total.toString(),
          date: new Date(row.created_at).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          time: new Date(row.created_at).toLocaleTimeString('bn-BD', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          method: 'বিকাশ', // Defaulting for now as it's not in fuel_transactions table
          location: row.pump_name,
        }));

        res.json({ success: true, transactions });
      } else {
        res.status(500).json({ success: false, error: "Database not connected" });
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(401).json({ success: false, error: "অবৈধ টোকেন" });
    }
  });

  // API to get dashboard dummy data (protected)
  app.get("/api/dashboard-data", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, error: "টোকেন নেই" });

    try {
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret",
      );

      // Dummy data for dashboard
      const dashboardData = {
        fuelRates: [
          { type: "অকটেন", price: 135, unit: "টাকা" },
          { type: "ডিজেল", price: 106, unit: "টাকা" },
          { type: "পেট্রোল", price: 130, unit: "টাকা" },
        ],
        limits: {
          daily: { used: 1.5, total: 5.0 },
          monthly: { used: 45, total: 100, renewalDate: "০১ এপ্রিল ২০২৬" },
        },
        recentTransactions: [
          {
            id: 1,
            company: "পদ্মা ফিলিং স্টেশন",
            date: "২০ মার্চ ২০২৪",
            time: "১১:২৫ AM",
            amount: "১০ লিটার",
            price: "১,৩৫০ টাকা",
            method: "বিকাশ",
            type: "Octane",
            location: "কারওয়ান বাজার, ঢাকা",
          },
          {
            id: 2,
            company: "মেঘনা পেট্রোলিয়াম",
            date: "১৮ মার্চ ২০২৪",
            time: "০৩:৪৫ PM",
            amount: "৫ লিটার",
            price: "৫৩০ টাকা",
            method: "নগদ",
            type: "Diesel",
            location: "উত্তরা, ঢাকা",
          },
          {
            id: 3,
            company: "যমুনা পেট্রোলিয়াম",
            date: "১৫ মার্চ ২০২৪",
            time: "০৯:১০ AM",
            amount: "১২ লিটার",
            price: "১,৫৬০ টাকা",
            method: "কার্ড",
            type: "Petrol",
            location: "মতিঝিল, ঢাকা",
          },
        ],
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
        const [rows]: any = await mysqlPool.execute(
          `
          SELECT u.*, v.district, v.series, v.model_number, v.type, v.fuel_type, v.model, v.color, v.engine_number, v.car_image_url, v.plate_image_url, v.bluebook_image_url 
          FROM users u 
          LEFT JOIN vehicles v ON u.id = v.user_id 
          WHERE u.mobile_number = ?
        `,
          [mobileNumber],
        );
        user = rows[0];
      }

      if (!user) {
        return res
          .status(401)
          .json({ success: false, error: "ব্যবহারকারী পাওয়া যায়নি" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: "ভুল পাসওয়ার্ড" });
      }

      const token = jwt.sign(
        { userId: user.id, mobileNumber: user.mobile_number },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" },
      );
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          mobileNumber: user.mobile_number,
          email: user.email,
          role: user.role,
          district: user.district,
          series: user.series,
          regNumber: user.model_number,
          type: user.type,
          model: user.model,
          color: user.color,
          engineNumber: user.engine_number,
          carImageUrl: user.car_image_url,
          plateImageUrl: user.plate_image_url,
          bluebookImageUrl: user.bluebook_image_url,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, error: "সার্ভার ত্রুটি" });
    }
  });

  // API to get current user info
  app.get("/api/me", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, error: "টোকেন নেই" });

    try {
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret",
      );
      let user: any = null;
      if (mysqlPool) {
        const [rows]: any = await mysqlPool.execute(
          `
          SELECT u.*, v.district, v.series, v.model_number, v.type, v.fuel_type, v.model, v.color, v.engine_number, v.car_image_url, v.plate_image_url, v.bluebook_image_url 
          FROM users u 
          LEFT JOIN vehicles v ON u.id = v.user_id 
          WHERE u.id = ?
        `,
          [decoded.userId],
        );
        user = rows[0];
      }

      if (!user)
        return res
          .status(404)
          .json({ success: false, error: "ব্যবহারকারী পাওয়া যায়নি" });

      res.json({
        success: true,
        user: {
          id: user.id,
          fullName: user.full_name,
          mobileNumber: user.mobile_number,
          email: user.email,
          role: user.role,
          district: user.district,
          series: user.series,
          regNumber: user.model_number,
          type: user.type,
          model: user.model,
          color: user.color,
          engineNumber: user.engine_number,
          carImageUrl: user.car_image_url,
          plateImageUrl: user.plate_image_url,
          bluebookImageUrl: user.bluebook_image_url,
        },
      });
    } catch (error) {
      res.status(401).json({ success: false, error: "অবৈধ টোকেন" });
    }
  });

  // API to get all pumps with inventory
  app.get("/api/pumps", async (req, res) => {
    try {
      if (mysqlPool) {
        const [rows]: any = await mysqlPool.execute(`
          SELECT p.*, i.octane_liters, i.diesel_liters, i.petrol_liters 
          FROM pumps p
          LEFT JOIN inventories i ON p.id = i.pump_id
          WHERE p.status = 'active'
        `);
        res.json({ success: true, pumps: rows });
      } else {
        res
          .status(500)
          .json({ success: false, error: "Database not connected" });
      }
    } catch (error) {
      console.error("Error fetching pumps:", error);
      res.status(500).json({ success: false, error: "সার্ভার ত্রুটি" });
    }
  });

  // API to get vehicle QR data as encrypted JWT
  // API to get fuel prices
  app.get("/api/fuel-prices", async (req, res) => {
    try {
      const [rows]: any = await mysqlPool.execute(
        "SELECT fuel_type, price, change_amount, trend FROM fuel_rates"
      );
      res.json({ success: true, prices: rows });
    } catch (error) {
      console.error("Error fetching fuel prices:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  app.get("/api/vehicle-qr", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "টোকেন নেই" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret",
      );

      let vehicle: any = null;
      if (mysqlPool) {
        const [rows]: any = await mysqlPool.execute(
          "SELECT uuid, model_number FROM vehicles WHERE user_id = ?",
          [decoded.userId],
        );
        vehicle = rows[0];
      }

      if (!vehicle) {
        return res
          .status(404)
          .json({ success: false, error: "যানবাহন পাওয়া যায়নি" });
      }

      // Hardcoded timestamps as requested: 1 minute duration
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        uuid: vehicle.uuid,
        regNumber: vehicle.model_number,
        iat: now,
        exp: now + 60, // 1 minute expiry
      };

      // Sign the payload. Note: jwt.sign adds iat by default unless we handle it.
      // Since specific iat/exp are requested, we'll sign the object as is.
      const qrToken = jwt.sign(payload, process.env.JWT_SECRET || "secret");

      res.json({
        success: true,
        qrToken,
      });
    } catch (error) {
      console.error("QR data error:", error);
      res.status(401).json({ success: false, error: "অবৈধ টোকেন" });
    }
  });

  // API to verify QR and get detailed vehicle/user data for operator dashboard
  app.post("/api/verify-qr", async (req, res) => {
    const { qrToken } = req.body;
    if (!qrToken) {
      return res.status(400).json({ success: false, error: "কিউআর টোকেন প্রয়োজন" });
    }

    try {
      // 1. Verify and decode the QR token
      const decoded: any = jwt.verify(qrToken, process.env.JWT_SECRET || "secret");
      const { uuid } = decoded;

      if (!mysqlPool) {
        return res.status(500).json({ success: false, error: "ডাটাবেস সংযোগ নেই" });
      }

      // 2. Query detailed information using UUID from vehicles table
      const [results]: any = await mysqlPool.execute(`
        SELECT 
          v.id as vehicle_id,
          u.full_name as owner_name,
          v.model_number,
          v.type as vehicle_type,
          v.car_image_url,
          v.plate_image_url,
          v.bluebook_image_url,
          (SELECT weekly_limit_liters FROM quotas WHERE vehicle_id = v.id LIMIT 1) as weekly_limit,
          (SELECT SUM(amount_liters) FROM fuel_usages WHERE vehicle_id = v.id AND DATE(created_at) = CURDATE()) as daily_usage,
          (SELECT SUM(amount_liters) FROM fuel_usages WHERE vehicle_id = v.id AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)) as weekly_usage,
          (SELECT SUM(amount_liters) FROM fuel_usages WHERE vehicle_id = v.id AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())) as monthly_usage
        FROM vehicles v
        INNER JOIN users u ON v.user_id = u.id
        WHERE v.uuid = ? OR v.model_number = ?
      `, [uuid, uuid]);

      if (results.length === 0) {
        return res.status(404).json({ success: false, error: "যানবাহন পাওয়া যায়নি" });
      }

      const data = results[0];
      
      // Calculate remaining limits
      const weeklyLimit = parseFloat(data.weekly_limit || 20);
      const weeklyUsage = parseFloat(data.weekly_usage || 0);
      const remainingQuota = Math.max(0, weeklyLimit - weeklyUsage);

      res.json({
        success: true,
        data: {
          ownerName: data.owner_name,
          regNumber: data.model_number,
          vehicleType: data.vehicle_type,
          carImageUrl: data.car_image_url,
          plateImageUrl: data.plate_image_url,
          bluebookImageUrl: data.bluebook_image_url,
          dailyLimit: weeklyLimit.toFixed(1),
          dailyRemaining: remainingQuota.toFixed(1),
          monthlyLimit: (weeklyLimit * 4).toFixed(0),
          monthlyUsage: parseFloat(data.monthly_usage || 0).toFixed(0),
          status: "Active",
          vehicleId: results[0].vehicle_id // Include vehicleId for the transaction flow
        }
      });
    } catch (error: any) {
      console.error("QR Verification error:", error);
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({ success: false, error: "কিউআর কোডটির মেয়াদ শেষ হয়ে গেছে" });
      }
      res.status(400).json({ success: false, error: "অবৈধ কিউআর কোড" });
    }
  });

  // API to complete a fuel transaction
  app.post("/api/complete-transaction", async (req, res) => {
    const { vehicleId, pumpId, operatorId, fuelType, amountLiters } = req.body;

    if (!vehicleId || !pumpId || !operatorId || !fuelType || !amountLiters) {
      return res.status(400).json({ success: false, error: "প্রয়োজনীয় তথ্য পাওয়া যায়নি" });
    }

    if (!mysqlPool) {
      return res.status(500).json({ success: false, error: "ডাটাবেস সংযোগ নেই" });
    }

    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Get the current fuel rate
      const [rates]: any = await connection.execute(
        "SELECT price FROM fuel_rates WHERE fuel_type = ?",
        [fuelType]
      );
      
      if (rates.length === 0) {
        throw new Error("জ্বালানির মূল্য পাওয়া যায়নি");
      }
      const pricePerLiter = parseFloat(rates[0].price);
      const totalPrice = pricePerLiter * parseFloat(amountLiters);

      // 2. Check inventory
      const [inventories]: any = await connection.execute(
        `SELECT id, octane_liters, diesel_liters, petrol_liters FROM inventories WHERE pump_id = ? FOR UPDATE`,
        [pumpId]
      );

      if (inventories.length === 0) {
        throw new Error("পাম্পের ইনভেন্টরি তথ্য পাওয়া যায়নি");
      }

      const inventory = inventories[0];
      const stockField = `${fuelType}_liters`;
      const currentStock = parseFloat(inventory[stockField]);

      if (currentStock < parseFloat(amountLiters)) {
        throw new Error("পাম্পে পর্যাপ্ত জ্বালানি নেই");
      }

      // 3. Decrement inventory
      const updateQuery = `UPDATE inventories SET ${stockField} = ${stockField} - ? WHERE pump_id = ?`;
      console.log(`[DEBUG] Executing: ${updateQuery} with values: [${amountLiters}, ${pumpId}]`);
      
      const [updateResult]: any = await connection.execute(
        updateQuery,
        [amountLiters, pumpId]
      );
      console.log(`[DEBUG] Inventory update rows affected: ${updateResult.affectedRows}`);

      // 4. Record transaction in fuel_transactions
      const [txResult]: any = await connection.execute(
        `INSERT INTO fuel_transactions (vehicle_id, pump_id, operator_id, fuel_type, amount_liters, price_total) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [vehicleId, pumpId, operatorId, fuelType, amountLiters, totalPrice]
      );

      // 5. Sync with legacy fuel_usages table
      // First get user_id for the vehicle
      const [vehicles]: any = await connection.execute(
        "SELECT user_id FROM vehicles WHERE id = ?",
        [vehicleId]
      );
      
      if (vehicles.length > 0) {
        const userId = vehicles[0].user_id;
        const [pumpInfo]: any = await connection.execute(
          "SELECT name, location FROM pumps WHERE id = ?",
          [pumpId]
        );
        
        const pumpName = pumpInfo.length > 0 ? pumpInfo[0].name : "Unknown Pump";
        const pumpLoc = pumpInfo.length > 0 ? pumpInfo[0].location : "";

        await connection.execute(
          `INSERT INTO fuel_usages (user_id, vehicle_id, pump_id, amount_liters, price_total, fuel_type, pump_name, pump_location, payment_method)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'FuelPass App')`,
          [userId, vehicleId, pumpId, amountLiters, totalPrice, fuelType, pumpName, pumpLoc]
        );
      }

      await connection.commit();
      res.json({ 
        success: true, 
        transactionId: txResult.insertId,
        message: "লেনদেন সফলভাবে সম্পন্ন হয়েছে" 
      });

    } catch (error: any) {
      await connection.rollback();
      console.error("Transaction Flow Error:", error);
      res.status(500).json({ success: false, error: error.message || "লেনদেন সম্পন্ন করা সম্ভব হয়নি" });
    } finally {
      connection.release();
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
