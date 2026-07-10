import { useNavigate } from 'react-router-dom';
import { Star, Clock, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useActiveOrder } from '../../hooks/useActiveOrder';

const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80';

export default function RestaurantCard({ restaurant, index = 0 }) {
  const {
    id,
    name,
    cuisine_tags = [],
    photo_url,
    rating,
    avg_prep_time_minutes,
    is_open,
    address,
  } = restaurant;

  const navigate = useNavigate();
  const { activeOrder } = useActiveOrder();

  // True if there is an active order at a DIFFERENT restaurant
  const isLocked = activeOrder && activeOrder.restaurant_id !== id;

  const handleClick = () => {
    if (isLocked) {
      toast.error(
        `You have an active order at ${activeOrder.restaurants?.name || 'another restaurant'}. Please wait until your current order is completed before ordering here.`,
        { duration: 4000, icon: '🔒' }
      );
      return;
    }
    navigate(`/restaurant/${id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
    >
      <motion.div
        onClick={handleClick}
        whileHover={{ y: isLocked ? 0 : -6, boxShadow: isLocked ? 'none' : '0 16px 48px rgba(0,0,0,0.16)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`card cursor-pointer group relative ${isLocked ? 'opacity-60 grayscale' : ''}`}
      >
        {/* Lock overlay badge */}
        {isLocked && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-dark-800/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full">
            <Lock className="w-3 h-3" />
            Order in Progress
          </div>
        )}

        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <motion.img
            whileHover={{ scale: isLocked ? 1 : 1.07 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            src={photo_url || FALLBACK_PHOTO}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = FALLBACK_PHOTO; }}
          />
          {/* Open/closed badge */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
            is_open
              ? 'bg-green-500/90 text-white'
              : 'bg-dark-900/70 text-gray-300'
          }`}>
            {is_open ? '● Open' : '● Closed'}
          </div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-bold text-lg text-dark-800 truncate group-hover:text-amber-600 transition-colors">
                {name}
              </h3>
              {address && (
                <p className="text-gray-500 text-sm truncate mt-0.5">{address}</p>
              )}
            </div>
            {isLocked
              ? <Lock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
              : null
            }
          </div>

          {/* Cuisine tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {cuisine_tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="text-sm font-semibold text-dark-800">
                {rating ? rating.toFixed(1) : '—'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>{avg_prep_time_minutes || 20}–{(avg_prep_time_minutes || 20) + 10} min</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
