const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ezpqrzhlsfxolytuuich.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6cHFyemhsc2Z4b2x5dHV1aWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMzU0NTMsImV4cCI6MjA5ODcxMTQ1M30.0IHRmHYLRzHwRmDOz3hWi14LtTji4OqBBlBPF1raA3I';

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
