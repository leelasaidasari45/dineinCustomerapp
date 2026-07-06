import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, LogOut, Package, UtensilsCrossed, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/layout/PageTransition';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, customer, signOut, openAuthModal } = useAuthStore();

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col px-4 pt-8">
          <div className="max-w-md mx-auto w-full">
            <button onClick={() => navigate('/')} className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center hover:shadow-card-hover transition-all mb-8">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-center py-12">
              <button onClick={() => openAuthModal('login')} className="btn-primary">Sign In</button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = customer?.name || user.user_metadata?.full_name || 'Customer';
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <PageTransition>
      <div className="min-h-screen pt-8 pb-8 px-4">
        <div className="max-w-md mx-auto">
          {/* Back button */}
          <button onClick={() => navigate('/')} className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center hover:shadow-card-hover transition-all mb-6">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          {/* Avatar + Name */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-amber-lg">
              <span className="font-heading font-bold text-3xl text-white">{initials}</span>
            </div>
            <h1 className="font-heading font-bold text-2xl text-dark-800">{displayName}</h1>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </motion.div>

          {/* Details */}
          <div className="card p-5 mb-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <Mail className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-dark-800">{user.email}</p>
              </div>
            </div>
            {customer?.phone && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Phone className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-dark-800">{customer.phone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/orders')}
              className="w-full card p-4 flex items-center gap-3 text-left hover:shadow-card-hover transition-all active:scale-99"
            >
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                <Package className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-medium text-dark-800">My Orders</span>
            </button>

            <button
              onClick={handleSignOut}
              className="w-full card p-4 flex items-center gap-3 text-left hover:shadow-card-hover transition-all active:scale-99 border border-red-100"
            >
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <span className="font-medium text-red-500">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
