import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, signOut } from '../utils/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    // Role checks
    isAdmin: user?.role === 'admin',
    isSectionHead: user?.role === 'section_head',
    isSupervisor: user?.role === 'supervisor',
    isVendor: user?.role === 'vendor',
    // NEW: Section & Vendor info
    userSection: user?.section_id || null,
    userVendor: user?.vendor_id || null,
    // NEW: Access level helper
    canAccessAllSections: user?.role === 'admin',
    canManageData: ['admin', 'section_head', 'supervisor'].includes(user?.role),
    canOnlyViewOwn: user?.role === 'vendor'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};