// src/components/Dashboard.jsx - FIXED VERSION
// ✅ Fixed Progress Calculation

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
    kondisi: '',
    show_completed: false
  });

  // ✅ FIXED: Real-time progress calculation dari block_activities
  const progressData = useMemo(() => {
    return data.blockActivities.map(ba => {
      const block = data.blocks.find(b => b.id === ba.block_id);
      const activity = data.activityTypes.find(a => a.id === ba.activity_type_id);
      const section = data.sections.find(s => s.id === ba.section_id);

      return {
        ...ba,
        block_code: block?.code,
        block_name: block?.name,
        block_zone: block?.zone,
        block_luas_total: block?.luas_total,
        activity_name: activity?.name,
        activity_code: activity?.code,
        section_name: section?.name
      };
    });
  }, [data.blockActivities, data.blocks, data.activityTypes, data.sections]);

  const filteredProgress = useMemo(() => {
    let filtered = [...progressData];

    if (!filters.show_completed) {
      filtered = filtered.filter(p => 
        p.status !== 'completed' && p.status !== 'cancelled'
      );
    }

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
        const targetMonth = p.target_bulan;
        return targetMonth >= filters.periode_start && targetMonth <= filters.periode_end;
      });
    }

    return filtered;
  }, [progressData, filters]);

  const vendorRanking = useMemo(() => {
    const vendorStats = {};

    let filteredTrans = data.transactions;
    if (filters.periode_start && filters.periode_end) {
      filteredTrans = filteredTrans.filter(t => 
        t.tanggal >= filters.periode_start && t.tanggal <= filters.periode_end
      );
    }

    filteredTrans.forEach(trans => {
      if (!vendorStats[trans.vendor_id]) {
        const vendor = data.vendors.find(v => v.id === trans.vendor_id);
        vendorStats[trans.vendor_id] = {
          vendor_id: trans.vendor_id,
          vendor_name: vendor?.name || 'Unknown',
          total_transaksi: 0,
          total_luasan: 0,
          total_pekerja: 0,
          activities: {}
        };
      }

      vendorStats[trans.vendor_id].total_transaksi += 1;
      vendorStats[trans.vendor_id].total_luasan += trans.total_luasan || 0;
      vendorStats[trans.vendor_id].total_pekerja += trans.total_pekerja || 0;

      const activityName = data.activityTypes.find(a => a.id === trans.activity_type_id)?.name;
      if (!vendorStats[trans.vendor_id].activities[activityName]) {
        vendorStats[trans.vendor_id].activities[activityName] = 0;
      }
      vendorStats[trans.vendor_id].activities[activityName] += 1;
    });

    return Object.values(vendorStats).sort((a, b) => b.total_luasan - a.total_luasan);
  }, [data.transactions, data.vendors, data.activityTypes, filters.periode_start, filters.periode_end]);

  const activityProgress = useMemo(() => {
    const activityStats = {};

    filteredProgress.forEach(p => {
      if (!activityStats[p.activity_type_id]) {
        activityStats[p.activity_type_id] = {
          activity_id: p.activity_type_id,
          activity_name: p.activity_name,
          activity_code: p.activity_code,
          total_blocks: 0,
          completed_blocks: 0,
          total_luas: 0,
          luas_dikerjakan: 0,
          avg_progress: 0
        };
      }

      activityStats[p.activity_type_id].total_blocks += 1;
      if (p.status === 'completed') {
        activityStats[p.activity_type_id].completed_blocks += 1;
      }
      activityStats[p.activity_type_id].total_luas += p.luas_total;
      activityStats[p.activity_type_id].luas_dikerjakan += p.luas_dikerjakan || 0;
    });

    return Object.values(activityStats).map(stat => ({
      ...stat,
      avg_progress: (stat.luas_dikerjakan / stat.total_luas) * 100
    }));
  }, [filteredProgress]);

  const monthlyTrend = useMemo(() => {
    const monthlyData = {};

    let filteredTrans = data.transactions;
    if (filters.periode_start && filters.periode_end) {
      filteredTrans = filteredTrans.filter(t => 
        t.tanggal >= filters.periode_start && t.tanggal <= filters.periode_end
      );
    }

    filteredTrans.forEach(trans => {
      const month = trans.tanggal.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          transactions: 0,
          luasan: 0,
          pekerja: 0
        };
      }
      monthlyData[month].transactions += 1;
      monthlyData[month].luasan += trans.total_luasan || 0;
      monthlyData[month].pekerja += trans.total_pekerja || 0;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [data.transactions, filters.periode_start, filters.periode_end]);

  const summaryStats = useMemo(() => {
    const stats = {
      total_blocks: filteredProgress.length,
      completed_blocks: filteredProgress.filter(p => p.status === 'completed').length,
      in_progress_blocks: filteredProgress.filter(p => p.status === 'in_progress').length,
      not_started_blocks: filteredProgress.filter(p => p.status === 'not_started').length,
      total_luas: filteredProgress.reduce((sum, p) => sum + p.luas_total, 0),
      luas_dikerjakan: filteredProgress.reduce((sum, p) => sum + (p.luas_dikerjakan || 0), 0),
      avg_progress: 0
    };

    stats.avg_progress = stats.total_luas > 0 
      ? (stats.luas_dikerjakan / stats.total_luas) * 100 
      : 0;

    return stats;
  }, [filteredProgress]);

  const uniqueZones = [...new Set(data.blocks.map(b => b.zone))];
  const uniqueKategori = [...new Set(data.blocks.map(b => b.kategori).filter(Boolean))];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">🔍 Filter Dashboard</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Section</label>
            <select
              value={filters.section_id}
              onChange={(e) => setFilters({...filters, section_id: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="">Semua Section</option>
              {data.sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Aktivitas</label>
            <select
              value={filters.activity_type_id}
              onChange={(e) => setFilters({...filters, activity_type_id: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="">Semua Aktivitas</option>
              {data.activityTypes.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Zone</label>
            <select
              value={filters.zone}
              onChange={(e) => setFilters({...filters, zone: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="">Semua Zone</option>
              {uniqueZones.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Kategori</label>
            <select
              value={filters.kategori}
              onChange={(e) => setFilters({...filters, kategori: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="">Semua Kategori</option>
              {uniqueKategori.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={filters.periode_start}
              onChange={(e) => setFilters({...filters, periode_start: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={filters.periode_end}
              onChange={(e) => setFilters({...filters, periode_end: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.show_completed}
                onChange={(e) => setFilters({...filters, show_completed: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm">Show Completed</span>
            </label>
          </div>

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
                kondisi: '',
                show_completed: false
              })}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-2 rounded">
          Menampilkan <span className="font-bold text-blue-600">{filteredProgress.length}</span> dari{' '}
          <span className="font-bold">{progressData.length}</span> blok
          {progressData.length - filteredProgress.length > 0 && (
            <span className="text-orange-600 ml-2">
              ({progressData.length - filteredProgress.length} disembunyikan oleh filter)
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Blok</p>
              <p className="text-3xl font-bold mt-1">{summaryStats.total_blocks}</p>
            </div>
            <div className="text-4xl opacity-50">📦</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Completed</p>
              <p className="text-3xl font-bold mt-1">{summaryStats.completed_blocks}</p>
            </div>
            <div className="text-4xl opacity-50">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">In Progress</p>
              <p className="text-3xl font-bold mt-1">{summaryStats.in_progress_blocks}</p>
            </div>
            <div className="text-4xl opacity-50">⏳</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Progress</p>
              <p className="text-3xl font-bold mt-1">{summaryStats.avg_progress.toFixed(1)}%</p>
            </div>
            <div className="text-4xl opacity-50">📊</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">📈 Progress per Aktivitas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="activity_code" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg_progress" fill="#3B82F6" name="Progress (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">🎯 Distribusi Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Completed', value: summaryStats.completed_blocks, color: '#10B981' },
                  { name: 'In Progress', value: summaryStats.in_progress_blocks, color: '#F59E0B' },
                  { name: 'Not Started', value: summaryStats.not_started_blocks, color: '#EF4444' }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Completed', value: summaryStats.completed_blocks, color: '#10B981' },
                  { name: 'In Progress', value: summaryStats.in_progress_blocks, color: '#F59E0B' },
                  { name: 'Not Started', value: summaryStats.not_started_blocks, color: '#EF4444' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">📅 Trend Bulanan</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="luasan" stroke="#3B82F6" name="Luasan (Ha)" />
            <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#10B981" name="Transaksi" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Vendor Ranking */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">🏆 Ranking Vendor</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Rank</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Vendor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Transaksi</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total Luasan</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total Pekerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vendorRanking.map((vendor, idx) => (
                <tr key={vendor.vendor_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span className="text-lg font-bold">#{idx + 1}</span>
                  </td>
                  <td className="px-4 py-2 font-medium">{vendor.vendor_name}</td>
                  <td className="px-4 py-2">{vendor.total_transaksi}</td>
                  <td className="px-4 py-2">{vendor.total_luasan.toFixed(2)} Ha</td>
                  <td className="px-4 py-2">{vendor.total_pekerja} orang</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Progress Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">📋 Detail Progress Blok</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Blok</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Aktivitas</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Section</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total Luas</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Dikerjakan</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Progress</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProgress.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="font-medium">{p.block_code}</div>
                    <div className="text-xs text-gray-500">{p.block_name}</div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{p.activity_name}</div>
                    <div className="text-xs text-gray-500">{p.activity_code}</div>
                  </td>
                  <td className="px-4 py-2">{p.section_name}</td>
                  <td className="px-4 py-2">{p.luas_total} Ha</td>
                  <td className="px-4 py-2">{(p.luas_dikerjakan || 0).toFixed(2)} Ha</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(p.persen_selesai || 0, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{(p.persen_selesai || 0).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'completed' ? 'bg-green-100 text-green-800' :
                      p.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
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
      </div>
    </div>
  );
}
