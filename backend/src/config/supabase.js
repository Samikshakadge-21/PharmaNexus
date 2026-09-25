const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is missing from environment variables');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_SECRET_KEY is missing from environment variables');
}

console.log(
  'Supabase key type:',
  supabaseKey?.startsWith('sb_secret_')
    ? 'SECRET KEY'
    : supabaseKey?.startsWith('sb_publishable_')
      ? 'PUBLISHABLE KEY'
      : 'UNKNOWN KEY FORMAT'
);

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

module.exports = supabase;