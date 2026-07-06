import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function useOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchOrders() {
      setLoading(true);
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
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (!active) return;
        if (err) setError(err.message);
        else setOrders(data || []);
      } catch (err) {
        if (!active) return;
        setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOrders();
    return () => { active = false; };
  }, [user]);

  return { orders, loading, error, refetch: () => {} };
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

  // Insert initial status log
  await supabase.from('order_status_log').insert({
    order_id: order.id,
    status: 'confirmed',
  });

  return order;
}
