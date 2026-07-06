import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export default function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, signIn, signUp } = useAuthStore();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  // Sync mode with what triggered the modal
  useEffect(() => {
    if (authModalOpen) setMode(authModalMode || 'login');
  }, [authModalOpen, authModalMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn({ email: form.email, password: form.password });
        toast.success('Welcome back! 🎉');
        closeAuthModal();
      } else {
        await signUp({ email: form.email, password: form.password, name: form.name, phone: form.phone });
        toast.success('Account created! Welcome to Zuno 🍽️');
        closeAuthModal();
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <AnimatePresence>
      {authModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeAuthModal}
            className="fixed inset-0 bg-black/40 z-[100]"
          />

          {/* Right-side panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[101] shadow-2xl flex flex-col"
          >
            {/* Close button */}
            <button
              onClick={closeAuthModal}
              className="absolute top-5 left-5 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all z-10"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto pt-16 pb-10 px-8">

              {/* Title row */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={mode}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="font-heading font-bold text-3xl text-dark-800 leading-tight"
                    >
                      {mode === 'login' ? 'Login' : 'Sign Up'}
                    </motion.h2>
                  </AnimatePresence>

                  {mode === 'login' ? (
                    <p className="text-sm text-gray-500 mt-1">
                      or{' '}
                      <button
                        onClick={() => setMode('signup')}
                        className="text-amber-500 font-semibold hover:text-amber-600 transition-colors"
                      >
                        create an account
                      </button>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      or{' '}
                      <button
                        onClick={() => setMode('login')}
                        className="text-amber-500 font-semibold hover:text-amber-600 transition-colors"
                      >
                        login to your account
                      </button>
                    </p>
                  )}

                  {/* Decorative underline */}
                  <div className="w-8 h-0.5 bg-dark-800 mt-3" />
                </div>

                {/* Food illustration */}
                <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 ml-4 shadow-inner">
                  <span className="text-4xl select-none">
                    {mode === 'login' ? '🍽️' : '🛵'}
                  </span>
                </div>
              </div>

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={mode}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-4"
                >
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          name="name"
                          type="text"
                          placeholder="Your full name"
                          required
                          value={form.name}
                          onChange={handleChange}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm text-dark-800 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm text-dark-800 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  {mode === 'signup' && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Phone <span className="font-normal normal-case text-gray-400">(optional)</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          name="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={form.phone}
                          onChange={handleChange}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm text-dark-800 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Password {mode === 'signup' && <span className="font-normal normal-case text-gray-400">(min. 6 characters)</span>}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        value={form.password}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-10 pr-11 text-sm text-dark-800 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all bg-gray-50 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-all shadow-amber disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </span>
                    ) : (
                      mode === 'login' ? 'Login' : 'Create Account'
                    )}
                  </button>

                  {/* T&C */}
                  <p className="text-xs text-gray-400 leading-relaxed text-center pt-1">
                    By clicking on {mode === 'login' ? 'Login' : 'Create Account'}, I accept the{' '}
                    <span className="text-dark-700 font-semibold cursor-pointer hover:underline">Terms & Conditions</span>
                    {' '}&amp;{' '}
                    <span className="text-dark-700 font-semibold cursor-pointer hover:underline">Privacy Policy</span>
                  </p>
                </motion.form>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
