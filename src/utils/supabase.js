import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * LOGIN DENGAN:
 * username + password
 * (di belakang layar tetap pakai Supabase Auth)
 */
export const signInWithAuth = async (username, password) => {
  // 1. Ambil user dari tabel users
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('active', true)
    .single();

  if (userError || !user) {
    return {
      error: { message: 'Username tidak ditemukan atau tidak aktif' },
    };
  }

  if (!user.email) {
    return {
      error: { message: 'User belum memiliki email (wajib untuk login)' },
    };
  }

  // 2. Login ke Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

  if (authError) {
    return { error: { message: 'Password salah' } };
  }

  // 3. Pastikan auth_user_id tersimpan
  if (!user.auth_user_id) {
    await supabase
      .from('users')
      .update({ auth_user_id: authData.user.id })
      .eq('id', user.id);
  }

  // 4. Ambil ulang user (final)
  const { data: finalUser, error: finalError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authData.user.id)
    .single();

  if (finalError) {
    return { error: { message: 'Gagal mengambil profile user' } };
  }

  return {
    data: { user: finalUser },
    error: null,
  };
};