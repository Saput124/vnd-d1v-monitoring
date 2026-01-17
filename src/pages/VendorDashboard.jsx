import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import TransactionForm from '../components/TransactionForm';

export default function VendorDashboard() {
  const { user, logout } = useAuth();
  const data = useSupabaseData();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">👷 VND D-One - Vendor Portal</h1>
              <p className="text-green-100 mt-1">Input Transaksi & Monitor Progress</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-100">Selamat Datang,</p>
              <p className="font-semibold">{user?.full_name}</p>
              <p className="text-xs text-green-200">Vendor</p>
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

      {/* Navigation Tabs - LIMITED for Vendor */}
      <div className="bg-white shadow-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'transaction', label: '➕ Input Transaksi' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              👋 Selamat Datang, {user?.full_name}!
            </h2>
            <p className="text-gray-600 mb-6">
              Portal vendor untuk input transaksi dan monitoring progress kerja Anda.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-semibold">Workers Anda</p>
                <p className="text-3xl font-bold text-gray-800">{data.workers.length}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-semibold">Transaksi Anda</p>
                <p className="text-3xl font-bold text-gray-800">{data.transactions.length}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-semibold">Total Luasan</p>
                <p className="text-3xl font-bold text-gray-800">
                  {data.transactions.reduce((sum, t) => sum + (parseFloat(t.total_luasan) || 0), 0).toFixed(2)} Ha
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold mb-2">🔐 Access Level - Vendor:</p>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✓ Input transaksi untuk aktivitas yang tersedia</li>
                <li>✓ Monitor progress kerja Anda sendiri</li>
                <li>✓ Lihat data workers dari vendor Anda</li>
                <li>⚠️ Tidak bisa akses Master Data & Block Registration</li>
                <li>⚠️ Hanya bisa lihat data vendor sendiri</li>
              </ul>
            </div>

            {/* Recent Transactions */}
            {data.transactions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Transaksi Terbaru</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Tanggal</th>
                        <th className="px-4 py-3 text-left">Aktivitas</th>
                        <th className="px-4 py-3 text-right">Luasan</th>
                        <th className="px-4 py-3 text-right">Pekerja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transactions.slice(0, 10).map((t) => (
                        <tr key={t.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3">{new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                          <td className="px-4 py-3">{t.activity_types?.name}</td>
                          <td className="px-4 py-3 text-right font-semibold">{t.total_luasan || '0'} Ha</td>
                          <td className="px-4 py-3 text-right">{t.jumlah_pekerja} orang</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'transaction' && (
          <TransactionForm data={data} loading={data.loading} />
        )}
      </div>
    </div>
  );
}