import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SectionDashboard from './pages/SectionDashboard'; 
import VendorDashboard from './pages/VendorDashboard';

function AppContent() {
  const { user, loading, isAdmin, isSectionHead, isSupervisor, isVendor } = useAuth();

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

  if (!user) {
    return <Login />;
  }

  // Route based on role
  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isSectionHead || isSupervisor) {
    return <SectionDashboard />;
  }

  if (isVendor) {
    return <VendorDashboard />;
  }

  // Fallback for unknown role
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Role Not Recognized</h2>
        <p className="text-gray-600">Role: {user?.role}</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}