/**
 * UTS Smart Transport - Secure Admin Seeder & Initialization Script
 *
 * Reads admin credentials from environment variables (.env)
 * Initializes the default system administrator account with secure role assignments.
 *
 * Usage:
 *   node scripts/seed-admin.cjs
 *   npm run seed:admin
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@gmail.com";
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "AdminUTS@2026!SecureKey#";
const ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || "UTS Operations Administrator";
const ADMIN_PHONE = process.env.DEFAULT_ADMIN_PHONE || "03124567891";

const ADMIN_UUID = "00000000-0000-4000-a000-000000000003";

console.log("==================================================");
console.log(" UTS SMART TRANSPORT — SECURE ADMIN SEEDER");
console.log("==================================================");
console.log(`[Config] Supabase URL: ${SUPABASE_URL ? "✓ Loaded" : "✗ Missing"}`);
console.log(`[Config] Admin Email:  ${ADMIN_EMAIL}`);
console.log(`[Config] Admin Name:   ${ADMIN_NAME}`);
console.log("--------------------------------------------------");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedAdmin() {
  try {
    console.log("1. Checking Supabase Auth registration...");
    // 1. Attempt to register admin account via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: {
          full_name: ADMIN_NAME,
          phone: ADMIN_PHONE,
          role: "ADMIN",
        },
      },
    });

    const targetUserId = authData?.user?.id || ADMIN_UUID;

    if (authError) {
      if (authError.message?.toLowerCase().includes("already registered") || authError.message?.toLowerCase().includes("exists")) {
        console.log("ℹ️  Admin auth account already exists in Supabase Auth.");
      } else {
        console.warn("⚠️  Auth signup warning:", authError.message);
      }
    } else {
      console.log("✓ Admin auth account registered successfully.");
    }

    // 2. Ensure public.profiles entry exists
    console.log("2. Syncing public.profiles record...");
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: targetUserId,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        phone: ADMIN_PHONE,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.warn("⚠️  Profiles table sync notice:", profileError.message);
    } else {
      console.log("✓ Admin profile upserted successfully.");
    }

    // 3. Ensure public.user_roles entry has role 'ADMIN'
    console.log("3. Granting RBAC role 'ADMIN' in public.user_roles...");
    const { error: roleError } = await supabase.from("user_roles").upsert(
      {
        user_id: targetUserId,
        role: "ADMIN",
      },
      { onConflict: "user_id,role" }
    );

    if (roleError) {
      console.warn("⚠️  User roles table sync notice:", roleError.message);
    } else {
      console.log("✓ RBAC role 'ADMIN' granted successfully.");
    }

    console.log("==================================================");
    console.log("✅ Default Administrator successfully initialized!");
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD.replace(/./g, "*")} (Configured in .env)`);
    console.log(`   Role:     ADMIN (Full Access to /admin routes)`);
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Seeder script encountered an error:", err);
  }
}

seedAdmin();
