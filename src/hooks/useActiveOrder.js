import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const ACTIVE_STATUSES = ['pending_payment', 'confirmed', 'preparing', 'ready'];

/**
 * Returns the customer's currently active order (if any).
 * An order is "active" if its status is one of: pending_payment, confirmed, preparing, ready.
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

    async function fetchActiveOrder() {
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
        if (error) {
          console.error('useActiveOrder fetch error:', error);
          setActiveOrder(null);
        } else {
          setActiveOrder(data);
        }
      } catch (err) {
        if (!active) return;
        console.error('useActiveOrder error:', err);
        setActiveOrder(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchActiveOrder();

    return () => {
      active = false;
    };
  }, [user]);

  return { activeOrder, loading };
}
