// src/pages/AdminDashboard.jsx - FIXED VERSION

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Dashboard from '../components/Dashboard';
import MasterData from '../components/MasterData';
import BlockRegistration from '../components/BlockRegistration';
import TransactionForm from '../components/TransactionForm';
import TransactionHistory from '../components/TransactionHistory';
import SectionActivityManagement from '../components/SectionActivityManagement';
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
              <h1 className="text-3xl font-bold">🌱 VND D-One - Divisi D1V</h1>
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

      {/* Navigation Tabs - UPDATED */}
      <div className="bg-white shadow-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: '📊 Dashboard', color: 'blue' },
              { id: 'history', label: '📜 Transaksi History', color: 'purple' },
              { id: 'transaction', label: '➕ Input Transaksi', color: 'green' },
              { id: 'registration', label: '📋 Block Registration', color: 'yellow' },
              { id: 'section_activities', label: '🔗 Section Activities', color: 'indigo' },
              { id: 'master', label: '🗂️ Master Data', color: 'cyan' },
              { id: 'users', label: '👥 User Management', color: 'red' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? `text-${tab.color}-600 border-b-2 border-${tab.color}-600 bg-${tab.color}-50`
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
        {activeTab === 'section_activities' && <SectionActivityManagement />}
        {activeTab === 'master' && <MasterData data={data} loading={data.loading} />}
        {activeTab === 'users' && <UserManagement />}
      </div>

      {/* Footer Info */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            <strong>ℹ️ Important:</strong> Pastikan Anda sudah:
          </p>
          <ol className="mt-2 space-y-1 text-xs">
            <li>2️⃣ Assign activities ke sections di <strong>"Section Activities"</strong></li>
            <li>3️⃣ Baru bisa registrasi blok & input transaksi</li>
          </ol>
        </div>
      </footer>
    </div>
  );
}
