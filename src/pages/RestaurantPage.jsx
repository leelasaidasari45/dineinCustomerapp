import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, MapPin, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/layout/PageTransition';
import MenuCategoryTabs from '../components/menu/MenuCategoryTabs';
import MenuItemCard from '../components/menu/MenuItemCard';
import CartBar from '../components/menu/CartBar';
import { useRestaurant } from '../hooks/useRestaurants';
import { useMenuItems } from '../hooks/useMenuItems';

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
  const { restaurant, loading: rLoading } = useRestaurant(id);
  const { menuItems, categories, loading: mLoading } = useMenuItems(id);
  const [activeCategory, setActiveCategory] = useState('');
  const sectionRefs = useRef({});

  // Set first category as active when loaded
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories]);

  // Scroll-spy: observe sections
  useEffect(() => {
    if (categories.length === 0) return;
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
  }, [categories]);

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

  const grouped = categories.reduce((acc, cat) => {
    acc[cat] = menuItems.filter((item) => item.category === cat);
    return acc;
  }, {});

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
        {categories.length > 0 && (
          <MenuCategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onSelect={scrollToCategory}
          />
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
          ) : (
            categories.map((cat) => (
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
