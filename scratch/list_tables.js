import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: otData, error: otError } = await supabase
    .from('order_tables')
    .insert({ order_id: 'd3c98511-490a-4f14-a4d4-8df7bd57b5a4' })
    .select();

  if (otError) {
    console.log("order_tables insert error details:", otError);
  } else {
    console.log("order_tables inserted row columns:", Object.keys(otData[0]));
  }
}

run();
