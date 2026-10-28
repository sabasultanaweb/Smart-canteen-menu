/**
 * Supabase Client Initialization Module
 * -------------------------------------------------------------
 * Reads credentials from environment variables (.env) and connects
 * to the Supabase PostgreSQL database. Provides status helpers for
 * seamless onboarding and fallback handling.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Check if credentials exist and are not unedited placeholders
const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-placeholder')
);

let supabase = null;

if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('✅ Supabase Client initialized with target URL:', supabaseUrl);
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
  }
} else {
  console.warn(
    '⚠️ Supabase credentials not found or set to default placeholders in backend/.env.\n' +
    '   Please set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env to connect to your real PostgreSQL database.\n' +
    '   The server will run in built-in demo memory mode until credentials are provided.'
  );
}

module.exports = {
  supabase,
  isConfigured: () => Boolean(supabase && isConfigured),
  getSupabaseStatus: () => ({
    configured: isConfigured,
    url: isConfigured ? supabaseUrl : 'Not Configured (Demo Mode Active)',
  }),
};
