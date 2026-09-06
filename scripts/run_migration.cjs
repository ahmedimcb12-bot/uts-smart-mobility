const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString =
  "postgresql://postgres:Mukhtarahmed@123@db.awelfckzcrzavlzdbpvb.supabase.co:5432/postgres";

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to PostgreSQL successfully.");

    const sqlPath = path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "20260906000000_driver_applications_and_audit.sql",
    );
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Running migration...");
    await client.query(sql);
    console.log("MIGRATION_APPLIED_SUCCESSFULLY");

    // Verify created tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(
      "Current Public Tables:",
      res.rows.map((r) => r.table_name),
    );
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

runMigration();
