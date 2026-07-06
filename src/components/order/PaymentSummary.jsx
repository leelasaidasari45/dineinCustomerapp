import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/formatters';

export default function PaymentSummary({ subtotal, taxes, total, advanceAmount, remainingAmount }) {
  const pct = 50;

  return (
    <div className="space-y-4">
      {/* Line items */}
      <div className="space-y-2">
        <div className="flex justify-between text-gray-600 text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600 text-sm">
          <span>GST (5%)</span>
          <span>{formatCurrency(taxes)}</span>
        </div>
        <div className="flex justify-between font-bold text-dark-800 text-base pt-2 border-t border-gray-100">
          <span>Total Bill</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* 50/50 split visual */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
        <p className="text-sm font-semibold text-amber-800 mb-3">Payment Split</p>

        {/* Progress bar */}
        <div className="flex rounded-xl overflow-hidden h-10 mb-3 bg-gray-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '50%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center"
          >
            <span className="text-white text-xs font-bold">Pay Now</span>
          </motion.div>
          <div className="flex-1 border-2 border-dashed border-amber-300 flex items-center justify-center">
            <span className="text-amber-600 text-xs font-bold">At Restaurant</span>
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-500 rounded-xl p-3 text-center">
            <p className="text-white/80 text-xs mb-0.5">Pay Now (50%)</p>
            <p className="text-white font-bold text-lg font-heading">{formatCurrency(advanceAmount)}</p>
          </div>
          <div className="bg-white border-2 border-dashed border-amber-300 rounded-xl p-3 text-center">
            <p className="text-amber-600 text-xs mb-0.5">At Restaurant (50%)</p>
            <p className="text-amber-700 font-bold text-lg font-heading">{formatCurrency(remainingAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
