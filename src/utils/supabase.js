// src/utils/supabase.js - FIXED: sessionStorage + Activity Tracking

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ SOLUTION: sessionStorage (per-tab) + Activity tracking untuk prevent auto-logout
const STORAGE_KEY = 'vnd_user_session';
const LAST_ACTIVITY_KEY = 'vnd_last_activity';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Update last activity timestamp
export const updateActivity = () => {
  sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
};

// Check if session is still valid
const isSessionValid = () => {
  const lastActivity = sessionStorage.getItem(LAST_ACTIVITY_KEY);
  if (!lastActivity) return false;
  
  const elapsed = Date.now() - parseInt(lastActivity);
  return elapsed < SESSION_TIMEOUT;
};

export const signIn = async (username, password) => {
  try {
    // 1. Get user data with section info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        sections(id, code, name)
      `)
      .eq('username', username)
      .eq('active', true)
      .single();
    
    if (userError || !userData) {
      console.error('User not found:', userError);
      return { 
        data: null, 
        error: { message: 'Username tidak ditemukan atau tidak aktif' } 
      };
    }
    
    // 2. Check password
    if (userData.password_hash !== password) {
      return { 
        data: null, 
        error: { message: 'Password salah' } 
      };
    }
    
    // 3. Initialize additional data
    let vendor_id = null;
    let vendor_name = null;
    let vendor_sections = [];
    let section_id = userData.section_id || null;
    let section_name = userData.sections?.name || null;
    
    // 4. Get vendor info if user is vendor
    if (userData.role === 'vendor') {
      const { data: vendorData, error: vendorError } = await supabase
        .from('user_vendors')
        .select(`
          vendor_id,
          vendors!inner(
            id,
            name,
            code,
            vendor_sections(
              section_id,
              sections(id, code, name)
            )
          )
        `)
        .eq('user_id', userData.id)
        .single();
      
      if (!vendorError && vendorData) {
        vendor_id = vendorData.vendor_id;
        vendor_name = vendorData.vendors.name;
        vendor_sections = vendorData.vendors.vendor_sections?.map(vs => ({
          id: vs.sections.id,
          code: vs.sections.code,
          name: vs.sections.name
        })) || [];
      }
    }
    
    // 5. Combine all data
    const fullUserData = {
      id: userData.id,
      username: userData.username,
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      section_id,
      section_name,
      vendor_id,
      vendor_name,
      vendor_sections,
      active: userData.active,
      created_at: userData.created_at
    };
    
    console.log('✅ Login Success:', fullUserData);
    
    // ✅ Save to sessionStorage (per-tab independent)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fullUserData));
    updateActivity(); // Set initial activity timestamp
    
    return { data: { user: fullUserData }, error: null };
  } catch (err) {
    console.error('❌ Login error:', err);
    return { 
      data: null, 
      error: { message: err.message } 
    };
  }
};

export const signOut = async () => {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(LAST_ACTIVITY_KEY);
  return { error: null };
};

export const getCurrentUser = () => {
  const userStr = sessionStorage.getItem(STORAGE_KEY);
  if (!userStr) return null;
  
  // Check session validity
  if (!isSessionValid()) {
    console.log('⏰ Session timeout - logging out');
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    return null;
  }
  
  try {
    return JSON.parse(userStr);
  } catch (err) {
    console.error('Error parsing user data:', err);
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};