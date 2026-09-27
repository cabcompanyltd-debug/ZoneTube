import React, { createContext, useContext, useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: 'admin' | 'visitor' | 'user',
    country?: string,
    country_code?: string,
    country_flag?: string
  ) => Promise<User>;
  googleAuth: (
    email: string,
    name: string,
    avatar: string,
    role?: 'admin' | 'visitor' | 'user',
    country?: string,
    country_code?: string,
    country_flag?: string
  ) => Promise<User>;
  signInWithGoogleOAuth: () => Promise<void>;
  logout: () => void;
  updateProfile: (
    name: string,
    avatar: string,
    country?: string,
    country_code?: string,
    country_flag?: string
  ) => Promise<void>;
  isAdmin: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to load user profile from InsForge public.users
  const syncAndLoadUserProfile = async (authUser: any): Promise<User> => {
    try {
      const { data: dbUsers } = await insforge.database
        .from('users')
        .select('*')
        .eq('id', authUser.id);

      const dbUser = dbUsers?.[0];
      const isProjectAdmin = authUser.email === 'admin@zonetube.com' || authUser.email === 'admin@gmail.com' || dbUser?.role === 'admin';
      const userRole: 'admin' | 'visitor' | 'user' = isProjectAdmin ? 'admin' : (dbUser?.role === 'visitor' ? 'visitor' : (dbUser?.role || 'user'));

      const finalUser: User = {
        id: authUser.id,
        name: dbUser?.name || authUser.name || authUser.profile?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: userRole,
        avatar: dbUser?.avatar || authUser.avatar || authUser.profile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(authUser.email || 'user')}`,
        country: dbUser?.country || 'United States',
        country_code: dbUser?.country_code || 'US',
        country_flag: dbUser?.country_flag || '🇺🇸',
        joined_at: dbUser?.created_at || authUser.createdAt || new Date().toISOString(),
      };

      // Upsert record into public.users if not present
      if (!dbUser) {
        await insforge.database.from('users').insert([
          {
            id: finalUser.id,
            name: finalUser.name,
            email: finalUser.email,
            role: finalUser.role,
            avatar: finalUser.avatar,
            country: finalUser.country,
            country_code: finalUser.country_code,
            country_flag: finalUser.country_flag,
            created_at: finalUser.joined_at,
          },
        ]);
      }

      return finalUser;
    } catch (e) {
      return {
        id: authUser.id,
        name: authUser.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: authUser.email?.includes('admin') ? 'admin' : 'visitor',
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(authUser.email || 'user')}`,
        country: 'United States',
        country_code: 'US',
        country_flag: '🇺🇸',
        joined_at: new Date().toISOString(),
      };
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Detect OAuth callback if redirected from Google OAuth
        try {
          await (insforge.auth as any).detectAuthCallback?.();
        } catch (e) {}

        // 2. Get current logged in user from InsForge Auth
        const { data: authData, error } = await insforge.auth.getCurrentUser();
        if (authData?.user && !error) {
          const loadedUser = await syncAndLoadUserProfile(authData.user);
          setUser(loadedUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 3. Listen to auth state events (signedIn, signedOut, tokenRefreshed)
    const unsubscribe = insforge.auth.onAuthStateChange(async (event) => {
      if (event === 'signedIn') {
        const { data: authData } = await insforge.auth.getCurrentUser();
        if (authData?.user) {
          const loadedUser = await syncAndLoadUserProfile(authData.user);
          setUser(loadedUser);
        }
      } else if (event === 'signedOut') {
        setUser(null);
        localStorage.removeItem('zonetube_token');
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Email Sign In
  const login = async (email: string, password: string): Promise<User> => {
    const res = await insforge.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (res.error) {
      throw new Error(res.error.message || 'Invalid email or password');
    }

    if (!res.data?.user) {
      throw new Error('Login failed. Please verify your credentials.');
    }

    if (res.data.accessToken) {
      localStorage.setItem('zonetube_token', res.data.accessToken);
    }

    const loadedUser = await syncAndLoadUserProfile(res.data.user);
    setUser(loadedUser);
    return loadedUser;
  };

  // Email Sign Up
  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'admin' | 'visitor' | 'user' = 'visitor',
    country = 'United States',
    country_code = 'US',
    country_flag = '🇺🇸'
  ): Promise<User> => {
    const res = await insforge.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
    });

    if (res.error) {
      throw new Error(res.error.message || 'Registration failed. Please try a different email.');
    }

    if (!res.data?.user) {
      throw new Error('Registration failed.');
    }

    if (res.data.accessToken) {
      localStorage.setItem('zonetube_token', res.data.accessToken);
    }

    const authUser = res.data.user;
    const isProjectAdmin = role === 'admin' || authUser.email === 'admin@zonetube.com';
    const finalRole: 'admin' | 'visitor' | 'user' = isProjectAdmin ? 'admin' : (role === 'visitor' ? 'visitor' : 'user');

    const newUser: User = {
      id: authUser.id,
      name: name.trim(),
      email: authUser.email || email,
      role: finalRole,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(authUser.email || email)}`,
      country: country || 'United States',
      country_code: country_code || 'US',
      country_flag: country_flag || '🇺🇸',
      joined_at: new Date().toISOString(),
    };

    // Save into public.users table
    try {
      await insforge.database.from('users').insert([
        {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          avatar: newUser.avatar,
          country: newUser.country,
          country_code: newUser.country_code,
          country_flag: newUser.country_flag,
          created_at: newUser.joined_at,
        },
      ]);
    } catch (e) {}

    setUser(newUser);
    return newUser;
  };

  // Google OAuth flow (Opens real Google sign in with redirection)
  const signInWithGoogleOAuth = async () => {
    const res = await insforge.auth.signInWithOAuth({
      provider: 'google',
      redirectTo: window.location.origin,
    });

    if (res.error) {
      throw new Error(res.error.message || 'Google OAuth failed to initialize');
    }

    if (res.data?.url) {
      window.location.href = res.data.url;
    }
  };

  // Mock / Quick Google Auth Dialog for environments without popups
  const googleAuth = async (
    email: string,
    name: string,
    avatar: string,
    role: 'admin' | 'visitor' | 'user' = 'visitor',
    country = 'United States',
    country_code = 'US',
    country_flag = '🇺🇸'
  ): Promise<User> => {
    // Try sign up or sign in
    let authUser: any = null;
    const cleanEmail = email.trim().toLowerCase();

    const signRes = await insforge.auth.signInWithPassword({
      email: cleanEmail,
      password: 'GoogleUserPassword123!',
    });

    if (signRes.data?.user) {
      authUser = signRes.data.user;
      if (signRes.data.accessToken) {
        localStorage.setItem('zonetube_token', signRes.data.accessToken);
      }
    } else {
      const upRes = await insforge.auth.signUp({
        email: cleanEmail,
        password: 'GoogleUserPassword123!',
        name,
      });
      authUser = upRes.data?.user;
      if (upRes.data?.accessToken) {
        localStorage.setItem('zonetube_token', upRes.data.accessToken);
      }
    }

    const isProjectAdmin = role === 'admin' || cleanEmail === 'admin@zonetube.com';
    const finalRole: 'admin' | 'visitor' | 'user' = isProjectAdmin ? 'admin' : (role === 'visitor' ? 'visitor' : 'user');

    const finalUser: User = {
      id: authUser?.id || `usr_g_${Date.now()}`,
      name,
      email: cleanEmail,
      role: finalRole,
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`,
      country: country || 'United States',
      country_code: country_code || 'US',
      country_flag: country_flag || '🇺🇸',
      joined_at: new Date().toISOString(),
    };

    try {
      await insforge.database.from('users').insert([
        {
          id: finalUser.id,
          name: finalUser.name,
          email: finalUser.email,
          role: finalUser.role,
          avatar: finalUser.avatar,
          country: finalUser.country,
          country_code: finalUser.country_code,
          country_flag: finalUser.country_flag,
          created_at: finalUser.joined_at,
        },
      ]);
    } catch (e) {}

    setUser(finalUser);
    return finalUser;
  };

  // Sign Out
  const logout = async () => {
    try {
      await insforge.auth.signOut();
    } catch (e) {}
    localStorage.removeItem('zonetube_token');
    setUser(null);
  };

  // Update Profile
  const updateProfile = async (
    name: string,
    avatar: string,
    country?: string,
    country_code?: string,
    country_flag?: string
  ) => {
    if (!user) return;
    const updates: Record<string, any> = { name, avatar };
    if (country !== undefined) updates.country = country;
    if (country_code !== undefined) updates.country_code = country_code;
    if (country_flag !== undefined) updates.country_flag = country_flag;

    try {
      await insforge.database.from('users').update(updates).eq('id', user.id);
    } catch (e) {}

    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const isAdmin = user?.role === 'admin' || user?.email === 'admin@zonetube.com' || user?.email === 'admin@gmail.com';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        googleAuth,
        signInWithGoogleOAuth,
        logout,
        updateProfile,
        isAdmin,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
