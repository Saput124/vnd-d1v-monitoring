// src/components/TransactionHistory.jsx

import { useState, useMemo } from 'react';
import Modal from './Modal';

export default function TransactionHistory({ data, loading }) {
  const [filters, setFilters] = useState({
    vendor_id: '',
    activity_type_id: '',
    periode_start: '',
    periode_end: '',
    search: ''
  });

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  // ============================================================================
  // FILTERED TRANSACTIONS
  // ============================================================================
  const filteredTransactions = useMemo(() => {
    let filtered = [...data.transactions];

    if (filters.vendor_id) {
      filtered = filtered.filter(t => t.vendor_id === filters.vendor_id);
    }

    if (filters.activity_type_id) {
      filtered = filtered.filter(t => t.activity_type_id === filters.activity_type_id);
    }

    if (filters.periode_start && filters.periode_end) {
      filtered = filtered.filter(t => {
        const transDate = t.tanggal;
        return transDate >= filters.periode_start && transDate <= filters.periode_end;
      });
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.transaction_code?.toLowerCase().includes(search) ||
        t.vendors?.name?.toLowerCase().includes(search) ||
        t.activity_types?.name?.toLowerCase().includes(search) ||
        t.catatan?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [data.transactions, filters]);

  // ============================================================================
  // VIEW TRANSACTION DETAIL
  // ============================================================================
  const viewDetail = async (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);

    try {
      // Fetch transaction_blocks
      const { data: blocks, error: blocksError } = await data.supabase
        .from('transaction_blocks')
        .select(`
          *,
          block_activities(
            *,
            blocks(code, name, zone)
          )
        `)
        .eq('transaction_id', transaction.id);

      if (blocksError) throw blocksError;

      // Fetch transaction_workers
      const { data: workers, error: workersError } = await data.supabase
        .from('transaction_workers')
        .select(`
          *,
          workers(worker_code, name)
        `)
        .eq('transaction_id', transaction.id);

      if (workersError) throw workersError;

      // Fetch activity-specific data
      let specificData = null;
      if (transaction.activity_types?.code === 'TANAM') {
        const { data: tanamData } = await data.supabase
          .from('transaction_tanam')
          .select('*')
          .eq('transaction_id', transaction.id)
          .single();
        specificData = tanamData;
      } else if (transaction.activity_types?.code === 'PANEN') {
        const { data: panenData } = await data.supabase
          .from('transaction_panen')
          .select('*')
          .eq('transaction_id', transaction.id)
          .single();
        specificData = panenData;
      } else if (transaction.activity_types?.code === 'WEED_CONTROL') {
        const { data: materialsData } = await data.supabase
          .from('transaction_materials')
          .select('*')
          .eq('transaction_id', transaction.id);
        specificData = { materials: materialsData };
      }

      setTransactionDetails({
        blocks: blocks || [],
        workers: workers || [],
        specificData
      });
    } catch (err) {
      console.error('Error fetching transaction details:', err);
      alert('Error loading details: ' + err.message);
    }
  };

  // ============================================================================
  // DELETE TRANSACTION
  // ============================================================================
  const handleDelete = async (transactionId, transactionCode) => {
    if (!confirm(`❓ Yakin hapus transaksi ${transactionCode}?\n\nSemua data terkait akan dihapus!`)) {
      return;
    }

    try {
      // Delete in order (children first)
      await data.supabase.from('transaction_blocks').delete().eq('transaction_id', transactionId);
      await data.supabase.from('transaction_workers').delete().eq('transaction_id', transactionId);
      await data.supabase.from('transaction_tanam').delete().eq('transaction_id', transactionId);
      await data.supabase.from('transaction_panen').delete().eq('transaction_id', transactionId);
      await data.supabase.from('transaction_materials').delete().eq('transaction_id', transactionId);
      
      // Delete main transaction
      const { error } = await data.supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      alert('✅ Transaksi berhasil dihapus!');
      await data.fetchAllData();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('❌ Error: ' + err.message);
    }
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
      {/* ====================================================================== */}
      {/* FILTERS */}
      {/* ====================================================================== */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🔍 Filter Transaksi</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div>
            <label className="block text-sm font-medium mb-2">Cari</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Kode, vendor, aktivitas..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tanggal Mulai</label>
            <input
              type="date"
              value={filters.periode_start}
              onChange={(e) => setFilters({...filters, periode_start: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tanggal Akhir</label>
            <input
              type="date"
              value={filters.periode_end}
              onChange={(e) => setFilters({...filters, periode_end: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                vendor_id: '',
                activity_type_id: '',
                periode_start: '',
                periode_end: '',
                search: ''
              })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* TRANSACTION TABLE */}
      {/* ====================================================================== */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📋 Riwayat Transaksi ({filteredTransactions.length})
        </h3>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Belum ada transaksi
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-3 text-left">No</th>
                  <th className="px-3 py-3 text-left">Tanggal</th>
                  <th className="px-3 py-3 text-left">Kode Transaksi</th>
                  <th className="px-3 py-3 text-left">Vendor</th>
                  <th className="px-3 py-3 text-left">Aktivitas</th>
                  <th className="px-3 py-3 text-right">Total Luasan</th>
                  <th className="px-3 py-3 text-right">Pekerja</th>
                  <th className="px-3 py-3 text-left">Kondisi</th>
                  <th className="px-3 py-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t, i) => (
                  <tr key={t.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-3">{i + 1}</td>
                    <td className="px-3 py-3">
                      {new Date(t.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs font-semibold">
                      {t.transaction_code}
                    </td>
                    <td className="px-3 py-3">{t.vendors?.name}</td>
                    <td className="px-3 py-3">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                        {t.activity_types?.name}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-blue-600">
                      {parseFloat(t.total_luasan || 0).toFixed(2)} Ha
                    </td>
                    <td className="px-3 py-3 text-right">{t.jumlah_pekerja} orang</td>
                    <td className="px-3 py-3">
                      {t.kondisi && (
                        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                          t.kondisi === 'ringan' ? 'bg-green-100 text-green-800' :
                          t.kondisi === 'sedang' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t.kondisi}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDetail(t)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                          title="Lihat Detail"
                        >
                          👁️
                        </button>
                        {data.currentUser?.role !== 'vendor' && (
                          <button
                            onClick={() => handleDelete(t.id, t.transaction_code)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* DETAIL MODAL */}
      {/* ====================================================================== */}
      <Modal
        show={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setTransactionDetails(null);
        }}
        title={`📋 Detail Transaksi: ${selectedTransaction?.transaction_code}`}
      >
        {!transactionDetails ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading details...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">ℹ️ Informasi Umum</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Tanggal:</p>
                  <p className="font-semibold">
                    {new Date(selectedTransaction.tanggal).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Vendor:</p>
                  <p className="font-semibold">{selectedTransaction.vendors?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Aktivitas:</p>
                  <p className="font-semibold">{selectedTransaction.activity_types?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Jumlah Pekerja:</p>
                  <p className="font-semibold">{selectedTransaction.jumlah_pekerja} orang</p>
                </div>
                {selectedTransaction.kondisi && (
                  <div>
                    <p className="text-gray-600">Kondisi:</p>
                    <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                      selectedTransaction.kondisi === 'ringan' ? 'bg-green-100 text-green-800' :
                      selectedTransaction.kondisi === 'sedang' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedTransaction.kondisi}
                    </span>
                  </div>
                )}
              </div>
              {selectedTransaction.catatan && (
                <div className="mt-3">
                  <p className="text-gray-600 text-sm">Catatan:</p>
                  <p className="text-sm bg-white p-2 rounded border">{selectedTransaction.catatan}</p>
                </div>
              )}
            </div>

            {/* Blocks */}
            <div>
              <h4 className="font-semibold mb-2">🗺️ Blok yang Dikerjakan</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Blok</th>
                      <th className="px-3 py-2 text-left">Zone</th>
                      <th className="px-3 py-2 text-right">Luasan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionDetails.blocks.map((b, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 font-semibold">
                          {b.block_activities?.blocks?.name}
                        </td>
                        <td className="px-3 py-2">
                          {b.block_activities?.blocks?.zone}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-blue-600">
                          {b.luas_dikerjakan} Ha
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workers (if available) */}
            {transactionDetails.workers?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">👷 Pekerja</h4>
                <div className="flex flex-wrap gap-2">
                  {transactionDetails.workers.map((w, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm">
                      {w.workers?.name} ({w.workers?.worker_code})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Activity-Specific Data */}
            {transactionDetails.specificData && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">📝 Data Spesifik Aktivitas</h4>
                
                {/* Tanam */}
                {selectedTransaction.activity_types?.code === 'TANAM' && (
                  <div className="text-sm">
                    <p className="text-gray-600">Varietas:</p>
                    <p className="font-semibold">{transactionDetails.specificData.varietas}</p>
                  </div>
                )}

                {/* Panen */}
                {selectedTransaction.activity_types?.code === 'PANEN' && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Estimasi Ton:</p>
                      <p className="font-semibold">{transactionDetails.specificData.estimasi_ton} ton</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Actual Ton:</p>
                      <p className="font-semibold">
                        {transactionDetails.specificData.actual_ton || '-'} ton
                      </p>
                    </div>
                  </div>
                )}

                {/* Weed Control */}
                {selectedTransaction.activity_types?.code === 'WEED_CONTROL' && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Material Herbisida:</p>
                    {transactionDetails.specificData.materials?.map((m, i) => (
                      <div key={i} className="text-sm bg-white p-2 rounded border mb-2">
                        <span className="font-semibold">{m.material_name}</span>
                        {' - '}
                        {m.dosis_per_ha} L/Ha
                        {' (Total: '}
                        {(m.dosis_per_ha * m.luasan_aplikasi).toFixed(2)} L)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}