import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

const testDb = async () => {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || "3306"),
  });

  try {
    const [users]: any = await connection.execute("SELECT id, full_name, mobile_number, role, created_at FROM users ORDER BY id DESC LIMIT 5");
    console.log("LAST 5 USERS:");
    console.table(users);
    
    const [vehicles]: any = await connection.execute("SELECT user_id, district, model_number, car_image_url FROM vehicles ORDER BY id DESC LIMIT 5");
    console.log("LAST 5 VEHICLES:");
    console.table(vehicles);

  } catch (err) {
    console.error("Query Error:", err);
  } finally {
    await connection.end();
  }
};

testDb();
