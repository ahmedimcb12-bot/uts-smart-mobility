const { Client } = require("pg");

const connectionString =
  "postgresql://postgres:Mukhtarahmed@123@db.awelfckzcrzavlzdbpvb.supabase.co:5432/postgres";

async function checkDb() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("CONNECTED_TO_SUPABASE_OK");

    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(
      "PUBLIC_TABLES:",
      tablesRes.rows.map((r) => r.table_name),
    );

    const enumRes = await client.query(`
      SELECT typname, enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid;
    `);
    console.log("ENUMS:", enumRes.rows);
  } catch (err) {
    console.error("Database check error:", err);
  } finally {
    await client.end();
  }
}

checkDb();
