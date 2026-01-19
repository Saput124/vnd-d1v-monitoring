import { useState } from 'react';
import Modal from './Modal';

export default function ActivityManagement({ data, loading }) {
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const openModal = (activity = null) => {
    setEditData(activity);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
   
    const activityData = {
      code: formData.get('code').toUpperCase().trim(),
      name: formData.get('name').trim(),
      description: formData.get('description')?.trim() || null,
      active: formData.get('active') === 'on'
    };

    try {
      if (editData) {
        // UPDATE
        const { error } = await data.supabase
          .from('activity_types')
          .update(activityData)
          .eq('id', editData.id);

        if (error) {
          console.error('Update activity error:', error);
          throw new Error(`Gagal update aktivitas: ${error.message}`);
        }
       
        alert('✅ Aktivitas berhasil diupdate!');
      } else {
        // INSERT
        const { error } = await data.supabase
          .from('activity_types')
          .insert([activityData]);

        if (error) {
          console.error('Insert activity error:', error);
          throw new Error(`Gagal menambah aktivitas: ${error.message}`);
        }
       
        alert('✅ Aktivitas berhasil ditambahkan!');
      }
     
      closeModal();
      await data.fetchAllData();
    } catch (err) {
      console.error('Error saving activity:', err);
      alert('❌ Error: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`❓ Yakin hapus aktivitas "${name}"?\n\nPeringatan: Semua transaksi terkait akan terpengaruh!`)) {
      return;
    }

    try {
      const { error } = await data.supabase
        .from('activity_types')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete activity error:', error);
        throw new Error(`Gagal hapus aktivitas: ${error.message}`);
      }
     
      alert('✅ Aktivitas berhasil dihapus!');
      await data.fetchAllData();
    } catch (err) {
      console.error('Error deleting activity:', err);
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ℹ️ <strong>Activity Types Management:</strong> Kelola jenis-jenis aktivitas pekerjaan yang tersedia
          untuk registrasi blok dan input transaksi. Aktivitas yang sudah memiliki transaksi sebaiknya tidak dihapus.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            🏷️ Daftar Aktivitas ({data.activityTypes.length})
          </h3>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            ➕ Tambah Aktivitas
          </button>
        </div>

        {data.activityTypes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Belum ada aktivitas</p>
            <p className="text-gray-400 text-sm mt-2">Klik "Tambah Aktivitas" untuk memulai</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-3 text-left font-semibold">No</th>
                  <th className="px-4 py-3 text-left font-semibold">Kode</th>
                  <th className="px-4 py-3 text-left font-semibold">Nama Aktivitas</th>
                  <th className="px-4 py-3 text-left font-semibold">Deskripsi</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.activityTypes.map((activity, idx) => (
                  <tr key={activity.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded font-mono text-xs font-semibold">
                        {activity.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{activity.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {activity.description || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {activity.active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                          ✓ Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                          ✗ Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(activity)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(activity.id, activity.name)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Default Activities Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800 font-semibold mb-2">📋 Aktivitas Standard:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-green-700">
          <div className="bg-white p-2 rounded">
            <strong>TANAM</strong> - Penanaman
          </div>
          <div className="bg-white p-2 rounded">
            <strong>KELENTEK</strong> - Pembersihan Kelentek
          </div>
          <div className="bg-white p-2 rounded">
            <strong>WEEDING</strong> - Penyiangan (1-3x)
          </div>
          <div className="bg-white p-2 rounded">
            <strong>WEED_CONTROL</strong> - Pengendalian Gulma (Herbisida)
          </div>
          <div className="bg-white p-2 rounded">
            <strong>PANEN</strong> - Pemanenan
          </div>
        </div>
        <p className="text-xs text-green-600 mt-2">
          💡 Anda dapat menambah aktivitas custom sesuai kebutuhan perusahaan
        </p>
      </div>

      {/* Modal */}
      <Modal
        show={showModal}
        onClose={closeModal}
        title={editData ? '✏️ Edit Aktivitas' : '➕ Tambah Aktivitas'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kode Aktivitas *</label>
            <input
              name="code"
              defaultValue={editData?.code || ''}
              required
              className="w-full px-4 py-2 border rounded-lg uppercase"
              placeholder="TANAM"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              Gunakan huruf kapital tanpa spasi. Contoh: TANAM, WEEDING, PANEN
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nama Aktivitas *</label>
            <input
              name="name"
              defaultValue={editData?.name || ''}
              required
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Penanaman"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deskripsi (Opsional)</label>
            <textarea
              name="description"
              defaultValue={editData?.description || ''}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
              placeholder="Deskripsi singkat tentang aktivitas ini..."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="active"
                defaultChecked={editData?.active !== false}
                className="w-4 h-4"
              />
              <span className="font-medium">Active</span>
              <span className="text-sm text-gray-500">(Aktivitas dapat digunakan)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold"
            >
              💾 Simpan
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

//src/components/BlockRegistration.jsx

import { useState, useMemo } from 'react';
import Modal from './Modal';

export default function BlockRegistration({ data, loading }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    activity_type_id: '',
    target_bulan: '',
    execution_number: 1,
    selected_blocks: []
  });
  const [zoneFilter, setZoneFilter] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter available blocks
  const availableBlocks = useMemo(() => {
    let filtered = data.blocks;

    if (zoneFilter) {
      filtered = filtered.filter(b => b.zone === zoneFilter);
    }

    if (kategoriFilter) {
      filtered = filtered.filter(b => b.kategori === kategoriFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(query) ||
        b.code.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [data.blocks, zoneFilter, kategoriFilter, searchQuery]);

  // Get unique zones and categories
  const uniqueZones = [...new Set(data.blocks.map(b => b.zone))];
  const uniqueKategori = [...new Set(data.blocks.map(b => b.kategori).filter(Boolean))];

  const toggleBlock = (blockId) => {
    setFormData(prev => ({
      ...prev,
      selected_blocks: prev.selected_blocks.includes(blockId)
        ? prev.selected_blocks.filter(id => id !== blockId)
        : [...prev.selected_blocks, blockId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.selected_blocks.length === 0) {
      alert('❌ Pilih minimal 1 blok!');
      return;
    }

    try {
      // Get selected activity
      const activity = data.activityTypes.find(a => a.id === formData.activity_type_id);
      
      // Register each selected block
      for (const blockId of formData.selected_blocks) {
        const block = data.blocks.find(b => b.id === blockId);
        
        const registrationData = {
          block_id: blockId,
          activity_type_id: formData.activity_type_id,
          kategori: block.kategori || '',
          varietas: block.varietas || '',
          target_bulan: formData.target_bulan,
          target_luasan: block.luas_total,
          execution_number: formData.execution_number
        };

        await data.addBlockActivity(registrationData);
      }

      alert(`✅ Berhasil registrasi ${formData.selected_blocks.length} blok untuk ${activity.name}!`);
      
      // Reset form
      setFormData({
        activity_type_id: '',
        target_bulan: '',
        execution_number: 1,
        selected_blocks: []
      });
      setShowModal(false);
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handleDelete = async (id, blockName) => {
    if (!confirm(`❓ Yakin hapus registrasi ${blockName}?`)) return;

    try {
      await data.deleteBlockActivity(id);
      alert('✅ Registrasi berhasil dihapus!');
    } catch (err) {
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
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ℹ️ <strong>Block Registration & Status:</strong> Registrasikan blok untuk aktivitas tertentu (Tanam, Kelentek, dll) 
          dan monitor progress real-time dari transaksi yang masuk.
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">📋 Block Registration & Status</h3>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            ➕ Registrasi Blok Baru
          </button>
        </div>
      </div>

      {/* Registered Blocks Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">
          📊 Blok yang Sudah Diregistrasi ({data.blockActivities.length})
        </h4>

        {data.blockActivities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Belum ada blok yang diregistrasi</p>
            <p className="text-gray-400 text-sm mt-2">Klik "Registrasi Blok Baru" untuk memulai</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-3 py-3 text-left font-semibold">No</th>
                  <th className="px-3 py-3 text-left font-semibold">Kode</th>
                  <th className="px-3 py-3 text-left font-semibold">Zone</th>
                  <th className="px-3 py-3 text-left font-semibold">Blok</th>
                  <th className="px-3 py-3 text-left font-semibold">Luas Asli</th>
                  <th className="px-3 py-3 text-left font-semibold">Kategori</th>
                  <th className="px-3 py-3 text-left font-semibold">Varietas</th>
                  <th className="px-3 py-3 text-left font-semibold">Aktivitas</th>
                  <th className="px-3 py-3 text-left font-semibold">Target Bulan</th>
                  <th className="px-3 py-3 text-left font-semibold">Target</th>
                  <th className="px-3 py-3 text-left font-semibold">Dikerjakan</th>
                  <th className="px-3 py-3 text-left font-semibold">Progress</th>
                  <th className="px-3 py-3 text-left font-semibold">Status</th>
                  <th className="px-3 py-3 text-left font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.blockActivities.map((ba, i) => {
                  const block = data.blocks.find(b => b.id === ba.block_id);
                  const activity = data.activityTypes.find(a => a.id === ba.activity_type_id);
                  
                  return (
                    <tr key={ba.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-3">{i + 1}</td>
                      <td className="px-3 py-3 font-mono text-xs">{block?.code}</td>
                      <td className="px-3 py-3">{block?.zone}</td>
                      <td className="px-3 py-3 font-semibold">{block?.name}</td>
                      <td className="px-3 py-3">{block?.luas_total} Ha</td>
                      <td className="px-3 py-3">{ba.kategori}</td>
                      <td className="px-3 py-3">{ba.varietas}</td>
                      <td className="px-3 py-3">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                          {activity?.name}
                          {ba.execution_number > 1 && ` ${ba.execution_number}`}
                        </span>
                      </td>
                      <td className="px-3 py-3">{ba.target_bulan}</td>
                      <td className="px-3 py-3 font-semibold">{ba.target_luasan} Ha</td>
                      <td className="px-3 py-3 font-semibold text-blue-600">{ba.luas_dikerjakan} Ha</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                ba.persen_selesai >= 100 ? 'bg-green-600' :
                                ba.persen_selesai >= 50 ? 'bg-yellow-600' :
                                'bg-blue-600'
                              }`}
                              style={{width: `${Math.min(ba.persen_selesai, 100)}%`}}
                            />
                          </div>
                          <span className="font-semibold">{ba.persen_selesai}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          ba.status === 'completed' ? 'bg-green-100 text-green-800' :
                          ba.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ba.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => handleDelete(ba.id, block?.name)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      <Modal 
        show={showModal} 
        onClose={() => setShowModal(false)} 
        title="➕ Registrasi Blok untuk Aktivitas"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Aktivitas Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Aktivitas *</label>
            <select
              value={formData.activity_type_id}
              onChange={(e) => setFormData({...formData, activity_type_id: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              required
            >
              <option value="">-- Pilih Aktivitas --</option>
              {data.activityTypes.map(at => (
                <option key={at.id} value={at.id}>{at.name}</option>
              ))}
            </select>
          </div>

          {/* Execution Number (for Weeding) */}
          {formData.activity_type_id && 
           data.activityTypes.find(a => a.id === formData.activity_type_id)?.code === 'WEEDING' && (
            <div>
              <label className="block text-sm font-medium mb-2">Weeding Ke-</label>
              <select
                value={formData.execution_number}
                onChange={(e) => setFormData({...formData, execution_number: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="1">Weeding 1</option>
                <option value="2">Weeding 2</option>
                <option value="3">Weeding 3</option>
              </select>
            </div>
          )}

          {/* Target Bulan */}
          <div>
            <label className="block text-sm font-medium mb-2">Target Bulan Pengerjaan *</label>
            <input
              type="month"
              value={formData.target_bulan}
              onChange={(e) => setFormData({...formData, target_bulan: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {/* Block Selection with Filters */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Pilih Blok (Multiple Select)</h4>
            
            {/* Filters */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium mb-1">Filter Zone</label>
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  <option value="">Semua Zone</option>
                  {uniqueZones.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Filter Kategori</label>
                <select
                  value={kategoriFilter}
                  onChange={(e) => setKategoriFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                >
                  <option value="">Semua Kategori</option>
                  {uniqueKategori.map(kat => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Cari nama atau kode blok..."
                className="w-full px-3 py-2 border rounded text-sm"
              />
            </div>

            {/* Block List */}
            <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              <p className="text-xs text-gray-600 mb-2">
                {formData.selected_blocks.length} blok dipilih dari {availableBlocks.length} tersedia
              </p>
              
              {availableBlocks.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Tidak ada blok yang sesuai filter
                </p>
              ) : (
                <div className="space-y-2">
                  {availableBlocks.map(block => (
                    <label
                      key={block.id}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        formData.selected_blocks.includes(block.id)
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-white border border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selected_blocks.includes(block.id)}
                        onChange={() => toggleBlock(block.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">{block.name}</p>
                        <p className="text-xs text-gray-600">
                          {block.code} | {block.zone} | {block.kategori} | {block.varietas} | {block.luas_total} Ha
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold"
            >
              ✅ Registrasi {formData.selected_blocks.length} Blok
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setFormData({
                  activity_type_id: '',
                  target_bulan: '',
                  execution_number: 1,
                  selected_blocks: []
                });
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

