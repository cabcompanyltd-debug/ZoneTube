import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { COUNTRIES, Country } from '../../data/countries';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register: registerAuth, googleAuth, signInWithGoogleOAuth } = useAuth();
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'visitor'>('visitor');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Default US
  const [isLoading, setIsLoading] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleFinishRegister = (role: string, name: string) => {
    if (role === 'admin') {
      showToast(`Welcome Admin ${name}! Redirecting to Admin Dashboard...`);
      onNavigate('/admin');
    } else {
      showToast(`Welcome Visitor ${name} ${selectedCountry.flag}! Redirecting to Visitor Dashboard...`);
      onNavigate('/dashboard');
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      const newUser = await registerAuth(
        data.name,
        data.email,
        data.password,
        selectedRole,
        selectedCountry.name,
        selectedCountry.code,
        selectedCountry.flag
      );
      handleFinishRegister(newUser.role, newUser.name);
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogleOAuth();
    } catch (err: any) {
      setShowGoogleModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim() || !googleEmailInput.includes('@')) {
      showToast('Please enter a valid Google email', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const nameFromEmail = googleEmailInput.split('@')[0];
      const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      const avatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`;

      const gUser = await googleAuth(
        googleEmailInput.trim(),
        capitalizedName,
        avatar,
        selectedRole,
        selectedCountry.name,
        selectedCountry.code,
        selectedCountry.flag
      );
      setShowGoogleModal(false);
      handleFinishRegister(gUser.role, gUser.name);
    } catch (err: any) {
      showToast(err.message || 'Google Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 animate-fade-in my-6">
      <div className="w-full max-w-lg p-8 bg-[#151821] border border-white/10 rounded-3xl shadow-2xl space-y-6">
        {/* Header & Brand Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <Logo size="lg" onClick={() => onNavigate('/')} />
          </div>
          <h1 className="text-2xl font-black text-white">Create Your Account</h1>
          <p className="text-xs text-zinc-400">
            Sign up with InsForge Authentication & choose your privilege level
          </p>
        </div>

        {/* Account Role Selection (Admin vs Visitor) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            Select Account Role / Privileges
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Visitor Option */}
            <div
              onClick={() => setSelectedRole('visitor')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRole === 'visitor'
                  ? 'bg-blue-500/15 border-blue-500 text-white shadow-lg ring-1 ring-blue-500'
                  : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  <span className="font-bold text-xs">Visitor</span>
                </div>
                <input
                  type="radio"
                  name="user_role"
                  checked={selectedRole === 'visitor'}
                  onChange={() => setSelectedRole('visitor')}
                  className="accent-blue-500 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                Watch, like, comment, create playlists & save history
              </p>
            </div>

            {/* Admin Option */}
            <div
              onClick={() => setSelectedRole('admin')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRole === 'admin'
                  ? 'bg-red-500/15 border-red-500 text-white shadow-lg ring-1 ring-red-500'
                  : 'bg-black/40 border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="font-bold text-xs text-red-400">Admin</span>
                </div>
                <input
                  type="radio"
                  name="user_role"
                  checked={selectedRole === 'admin'}
                  onChange={() => setSelectedRole('admin')}
                  className="accent-red-500 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-zinc-400 leading-tight">
                Full access: Import videos, manage categories & admin dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Google Authentication Button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleClick}
            className="w-full py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 border border-zinc-200 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google ({selectedRole === 'admin' ? 'as Admin' : 'as Visitor'})</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#151821] px-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest absolute">
            or Email Registration
          </span>
        </div>

        {/* InsForge Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            {...register('name')}
            error={errors.name?.message}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            error={errors.email?.message}
          />

          {/* Clean Country Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Select Country
            </label>
            <div className="relative">
              <select
                value={selectedCountry.code}
                onChange={(e) => {
                  const found = COUNTRIES.find((c) => c.code === e.target.value);
                  if (found) setSelectedCountry(found);
                }}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[var(--accent-red)] transition-colors cursor-pointer appearance-none pr-10"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-zinc-900 text-white">
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
                ▼
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              Your country flag will be displayed beside your username on ZoneTube.
            </p>
          </div>

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          <Button type="submit" isLoading={isLoading} className="w-full py-3.5 font-bold text-sm mt-2">
            Create {selectedRole === 'admin' ? 'Admin' : 'Visitor'} Account
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-400 border-t border-white/10 pt-4">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('/login')}
            className="text-[var(--accent-red)] font-bold hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>

      {/* Google Sign-In Quick Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#151821] border border-white/10 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌐</span>
                <h3 className="text-base font-bold text-white">Google Authentication</h3>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs flex items-center justify-between">
              <span className="text-zinc-300">Selected Role:</span>
              <span className={`font-bold px-2 py-0.5 rounded-md ${selectedRole === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                {selectedRole.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-zinc-300">
              Enter your Google Account email to authenticate:
            </p>

            <form onSubmit={handleGoogleAuthSubmit} className="space-y-4">
              <Input
                label="Google Email"
                type="email"
                placeholder="user@gmail.com"
                value={googleEmailInput}
                onChange={(e) => setGoogleEmailInput(e.target.value)}
                autoFocus
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Select Country
                </label>
                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const found = COUNTRIES.find((c) => c.code === e.target.value);
                    if (found) setSelectedCountry(found);
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[var(--accent-red)] cursor-pointer"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-zinc-900 text-white">
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setShowGoogleModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isLoading}>
                  Sign In with Google
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
