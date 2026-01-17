import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [], requiredSection = false }) {
  const { user, loading, userSection } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has allowed role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Anda tidak memiliki akses ke halaman ini.
          </p>
          <p className="text-sm text-gray-500">
            Role Anda: <span className="font-semibold">{user?.role}</span>
          </p>
        </div>
      </div>
    );
  }

  // Check if section is required but user doesn't have one
  if (requiredSection && !userSection && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Section Not Assigned</h2>
          <p className="text-gray-600">
            Akun Anda belum di-assign ke section. Hubungi admin.
          </p>
        </div>
      </div>
    );
  }

  return children;
}