import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import MasterData from '../components/MasterData';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const data = useSupabaseData();
  const [activeTab, setActiveTab] = useState('dashboard');

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

      {/* Navigation Tabs */}
      <div className="bg-white shadow-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
              { id: 'master', label: '💾 Master Data', icon: '💾' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
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
                <ul className="space-y-1 text-sm text-green-700">
                <li>✓ Vendors: {data.vendors.length}</li>
                <li>✓ Blocks: {data.blocks.length}</li>
                <li>✓ Workers: {data.workers.length}</li>
                <li>✓ Activity Types: {data.activityTypes.length}</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'master' && (
          <MasterData data={data} loading={data.loading} />
        )}
      </div>
    </div>
  );
}

              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-semibold">Role</p>
                <p className="text-lg font-bold text-gray-800 uppercase">{user?.role}</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold mb-2">✅ Database Stats:</p>