import { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';

export default function TransactionHistory({ data, loading }) {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    vendor_id: '',
    activity_type_id: '',
    search: ''
  });

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Permissions check
  const canDelete = ['admin', 'section_head', 'supervisor'].includes(data.currentUser?.role);
  const canEdit = ['admin', 'section_head', 'supervisor'].includes(data.currentUser?.role);

  const filteredTransactions = useMemo(() => {
    let filtered = [...data.transactions];

    if (filters.dateFrom) {
      filtered = filtered.filter(t => t.tanggal >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(t => t.tanggal <= filters.dateTo);
    }

    if (filters.vendor_id) {
      filtered = filtered.filter(t => t.vendor_id === filters.vendor_id);
    }

    if (filters.activity_type_id) {
      filtered = filtered.filter(t => t.activity_type_id === filters.activity_type_id);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.transaction_code?.toLowerCase().includes(search) ||
        t.vendors?.name?.toLowerCase().includes(search) ||
        t.activity_types?.name?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [data.transactions, filters]);

  const summary = useMemo(() => {
    return {
      totalTransactions: filteredTransactions.length,
      totalLuasan: filteredTransactions.reduce((sum, t) => {
        return sum + (parseFloat(t.total_luasan) || 0);
      }, 0),
      totalPekerja: filteredTransactions.reduce((sum, t) => {
        return sum + (parseInt(t.jumlah_pekerja) || 0);
      }, 0),
      byActivity: filteredTransactions.reduce((acc, t) => {
        const actName = t.activity_types?.name || 'Unknown';
        if (!acc[actName]) {
          acc[actName] = { count: 0, luasan: 0 };
        }
        acc[actName].count++;
        acc[actName].luasan += parseFloat(t.total_luasan) || 0;
        return acc;
      }, {})
    };
  }, [filteredTransactions]);

  const fetchTransactionDetails = async (transactionId) => {
    setLoadingDetails(true);
    try {
      // Fetch transaction blocks
      const { data: blockData, error: blockError } = await data.supabase
        .from('transaction_blocks')
        .select(`
          *,
          block_activities(
            *,
            blocks(code, name, zone)
          )
        `)
        .eq('transaction_id', transactionId);

      if (blockError) throw blockError;

      // Fetch workers if any
      const { data: workerData, error: workerError } = await data.supabase
        .from('transaction_workers')
        .select(`
          *,
          workers(worker_code, name)
        `)
        .eq('transaction_id', transactionId);

      if (workerError) throw workerError;

      // Fetch activity-specific data
      const transaction = data.transactions.find(t => t.id === transactionId);
      let specificData = null;

      if (transaction?.activity_types?.code === 'TANAM') {
        const { data: tanamData } = await data.supabase
          .from('transaction_tanam')
          .select('*')
          .eq('transaction_id', transactionId)
          .single();
        specificData = tanamData;
      }

      if (transaction?.activity_types?.code === 'PANEN') {
        const { data: panenData } = await data.supabase
          .from('transaction_panen')
          .select('*')
          .eq('transaction_id', transactionId)
          .single();
        specificData = panenData;
      }

      if (transaction?.activity_types?.code === 'WEED_CONTROL') {
        const { data: materialData } = await data.supabase
          .from('transaction_materials')
          .select('*')
          .eq('transaction_id', transactionId);
        specificData = materialData;
      }

      setTransactionDetails({
        blocks: blockData || [],
        workers: workerData || [],
        specificData
      });

    } catch (err) {
      console.error('Error fetching transaction details:', err);
      alert('Error loading details: ' + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = async (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
    await fetchTransactionDetails(transaction.id);
  };

  const handleDelete = async (transaction) => {
    if (!canDelete) {
      alert('❌ Anda tidak memiliki akses untuk menghapus transaksi!');
      return;
    }

    if (!confirm(`❓ Yakin hapus transaksi ${transaction.transaction_code}?\n\nPeringatan: Ini akan menghapus semua data terkait!`)) {
      return;
    }

    try {
      const { error } = await data.supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      if (error) throw error;

      alert('✅ Transaksi berhasil dihapus!');
      await data.fetchAllData();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('❌ Error: ' + err.message);
    }
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      vendor_id: '',
      activity_type_id: '',
      search: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-semibold">Total Transaksi</p>
          <p className="text-3xl font-bold text-gray-800">{summary.totalTransactions}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-semibold">Total Luasan</p>
          <p className="text-3xl font-bold text-gray-800">{summary.totalLuasan.toFixed(2)} Ha</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-semibold">Total Pekerja</p>
          <p className="text-3xl font-bold text-gray-800">{summary.totalPekerja}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600 font-semibold">Avg Workload</p>
          <p className="text-3xl font-bold text-gray-800">
            {summary.totalPekerja > 0 
              ? (summary.totalLuasan / summary.totalPekerja).toFixed(3) 
              : '0'} Ha/org
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">🔍 Filter Transaksi</h3>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
          >
            🔄 Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Tanggal Dari</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Tanggal Sampai</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Vendor</label>
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
          <div>
            <label className="block text-xs font-medium mb-1">Aktivitas</label>
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
          <div>
            <label className="block text-xs font-medium mb-1">Cari</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Kode, vendor, aktivitas..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      {Object.keys(summary.byActivity).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Ringkasan Per Aktivitas</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(summary.byActivity).map(([activity, stats]) => (
              <div key={activity} className="bg-gray-50 border rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium truncate">{activity}</p>
                <p className="text-xl font-bold text-blue-600">{stats.count}x</p>
                <p className="text-xs text-gray-500">{stats.luasan.toFixed(2)} Ha</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">
            📋 Daftar Transaksi ({filteredTransactions.length})
          </h3>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Tidak ada transaksi yang sesuai filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                  <th className="px-4 py-3 text-left font-semibold">Kode Transaksi</th>
                  <th className="px-4 py-3 text-left font-semibold">Vendor</th>
                  <th className="px-4 py-3 text-left font-semibold">Aktivitas</th>
                  <th className="px-4 py-3 text-left font-semibold">Kondisi</th>
                  <th className="px-4 py-3 text-right font-semibold">Luasan</th>
                  <th className="px-4 py-3 text-right font-semibold">Pekerja</th>
                  <th className="px-4 py-3 text-right font-semibold">Workload</th>
                  <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction, idx) => {
                  const luasan = parseFloat(transaction.total_luasan) || 0;
                  const pekerja = parseInt(transaction.jumlah_pekerja) || 0;
                  const workload = pekerja > 0 ? (luasan / pekerja).toFixed(3) : '0';

                  return (
                    <tr 
                      key={transaction.id} 
                      className={`border-t hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-4 py-3">
                        {new Date(transaction.tanggal).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600">
                        {transaction.transaction_code}
                      </td>
                      <td className="px-4 py-3">{transaction.vendors?.name}</td>
                      <td className="px-4 py-3">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                          {transaction.activity_types?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {transaction.kondisi ? (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            transaction.kondisi === 'berat' ? 'bg-red-100 text-red-800' :
                            transaction.kondisi === 'sedang' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {transaction.kondisi}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-600">
                        {luasan.toFixed(2)} Ha
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {pekerja} orang
                      </td>
                      <td className="px-4 py-3 text-right text-purple-600 font-semibold">
                        {workload} Ha/org
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleViewDetails(transaction)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-semibold"
                          >
                            👁️ Detail
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(transaction)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs font-semibold"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        show={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTransaction(null);
          setTransactionDetails(null);
        }}
        title={`📋 Detail Transaksi: ${selectedTransaction?.transaction_code}`}
      >
        {loadingDetails ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : selectedTransaction && transactionDetails ? (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">Tanggal</p>
                <p className="font-semibold">
                  {new Date(selectedTransaction.tanggal).toLocaleDateString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Vendor</p>
                <p className="font-semibold">{selectedTransaction.vendors?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Aktivitas</p>
                <p className="font-semibold">{selectedTransaction.activity_types?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Kondisi</p>
                <p className="font-semibold capitalize">{selectedTransaction.kondisi || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Jumlah Pekerja</p>
                <p className="font-semibold text-green-600">{selectedTransaction.jumlah_pekerja} orang</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Luasan</p>
                <p className="font-semibold text-blue-600">
                  {parseFloat(selectedTransaction.total_luasan || 0).toFixed(2)} Ha
                </p>
              </div>
            </div>

            {/* Catatan */}
            {selectedTransaction.catatan && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-semibold mb-1">📝 Catatan:</p>
                <p className="text-sm text-yellow-900">{selectedTransaction.catatan}</p>
              </div>
            )}

            {/* Blocks */}
            <div>
              <h4 className="font-semibold mb-2">🗺️ Blok yang Dikerjakan ({transactionDetails.blocks.length})</h4>
              <div className="space-y-2">
                {transactionDetails.blocks.map((tb, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {tb.block_activities?.blocks?.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {tb.block_activities?.blocks?.code} | Zone: {tb.block_activities?.blocks?.zone}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{tb.luas_dikerjakan} Ha</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workers */}
            {transactionDetails.workers.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">👷 Pekerja ({transactionDetails.workers.length})</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {transactionDetails.workers.map((tw, idx) => (
                    <div key={idx} className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                      <p className="font-medium">{tw.workers?.name}</p>
                      <p className="text-xs text-gray-600">{tw.workers?.worker_code}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Specific Data */}
            {selectedTransaction.activity_types?.code === 'TANAM' && transactionDetails.specificData && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-600 font-semibold mb-1">🌱 Data Tanam:</p>
                <p className="text-sm"><strong>Varietas:</strong> {transactionDetails.specificData.varietas}</p>
              </div>
            )}

            {selectedTransaction.activity_types?.code === 'PANEN' && transactionDetails.specificData && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-600 font-semibold mb-2">🚜 Data Panen:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Estimasi Ton:</p>
                    <p className="font-semibold">{transactionDetails.specificData.estimasi_ton || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Actual Ton:</p>
                    <p className="font-semibold">{transactionDetails.specificData.actual_ton || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedTransaction.activity_types?.code === 'WEED_CONTROL' && transactionDetails.specificData?.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-600 font-semibold mb-2">🧪 Material Herbisida:</p>
                <div className="space-y-2">
                  {transactionDetails.specificData.map((mat, idx) => (
                    <div key={idx} className="text-sm bg-white p-2 rounded">
                      <p><strong>{mat.material_name}</strong></p>
                      <p className="text-xs text-gray-600">
                        Dosis: {mat.dosis_per_ha} L/Ha × {mat.luasan_aplikasi} Ha = {(mat.dosis_per_ha * mat.luasan_aplikasi).toFixed(2)} L
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}