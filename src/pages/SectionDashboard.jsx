// src/pages/SectionDashboard.jsx - UPDATED

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Dashboard from '../components/Dashboard';
import MasterData from '../components/MasterData';
import BlockRegistration from '../components/BlockRegistration';
import TransactionForm from '../components/TransactionForm';
import TransactionHistory from '../components/TransactionHistory';

export default function SectionDashboard() {
  const { user, logout, isSectionHead, isSupervisor } = useAuth();
  const data = useSupabaseData();
  const [activeTab, setActiveTab] = useState('dashboard');

  const roleLabel = isSectionHead ? 'Kepala Seksi' : 'Supervisor';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">📊 VND D-One - Section Dashboard</h1>
              <p className="text-purple-100 mt-1">Monitoring Section {user?.section_name}</p>
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
              { id: 'history', label: '📋 Transaksi History' },
              { id: 'transaction', label: '➕ Input Transaksi' },
              { id: 'registration', label: '📝 Block Registration' },
              { id: 'master', label: '💾 Master Data' },
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
        {activeTab === 'dashboard' && <Dashboard data={data} loading={data.loading} />}
        {activeTab === 'history' && <TransactionHistory data={data} loading={data.loading} />}
        {activeTab === 'transaction' && <TransactionForm data={data} loading={data.loading} />}
        {activeTab === 'registration' && <BlockRegistration data={data} loading={data.loading} />}
        {activeTab === 'master' && <MasterData data={data} loading={data.loading} />}
      </div>
    </div>
  );
}