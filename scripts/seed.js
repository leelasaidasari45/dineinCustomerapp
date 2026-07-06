/**
 * DineIn — Direct Schema + Seed via Supabase JS
 * Uses service role key to create tables then seed data
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tpusmiojzdalqrxjzph.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
  db: { schema: 'public' },
});

// ─── Individual table creation via rpc exec_sql or direct checks ──────────────

async function tableExists(tableName) {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName)
    .single();
  return !!data && !error;
}

// ─── Restaurant data ────────────────────────────────────────────────────────

const restaurants = [
  { name: 'Spice Garden', cuisine_tags: ['North Indian', 'Biryani', 'Curries'], address: '12 MG Road, Bangalore', photo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', avg_prep_time_minutes: 25, rating: 4.5, is_open: true },
  { name: 'The Pizza Republic', cuisine_tags: ['Pizza', 'Italian', 'Burgers'], address: '45 Indiranagar, Bangalore', photo_url: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800&q=80', avg_prep_time_minutes: 20, rating: 4.3, is_open: true },
  { name: 'Wok & Roll', cuisine_tags: ['Chinese', 'Noodles', 'Asian'], address: '7 Koramangala, Bangalore', photo_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80', avg_prep_time_minutes: 18, rating: 4.1, is_open: true },
  { name: 'South Spice', cuisine_tags: ['South Indian', 'Dosa', 'Filter Coffee'], address: '3 Jayanagar, Bangalore', photo_url: 'https://images.unsplash.com/photo-1630383249896-483b843e5b89?w=800&q=80', avg_prep_time_minutes: 15, rating: 4.6, is_open: true },
  { name: 'Burger Barn', cuisine_tags: ['Burgers', 'American', 'Fries'], address: '22 Whitefield, Bangalore', photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', avg_prep_time_minutes: 12, rating: 4.0, is_open: true },
  { name: 'Sweet Cravings', cuisine_tags: ['Desserts', 'Ice Cream', 'Cakes'], address: '8 HSR Layout, Bangalore', photo_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80', avg_prep_time_minutes: 10, rating: 4.7, is_open: true },
];

const getMenuItems = (restaurantId, restaurantName) => {
  const menus = {
    'Spice Garden': [
      { category: 'Starters', name: 'Paneer Tikka', price: 280, is_veg: true, description: 'Marinated cottage cheese grilled to perfection', photo_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80' },
      { category: 'Starters', name: 'Chicken Seekh Kebab', price: 340, is_veg: false, description: 'Minced chicken with aromatic spices', photo_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80' },
      { category: 'Starters', name: 'Samosa (2 pcs)', price: 80, is_veg: true, description: 'Crispy pastry with spiced potato filling', photo_url: null },
      { category: 'Main Course', name: 'Butter Chicken', price: 380, is_veg: false, description: 'Slow-cooked chicken in rich tomato-cream gravy', photo_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80' },
      { category: 'Main Course', name: 'Dal Makhani', price: 280, is_veg: true, description: 'Black lentils slow-cooked overnight with butter', photo_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80' },
      { category: 'Main Course', name: 'Chicken Biryani', price: 420, is_veg: false, description: 'Fragrant basmati with juicy chicken pieces', photo_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80' },
      { category: 'Main Course', name: 'Paneer Butter Masala', price: 320, is_veg: true, description: 'Rich and creamy paneer in tomato gravy', photo_url: null },
      { category: 'Breads', name: 'Garlic Naan', price: 60, is_veg: true, description: 'Soft naan with garlic butter', photo_url: null },
      { category: 'Breads', name: 'Tandoori Roti', price: 40, is_veg: true, description: 'Whole wheat bread baked in tandoor', photo_url: null },
      { category: 'Desserts', name: 'Gulab Jamun', price: 120, is_veg: true, description: 'Soft milk dumplings in rose syrup', photo_url: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&q=80' },
      { category: 'Beverages', name: 'Mango Lassi', price: 120, is_veg: true, description: 'Chilled yogurt smoothie with Alphonso mango', photo_url: null },
    ],
    'The Pizza Republic': [
      { category: 'Starters', name: 'Garlic Bread', price: 150, is_veg: true, description: 'Toasted baguette with herb garlic butter', photo_url: null },
      { category: 'Starters', name: 'Chicken Wings', price: 320, is_veg: false, description: 'Crispy wings with choice of sauce', photo_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80' },
      { category: 'Pizzas', name: 'Margherita', price: 350, is_veg: true, description: 'Classic tomato, mozzarella, fresh basil', photo_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80' },
      { category: 'Pizzas', name: 'BBQ Chicken Pizza', price: 450, is_veg: false, description: 'Smoky BBQ sauce, chicken, onions, peppers', photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80' },
      { category: 'Pizzas', name: 'Veggie Supreme', price: 400, is_veg: true, description: 'Loaded with seasonal vegetables', photo_url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&q=80' },
      { category: 'Burgers', name: 'Classic Smash Burger', price: 280, is_veg: false, description: 'Double smashed beef patty, cheese, special sauce', photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
      { category: 'Burgers', name: 'Crispy Veg Burger', price: 220, is_veg: true, description: 'Crispy veggie patty, lettuce, tomato', photo_url: null },
      { category: 'Desserts', name: 'Tiramisu', price: 220, is_veg: true, description: 'Classic Italian dessert with espresso', photo_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80' },
      { category: 'Beverages', name: 'Fresh Lime Soda', price: 80, is_veg: true, description: 'Sweet, salt, or masala', photo_url: null },
    ],
    'Wok & Roll': [
      { category: 'Starters', name: 'Spring Rolls (4 pcs)', price: 220, is_veg: true, description: 'Crispy rolls with vegetable filling', photo_url: null },
      { category: 'Starters', name: 'Chicken Dumplings', price: 280, is_veg: false, description: 'Steamed or fried, with soy dipping sauce', photo_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80' },
      { category: 'Noodles', name: 'Hakka Noodles', price: 240, is_veg: true, description: 'Stir-fried noodles with veggies and soy sauce', photo_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80' },
      { category: 'Noodles', name: 'Chilli Chicken Noodles', price: 310, is_veg: false, description: 'Spicy noodles tossed with chilli chicken', photo_url: null },
      { category: 'Rice', name: 'Vegetable Fried Rice', price: 220, is_veg: true, description: 'Wok-tossed rice with fresh vegetables', photo_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80' },
      { category: 'Rice', name: 'Egg Fried Rice', price: 260, is_veg: false, description: 'Classic fried rice with scrambled eggs', photo_url: null },
      { category: 'Mains', name: 'Chilli Paneer', price: 290, is_veg: true, description: 'Indo-Chinese crispy paneer in spicy sauce', photo_url: null },
      { category: 'Beverages', name: 'Iced Green Tea', price: 90, is_veg: true, description: 'Chilled Japanese green tea with lemon', photo_url: null },
    ],
    'South Spice': [
      { category: 'Dosas', name: 'Masala Dosa', price: 160, is_veg: true, description: 'Crispy dosa with spiced potato filling', photo_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80' },
      { category: 'Dosas', name: 'Onion Rava Dosa', price: 180, is_veg: true, description: 'Crispy semolina dosa with onions', photo_url: null },
      { category: 'Dosas', name: 'Ghee Roast Dosa', price: 200, is_veg: true, description: 'Roasted crispy dosa with generous ghee', photo_url: null },
      { category: 'Rice', name: 'Curd Rice', price: 120, is_veg: true, description: 'Tempered curd rice with curry leaves', photo_url: null },
      { category: 'Rice', name: 'Lemon Rice', price: 130, is_veg: true, description: 'Tangy rice with peanuts and turmeric', photo_url: null },
      { category: 'Tiffin', name: 'Idli Sambar (3 pcs)', price: 100, is_veg: true, description: 'Soft idlis with sambar and chutneys', photo_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80' },
      { category: 'Tiffin', name: 'Medu Vada (2 pcs)', price: 90, is_veg: true, description: 'Crispy lentil donuts with sambar', photo_url: null },
      { category: 'Beverages', name: 'Filter Coffee', price: 60, is_veg: true, description: 'Authentic South Indian filter coffee', photo_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
      { category: 'Beverages', name: 'Buttermilk (Chaas)', price: 50, is_veg: true, description: 'Chilled spiced buttermilk', photo_url: null },
    ],
    'Burger Barn': [
      { category: 'Burgers', name: 'Classic Cheeseburger', price: 250, is_veg: false, description: 'Beef patty, cheddar, lettuce, tomato, pickles', photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
      { category: 'Burgers', name: 'Mushroom Swiss Burger', price: 280, is_veg: true, description: 'Grilled mushrooms with melted Swiss cheese', photo_url: null },
      { category: 'Burgers', name: 'Spicy Chicken Burger', price: 270, is_veg: false, description: 'Crispy spiced chicken fillet, jalapeños', photo_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80' },
      { category: 'Sides', name: 'Loaded Fries', price: 180, is_veg: true, description: 'Fries with cheese sauce, jalapeños, sour cream', photo_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80' },
      { category: 'Sides', name: 'Onion Rings', price: 150, is_veg: true, description: 'Crispy battered onion rings', photo_url: null },
      { category: 'Beverages', name: 'Chocolate Milkshake', price: 180, is_veg: true, description: 'Thick and creamy chocolate shake', photo_url: null },
      { category: 'Beverages', name: 'Coca-Cola', price: 80, is_veg: true, description: '330ml can', photo_url: null },
    ],
    'Sweet Cravings': [
      { category: 'Ice Cream', name: 'Belgian Chocolate Sundae', price: 220, is_veg: true, description: 'Rich dark chocolate ice cream with hot fudge', photo_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80' },
      { category: 'Ice Cream', name: 'Mango Sorbet', price: 160, is_veg: true, description: 'Refreshing Alphonso mango sorbet', photo_url: null },
      { category: 'Cakes', name: 'Red Velvet Slice', price: 180, is_veg: true, description: 'Classic red velvet with cream cheese frosting', photo_url: 'https://images.unsplash.com/photo-1586788224331-947f68671cf1?w=400&q=80' },
      { category: 'Cakes', name: 'New York Cheesecake', price: 200, is_veg: true, description: 'Creamy New York style cheesecake', photo_url: null },
      { category: 'Waffles', name: 'Nutella Waffle', price: 240, is_veg: true, description: 'Crispy waffle with Nutella and fresh berries', photo_url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&q=80' },
      { category: 'Waffles', name: 'Strawberry Cream Waffle', price: 220, is_veg: true, description: 'Waffle with whipped cream and fresh strawberries', photo_url: null },
      { category: 'Beverages', name: 'Hot Chocolate', price: 140, is_veg: true, description: 'Rich velvety hot chocolate with marshmallows', photo_url: 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=400&q=80' },
    ],
  };
  return (menus[restaurantName] || []).map((item) => ({
    ...item,
    restaurant_id: restaurantId,
    is_available: true,
  }));
};

async function seed() {
  console.log('🌱 Seeding DineIn database...\n');

  // Test connection first
  const { error: pingError } = await supabase.from('restaurants').select('id').limit(1);
  if (pingError && pingError.code !== 'PGRST116') {
    if (pingError.message.includes('does not exist') || pingError.code === '42P01') {
      console.error('❌ The "restaurants" table does not exist yet.');
      console.error('\n📋 Please run the SQL schema first:');
      console.error('   1. Open: https://supabase.com/dashboard/project/tpusmiojzdalqrxjzph/sql');
      console.error('   2. Copy and paste the contents of: scripts/schema.sql');
      console.error('   3. Click Run');
      console.error('   4. Then run this seed script again\n');
      process.exit(1);
    }
  }

  // Seed restaurants
  const { data: insertedRestaurants, error: rError } = await supabase
    .from('restaurants')
    .upsert(restaurants, { onConflict: 'name' })
    .select();

  if (rError) {
    console.error('❌ Restaurant insert failed:', rError.message);
    process.exit(1);
  }

  console.log(`✅ ${insertedRestaurants.length} restaurants seeded`);

  // Seed menu items
  let total = 0;
  for (const r of insertedRestaurants) {
    const items = getMenuItems(r.id, r.name);
    const { error: mErr } = await supabase
      .from('menu_items')
      .upsert(items, { onConflict: 'restaurant_id,name' });

    if (mErr) {
      console.error(`  ❌ ${r.name}: ${mErr.message}`);
    } else {
      total += items.length;
      console.log(`  ✅ ${r.name}: ${items.length} items`);
    }
  }

  console.log(`\n🎉 Done! Seeded ${insertedRestaurants.length} restaurants & ${total} menu items`);
  console.log('   Refresh http://localhost:5173/ to see live data!\n');
}

seed().catch(console.error);
