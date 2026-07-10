import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const ACTIVE_STATUSES = ['pending_payment', 'confirmed', 'preparing', 'ready'];

/**
 * Returns the customer's currently active order (if any).
 * An order is "active" if its status is one of: pending_payment, confirmed, preparing, ready.
 * Returns null when loading or when no active order exists.
 */
export function useActiveOrder() {
  const { user } = useAuthStore();
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setActiveOrder(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function fetch() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('id, status, restaurant_id, restaurants(name)')
          .eq('customer_id', user.id)
          .in('status', ACTIVE_STATUSES)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!active) return;
        if (error) { console.error(error); setActiveOrder(null); }
        else setActiveOrder(data);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetch();

    // Subscribe to realtime so the lock lifts the moment the owner marks completed
    const channel = supabase
      .channel(`active-order-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` },
        () => { if (active) fetch(); }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { activeOrder, loading };
}
