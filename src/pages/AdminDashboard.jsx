// src/pages/AdminDashboard.jsx - FIXED VERSION
// Tambahkan tab "Activity Management" dan "Section Activities"

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import Dashboard from '../components/Dashboard';
import MasterData from '../components/MasterData';
import BlockRegistration from '../components/BlockRegistration';
import TransactionForm from '../components/TransactionForm';
import TransactionHistory from '../components/TransactionHistory';
import ActivityManagement from '../components/ActivityManagement';
import SectionActivityManagement from '../components/SectionActivityManagement';
import UserManagement from '../components/UserManagement';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const data = useSupabaseData();
  const [activeTab, setActiveTab] = useState('dashboard');
const [activeSubTab, setActiveSubTab] = useState({
  master: 'blocks',
  transaction: 'input',
  management: 'users'
});

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

      // Tab groups
const tabGroups = {
  single: [
    { id: 'dashboard', label: '📊 Dashboard', color: 'blue' }
  ]
},
  transaction: {
    label: '💼 Transaksi',
    tabs: [
      { id: 'input', label: '➕ Input Transaksi' },
      { id: 'history', label: '📜 History' }
    ]
  },
  registration: {
    label: '📋 Registrasi',
    tabs: [
      { id: 'blocks', label: '🗺️ Block Registration' },
      { id: 'activities', label: '🎯 Activity Management' }
    ]
  },
  assignment: {
    label: '🔗 Assignment',
    tabs: [
      { id: 'section_activities', label: '📍 Section Activities' },
      { id: 'vendor_assignments', label: '👷 Vendor Assignment' }
    ]
  },
  master: {
    label: '🗂️ Master Data',
    tabs: [
      { id: 'blocks', label: '🗺️ Blocks' },
      { id: 'vendors', label: '👥 Vendors' },
      { id: 'workers', label: '👷 Workers' }
    ]
  },
  management: {
    label: '⚙️ Management',
    tabs: [
      { id: 'users', label: '👥 Users' }
    ]
  }
};

// Render navigation
<div className="bg-white shadow-md border-b">
  <div className="container mx-auto px-4">
    {/* Main tabs */}
    <div className="flex space-x-1 overflow-x-auto border-b">
      {/* Single tabs */}
      {tabGroups.single.map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)}>
          {tab.label}
        </button>
      ))}
      
      {/* Grouped tabs */}
      {Object.entries(tabGroups).filter(([key]) => key !== 'single').map(([groupKey, group]) => (
        <button 
          key={groupKey}
          onClick={() => setActiveTab(groupKey)}
          className={activeTab === groupKey ? 'active' : ''}
        >
          {group.label}
        </button>
      ))}
    </div>
    
    {/* Sub-tabs (if grouped tab active) */}
    {activeTab !== 'dashboard' && tabGroups[activeTab]?.tabs && (
      <div className="flex space-x-1 py-2 border-b bg-gray-50">
        {tabGroups[activeTab].tabs.map(subTab => (
          <button
            key={subTab.id}
            onClick={() => setActiveSubTab({...activeSubTab, [activeTab]: subTab.id})}
            className={`px-4 py-2 text-sm ${
              activeSubTab[activeTab] === subTab.id 
                ? 'bg-white border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            {subTab.label}
          </button>
        ))}
      </div>
    )}
  </div>
</div>

{/* Content area */}
<div className="container mx-auto px-4 py-8">
  {activeTab === 'dashboard' && <Dashboard data={data} loading={data.loading} />}
  
  {activeTab === 'transaction' && (
    <>
      {activeSubTab.transaction === 'input' && <TransactionForm data={data} loading={data.loading} />}
      {activeSubTab.transaction === 'history' && <TransactionHistory data={data} loading={data.loading} />}
    </>
  )}
  
  {activeTab === 'registration' && (
    <>
      {activeSubTab.registration === 'blocks' && <BlockRegistration data={data} loading={data.loading} />}
      {activeSubTab.registration === 'activities' && <ActivityManagement data={data} loading={data.loading} />}
    </>
  )}
  
  {activeTab === 'assignment' && (
    <>
      {activeSubTab.assignment === 'section_activities' && <SectionActivityManagement />}
      {activeSubTab.assignment === 'vendor_assignments' && <VendorAssignmentManagement />}
    </>
  )}
  
  {activeTab === 'master' && (
    <MasterData 
      data={data} 
      loading={data.loading} 
      activeSubTab={activeSubTab.master}
      setActiveSubTab={(tab) => setActiveSubTab({...activeSubTab, master: tab})}
    />
  )}
  
  {activeTab === 'management' && (
    <>
      {activeSubTab.management === 'users' && <UserManagement />}
    </>
  )}
</div>

      {/* Footer Info */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            <strong>ℹ️ Important:</strong> Pastikan Anda sudah:
          </p>
          <ol className="mt-2 space-y-1 text-xs">
            <li>1️⃣ Tambahkan <strong>Activity Types</strong> di "Activity Management"</li>
            <li>2️⃣ Assign activities ke sections di <strong>"Section Activities"</strong></li>
            <li>3️⃣ Baru bisa registrasi blok & input transaksi</li>
          </ol>
        </div>
      </footer>
    </div>
  );
}