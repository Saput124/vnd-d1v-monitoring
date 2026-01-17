import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import MasterData from '../components/MasterData';
import BlockRegistration from '../components/BlockRegistration';
import TransactionForm from '../components/TransactionForm';

export default function SectionDashboard() {
  const { user, logout, isSectionHead, isSupervisor } = useAuth();
  const data = useSupabaseData();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Determine role label
  const roleLabel = isSectionHead ? 'Kepala Seksi' : 'Supervisor';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">📊 VND D-One - Section Dashboard</h1>
              <p className="text-purple-100 mt-1">Monitoring Aktivitas Section {user?.section_id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-100">Selamat Datang,</p>
              <p className="font-semibold">{user?.full_name}</p>
              <p className="text-xs text-purple-200">{roleLabel}</p>
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
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'master', label: '💾 Master Data' },
              { id: 'registration', label: '📋 Block Registration' },
              { id: 'transaction', label: '➕ Input Transaksi' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
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
              📍 Dashboard Section {user?.section_id}
            </h2>
            <p className="text-gray-600 mb-6">
              Anda memiliki akses penuh untuk mengelola data di section Anda.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-semibold">Vendors (Section)</p>
                <p className="text-3xl font-bold text-gray-800">{data.vendors.length}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-semibold">Blocks (Section)</p>
                <p className="text-3xl font-bold text-gray-800">{data.blocks.length}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-semibold">Workers (Section)</p>
                <p className="text-3xl font-bold text-gray-800">{data.workers.length}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-600 font-semibold">Activities (Section)</p>
                <p className="text-3xl font-bold text-gray-800">{data.blockActivities.length}</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-800 font-semibold mb-2">🔐 Access Level:</p>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>✓ Role: {roleLabel}</li>
                <li>✓ Section: {user?.section_id}</li>
                <li>✓ Full CRUD access untuk section Anda</li>
                <li>✓ Dashboard, Master Data, Block Registration, Transaksi</li>
                <li>⚠️ Data section lain tidak dapat diakses</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'master' && (
          <MasterData data={data} loading={data.loading} />
        )}

        {activeTab === 'registration' && (
          <BlockRegistration data={data} loading={data.loading} />
        )}
        
        {activeTab === 'transaction' && (
          <TransactionForm data={data} loading={data.loading} />
        )}
      </div>
    </div>
  );
}