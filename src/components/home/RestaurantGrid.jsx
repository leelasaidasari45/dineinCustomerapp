import RestaurantCard from './RestaurantCard';

export function RestaurantCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-6 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-4 pt-2 border-t border-gray-100">
          <div className="skeleton h-4 w-12" />
          <div className="skeleton h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export default function RestaurantGrid({ restaurants, loading, error }) {
  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Could not load restaurants.</p>
        <p className="text-gray-400 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!loading && restaurants.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="font-heading font-bold text-xl text-dark-800 mb-2">No restaurants found</h3>
        <p className="text-gray-500">Try a different search or cuisine filter</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading
        ? Array.from({ length: 6 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
        : restaurants.map((r, i) => (
            <RestaurantCard key={r.id} restaurant={r} index={i} />
          ))}
    </div>
  );
}
