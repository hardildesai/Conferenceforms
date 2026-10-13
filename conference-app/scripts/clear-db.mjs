// scripts/clear-db.mjs
// Run: node scripts/clear-db.mjs
// Or for a single city: node scripts/clear-db.mjs surat

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const targetCity = process.argv[2]?.toLowerCase();

async function clearDb() {
  if (targetCity) {
    console.log(`Clearing registrations for city: "${targetCity}"...`);
    const { error, count } = await supabase
      .from('registrations')
      .delete({ count: 'exact' })
      .eq('city', targetCity);

    if (error) {
      console.error('❌ Error deleting rows:', error.message);
      process.exit(1);
    }
    console.log(`✓ Cleared registrations for ${targetCity}. Rows deleted: ${count ?? 'all matching'}`);
  } else {
    console.log('Clearing ALL registrations from database...');
    // Delete all records where id is not null (deletes all rows)
    const { error, count } = await supabase
      .from('registrations')
      .delete({ count: 'exact' })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('❌ Error deleting rows:', error.message);
      process.exit(1);
    }
    console.log(`✓ Successfully cleared all registrations from database. Rows deleted: ${count ?? 'all'}`);
  }
}

clearDb().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
