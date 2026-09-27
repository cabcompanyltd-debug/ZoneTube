import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, googleAuth, signInWithGoogleOAuth } = useAuth();

  const handleGoogleClick = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogleOAuth();
    } catch (err: any) {
      // Fallback to Google Email dialog
      setShowGoogleModal(true);
    } finally {
      setIsLoading(false);
    }
  };
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const redirectAfterLogin = (userRole: string, userName: string) => {
    if (userRole === 'admin') {
      showToast(`Welcome back, Admin ${userName}! Redirecting to Admin Dashboard...`);
      onNavigate('/admin');
    } else {
      showToast(`Welcome back, ${userName}! Redirecting to Visitor Dashboard...`);
      onNavigate('/dashboard');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const user = await login(data.email, data.password);
      redirectAfterLogin(user.role, user.name);
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim() || !googleEmailInput.includes('@')) {
      showToast('Please enter a valid Google email address', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const nameFromEmail = googleEmailInput.split('@')[0];
      const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      const avatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`;

      const gUser = await googleAuth(googleEmailInput.trim(), capitalizedName, avatar, 'user');
      setShowGoogleModal(false);
      redirectAfterLogin(gUser.role, gUser.name);
    } catch (err: any) {
      showToast(err.message || 'Google Auth failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    try {
      setIsLoading(true);
      const user = await login('admin@zonetube.com', 'password123');
      redirectAfterLogin(user.role, user.name);
    } catch (err: any) {
      showToast(err.message || 'Demo login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in my-6">
      <div className="w-full max-w-md p-8 bg-[#151821] border border-white/10 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <Logo size="lg" onClick={() => onNavigate('/')} />
          </div>
          <h1 className="text-2xl font-black text-white">Welcome Back</h1>
          <p className="text-xs text-zinc-400">Sign in to your ZoneTube account</p>
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          className="w-full py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 border border-zinc-200"
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
          <span>Sign In with Google</span>
        </button>

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#151821] px-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest absolute">
            or Email & Password
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />

          <Button type="submit" isLoading={isLoading} className="w-full py-3.5 font-bold text-sm mt-2">
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('/register')}
            className="text-[var(--accent-red)] font-bold hover:underline"
          >
            Create account
          </button>
        </p>
      </div>

      {/* Google Modal */}
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
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Enter your Google email to log in:
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
