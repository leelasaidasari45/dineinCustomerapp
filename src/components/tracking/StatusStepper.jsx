import { motion } from 'framer-motion';
import { Check, Circle, Clock } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

const ORDER_STEPS = [
  { status: 'confirmed', label: 'Order Confirmed', icon: '✅', description: 'Your order has been received' },
  { status: 'preparing', label: 'Preparing', icon: '👨‍🍳', description: 'Kitchen is working on your food' },
  { status: 'ready', label: 'Ready!', icon: '🎉', description: 'Your food is ready. Time to arrive!' },
  { status: 'completed', label: 'Completed', icon: '🌟', description: 'Enjoy your meal!' },
];

const STATUS_ORDER = ['confirmed', 'preparing', 'ready', 'completed'];

export default function StatusStepper({ currentStatus, completedAt }) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="py-4">
      {ORDER_STEPS.map((step, index) => {
        const stepIndex = STATUS_ORDER.indexOf(step.status);
        const isCompleted = stepIndex < currentIndex;
        const isActive = stepIndex === currentIndex;
        const isPending = stepIndex > currentIndex;

        return (
          <div key={step.status} className="flex gap-4">
            {/* Step indicator column */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted || isActive ? '#F59E0B' : '#E5E7EB',
                  scale: isActive ? [1, 1.15, 1] : 1,
                }}
                transition={isActive ? {
                  scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                } : {}}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative"
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <Check className="w-5 h-5 text-white font-bold" strokeWidth={3} />
                  </motion.div>
                ) : isActive ? (
                  <>
                    <span className="text-lg">{step.icon}</span>
                    {/* Pulse ring */}
                    <motion.div
                      animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full bg-amber-400"
                    />
                  </>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                )}
              </motion.div>

              {/* Connecting line */}
              {index < ORDER_STEPS.length - 1 && (
                <div className="w-0.5 flex-1 my-1 bg-gray-200 rounded-full overflow-hidden min-h-[32px]">
                  <motion.div
                    initial={{ height: '0%' }}
                    animate={{ height: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full bg-amber-500 rounded-full"
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-6 ${index === ORDER_STEPS.length - 1 ? 'pb-0' : ''}`}>
              <motion.div
                animate={{ opacity: isPending ? 0.4 : 1 }}
                className="pt-1"
              >
                <h4 className={`font-heading font-bold text-base ${
                  isActive ? 'text-amber-600' : isCompleted ? 'text-dark-800' : 'text-gray-400'
                }`}>
                  {step.label}
                </h4>
                <p className={`text-sm mt-0.5 ${isActive ? 'text-amber-500' : 'text-gray-500'}`}>
                  {step.description}
                </p>
                {step.status === 'completed' && completedAt && (
                  <p className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Completed at {formatTime(completedAt)}</span>
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
