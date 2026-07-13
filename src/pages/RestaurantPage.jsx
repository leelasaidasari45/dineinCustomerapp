import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Clock, MapPin, ShoppingBag, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/layout/PageTransition';
import MenuCategoryTabs from '../components/menu/MenuCategoryTabs';
import MenuItemCard from '../components/menu/MenuItemCard';
import CartBar from '../components/menu/CartBar';
import { useRestaurant } from '../hooks/useRestaurants';
import { useMenuItems } from '../hooks/useMenuItems';
import { useActiveOrder } from '../hooks/useActiveOrder';

const FALLBACK_BANNER = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80';

function MenuSkeleton() {
  return (
    <div className="space-y-4 mt-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-4 border-b border-gray-100">
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-5 w-1/4" />
          </div>
          <div className="skeleton w-24 h-24 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

export default function RestaurantPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { restaurant, loading: rLoading } = useRestaurant(id);
  const { menuItems, categories, loading: mLoading } = useMenuItems(id);
  const { activeOrder, loading: activeOrderLoading } = useActiveOrder();
  const [activeCategory, setActiveCategory] = useState('');
  const [dietFilter, setDietFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'
  const sectionRefs = useRef({});

  // Filter categories and group items based on diet filter
  const grouped = categories.reduce((acc, cat) => {
    const itemsOfCat = menuItems.filter((item) => {
      if (item.category !== cat) return false;
      if (dietFilter === 'veg' && !item.is_veg) return false;
      if (dietFilter === 'non-veg' && item.is_veg) return false;
      return true;
    });
    if (itemsOfCat.length > 0) {
      acc[cat] = itemsOfCat;
    }
    return acc;
  }, {});

  const activeCategories = categories.filter((cat) => grouped[cat] && grouped[cat].length > 0);

  // Set first category as active when loaded or activeCategories change
  useEffect(() => {
    if (activeCategories.length > 0 && (!activeCategory || !activeCategories.includes(activeCategory))) {
      setActiveCategory(activeCategories[0]);
    }
  }, [activeCategories]);

  // Scroll-spy: observe sections
  useEffect(() => {
    if (activeCategories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.dataset.category);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeCategories]);

  const scrollToCategory = (cat) => {
    const el = sectionRefs.current[cat];
    if (el) {
      const yOffset = -120;
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setActiveCategory(cat);
  };

  if (rLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen">
          <div className="skeleton h-72 w-full" />
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
            <div className="skeleton h-8 w-1/2" />
            <div className="skeleton h-5 w-1/3" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!restaurant) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg">Restaurant not found</p>
            <Link to="/" className="btn-primary mt-4 inline-block">Go Home</Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Block access if customer has an active order at a DIFFERENT restaurant
  const isLocked = !activeOrderLoading && activeOrder && activeOrder.restaurant_id !== id;

  if (isLocked) {
    return (
      <PageTransition>
        <div className="min-h-screen pt-20 pb-8 px-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-card border border-gray-100 p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-100">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="font-heading font-extrabold text-xl text-dark-800 mb-2">
              You have an active order
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-2">
              You currently have an active pre-order at
            </p>
            <p className="font-heading font-bold text-amber-600 text-lg mb-4">
              {activeOrder.restaurants?.name || 'another restaurant'}
            </p>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              You cannot place a new order at a different restaurant until the restaurant owner marks your current order as <strong>Completed</strong>.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to={`/track/${activeOrder.id}`}
                className="btn-primary text-center w-full"
              >
                Track My Current Order
              </Link>
              <button
                onClick={() => navigate(-1)}
                className="btn-secondary w-full"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // Grouped and activeCategories calculated above

  return (
    <PageTransition>
      <div className="min-h-screen pb-32">
        {/* Hero Banner */}
        <div className="relative h-72 overflow-hidden">
          <img
            src={restaurant.photo_url || FALLBACK_BANNER}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = FALLBACK_BANNER; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/30 to-transparent" />

          {/* Back button */}
          <Link
            to="/"
            className="absolute top-20 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>

          {/* Restaurant info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="max-w-4xl mx-auto">
              {/* Open badge */}
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                restaurant.is_open ? 'bg-green-500/90 text-white' : 'bg-gray-800/70 text-gray-300'
              }`}>
                {restaurant.is_open ? '● Open Now' : '● Closed'}
              </span>
              <h1 className="font-heading font-extrabold text-3xl text-white mb-1">
                {restaurant.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
                {restaurant.cuisine_tags?.slice(0, 3).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
                <span className="opacity-50">|</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  {restaurant.rating?.toFixed(1) || '—'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {restaurant.avg_prep_time_minutes || 20} min prep
                </span>
              </div>
              {restaurant.address && (
                <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {restaurant.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        {activeCategories.length > 0 && (
          <MenuCategoryTabs
            categories={activeCategories}
            activeCategory={activeCategory}
            onSelect={scrollToCategory}
          />
        )}

        {/* Veg/Non-veg filter toggles */}
        {!mLoading && categories.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pt-6 flex gap-2">
            <button
              onClick={() => setDietFilter('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
                dietFilter === 'all'
                  ? 'bg-dark-800 text-white shadow-sm shadow-dark-800/10'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietFilter('veg')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
                dietFilter === 'veg'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                  : 'bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50/30'
              }`}
            >
              <span className="inline-flex w-3.5 h-3.5 border border-emerald-500 rounded items-center justify-center bg-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
              Veg
            </button>
            <button
              onClick={() => setDietFilter('non-veg')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
                dietFilter === 'non-veg'
                  ? 'bg-red-500 text-white shadow-sm shadow-red-500/10'
                  : 'bg-white border border-red-100 text-red-600 hover:bg-red-50/30'
              }`}
            >
              <span className="inline-flex w-3.5 h-3.5 border border-red-500 rounded items-center justify-center bg-white">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              </span>
              Non-Veg
            </button>
          </div>
        )}

        {/* Menu */}
        <div className="max-w-4xl mx-auto px-4 pt-6">
          {mLoading ? (
            <MenuSkeleton />
          ) : categories.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No menu items available</p>
            </div>
          ) : activeCategories.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <span className="text-4xl">🥗</span>
              <h3 className="font-heading font-bold text-dark-800 text-lg mt-3 mb-1">
                No items match your filter
              </h3>
              <p className="text-gray-400 text-xs">
                Try switching the toggle to "All" or a different option
              </p>
              <button
                onClick={() => setDietFilter('all')}
                className="mt-4 px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors"
              >
                Show All Items
              </button>
            </div>
          ) : (
            activeCategories.map((cat) => (
              <div
                key={cat}
                ref={(el) => (sectionRefs.current[cat] = el)}
                data-category={cat}
                className="mb-8"
              >
                <motion.h2
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="font-heading font-bold text-xl text-dark-800 mb-2"
                >
                  {cat}
                  <span className="text-gray-400 text-base font-normal ml-2">
                    ({grouped[cat]?.length || 0})
                  </span>
                </motion.h2>
                <div className="bg-white rounded-3xl shadow-card px-4 divide-y divide-gray-50">
                  {(grouped[cat] || []).map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      restaurantName={restaurant.name}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <CartBar />
      </div>
    </PageTransition>
  );
}
