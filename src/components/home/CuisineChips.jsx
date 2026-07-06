import { motion } from 'framer-motion';

const ALL_ITEMS = [
  { label: 'All',           value: '',               img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&h=150&fit=crop&crop=center' },
  { label: 'Idli',          value: 'South Indian',   img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=150&h=150&fit=crop&crop=center' },
  { label: 'Dosa',          value: 'Dosa',           img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=150&h=150&fit=crop&crop=center' },
  { label: 'Biryani',       value: 'Biryani',        img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=150&h=150&fit=crop&crop=center' },
  { label: 'Burger',        value: 'Burgers',        img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&h=150&fit=crop&crop=center' },
  { label: 'Pizza',         value: 'Pizza',          img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=150&h=150&fit=crop&crop=center' },
  { label: 'Noodles',       value: 'Noodles',        img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&h=150&fit=crop&crop=center' },
  { label: 'Coffee',        value: 'Filter Coffee',  img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&h=150&fit=crop&crop=center' },
  { label: 'Cake',          value: 'Cakes',          img: 'https://images.unsplash.com/photo-1586788224331-947f68671cf1?w=150&h=150&fit=crop&crop=center' },
  { label: 'Samosa',        value: 'Snacks',         img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=150&h=150&fit=crop&crop=center' },
  { label: 'Butter Chicken',value: 'North Indian',   img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=150&h=150&fit=crop&crop=center' },
  { label: 'Paneer Tikka',  value: 'North Indian',   img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=150&h=150&fit=crop&crop=center' },
  { label: 'Ice Cream',     value: 'Ice Cream',      img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=150&h=150&fit=crop&crop=center' },
  { label: 'Fried Rice',    value: 'Chinese',        img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=150&h=150&fit=crop&crop=center' },
  { label: 'Wings',         value: 'American',       img: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=150&h=150&fit=crop&crop=center' },
  { label: 'Waffle',        value: 'Waffles',        img: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=150&h=150&fit=crop&crop=center' },
  { label: 'Dal Makhani',   value: 'North Indian',   img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=150&h=150&fit=crop&crop=center' },
];

const ROW_1 = ALL_ITEMS.slice(0, 9);
const ROW_2 = ALL_ITEMS.slice(9);

function FoodChip({ item, active, onSelect, delay }) {
  // Use label as unique key so chips with the same cuisine value don't all highlight
  const isActive = active === item.label;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.93 }}
      onClick={() => onSelect(isActive ? { label: '', value: '' } : { label: item.label, value: item.value })}
      className="flex flex-col items-center gap-2 group"
    >
      {/* Circle */}
      <div
        className={`w-20 h-20 rounded-full overflow-hidden transition-all duration-200 shadow-sm group-hover:shadow-md
          ${isActive ? 'ring-[3px] ring-amber-500 ring-offset-2' : 'group-hover:ring-2 group-hover:ring-amber-200 group-hover:ring-offset-1'}
          ${!item.img ? 'bg-amber-50 flex items-center justify-center text-4xl' : ''}`}
      >
        {item.img
          ? <img src={item.img} alt={item.label} className="w-full h-full object-cover" loading="lazy" />
          : <span>{item.emoji}</span>
        }
      </div>

      {/* Label */}
      <span className={`text-xs font-semibold text-center leading-tight max-w-[80px]
        ${isActive ? 'text-amber-600' : 'text-gray-500 group-hover:text-gray-800'}`}
      >
        {item.label}
      </span>
    </motion.button>
  );
}

export default function CuisineChips({ active, onSelect }) {
  return (
    <>
      {/* Mobile & Tablet: Single horizontally scrollable row */}
      <div className="lg:hidden overflow-hidden -mx-4 sm:mx-0">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-3 px-4 sm:px-0">
          {ALL_ITEMS.map((item, i) => (
            <div key={item.label} className="flex-shrink-0">
              <FoodChip item={item} active={active} onSelect={onSelect} delay={i * 0.03} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop (Large Devices): Two-row spread layout (original design) */}
      <div className="hidden lg:flex flex-col gap-5">
        {/* Row 1 — 9 items spread full width */}
        <div className="flex justify-between">
          {ROW_1.map((item, i) => (
            <FoodChip key={item.label} item={item} active={active} onSelect={onSelect} delay={i * 0.04} />
          ))}
        </div>

        {/* Row 2 — 8 items spread full width */}
        <div className="flex justify-between">
          {ROW_2.map((item, i) => (
            <FoodChip key={item.label} item={item} active={active} onSelect={onSelect} delay={(9 + i) * 0.04} />
          ))}
        </div>
      </div>
    </>
  );
}
