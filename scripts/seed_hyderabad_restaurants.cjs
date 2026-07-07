const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ezpqrzhlsfxolytuuich.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6cHFyemhsc2Z4b2x5dHV1aWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMzU0NTMsImV4cCI6MjA5ODcxMTQ1M30.0IHRmHYLRzHwRmDOz3hWi14LtTji4OqBBlBPF1raA3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// 25 realistic Hyderabad restaurants
const hyderabadRestaurants = [
  { name: 'Shadhab', cuisine_tags: ['Biryani', 'Mughlai', 'Kebabs'], address: 'High Court Road, Ghansi Bazaar, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', avg_prep_time_minutes: 25, rating: 4.6, is_open: true },
  { name: 'Bawarchi Restaurant', cuisine_tags: ['Biryani', 'Mughlai', 'Kebabs'], address: 'RTC X Roads, Musheerabad, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80', avg_prep_time_minutes: 25, rating: 4.6, is_open: true },
  { name: 'Paradise Biryani', cuisine_tags: ['Biryani', 'North Indian', 'Curries'], address: 'SD Road, Secunderabad, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80', avg_prep_time_minutes: 20, rating: 4.3, is_open: true },
  { name: 'Shah Ghouse', cuisine_tags: ['Biryani', 'Haleem', 'Mughlai'], address: 'Gachibowli Main Rd, Gachibowli, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80', avg_prep_time_minutes: 30, rating: 4.4, is_open: true },
  { name: 'Cafe Bahar', cuisine_tags: ['Biryani', 'Mughlai', 'Kebabs'], address: 'Hyderguda Rd, Basheerbagh, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80', avg_prep_time_minutes: 25, rating: 4.5, is_open: true },
  { name: 'Pista House', cuisine_tags: ['Haleem', 'Biryani', 'Desserts'], address: 'Kondapur Main Rd, Kondapur, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80', avg_prep_time_minutes: 20, rating: 4.2, is_open: true },
  { name: 'Chutneys', cuisine_tags: ['South Indian', 'Breakfast', 'Vegetarian'], address: 'Road No. 3, Banjara Hills, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1630383249896-483b843e5b89?w=800&q=80', avg_prep_time_minutes: 15, rating: 4.5, is_open: true },
  { name: 'Minerva Coffee Shop', cuisine_tags: ['South Indian', 'Breakfast', 'Chinese'], address: 'Amrutha Mall, Somajiguda, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&q=80', avg_prep_time_minutes: 15, rating: 4.4, is_open: true },
  { name: 'Taj Mahal Hotel', cuisine_tags: ['South Indian', 'Breakfast', 'Vegetarian'], address: 'Patny Circle, Secunderabad, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', avg_prep_time_minutes: 18, rating: 4.3, is_open: true },
  { name: 'Subayya Gari Hotel', cuisine_tags: ['South Indian', 'Traditional Thali', 'Vegetarian'], address: 'Hitech City Rd, Kondapur, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800&q=80', avg_prep_time_minutes: 20, rating: 4.6, is_open: true },
  { name: 'Rayalaseema Ruchulu', cuisine_tags: ['Telugu', 'Rayalaseema Special', 'Andhra'], address: 'Road No. 36, Jubilee Hills, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80', avg_prep_time_minutes: 22, rating: 4.3, is_open: true },
  { name: 'Mehfil Restaurant', cuisine_tags: ['Biryani', 'North Indian', 'Chinese'], address: 'YMCA Cross Road, Narayanguda, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80', avg_prep_time_minutes: 25, rating: 4.2, is_open: true },
  { name: 'Absolute Barbecues', cuisine_tags: ['Barbecue', 'Buffet', 'Grill'], address: 'Telecom Nagar, Gachibowli, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80', avg_prep_time_minutes: 30, rating: 4.5, is_open: true },
  { name: 'Barbeque Nation', cuisine_tags: ['Barbecue', 'Grill', 'Buffet'], address: 'Cyber Grids, Madhapur, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80', avg_prep_time_minutes: 30, rating: 4.4, is_open: true },
  { name: 'Concu', cuisine_tags: ['Patisserie', 'Desserts', 'Cafe'], address: 'Road No. 37, Jubilee Hills, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80', avg_prep_time_minutes: 15, rating: 4.7, is_open: true },
  { name: 'Roastery Coffee House', cuisine_tags: ['Cafe', 'Burgers', 'Coffee'], address: 'Road No. 14, Banjara Hills, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80', avg_prep_time_minutes: 18, rating: 4.6, is_open: true },
  { name: 'Cream Stone', cuisine_tags: ['Ice Cream', 'Desserts', 'Milkshakes'], address: 'Road No. 2, Banjara Hills, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80', avg_prep_time_minutes: 10, rating: 4.6, is_open: true },
  { name: 'Exotica', cuisine_tags: ['North Indian', 'Chinese', 'Mughlai'], address: 'Road No. 12, Banjara Hills, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', avg_prep_time_minutes: 25, rating: 4.4, is_open: true },
  { name: 'SodaBottleOpenerWala', cuisine_tags: ['Parsi', 'Irani Cafe', 'Biryani'], address: 'Road No. 1, Jubilee Hills, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', avg_prep_time_minutes: 20, rating: 4.3, is_open: true },
  { name: 'Olive Bistro', cuisine_tags: ['Mediterranean', 'Italian', 'Pizza'], address: 'Road No. 46, Jubilee Hills, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800&q=80', avg_prep_time_minutes: 25, rating: 4.5, is_open: true },
  { name: 'Flea Bazaar Cafe', cuisine_tags: ['Multi-cuisine', 'Burgers', 'Pizza'], address: 'Image Gardens Rd, Madhapur, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80', avg_prep_time_minutes: 20, rating: 4.2, is_open: true },
  { name: 'Santosh Dhaba', cuisine_tags: ['North Indian', 'Vegetarian', 'Chinese'], address: 'Hanuman Tekdi, Abids, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80', avg_prep_time_minutes: 22, rating: 4.1, is_open: true },
  { name: 'Nanking Restaurant', cuisine_tags: ['Chinese', 'Asian', 'Noodles'], address: 'Park Lane, Secunderabad, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&q=80', avg_prep_time_minutes: 20, rating: 4.4, is_open: true },
  { name: 'Ohris Jiva Imperia', cuisine_tags: ['Vegetarian Thali', 'North Indian', 'Buffet'], address: 'Begumpet Rd, Begumpet, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=800&q=80', avg_prep_time_minutes: 25, rating: 4.3, is_open: true },
  { name: 'Gusto Latino', cuisine_tags: ['Mexican', 'Tacos', 'Tex-Mex'], address: 'Road No. 10, Jubilee Hills, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80', avg_prep_time_minutes: 20, rating: 4.4, is_open: true },
  { name: 'Wok to Walk', cuisine_tags: ['Asian Noodles', 'Wok', 'Healthy'], address: 'Hitech City Rd, Kondapur, Hyderabad', photo_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80', avg_prep_time_minutes: 18, rating: 4.3, is_open: true }
];

// Menu item templates based on cuisine tags
const biryaniMenu = [
  { name: 'Special Chicken Biryani', category: 'Biryani', price: 290.00, description: 'Fragrant long-grain basmati rice cooked with succulent chicken pieces and aromatic spices.', is_veg: false },
  { name: 'Special Mutton Biryani', category: 'Biryani', price: 340.00, description: 'Slow-cooked mutton with layer of basmati rice, saffron, and ghee.', is_veg: false },
  { name: 'Egg Biryani', category: 'Biryani', price: 210.00, description: 'Aromatic basmati rice cooked with hard-boiled eggs and traditional spices.', is_veg: false },
  { name: 'Chicken Tikka Kebab', category: 'Starters', price: 250.00, description: 'Boneless chicken cubes marinated in yogurt and tandoori spices, grilled in clay oven.', is_veg: false },
  { name: 'Chicken Seekh Kebab', category: 'Starters', price: 260.00, description: 'Skewered minced chicken blended with fresh herbs and spices, grilled to perfection.', is_veg: false },
  { name: 'Butter Chicken', category: 'Curries', price: 280.00, description: 'Tender chicken tikka cooked in rich tomato, butter, and cashew gravy.', is_veg: false },
  { name: 'Paneer Butter Masala', category: 'Curries', price: 240.00, description: 'Fresh paneer cubes cooked in a cream, tomato, and cashew nut gravy.', is_veg: true },
  { name: 'Garlic Butter Naan', category: 'Breads', price: 60.00, description: 'Leavened clay-oven flatbread topped with garlic and butter.', is_veg: true },
  { name: 'Rumali Roti', category: 'Breads', price: 30.00, description: 'Ultra-thin, soft flatbread folded like a handkerchief.', is_veg: true },
  { name: 'Double Ka Meetha', category: 'Desserts', price: 90.00, description: 'Traditional Hyderabadi bread pudding soaked in saffron milk and cardamom.', is_veg: true },
  { name: 'Qubani Ka Meetha', category: 'Desserts', price: 110.00, description: 'Classic stewed apricot dessert served with cream or ice cream.', is_veg: true },
  { name: 'Spicy Mirchi Ka Salan', category: 'Sides', price: 40.00, description: 'Rich peanut and sesame gravy with green chillies, served with Biryani.', is_veg: true }
];

const southIndianMenu = [
  { name: 'Ghee Karam Masala Dosa', category: 'Dosa', price: 110.00, description: 'Crispy rice crepe spread with spicy red karam paste, potato mash, and ghee.', is_veg: true },
  { name: 'Steamed Ghee Idly (2 pcs)', category: 'Idly', price: 60.00, description: 'Fluffy steamed rice-lentil cakes served with sambar and fresh chutneys.', is_veg: true },
  { name: 'Crispy Medu Vada (2 pcs)', category: 'Vada', price: 70.00, description: 'Golden fried savory lentil doughnuts served with sambar.', is_veg: true },
  { name: 'Rava Onion Dosa', category: 'Dosa', price: 130.00, description: 'Crispy semolina crepe topped with chopped onions and coriander.', is_veg: true },
  { name: 'Pesarattu Upma Dosa', category: 'Breakfast Specials', price: 120.00, description: 'Traditional green gram crepe filled with savory semolina upma.', is_veg: true },
  { name: 'Poori Bhaji (3 pcs)', category: 'Breakfast Specials', price: 90.00, description: 'Puffed deep-fried wheat breads served with spiced potato curry.', is_veg: true },
  { name: 'Andhra Veg Meals Thali', category: 'Meals', price: 220.00, description: 'Uniquely prepared traditional rice, dal, rasam, sambar, curries, papad, curd, and sweet.', is_veg: true },
  { name: 'Onion Tomato Uttapam', category: 'Uttapam', price: 100.00, description: 'Thick pancake topped with caramelized onions, tomatoes, and chillies.', is_veg: true },
  { name: 'Sweet Pongal', category: 'Desserts', price: 70.00, description: 'Sweet rice-lentil dish cooked with jaggery, milk, and dry fruits.', is_veg: true },
  { name: 'Authentic Filter Coffee', category: 'Beverages', price: 40.00, description: 'Strong, aromatic chicory blend brewed coffee served frothy in brass tumbler.', is_veg: true },
  { name: 'Curd Rice', category: 'Rice', price: 90.00, description: 'Soft cooked rice mixed with yogurt, tempered with mustard seeds and curry leaves.', is_veg: true },
  { name: 'Gongura Pickle Rice', category: 'Rice', price: 100.00, description: 'Spiced rice tossed in tangy sorrel leaf (gongura) paste.', is_veg: true }
];

const barbecueMenu = [
  { name: 'Grilled Paneer Tikka', category: 'Veg Starters', price: 180.00, description: 'Charred paneer cubes marinated in rich tikka spices.', is_veg: true },
  { name: 'Crispy Fried Corn', category: 'Veg Starters', price: 150.00, description: 'Deep fried corn kernels tossed in spicy seasoning.', is_veg: true },
  { name: 'Cajun Spiced Potatoes', category: 'Veg Starters', price: 160.00, description: 'Crispy baby potatoes drizzled with Cajun mayo sauce.', is_veg: true },
  { name: 'Tandoori Chicken Wings', category: 'Non-Veg Starters', price: 220.00, description: 'Spicy chicken wings cooked over glowing charcoal.', is_veg: false },
  { name: 'Garlic Butter Grilled Prawns', category: 'Non-Veg Starters', price: 290.00, description: 'Juicy skewered prawns brushed with garlic-herb butter.', is_veg: false },
  { name: 'Mutton Seekh Kebab', category: 'Non-Veg Starters', price: 280.00, description: 'Spiced minced lamb skewers grilled over open flame.', is_veg: false },
  { name: 'Tandoori Veg Spring Roll', category: 'Veg Starters', price: 150.00, description: 'Crispy rolls filled with wok veggies, lightly charred.', is_veg: true },
  { name: 'Barbecue Grilled Pineapple', category: 'Desserts', price: 140.00, description: 'Sweet pineapple rings dusted with cinnamon and grilled.', is_veg: true },
  { name: 'Dal Makhani', category: 'Mains', price: 190.00, description: 'Slow cooked black lentils with cream and spices.', is_veg: true },
  { name: 'Soft Garlic Roti', category: 'Mains', price: 40.00, description: 'Whole wheat flatbread cooked in tandoor.', is_veg: true },
  { name: 'Warm Gulab Jamun (3 pcs)', category: 'Desserts', price: 80.00, description: 'Deep fried milk dumplings soaked in cardamom sugar syrup.', is_veg: true },
  { name: 'Fudge Brownie with Ice Cream', category: 'Desserts', price: 120.00, description: 'Sizzling hot brownie with vanilla ice cream and chocolate sauce.', is_veg: true }
];

const generalMenu = [
  { name: 'Classic Margherita Pizza', category: 'Pizza', price: 290.00, description: 'Fresh mozzarella cheese, tomato sauce, and basil leaves on hand-tossed crust.', is_veg: true },
  { name: 'Double Cheese Burger', category: 'Burgers', price: 160.00, description: 'Juicy vegetable patty with double melted cheese, lettuce, and burger sauce.', is_veg: true },
  { name: 'Chicken Alfredo Pasta', category: 'Pasta', price: 260.00, description: 'Penne pasta tossed in rich, creamy parmesan cheese sauce with chicken.', is_veg: false },
  { name: 'Chilli Garlic Hakka Noodles', category: 'Asian', price: 180.00, description: 'Stir-fried noodles with garlic, green chillies, and mixed vegetables.', is_veg: true },
  { name: 'Veg Manchurian Gravy', category: 'Asian', price: 170.00, description: 'Golden fried vegetable dumplings in tangy, spicy soy-garlic sauce.', is_veg: true },
  { name: 'Mexican Chicken Tacos', category: 'Tex-Mex', price: 210.00, description: 'Soft tortillas filled with spiced grilled chicken, salsa, and cheese.', is_veg: false },
  { name: 'Three Cheese Quesadilla', category: 'Tex-Mex', price: 190.00, description: 'Grilled tortilla packed with cheddar, mozzarella, and paneer.', is_veg: true },
  { name: 'Ferrero Rocher Ice Cream', category: 'Desserts', price: 220.00, description: 'Rich chocolate ice cream blended with hazelnut praline and cookies.', is_veg: true },
  { name: 'Warm Apple Pie', category: 'Desserts', price: 130.00, description: 'Classic spiced apple filling in a flaky golden crust.', is_veg: true },
  { name: 'Hot Chocolate Fudge', category: 'Desserts', price: 180.00, description: 'Two scoops of vanilla ice cream with warm chocolate fudge and nuts.', is_veg: true },
  { name: 'Hazelnut Cold Brew Coffee', category: 'Beverages', price: 150.00, description: 'Slow brewed smooth cold coffee with a hint of hazelnut.', is_veg: true },
  { name: 'Mango Passion Fruit Cooler', category: 'Beverages', price: 120.00, description: 'Tangy, refreshing iced fruit drink with mint leaves.', is_veg: true }
];

async function seedData() {
  console.log('🌱 Starting Hyderabad restaurant seeding...');
  
  // 1. Clear existing restaurants (this cascades and deletes menu items too)
  console.log('🧹 Clearing previous restaurants table...');
  const { error: deleteError } = await supabase
    .from('restaurants')
    .delete()
    .neq('name', 'ThisWillNeverMatchAnyRestaurantSoItDeletesAll');
  
  if (deleteError) {
    console.error('❌ Failed to clear restaurants table:', deleteError.message);
    return;
  }
  
  console.log('✅ Previous restaurants cleared.');

  // 2. Insert the 25 restaurants
  const { data: insertedRestaurants, error: insertError } = await supabase
    .from('restaurants')
    .insert(hyderabadRestaurants)
    .select('*');

  if (insertError) {
    console.error('❌ Failed to insert restaurants:', insertError.message);
    return;
  }

  console.log(`✅ Successfully inserted ${insertedRestaurants.length} restaurants!`);

  // 3. Insert menu items for each restaurant
  let totalItemsCount = 0;
  for (const restaurant of insertedRestaurants) {
    // Choose menu template based on cuisine tags
    let selectedMenu = generalMenu;
    if (restaurant.cuisine_tags.includes('South Indian') || restaurant.cuisine_tags.includes('Telugu')) {
      selectedMenu = southIndianMenu;
    } else if (restaurant.cuisine_tags.includes('Biryani') || restaurant.cuisine_tags.includes('Mughlai')) {
      selectedMenu = biryaniMenu;
    } else if (restaurant.cuisine_tags.includes('Barbecue')) {
      selectedMenu = barbecueMenu;
    }

    // Map template menu items to this specific restaurant id
    const itemsToInsert = selectedMenu.map(item => ({
      ...item,
      restaurant_id: restaurant.id,
      photo_url: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80` // default item photo placeholder
    }));

    const { error: itemsError } = await supabase
      .from('menu_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error(`❌ Failed to insert menu items for ${restaurant.name}:`, itemsError.message);
    } else {
      totalItemsCount += itemsToInsert.length;
    }
  }

  console.log(`🎉 Successfully seeded ${totalItemsCount} menu items across all restaurants!`);
}

seedData();
