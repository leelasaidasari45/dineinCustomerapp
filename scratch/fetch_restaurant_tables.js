import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: restaurants, error: rError } = await supabase.from('restaurants').select('id, name').limit(1);
  if (rError) {
    console.error("Error fetching restaurants:", rError);
    return;
  }
  
  if (restaurants.length === 0) {
    console.log("No restaurants found in database!");
    return;
  }
  
  const restaurant = restaurants[0];
  console.log(`Found restaurant: ${restaurant.name} (${restaurant.id})`);

  const { data: tables, error: tError } = await supabase
    .from('restaurant_tables')
    .select('*')
    .eq('restaurant_id', restaurant.id);

  if (tError) {
    console.error("Error fetching restaurant_tables:", tError);
  } else {
    console.log(`Found ${tables.length} tables in restaurant_tables for ${restaurant.name}:`, tables);
  }
}

run();
