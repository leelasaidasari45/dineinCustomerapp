const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vspxlhphxypaxlxtfkwx.supabase.co'; // read from config or env
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("VITE_SUPABASE_ANON_KEY is not defined");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('restaurants').select('id, name');
  if (error) {
    console.error("Error fetching restaurants:", error);
  } else {
    console.log("Restaurants in DB:", data);
  }
}

run();
