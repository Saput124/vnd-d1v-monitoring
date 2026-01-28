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
import VendorAssignmentManagement from '../components/VendorAssignmentManagement';
import UserManagement from '../components/UserManagement';
import MaterialManagement from '../components/MaterialManagement';
import ActivityStageManagement from '../components/ActivityStageManagement';
import ActivityMaterialConfiguration from '../components/ActivityMaterialConfiguration';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const data = useSupabaseData();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState({
    transaction: 'input',
    registration: 'blocks',
    assignment: 'section_activities',
    master: 'general',
    management: 'users'
  });

  /* ================= TAB CONFIG ================= */
  const tabGroups = {
    single: [
      { id: 'dashboard', label: '📊 Dashboard' }
    ],
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
    { id: 'general', label: '📋 General Data' },
    { id: 'materials', label: '📦 Materials' },
    { id: 'stages', label: '🎯 Activity Stages' },
    { id: 'material_config', label: '⚙️ Material Config' }
  ]
},
    management: {
      label: '⚙️ Management',
      tabs: [
        { id: 'users', label: '👥 Users' }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">

      {/* ================= HEADER ================= */}
      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
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
      </header>

      {/* ================= NAVIGATION ================= */}
      <div className="bg-white shadow-md border-b">
        <div className="container mx-auto px-4">

          {/* Main Tabs */}
          <div className="flex space-x-1 overflow-x-auto border-b">
            {tabGroups.single.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {Object.entries(tabGroups)
              .filter(([key]) => key !== 'single')
              .map(([key, group]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-3 font-medium ${
                    activeTab === key
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {group.label}
                </button>
              ))}
          </div>

          {/* Sub Tabs */}
          {activeTab !== 'dashboard' && tabGroups[activeTab]?.tabs && (
            <div className="flex space-x-1 py-2 bg-gray-50 border-b">
              {tabGroups[activeTab].tabs.map(sub => (
                <button
                  key={sub.id}
                  onClick={() =>
                    setActiveSubTab(prev => ({
                      ...prev,
                      [activeTab]: sub.id
                    }))
                  }
                  className={`px-4 py-2 text-sm ${
                    activeSubTab[activeTab] === sub.id
                      ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard data={data} loading={data.loading} />
        )}

        {activeTab === 'transaction' && (
          <>
            {activeSubTab.transaction === 'input' && (
              <TransactionForm data={data} loading={data.loading} />
            )}
            {activeSubTab.transaction === 'history' && (
              <TransactionHistory data={data} loading={data.loading} />
            )}
          </>
        )}

        {activeTab === 'registration' && (
          <>
            {activeSubTab.registration === 'blocks' && (
              <BlockRegistration data={data} loading={data.loading} />
            )}
            {activeSubTab.registration === 'activities' && (
              <ActivityManagement data={data} loading={data.loading} />
            )}
          </>
        )}

        {activeTab === 'assignment' && (
          <>
            {activeSubTab.assignment === 'section_activities' && (
              <SectionActivityManagement />
            )}
            {activeSubTab.assignment === 'vendor_assignments' && (
              <VendorAssignmentManagement />
            )}
          </>
        )}

        {activeTab === 'master' && (
  <>
    {activeSubTab.master === 'general' && (
      <MasterData data={data} loading={data.loading} />
    )}
    {activeSubTab.master === 'materials' && (
      <MaterialManagement />
    )}
    {activeSubTab.master === 'stages' && (
      <ActivityStageManagement />
    )}
    {activeSubTab.master === 'material_config' && (
      <ActivityMaterialConfiguration />
    )}
  </>
)}

        {activeTab === 'management' && (
          <UserManagement />
        )}
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t mt-12 py-6">
  <div className="container mx-auto px-4 text-center text-sm text-gray-600">
    <p><strong>ℹ️ Setup Guide:</strong></p>
    <ol className="mt-2 space-y-1 text-xs">
      <li>1️⃣ Tambahkan <strong>Activity Types</strong> di Activity Management</li>
      <li>2️⃣ Tambahkan <strong>Activity Stages</strong> di Master Data → Activity Stages</li>
      <li>3️⃣ Tambahkan <strong>Materials</strong> di Master Data → Materials</li>
      <li>4️⃣ Konfigurasi <strong>Material Requirements</strong> di Master Data → Material Config</li>
      <li>5️⃣ Assign activity ke section di <strong>Section Activities</strong></li>
      <li>6️⃣ Registrasi blocks & mulai input transaksi</li>
    </ol>
  </div>
</footer>
        </div>
      </footer>

    </div>
  );
}