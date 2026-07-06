import { useState } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Zap, AlertTriangle } from 'lucide-react';
import HeroSearch from '../components/home/HeroSearch';
import CuisineChips from '../components/home/CuisineChips';
import RestaurantGrid from '../components/home/RestaurantGrid';
import PageTransition from '../components/layout/PageTransition';
import { useRestaurants } from '../hooks/useRestaurants';
import { toast } from 'sonner';

export default function HomePage() {
  const [search, setSearch] = useState('');
  // cuisine.label = unique active key for chip highlight
  // cuisine.value = the actual filter passed to useRestaurants
  const [cuisine, setCuisine] = useState({ label: '', value: '' });
  const [location, setLocation] = useState('Hyderabad');
  const { restaurants, loading, error, usingMock } = useRestaurants(search, cuisine.value, location);

  const handleLocationChange = (newLoc) => {
    setLocation(newLoc);
  };

  const isComingSoon = location !== 'Hyderabad';

  return (
    <PageTransition>
      <div className="min-h-screen">


        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-dark-800 via-dark-700 to-amber-900/40 pt-28 pb-16 px-4">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-full px-4 py-1.5 text-sm font-medium mb-6"
            >
              <Zap className="w-3.5 h-3.5" />
              Pre-order & skip the wait
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-white mb-4 leading-tight"
            >
              Order ahead,
              <br />
              <span className="text-gradient">arrive to perfection</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-gray-300 text-sm sm:text-base md:text-lg mb-8 max-w-xl mx-auto px-2"
            >
              Pre-order your meal, pick an arrival time, and walk in to food ready exactly when you do.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <HeroSearch
                value={search}
                onChange={setSearch}
                location={location}
                onLocationChange={handleLocationChange}
              />
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-4 sm:gap-8 mt-8"
            >
              {[
                { value: '0 min', label: 'Wait time' },
                { value: '50%', label: 'Pay advance' },
                { value: '100%', label: 'Food ready' },
              ].map((stat) => (
                <div key={stat.label} className="text-center min-w-[70px]">
                  <p className="text-white font-heading font-bold text-xl sm:text-2xl">{stat.value}</p>
                  <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Cuisine Filters - Hide when selected city is Coming Soon */}
          {!isComingSoon && (
            <section className="mb-8">
              <h2 className="font-heading font-bold text-xl text-dark-800 mb-4">
                What are you craving?
              </h2>
              <CuisineChips active={cuisine.label} onSelect={setCuisine} />
            </section>
          )}

          {/* Restaurant Listing */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-xl text-dark-800">
                {isComingSoon
                  ? `${location} Restaurants`
                  : cuisine.label
                  ? `${cuisine.label} Restaurants`
                  : 'All Restaurants'}
                {!loading && !isComingSoon && (
                  <span className="text-gray-400 text-base font-normal ml-2">
                    ({restaurants.length})
                  </span>
                )}
              </h2>
            </div>

            {isComingSoon ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm px-6 max-w-xl mx-auto"
              >
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <span className="text-4xl select-none animate-bounce">🚀</span>
                </div>
                <h3 className="font-heading font-extrabold text-2xl text-dark-800 mb-2">
                  Coming soon to {location}!
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                  We are actively partnering with top-rated local kitchens and restaurants in {location} to bring you wait-free dine-in pre-orders. Stay tuned!
                </p>
                <div className="mt-8 flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">
                    Onboarding restaurants...
                  </span>
                </div>
              </motion.div>
            ) : (
              <RestaurantGrid
                restaurants={restaurants}
                loading={loading}
                error={error}
              />
            )}
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
