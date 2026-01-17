import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signIn = async (username, password) => {
  try {
    // 1. Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('active', true)
      .single();
    
    if (userError || !userData) {
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
    let section_id = null;
    let vendor_name = null;
    let section_name = null;
    
    // 4. Get vendor_id if user is vendor
    if (userData.role === 'vendor') {
      const { data: vendorData, error: vendorError } = await supabase
        .from('user_vendors')
        .select(`
          vendor_id,
          vendors!inner(
            id,
            name,
            code,
            section_id,
            sections(id, code, name)
          )
        `)
        .eq('user_id', userData.id)
        .single();
      
      if (!vendorError && vendorData) {
        vendor_id = vendorData.vendor_id;
        vendor_name = vendorData.vendors.name;
        section_id = vendorData.vendors.section_id;
        section_name = vendorData.vendors.sections?.name;
      }
    }
    
    // 5. Get section_id if user is section_head or supervisor
    if (userData.role === 'section_head' || userData.role === 'supervisor') {
      const { data: sectionData, error: sectionError } = await supabase
        .from('user_sections')
        .select(`
          section_id,
          sections!inner(id, code, name)
        `)
        .eq('user_id', userData.id)
        .single();
      
      if (!sectionError && sectionData) {
        section_id = sectionData.section_id;
        section_name = sectionData.sections.name;
      }
    }
    
    // 6. Combine all data
    const fullUserData = {
      ...userData,
      vendor_id,
      vendor_name,
      section_id,
      section_name
    };
    
    console.log('✅ Login Success:', {
      username: fullUserData.username,
      role: fullUserData.role,
      vendor_id: fullUserData.vendor_id,
      section_id: fullUserData.section_id,
      section_name: fullUserData.section_name
    });
    
    localStorage.setItem('vnd_user', JSON.stringify(fullUserData));
    
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
