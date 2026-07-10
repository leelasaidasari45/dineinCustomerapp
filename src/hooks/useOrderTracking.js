import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useOrderTracking(orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    let active = true;

    // Initial fetch
    async function fetchOrder(showLoading = true) {
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from('orders')
          .select(`
            *,
            restaurants(name, photo_url, avg_prep_time_minutes),
            order_status_log(*),
            order_items(
              *,
              menu_items(name, photo_url, is_veg)
            ),
            order_tables(
              restaurant_tables(table_number)
            )
          `)
          .eq('id', orderId)
          .single();

        if (!active) return;
        if (err) setError(err.message);
        else setOrder(data);
      } catch (err) {
        if (!active) return;
        setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOrder(true);

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          if (active) {
            // Quietly refetch in the background to get relation updates (like order_status_log)
            fetchOrder(false);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      active = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [orderId]);

  return { order, loading, error };
}
