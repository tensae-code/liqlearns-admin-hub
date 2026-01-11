import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'student' | 'teacher' | 'support' | 'admin' | 'ceo' | 'parent';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole | null;
  signUp: (email: string, password: string, fullName: string, username: string, role: UserRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; role?: UserRole }>;
  signOut: () => Promise<void>;
  getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data && !error) {
        setUserRole(data.role as UserRole);
        return data.role as UserRole;
      }
      // Default to student if no role found
      setUserRole('student');
      return 'student' as UserRole;
    } catch (err) {
      console.error('Error fetching user role:', err);
      setUserRole('student');
      return 'student' as UserRole;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check for existing session first
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          if (mounted) {
            setUserRole(role);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const role = await fetchUserRole(session.user.id);
          if (mounted) {
            setUserRole(role);
          }
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, username: string, role: UserRole = 'student') => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Map 'parent' to 'student' for database since parent is not in the enum
    const dbRole = role === 'parent' ? 'student' : role;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          username: username,
          role: role,
        }
      }
    });
    
    if (!error && data.user) {
      // Insert role into user_roles table
      // Note: 'parent' role is stored in user metadata, but as 'student' in user_roles since it's not in the enum
      const insertRole = dbRole as 'student' | 'teacher' | 'support' | 'admin' | 'ceo';
      await supabase.from('user_roles').insert([{
        user_id: data.user.id,
        role: insertRole,
      }]);
      setUserRole(role);
    }
    
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      const role = await fetchUserRole(data.user.id);
      return { error: null, role };
    }
    
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  const getDashboardPath = (): string => {
    switch (userRole) {
      case 'ceo':
        return '/ceo';
      case 'admin':
        return '/admin';
      case 'support':
        return '/support';
      case 'teacher':
        return '/teacher';
      case 'parent':
        return '/parent';
      case 'student':
      default:
        return '/dashboard';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, signUp, signIn, signOut, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
