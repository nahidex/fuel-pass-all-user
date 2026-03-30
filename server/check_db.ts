import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function checkDb() {
  if (!process.env.MYSQL_HOST) {
    console.log("MYSQL_HOST not found in .env");
    return;
  }

  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || "3306"),
  });

  try {
    const [tables]: any = await pool.execute("SHOW TABLES");
    console.log("Tables:", tables);

    for (const table of tables) {
      const tableName = Object.values(table)[0] as string;
      const [createTable]: any = await pool.execute(`SHOW CREATE TABLE ${tableName}`);
      console.log(`\n--- CREATE TABLE ${tableName} ---\n`, createTable[0]['Create Table']);
    }

  } catch (err) {
    console.error("Error checking DB:", err);
  } finally {
    await pool.end();
  }
}

checkDb();
