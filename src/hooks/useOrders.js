import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useOrdersCache } from '../store/ordersCache';

const STALE_AFTER_MS = 30_000; // 30 seconds — background refresh if cache is older than this

export function useOrders() {
  const { user } = useAuthStore();
  const { orders: cachedOrders, lastFetchedAt, setOrders, clearOrders } = useOrdersCache();

  // loading = true ONLY when there is NO cached data yet (first visit)
  const [loading, setLoading] = useState(cachedOrders.length === 0);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!user) {
      clearOrders();
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants(name, photo_url, cuisine_tags),
          order_items(
            *,
            menu_items(name, is_veg)
          ),
          order_tables(
            restaurant_tables(table_number)
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (err) setError(err.message);
      else setOrders(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      clearOrders();
      setLoading(false);
      return;
    }

    const isStale = !lastFetchedAt || (Date.now() - lastFetchedAt > STALE_AFTER_MS);

    if (cachedOrders.length === 0) {
      // No cache — full loading fetch
      fetchOrders(false);
    } else if (isStale) {
      // Cache exists but is stale — show cached, refresh silently
      fetchOrders(true);
    }
    // else cache is fresh — just use it, no fetch needed
  }, [user]);

  return { orders: cachedOrders, loading, error, refetch: () => fetchOrders(false) };
}

export async function createOrder({
  customerId,
  restaurantId,
  cartItems,
  arrivalTime,
  estimatedReadyTime,
  totalAmount,
  advancePaidAmount,
  remainingAmount,
  paymentReference,
  numGuests,
  selectedTableIds,
}) {
  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      restaurant_id: restaurantId,
      status: 'confirmed',
      arrival_time: arrivalTime.toISOString(),
      estimated_ready_time: estimatedReadyTime.toISOString(),
      total_amount: totalAmount,
      advance_paid_amount: advancePaidAmount,
      remaining_amount: remainingAmount,
      payment_status: 'advance_paid',
      payment_reference: paymentReference,
      num_guests: numGuests,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert order items
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItem.id,
    quantity: item.quantity,
    notes: item.notes || null,
    price_at_order: item.menuItem.price,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  // Insert order tables if selected
  if (selectedTableIds && selectedTableIds.length > 0) {
    const orderTables = selectedTableIds.map(tableId => ({
      order_id: order.id,
      table_id: tableId,
    }));

    const { error: tablesError } = await supabase
      .from('order_tables')
      .insert(orderTables);

    if (tablesError) throw tablesError;
  }

  // Insert initial status log
  await supabase.from('order_status_log').insert({
    order_id: order.id,
    status: 'confirmed',
  });

  return order;
}
