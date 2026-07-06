import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  customer: null,
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
        set({ user: null, customer: null });
      }
    });
  },

  fetchCustomerProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (data) set({ customer: data });
    } catch (e) {
      console.warn('Error fetching customer profile:', e.message);
    }
  },

  signUp: async ({ email, password, name, phone }) => {
    // Attempt Supabase sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: name,
          phone: phone || null
        } 
      },
    });

    if (error) throw new Error(error.message);

    // Explicit profile insert (our DB trigger also guarantees this, but we keep this as backup)
    if (data?.user) {
      try {
        await supabase.from('customers').upsert({
          id: data.user.id,
          name,
          email,
          phone: phone || null,
        });
      } catch (e) {
        console.warn('Profile upsert warning:', e.message);
      }
      
      set({ 
        user: data.user, 
        customer: { id: data.user.id, name, email, phone } 
      });
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
    set({ user: null, customer: null });
  },
}));
