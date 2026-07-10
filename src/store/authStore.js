import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  customer: null,
  owner: null,
  role: null,
  loading: true,
  authModalOpen: false,
  authModalMode: 'login',

  openAuthModal: (mode = 'login') =>
    set({ authModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ authModalOpen: false }),

  initialize: async () => {
    set({ loading: true });

    // Clear old mock localStorage keys if they exist
    localStorage.removeItem('dinein_users');
    localStorage.removeItem('dinein_session');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        await get().fetchCustomerProfile(session.user.id);
      }
    } catch (e) {
      console.warn('Auth initialization failed:', e.message);
    }

    set({ loading: false });

    // Set up real-time listener — only respond to real auth events, not
    // INITIAL_SESSION (which fires spuriously on every URL change).
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return; // ignore, handled above via getSession()
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          set({ user: session.user });
          await get().fetchCustomerProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, customer: null, owner: null, role: null });
      }
    });
  },

  fetchCustomerProfile: async (userId) => {
    try {
      // 1. Try to fetch from customers
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (customerData) {
        set({ customer: customerData, owner: null, role: 'customer' });
        return;
      }

      // 2. If not found in customers, try to fetch from restaurant_owners
      const { data: ownerData } = await supabase
        .from('restaurant_owners')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (ownerData) {
        set({ customer: null, owner: ownerData, role: 'restaurant_owner' });
      }
    } catch (e) {
      console.warn('Error fetching profile:', e.message);
    }
  },

  signUp: async ({ email, password, name, phone, role }) => {
    const userRole = role || 'customer';
    
    // Attempt Supabase sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: name,
          phone: phone || null,
          role: userRole,
        } 
      },
    });

    if (error) throw new Error(error.message);

    if (data?.user) {
      try {
        if (userRole === 'restaurant_owner') {
          // Insert into restaurant_owners
          await supabase.from('restaurant_owners').upsert({
            id: data.user.id,
            name,
            email,
            phone: phone || null,
          });

          // Automatically seed a default restaurant linked to this owner
          await supabase.from('restaurants').insert({
            name: `${name}'s Restaurant`,
            cuisine_tags: ['North Indian', 'Biryani'],
            address: 'TBD',
            photo_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
            owner_id: data.user.id,
            is_open: true,
          });

          set({ 
            user: data.user, 
            customer: null,
            owner: { id: data.user.id, name, email, phone },
            role: 'restaurant_owner'
          });
        } else {
          // Insert into customers
          await supabase.from('customers').upsert({
            id: data.user.id,
            name,
            email,
            phone: phone || null,
          });

          set({ 
            user: data.user, 
            customer: { id: data.user.id, name, email, phone },
            owner: null,
            role: 'customer'
          });
        }
      } catch (e) {
        console.warn('Profile upsert warning:', e.message);
      }
    }

    return data;
  },

  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error.message);
    set({ user: null, customer: null, owner: null, role: null });
  },
}));
