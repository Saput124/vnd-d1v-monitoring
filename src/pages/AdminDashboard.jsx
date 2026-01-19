// src/pages/AdminDashboard.jsx - UPDATED WITH DASHBOARD & HISTORY

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Dashboard from '../components/Dashboard';
import MasterData from '../components/MasterData';
import BlockRegistration from '../components/BlockRegistration';
import TransactionForm from '../components/TransactionForm';
import TransactionHistory from '../components/TransactionHistory';
import UserManagement from '../components/UserManagement';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const data = useSupabaseData();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
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
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'history', label: 'Transaksi History' },
              { id: 'transaction', label: 'Input Transaksi' },
              { id: 'registration', label: 'Block Registration' },
              { id: 'master', label: 'Master Data' },
              { id: 'users', label: 'User Management' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-all whitespace-nowrap ${
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

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <Dashboard data={data} loading={data.loading} />}
        {activeTab === 'history' && <TransactionHistory data={data} loading={data.loading} />}
        {activeTab === 'transaction' && <TransactionForm data={data} loading={data.loading} />}
        {activeTab === 'registration' && <BlockRegistration data={data} loading={data.loading} />}
        {activeTab === 'master' && <MasterData data={data} loading={data.loading} />}
        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  );
}