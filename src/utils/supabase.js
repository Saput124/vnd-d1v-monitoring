import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.https://abyakihtzighulyengko.supabase.co;
const supabaseAnonKey = import.meta.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFieWFraWh0emlnaHVseWVuZ2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0Mzk2NjgsImV4cCI6MjA4NDAxNTY2OH0.RcQ7CY08gGQYtKTwELUJN3MOCNXAwrJyMKvNEWqU0Sw
  ;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signIn = async (username, password) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) {
      return { 
        data: null, 
        error: { message: 'Username tidak ditemukan' } 
      };
    }
    
    if (data.password_hash !== password) {
      return { 
        data: null, 
        error: { message: 'Password salah' } 
      };
    }
    
    localStorage.setItem('vnd_user', JSON.stringify(data));
    
    return { data: { user: data }, error: null };
  } catch (err) {
    return { 
      data: null, 
      error: { message: err.message } 
    };
  }
};

export const signOut = async () => {
  localStorage.removeItem('vnd_user');
  return { error: null };
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('vnd_user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};
