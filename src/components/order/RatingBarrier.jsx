import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Star, MessageSquare, Send, Sparkles, ChefHat, Heart, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Star selector component with micro-animations
function StarSelector({ rating, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1.5 bg-gray-50/80 px-4 py-2 rounded-2xl border border-gray-100/50">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hovered || rating);
        return (
          <motion.button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            whileHover={{ scale: 1.25, rotate: 8 }}
            whileTap={{ scale: 0.9 }}
            className="p-0.5 focus:outline-none transition-all duration-150"
          >
            <Star
              className={`w-7 h-7 stroke-[1.5] transition-all duration-150 ${
                active
                  ? 'fill-amber-400 text-amber-500 drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)]'
                  : 'text-gray-300 hover:text-amber-300'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

export default function RatingBarrier() {
  const { user } = useAuthStore();
  const [unratedOrder, setUnratedOrder] = useState(null);
  const [ratingRestaurant, setRatingRestaurant] = useState(0);
  const [ratingFood, setRatingFood] = useState(0);
  const [ratingService, setRatingService] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Initial check
  useEffect(() => {
    if (!user) {
      setUnratedOrder(null);
      return;
    }

    async function checkUnratedOrders() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, restaurants(name)')
          .eq('customer_id', user.id)
          .eq('status', 'completed')
          .eq('is_rated', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        if (data && data.length > 0) {
          setUnratedOrder(data[0]);
        }
      } catch (err) {
        console.error('Error checking unrated orders:', err.message);
      }
    }

    checkUnratedOrders();

    // 2. Realtime listener
    const channel = supabase
      .channel(`user-completed-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.status === 'completed' && payload.new.is_rated === false) {
            supabase
              .from('restaurants')
              .select('name')
              .eq('id', payload.new.restaurant_id)
              .single()
              .then(({ data }) => {
                setUnratedOrder({
                  ...payload.new,
                  restaurants: data,
                });
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (ratingRestaurant === 0 || ratingFood === 0 || ratingService === 0) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          rating_restaurant: ratingRestaurant,
          rating_food: ratingFood,
          rating_service: ratingService,
          rating_comment: comment.trim() || null,
          is_rated: true,
        })
        .eq('id', unratedOrder.id);

      if (error) throw error;

      setUnratedOrder(null);
      setRatingRestaurant(0);
      setRatingFood(0);
      setRatingService(0);
      setComment('');
    } catch (err) {
      console.error('Error submitting rating:', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!unratedOrder) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-dark-900/90 backdrop-blur-lg flex justify-center items-start sm:items-center overflow-y-auto p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 my-auto"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-br from-dark-800 to-dark-900 p-8 text-center relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Premium Icon Badge */}
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20 rotate-3 hover:rotate-12 transition-transform duration-300">
              <ChefHat className="w-8 h-8 text-white" />
            </div>

            <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-400 mb-3 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Dine-in Review</span>
            </div>

            <h2 className="font-heading font-extrabold text-2xl text-white leading-tight">
              How was your meal?
            </h2>
            <p className="text-gray-400 text-sm mt-1.5">
              Rate your dining experience at <strong className="text-amber-400 font-semibold">{unratedOrder.restaurants?.name || 'the restaurant'}</strong>
            </p>
          </div>

          {/* Form container */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Rating Cards */}
            <div className="space-y-4">
              {/* Food Rating */}
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                    <Utensils className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-dark-800 text-sm leading-snug">Food Taste</h4>
                    <p className="text-gray-400 text-xs mt-0.5">Flavor, quality, and portion</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <StarSelector rating={ratingFood} onChange={setRatingFood} />
                </div>
              </div>

              {/* Ambience Rating */}
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <Heart className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-dark-800 text-sm leading-snug">Ambience</h4>
                    <p className="text-gray-400 text-xs mt-0.5">Vibe, cleanliness, and seating</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <StarSelector rating={ratingRestaurant} onChange={setRatingRestaurant} />
                </div>
              </div>

              {/* Service Rating */}
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 flex-shrink-0">
                    <ChefHat className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-dark-800 text-sm leading-snug">Service</h4>
                    <p className="text-gray-400 text-xs mt-0.5">Staff politeness and speed</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <StarSelector rating={ratingService} onChange={setRatingService} />
                </div>
              </div>
            </div>

            {/* Comment Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 px-1">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span>Add a detailed comment (Optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (e.g. favorite dish, special service)..."
                rows={3}
                className="w-full rounded-2xl border border-gray-200 p-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none bg-gray-50/50 hover:bg-gray-50 focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting || ratingRestaurant === 0 || ratingFood === 0 || ratingService === 0}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-heading font-extrabold text-base py-4 rounded-2xl shadow-lg shadow-amber-200 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4.5 h-4.5" />
                    Submit Review & Continue
                  </>
                )}
              </motion.button>
              <p className="text-center text-xs text-gray-400 mt-3 font-medium">
                🔒 You must submit a review to continue using the application.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
