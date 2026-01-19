// src/contexts/AuthContext.jsx - WITH ACTIVITY TRACKING

import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, signOut, updateActivity } from '../utils/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // ✅ Track user activity to prevent timeout
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (getCurrentUser()) {
        updateActivity();
      }
    };

    // Add activity listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Periodic check (every minute)
    const intervalId = setInterval(() => {
      const user = getCurrentUser();
      if (!user && currentUser) {
        // Session expired, reload to login
        window.location.reload();
      }
    }, 60000); // Check every minute

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, []);

  const login = (userData) => {
    setUser(userData);
    updateActivity();
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
    // Section & Vendor info
    userSection: user?.section_id || null,
    userSectionName: user?.section_name || null,
    userVendor: user?.vendor_id || null,
    userVendorName: user?.vendor_name || null,
    // Access level helpers
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