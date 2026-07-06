import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── Mock data fallback ─────────────────────────────────────
const MOCK_RESTAURANTS = [
  {
    id: 'mock-1',
    name: 'Spice Garden',
    cuisine_tags: ['North Indian', 'Biryani', 'Curries'],
    address: '12 MG Road, Bangalore',
    photo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    avg_prep_time_minutes: 25,
    rating: 4.5,
    is_open: true,
  },
  {
    id: 'mock-2',
    name: 'The Pizza Republic',
    cuisine_tags: ['Pizza', 'Italian', 'Burgers'],
    address: '45 Indiranagar, Bangalore',
    photo_url: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=800&q=80',
    avg_prep_time_minutes: 20,
    rating: 4.3,
    is_open: true,
  },
  {
    id: 'mock-3',
    name: 'Wok & Roll',
    cuisine_tags: ['Chinese', 'Noodles', 'Asian'],
    address: '7 Koramangala, Bangalore',
    photo_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
    avg_prep_time_minutes: 18,
    rating: 4.1,
    is_open: true,
  },
  {
    id: 'mock-4',
    name: 'South Spice',
    cuisine_tags: ['South Indian', 'Dosa', 'Filter Coffee'],
    address: '3 Jayanagar, Bangalore',
    photo_url: 'https://images.unsplash.com/photo-1630383249896-483b843e5b89?w=800&q=80',
    avg_prep_time_minutes: 15,
    rating: 4.6,
    is_open: true,
  },
  {
    id: 'mock-5',
    name: 'Burger Barn',
    cuisine_tags: ['Burgers', 'American', 'Fries'],
    address: '22 Gachibowli, Hyderabad',
    photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    avg_prep_time_minutes: 12,
    rating: 4.0,
    is_open: true,
  },
  {
    id: 'mock-6',
    name: 'Sweet Cravings',
    cuisine_tags: ['Desserts', 'Ice Cream', 'Cakes'],
    address: '8 Banjara Hills, Hyderabad',
    photo_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
    avg_prep_time_minutes: 10,
    rating: 4.7,
    is_open: true,
  },
];

// ─── Hooks ──────────────────────────────────────────────────

export function useRestaurants(searchQuery = '', cuisineFilter = '', locationFilter = '') {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchRestaurants() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('restaurants')
          .select('*')
          .eq('is_open', true)
          .order('rating', { ascending: false });

        if (!active) return;

        if (err) {
          console.warn('Supabase error – falling back to demo data:', err.message);
          setRestaurants(applyFilters(MOCK_RESTAURANTS, searchQuery, cuisineFilter, locationFilter));
          setUsingMock(true);
        } else {
          setRestaurants(applyFilters(data || [], searchQuery, cuisineFilter, locationFilter));
          setUsingMock(false);
        }
      } catch (err) {
        if (!active) return;
        console.warn('Network error – falling back to demo data:', err.message);
        setRestaurants(applyFilters(MOCK_RESTAURANTS, searchQuery, cuisineFilter, locationFilter));
        setUsingMock(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchRestaurants();
    return () => { active = false; };
  }, [searchQuery, cuisineFilter, locationFilter]);

  return { restaurants, loading, error, usingMock };
}

function applyFilters(data, searchQuery, cuisineFilter, locationFilter) {
  let filtered = data;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.cuisine_tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }
  if (cuisineFilter) {
    filtered = filtered.filter((r) =>
      (r.cuisine_tags || []).some(
        (tag) => tag.toLowerCase() === cuisineFilter.toLowerCase()
      )
    );
  }
  if (locationFilter && locationFilter !== 'All') {
    const loc = locationFilter.toLowerCase();
    filtered = filtered.filter((r) =>
      r.address?.toLowerCase().includes(loc)
    );
  }
  return filtered;
}

export function useRestaurant(restaurantId) {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchRestaurant() {
      setLoading(true);
      setError(null);

      // Serve mock data for mock restaurants
      if (restaurantId.startsWith('mock-')) {
        const mock = MOCK_RESTAURANTS.find((r) => r.id === restaurantId);
        if (active) {
          setRestaurant(mock || null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error: err } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .single();

        if (!active) return;

        if (err) {
          setError(err.message);
          setRestaurant(null);
        } else {
          setRestaurant(data);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message);
        setRestaurant(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchRestaurant();
    return () => { active = false; };
  }, [restaurantId]);

  return { restaurant, loading, error };
}
