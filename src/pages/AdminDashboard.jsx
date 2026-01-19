import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import MasterData from '../components/MasterData';
import BlockRegistration from '../components/BlockRegistration';
import TransactionForm from '../components/TransactionForm';
import TransactionHistory from '../components/TransactionHistory';
import UserManagement from '../components/UserManagement';
import ActivityManagement from '../components/ActivityManagement';

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
              <p className="text-xs text-green-200">Role: Admin</p>
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

      <div className="bg-white shadow-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'users', label: '👥 User Management' },
              { id: 'activities', label: '🏷️ Activity Types' },
              { id: 'master', label: '💾 Master Data' },
              { id: 'registration', label: '📋 Block Registration' },
              { id: 'transaction', label: '➕ Input Transaksi' },
              { id: 'history', label: '📜 History Transaksi' },
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
              🎉 VND D-One Monitoring System
            </h2>
            <p className="text-gray-600 mb-6">
              Sistem monitoring aktivitas perkebunan dengan manajemen vendor, blok, dan pekerja terintegrasi.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-semibold">Vendors</p>
                <p className="text-3xl font-bold text-gray-800">{data.vendors.length}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-semibold">Blocks</p>
                <p className="text-3xl font-bold text-gray-800">{data.blocks.length}</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-semibold">Workers</p>
                <p className="text-3xl font-bold text-gray-800">{data.workers.length}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-600 font-semibold">Transaksi</p>
                <p className="text-3xl font-bold text-gray-800">{data.transactions.length}</p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold mb-2">✅ Fitur Tersedia:</p>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✓ User Management (Multi-role: Admin, Section Head, Supervisor, Vendor)</li>
                <li>✓ Activity Types Management</li>
                <li>✓ Master Data (Vendors, Blocks, Workers)</li>
                <li>✓ Block Registration untuk Aktivitas</li>
                <li>✓ Input Transaksi Multi-block dengan Worker Management</li>
                <li>✓ History Transaksi dengan Filter & Detail View</li>
                <li>✓ Role-based Access Control (RBAC)</li>
                <li>✓ Section-based Data Isolation</li>
              </ul>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-semibold mb-2">📊 Activity Summary:</p>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>Registered Activities: {data.blockActivities.length}</li>
                  <li>Active Transactions: {data.transactions.length}</li>
                  <li>Total Activity Types: {data.activityTypes.length}</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-purple-800 font-semibold mb-2">🔐 Access Control:</p>
                <ul className="space-y-1 text-sm text-purple-700">
                  <li>Admin: Full Access</li>
                  <li>Section Head/Supervisor: Section-only</li>
                  <li>Vendor: Own data only</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'activities' && <ActivityManagement data={data} loading={data.loading} />}
        {activeTab === 'master' && <MasterData data={data} loading={data.loading} />}
        {activeTab === 'registration' && <BlockRegistration data={data} loading={data.loading} />}
        {activeTab === 'transaction' && <TransactionForm data={data} loading={data.loading} />}
        {activeTab === 'history' && <TransactionHistory data={data} loading={data.loading} />}
      </div>
    </div>
  );
}