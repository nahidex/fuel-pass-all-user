import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

const showTables = async () => {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || "3306"),
  });

  try {
    const [tables]: any = await connection.execute("SHOW TABLES");
    console.log("TABLES IN DATABASE:");
    console.table(tables.map((row: any) => Object.values(row)[0]));
    
    // Check if some key tables exist and their row count
    for (const row of tables) {
      const tableName = Object.values(row)[0] as string;
      const [count]: any = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
      console.log(`${tableName}: ${count[0].total} rows`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await connection.end();
  }
};

showTables();
