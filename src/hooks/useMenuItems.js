import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── Mock menu data for demo mode ───────────────────────────
const MOCK_MENUS = {
  'mock-1': [ // Spice Garden
    { id: 'm1-1', restaurant_id: 'mock-1', name: 'Paneer Tikka', category: 'Starters', price: 280, is_veg: true, is_available: true, serves: 2, description: 'Marinated cottage cheese grilled to perfection', photo_url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80' },
    { id: 'm1-2', restaurant_id: 'mock-1', name: 'Chicken Seekh Kebab', category: 'Starters', price: 340, is_veg: false, is_available: true, serves: 2, description: 'Minced chicken with aromatic spices', photo_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80' },
    { id: 'm1-3', restaurant_id: 'mock-1', name: 'Butter Chicken', category: 'Main Course', price: 380, is_veg: false, is_available: true, serves: 2, description: 'Slow-cooked chicken in rich tomato-cream gravy', photo_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80' },
    { id: 'm1-4', restaurant_id: 'mock-1', name: 'Dal Makhani', category: 'Main Course', price: 280, is_veg: true, is_available: true, serves: 2, description: 'Black lentils slow-cooked overnight with butter', photo_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80' },
    { id: 'm1-5', restaurant_id: 'mock-1', name: 'Chicken Biryani', category: 'Main Course', price: 420, is_veg: false, is_available: true, serves: 2, description: 'Fragrant basmati with juicy chicken pieces', photo_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80' },
    { id: 'm1-6', restaurant_id: 'mock-1', name: 'Garlic Naan', category: 'Breads', price: 60, is_veg: true, is_available: true, serves: 1, description: 'Soft naan with garlic butter', photo_url: null },
    { id: 'm1-7', restaurant_id: 'mock-1', name: 'Gulab Jamun', category: 'Desserts', price: 120, is_veg: true, is_available: true, serves: 2, description: 'Soft milk dumplings in rose syrup', photo_url: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400&q=80' },
    { id: 'm1-8', restaurant_id: 'mock-1', name: 'Mango Lassi', category: 'Beverages', price: 120, is_veg: true, is_available: true, serves: 1, description: 'Chilled yogurt smoothie with Alphonso mango', photo_url: null },
  ],
  'mock-2': [ // The Pizza Republic
    { id: 'm2-1', restaurant_id: 'mock-2', name: 'Garlic Bread', category: 'Starters', price: 150, is_veg: true, is_available: true, serves: 2, description: 'Toasted baguette with herb garlic butter', photo_url: null },
    { id: 'm2-2', restaurant_id: 'mock-2', name: 'Chicken Wings', category: 'Starters', price: 320, is_veg: false, is_available: true, serves: 2, description: 'Crispy wings with choice of sauce', photo_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80' },
    { id: 'm2-3', restaurant_id: 'mock-2', name: 'Margherita', category: 'Pizzas', price: 350, is_veg: true, is_available: true, serves: 2, description: 'Classic tomato, mozzarella, fresh basil', photo_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80' },
    { id: 'm2-4', restaurant_id: 'mock-2', name: 'BBQ Chicken Pizza', category: 'Pizzas', price: 450, is_veg: false, is_available: true, serves: 3, description: 'Smoky BBQ sauce, chicken, onions, peppers', photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80' },
    { id: 'm2-5', restaurant_id: 'mock-2', name: 'Veggie Supreme', category: 'Pizzas', price: 400, is_veg: true, is_available: true, serves: 3, description: 'Loaded with seasonal vegetables', photo_url: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&q=80' },
    { id: 'm2-6', restaurant_id: 'mock-2', name: 'Classic Smash Burger', category: 'Burgers', price: 280, is_veg: false, is_available: true, serves: 1, description: 'Double smashed beef patty, cheese, special sauce', photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
    { id: 'm2-7', restaurant_id: 'mock-2', name: 'Tiramisu', category: 'Desserts', price: 220, is_veg: true, is_available: true, serves: 2, description: 'Classic Italian dessert with espresso', photo_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80' },
    { id: 'm2-8', restaurant_id: 'mock-2', name: 'Fresh Lime Soda', category: 'Beverages', price: 80, is_veg: true, is_available: true, serves: 1, description: 'Sweet, salt, or masala — your choice', photo_url: null },
  ],
  'mock-3': [ // Wok & Roll
    { id: 'm3-1', restaurant_id: 'mock-3', name: 'Spring Rolls (4 pcs)', category: 'Starters', price: 220, is_veg: true, is_available: true, serves: 2, description: 'Crispy rolls with vegetable filling', photo_url: null },
    { id: 'm3-2', restaurant_id: 'mock-3', name: 'Chicken Dumplings', category: 'Starters', price: 280, is_veg: false, is_available: true, serves: 2, description: 'Steamed or fried, with soy dipping sauce', photo_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80' },
    { id: 'm3-3', restaurant_id: 'mock-3', name: 'Hakka Noodles', category: 'Noodles', price: 240, is_veg: true, is_available: true, serves: 2, description: 'Stir-fried noodles with veggies and soy sauce', photo_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80' },
    { id: 'm3-4', restaurant_id: 'mock-3', name: 'Chilli Chicken Noodles', category: 'Noodles', price: 310, is_veg: false, is_available: true, serves: 2, description: 'Spicy noodles tossed with chilli chicken', photo_url: null },
    { id: 'm3-5', restaurant_id: 'mock-3', name: 'Vegetable Fried Rice', category: 'Rice', price: 220, is_veg: true, is_available: true, serves: 2, description: 'Wok-tossed rice with fresh vegetables', photo_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80' },
    { id: 'm3-6', restaurant_id: 'mock-3', name: 'Chilli Paneer', category: 'Mains', price: 290, is_veg: true, is_available: true, serves: 2, description: 'Indo-Chinese crispy paneer in spicy sauce', photo_url: null },
  ],
  'mock-4': [ // South Spice
    { id: 'm4-1', restaurant_id: 'mock-4', name: 'Masala Dosa', category: 'Dosas', price: 160, is_veg: true, is_available: true, serves: 1, description: 'Crispy dosa with spiced potato filling', photo_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80' },
    { id: 'm4-2', restaurant_id: 'mock-4', name: 'Ghee Roast Dosa', category: 'Dosas', price: 200, is_veg: true, is_available: true, serves: 1, description: 'Roasted crispy dosa with generous ghee', photo_url: null },
    { id: 'm4-3', restaurant_id: 'mock-4', name: 'Idli Sambar (3 pcs)', category: 'Tiffin', price: 100, is_veg: true, is_available: true, serves: 1, description: 'Soft idlis with sambar and chutneys', photo_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80' },
    { id: 'm4-4', restaurant_id: 'mock-4', name: 'Medu Vada (2 pcs)', category: 'Tiffin', price: 90, is_veg: true, is_available: true, serves: 1, description: 'Crispy lentil donuts with sambar', photo_url: null },
    { id: 'm4-5', restaurant_id: 'mock-4', name: 'Filter Coffee', category: 'Beverages', price: 60, is_veg: true, is_available: true, serves: 1, description: 'Authentic South Indian filter coffee', photo_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
  ],
  'mock-5': [ // Burger Barn
    { id: 'm5-1', restaurant_id: 'mock-5', name: 'Classic Cheeseburger', category: 'Burgers', price: 250, is_veg: false, is_available: true, serves: 1, description: 'Beef patty, cheddar, lettuce, tomato, pickles', photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
    { id: 'm5-2', restaurant_id: 'mock-5', name: 'Mushroom Swiss Burger', category: 'Burgers', price: 280, is_veg: true, is_available: true, serves: 1, description: 'Grilled mushrooms with melted Swiss cheese', photo_url: null },
    { id: 'm5-3', restaurant_id: 'mock-5', name: 'Spicy Chicken Burger', category: 'Burgers', price: 270, is_veg: false, is_available: true, serves: 1, description: 'Crispy spiced chicken fillet, jalapeños', photo_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80' },
    { id: 'm5-4', restaurant_id: 'mock-5', name: 'Loaded Fries', category: 'Sides', price: 180, is_veg: true, is_available: true, serves: 2, description: 'Fries with cheese sauce, jalapeños, sour cream', photo_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80' },
    { id: 'm5-5', restaurant_id: 'mock-5', name: 'Chocolate Milkshake', category: 'Beverages', price: 180, is_veg: true, is_available: true, serves: 1, description: 'Thick and creamy chocolate shake', photo_url: null },
  ],
  'mock-6': [ // Sweet Cravings
    { id: 'm6-1', restaurant_id: 'mock-6', name: 'Belgian Chocolate Sundae', category: 'Ice Cream', price: 220, is_veg: true, is_available: true, serves: 2, description: 'Rich dark chocolate ice cream with hot fudge', photo_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80' },
    { id: 'm6-2', restaurant_id: 'mock-6', name: 'Mango Sorbet', category: 'Ice Cream', price: 160, is_veg: true, is_available: true, serves: 1, description: 'Refreshing Alphonso mango sorbet', photo_url: null },
    { id: 'm6-3', restaurant_id: 'mock-6', name: 'Red Velvet Slice', category: 'Cakes', price: 180, is_veg: true, is_available: true, serves: 2, description: 'Classic red velvet with cream cheese frosting', photo_url: 'https://images.unsplash.com/photo-1586788224331-947f68671cf1?w=400&q=80' },
    { id: 'm6-4', restaurant_id: 'mock-6', name: 'Nutella Waffle', category: 'Waffles', price: 240, is_veg: true, is_available: true, serves: 1, description: 'Crispy waffle with Nutella and fresh berries', photo_url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&q=80' },
    { id: 'm6-5', restaurant_id: 'mock-6', name: 'Hot Chocolate', category: 'Beverages', price: 140, is_veg: true, is_available: true, serves: 1, description: 'Rich velvety hot chocolate with marshmallows', photo_url: 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=400&q=80' },
  ],
};

export function useMenuItems(restaurantId) {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchMenuItems() {
      setLoading(true);
      setError(null);

      // Serve mock data for mock restaurants
      if (restaurantId.startsWith('mock-')) {
        const items = MOCK_MENUS[restaurantId] || [];
        if (active) {
          setMenuItems(items);
          setCategories([...new Set(items.map((i) => i.category))]);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error: err } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('is_available', true)
          .order('category')
          .order('name');

        if (!active) return;

        if (err) {
          setError(err.message);
        } else {
          setMenuItems(data || []);
          const cats = [...new Set((data || []).map((i) => i.category))];
          setCategories(cats);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchMenuItems();
    return () => { active = false; };
  }, [restaurantId]);

  return { menuItems, categories, loading, error };
}
