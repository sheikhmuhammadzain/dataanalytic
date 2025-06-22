import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useDataStore } from '../store/dataStore';

interface LoginProps {
  theme: 'dark' | 'light';
  getThemeClass: (darkClass: string, lightClass: string) => string;
}

export const Login: React.FC<LoginProps> = ({ theme, getThemeClass }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const login = useDataStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
      setError('Sign up is for demo only. Please use login credentials: admin@qubit.com / admin123');
      setIsLoading(false);
      return;
    }

    const success = login(email, password);
    if (!success) {
      setError('Invalid credentials. Use: admin@qubit.com / admin123');
    }
    setIsLoading(false);
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full max-w-md mx-auto p-6 rounded-2xl ${getThemeClass('bg-white/5 backdrop-blur-lg border border-white/10', 'bg-white border border-gray-100')} shadow-xl`}
    >
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`w-16 h-16 mx-auto mb-4 rounded-full ${getThemeClass('bg-indigo-500/10', 'bg-blue-50')} flex items-center justify-center`}
        >
          <LogIn className={`w-8 h-8 ${getThemeClass('text-indigo-400', 'text-[#0052A5]')}`} />
        </motion.div>
        <h2 className={`text-2xl font-bold ${getThemeClass('text-white', 'text-gray-900')} mb-2`}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className={`${getThemeClass('text-white/70', 'text-gray-600')}`}>
          {isSignUp ? 'Sign up to access the admin panel' : 'Sign in to access the admin panel'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm"
          >
            {error}
          </motion.div>
        )}

        <div>
          <label className={`block text-sm font-medium ${getThemeClass('text-white/90', 'text-gray-700')} mb-2`}>
            Email Address
          </label>
          <div className="relative">
            <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${getThemeClass('text-white/50', 'text-gray-400')}`} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg ${getThemeClass('bg-white/10 border border-white/20 text-white placeholder-white/50', 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500')} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${getThemeClass('text-white/90', 'text-gray-700')} mb-2`}>
            Password
          </label>
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${getThemeClass('text-white/50', 'text-gray-400')}`} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-10 pr-12 py-3 rounded-lg ${getThemeClass('bg-white/10 border border-white/20 text-white placeholder-white/50', 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500')} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${getThemeClass('text-white/50 hover:text-white/70', 'text-gray-400 hover:text-gray-600')} transition-colors`}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isSignUp && (
          <div>
            <label className={`block text-sm font-medium ${getThemeClass('text-white/90', 'text-gray-700')} mb-2`}>
              Confirm Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${getThemeClass('text-white/50', 'text-gray-400')}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg ${getThemeClass('bg-white/10 border border-white/20 text-white placeholder-white/50', 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500')} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>
        )}

        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white ${getThemeClass('bg-indigo-600 hover:bg-indigo-700', 'bg-[#0052A5] hover:bg-[#004080]')} disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2`}
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              Processing...
            </>
          ) : (
            <>
              {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </>
          )}
        </motion.button>
      </form>

      <div className="mt-6 space-y-4">
        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
            className={`text-sm ${getThemeClass('text-white/70 hover:text-white', 'text-gray-600 hover:text-[#0052A5]')} transition-colors`}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}; 