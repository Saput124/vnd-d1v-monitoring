import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">📊 VND D-One - Divisi D1V</h1>
              <p className="text-green-100 mt-1">Monitoring Aktivitas Perkebunan</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Selamat Datang,</p>
              <p className="font-semibold">{user?.full_name}</p>
              <p className="text-xs text-green-200">Role: {user?.role}</p>
              <button
                onClick={logout}
                className="mt-2 bg-red-500 hover:bg-red-600 px-4 py-1 rounded text-sm"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🎉 Sistem Berhasil Deploy!
          </h2>
          <p className="text-gray-600 mb-6">
            VND D-One Monitoring System berhasil terkoneksi dengan Supabase dan deploy di Vercel.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-semibold">Username</p>
              <p className="text-lg font-bold text-gray-800">{user?.username}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 font-semibold">Full Name</p>
              <p className="text-lg font-bold text-gray-800">{user?.full_name}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-semibold">Role</p>
              <p className="text-lg font-bold text-gray-800 uppercase">{user?.role}</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold mb-2">✅ System Status:</p>
            <ul className="space-y-1 text-sm text-green-700">
              <li>✓ Deployed on Vercel</li>
              <li>✓ Supabase Connection: Active</li>
              <li>✓ Authentication: Working</li>
              <li>✓ Database: 17 Tables Ready</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-semibold mb-2">🚧 Next Development:</p>
            <ul className="space-y-1 text-sm text-yellow-700">
              <li>→ Master Data CRUD (Vendors, Blocks, Workers)</li>
              <li>→ Block Activity Registration</li>
              <li>→ Transaction Input Forms</li>
              <li>→ Dashboard dengan Charts</li>
              <li>→ Export Excel & PDF</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}