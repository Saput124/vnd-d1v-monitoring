// src/components/Dashboard.jsx - COMPLETE DASHBOARD

import { useState, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard({ data, loading }) {
  const [filters, setFilters] = useState({
    section_id: '',
    vendor_id: '',
    activity_type_id: '',
    kategori: '',
    zone: '',
    periode_start: '',
    periode_end: '',
    kondisi: ''
  });

  // ============================================================================
  // 📊 REAL-TIME PROGRESS CALCULATION dari Transactions
  // ============================================================================
  const progressData = useMemo(() => {
    const grouped = {};

    // Group by block_activity_id dan hitung total luas dikerjakan
    data.transactions.forEach(trans => {
      // Get transaction_blocks for this transaction
      const transBlocks = data.supabase
        ? [] // Will be loaded separately
        : [];

      // For now, use transaction.total_luasan if available
      // Atau kita perlu fetch transaction_blocks
    });

    // Aggregate block_activities dengan progress real-time
    const result = data.blockActivities.map(ba => {
      const block = data.blocks.find(b => b.id === ba.block_id);
      const activity = data.activityTypes.find(a => a.id === ba.activity_type_id);

      return {
        ...ba,
        block_code: block?.code,
        block_name: block?.name,
        block_zone: block?.zone,
        activity_name: activity?.name,
        activity_code: activity?.code
      };
    });

    return result;
  }, [data.blockActivities, data.blocks, data.activityTypes, data.transactions]);

  // ============================================================================
  // 🎯 FILTERED DATA berdasarkan filter
  // ============================================================================
  const filteredProgress = useMemo(() => {
    let filtered = [...progressData];

    if (filters.section_id) {
      filtered = filtered.filter(p => p.section_id === filters.section_id);
    }

    if (filters.activity_type_id) {
      filtered = filtered.filter(p => p.activity_type_id === filters.activity_type_id);
    }

    if (filters.kategori) {
      filtered = filtered.filter(p => p.kategori === filters.kategori);
    }

    if (filters.zone) {
      filtered = filtered.filter(p => p.block_zone === filters.zone);
    }

    if (filters.periode_start && filters.periode_end) {
      filtered = filtered.filter(p => {
        const targetMonth = p.target_bulan; // Format: YYYY-MM
        return targetMonth >= filters.periode_start && targetMonth <= filters.periode_end;
      });
    }

    return filtered;
  }, [progressData, filters]);

  // ============================================================================
  // 📈 VENDOR RANKING berdasarkan transaksi
  // ============================================================================
  const vendorRanking = useMemo(() => {
    const vendorStats = {};

    // Filter transactions berdasarkan periode
    let filteredTrans = data.transactions;

    if (filters.periode_start && filters.periode_end) {
      filteredTrans = filteredTrans.filter(t => {
        const transDate = t.tanggal.substring(0, 7); // YYYY-MM
        return transDate >= filters.periode_start && transDate <= filters.periode_end;
      });
    }

    if (filters.vendor_id) {
      filteredTrans = filteredTrans.filter(t => t.vendor_id === filters.vendor_id);
    }

    if (filters.activity_type_id) {
      filteredTrans = filteredTrans.filter(t => t.activity_type_id === filters.activity_type_id);
    }

    // Aggregate by vendor
    filteredTrans.forEach(trans => {
      const vendor = data.vendors.find(v => v.id === trans.vendor_id);
      const vendorName = vendor?.name || 'Unknown';

      if (!vendorStats[vendorName]) {
        vendorStats[vendorName] = {
          name: vendorName,
          total_transactions: 0,
          total_luasan: 0,
          total_pekerja: 0,
          avg_workload: 0
        };
      }

      vendorStats[vendorName].total_transactions += 1;
      vendorStats[vendorName].total_luasan += parseFloat(trans.total_luasan || 0);
      vendorStats[vendorName].total_pekerja += parseInt(trans.jumlah_pekerja || 0);
    });

    // Calculate average workload
    Object.keys(vendorStats).forEach(key => {
      const v = vendorStats[key];
      v.avg_workload = v.total_pekerja > 0 
        ? (v.total_luasan / v.total_pekerja).toFixed(3)
        : 0;
    });

    // Sort by total_luasan descending
    return Object.values(vendorStats)
      .sort((a, b) => b.total_luasan - a.total_luasan)
      .slice(0, 10); // Top 10
  }, [data.transactions, data.vendors, filters]);

  // ============================================================================
  // 📊 ACTIVITY BREAKDOWN (Pie Chart Data)
  // ============================================================================
  const activityBreakdown = useMemo(() => {
    const breakdown = {};

    filteredProgress.forEach(p => {
      const actName = p.activity_name || 'Unknown';
      if (!breakdown[actName]) {
        breakdown[actName] = {
          name: actName,
          value: 0,
          target: 0,
          completed: 0
        };
      }
      breakdown[actName].target += parseFloat(p.target_luasan || 0);
      breakdown[actName].completed += parseFloat(p.luas_dikerjakan || 0);
      breakdown[actName].value = parseFloat(p.luas_dikerjakan || 0);
    });

    return Object.values(breakdown);
  }, [filteredProgress]);

  // ============================================================================
  // 📈 PROGRESS TIMELINE (Line Chart Data)
  // ============================================================================
  const progressTimeline = useMemo(() => {
    const timeline = {};

    data.transactions
      .filter(t => {
        if (filters.vendor_id && t.vendor_id !== filters.vendor_id) return false;
        if (filters.activity_type_id && t.activity_type_id !== filters.activity_type_id) return false;
        return true;
      })
      .forEach(trans => {
        const month = trans.tanggal.substring(0, 7); // YYYY-MM
        if (!timeline[month]) {
          timeline[month] = {
            month,
            luasan: 0,
            transactions: 0
          };
        }
        timeline[month].luasan += parseFloat(trans.total_luasan || 0);
        timeline[month].transactions += 1;
      });

    return Object.values(timeline).sort((a, b) => a.month.localeCompare(b.month));
  }, [data.transactions, filters]);

  // ============================================================================
  // 🎨 PIE CHART COLORS
  // ============================================================================
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  // ============================================================================
  // 📋 SUMMARY STATS
  // ============================================================================
  const summaryStats = useMemo(() => {
    const totalTarget = filteredProgress.reduce((sum, p) => sum + parseFloat(p.target_luasan || 0), 0);
    const totalCompleted = filteredProgress.reduce((sum, p) => sum + parseFloat(p.luas_dikerjakan || 0), 0);
    const totalTransactions = data.transactions.filter(t => {
      if (filters.vendor_id && t.vendor_id !== filters.vendor_id) return false;
      if (filters.activity_type_id && t.activity_type_id !== filters.activity_type_id) return false;
      if (filters.periode_start && filters.periode_end) {
        const transMonth = t.tanggal.substring(0, 7);
        if (transMonth < filters.periode_start || transMonth > filters.periode_end) return false;
      }
      return true;
    }).length;

    const avgProgress = totalTarget > 0 ? ((totalCompleted / totalTarget) * 100).toFixed(1) : 0;

    return {
      totalTarget: totalTarget.toFixed(2),
      totalCompleted: totalCompleted.toFixed(2),
      totalTransactions,
      avgProgress,
      totalBlocks: filteredProgress.length
    };
  }, [filteredProgress, data.transactions, filters]);

  // ============================================================================
  // 🎨 UNIQUE VALUES for Filters
  // ============================================================================
  const uniqueZones = [...new Set(data.blocks.map(b => b.zone).filter(Boolean))];
  const uniqueKategori = [...new Set(data.blocks.map(b => b.kategori).filter(Boolean))];
  const uniqueSections = [...new Set(data.blocks.map(b => b.section_id).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ====================================================================== */}
      {/* FILTERS SECTION */}
      {/* ====================================================================== */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🔍 Filter Data</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Section Filter (Admin only) */}
          {data.currentUser?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium mb-2">Section</label>
              <select
                value={filters.section_id}
                onChange={(e) => setFilters({...filters, section_id: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Semua Section</option>
                {uniqueSections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Vendor Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Vendor</label>
            <select
              value={filters.vendor_id}
              onChange={(e) => setFilters({...filters, vendor_id: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Semua Vendor</option>
              {data.vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Activity Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Aktivitas</label>
            <select
              value={filters.activity_type_id}
              onChange={(e) => setFilters({...filters, activity_type_id: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Semua Aktivitas</option>
              {data.activityTypes.map(at => (
                <option key={at.id} value={at.id}>{at.name}</option>
              ))}
            </select>
          </div>

          {/* Zone Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Zone</label>
            <select
              value={filters.zone}
              onChange={(e) => setFilters({...filters, zone: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Semua Zone</option>
              {uniqueZones.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          {/* Kategori Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Kategori</label>
            <select
              value={filters.kategori}
              onChange={(e) => setFilters({...filters, kategori: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Semua Kategori</option>
              {uniqueKategori.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Periode Start */}
          <div>
            <label className="block text-sm font-medium mb-2">Periode Mulai</label>
            <input
              type="month"
              value={filters.periode_start}
              onChange={(e) => setFilters({...filters, periode_start: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Periode End */}
          <div>
            <label className="block text-sm font-medium mb-2">Periode Akhir</label>
            <input
              type="month"
              value={filters.periode_end}
              onChange={(e) => setFilters({...filters, periode_end: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                section_id: '',
                vendor_id: '',
                activity_type_id: '',
                kategori: '',
                zone: '',
                periode_start: '',
                periode_end: '',
                kondisi: ''
              })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
            >
              🔄 Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* SUMMARY CARDS */}
      {/* ====================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <p className="text-sm opacity-90 mb-1">Total Blok Registered</p>
          <p className="text-4xl font-bold">{summaryStats.totalBlocks}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <p className="text-sm opacity-90 mb-1">Target Luasan</p>
          <p className="text-4xl font-bold">{summaryStats.totalTarget}</p>
          <p className="text-xs opacity-75">Ha</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <p className="text-sm opacity-90 mb-1">Sudah Dikerjakan</p>
          <p className="text-4xl font-bold">{summaryStats.totalCompleted}</p>
          <p className="text-xs opacity-75">Ha</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-lg shadow-lg p-6">
          <p className="text-sm opacity-90 mb-1">Progress Rata-rata</p>
          <p className="text-4xl font-bold">{summaryStats.avgProgress}%</p>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-red-500 text-white rounded-lg shadow-lg p-6">
          <p className="text-sm opacity-90 mb-1">Total Transaksi</p>
          <p className="text-4xl font-bold">{summaryStats.totalTransactions}</p>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* CHARTS ROW 1: Vendor Ranking + Activity Breakdown */}
      {/* ====================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Ranking */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Top Vendor by Luasan</h3>
          {vendorRanking.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Belum ada data transaksi
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorRanking}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_luasan" fill="#8884d8" name="Total Luasan (Ha)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Breakdown per Aktivitas</h3>
          {activityBreakdown.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Belum ada block activity registered
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activityBreakdown}
                  dataKey="completed"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.completed.toFixed(1)} Ha`}
                >
                  {activityBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ====================================================================== */}
      {/* CHARTS ROW 2: Progress Timeline */}
      {/* ====================================================================== */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Progress Timeline (Bulanan)</h3>
        {progressTimeline.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Belum ada data transaksi
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressTimeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="luasan" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Luasan (Ha)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="transactions" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Jumlah Transaksi"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ====================================================================== */}
      {/* DETAILED TABLE: Block Activities Progress */}
      {/* ====================================================================== */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📋 Detail Progress per Blok ({filteredProgress.length} blok)
        </h3>

        {filteredProgress.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Tidak ada data sesuai filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-3 text-left">No</th>
                  <th className="px-3 py-3 text-left">Blok</th>
                  <th className="px-3 py-3 text-left">Zone</th>
                  <th className="px-3 py-3 text-left">Kategori</th>
                  <th className="px-3 py-3 text-left">Varietas</th>
                  <th className="px-3 py-3 text-left">Aktivitas</th>
                  <th className="px-3 py-3 text-left">Target Bulan</th>
                  <th className="px-3 py-3 text-right">Target</th>
                  <th className="px-3 py-3 text-right">Dikerjakan</th>
                  <th className="px-3 py-3 text-right">Progress</th>
                  <th className="px-3 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProgress.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-3">{i + 1}</td>
                    <td className="px-3 py-3 font-semibold">{p.block_name}</td>
                    <td className="px-3 py-3">{p.block_zone}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        p.kategori === 'PC' ? 'bg-green-100 text-green-800' :
                        p.kategori === 'RC' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {p.kategori}
                      </span>
                    </td>
                    <td className="px-3 py-3">{p.varietas}</td>
                    <td className="px-3 py-3">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                        {p.activity_name}
                      </span>
                    </td>
                    <td className="px-3 py-3">{p.target_bulan}</td>
                    <td className="px-3 py-3 text-right font-semibold">{p.target_luasan} Ha</td>
                    <td className="px-3 py-3 text-right font-semibold text-blue-600">
                      {p.luas_dikerjakan} Ha
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              p.persen_selesai >= 100 ? 'bg-green-600' :
                              p.persen_selesai >= 50 ? 'bg-yellow-600' :
                              'bg-blue-600'
                            }`}
                            style={{width: `${Math.min(p.persen_selesai, 100)}%`}}
                          />
                        </div>
                        <span className="font-semibold">{p.persen_selesai}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        p.status === 'completed' ? 'bg-green-100 text-green-800' :
                        p.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}