// src/components/BlockRegistration.jsx - FIXED VERSION
// Admin bisa pilih section,Section Head auto-fill

import { useState, useMemo } from 'react';
import Modal from './Modal';

export default function BlockRegistration({ data, loading }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    section_id: '', // ⭐ NEW: For admin to select
    activity_type_id: '',
    target_bulan: '',
    execution_number: 1,
    selected_blocks: []
  });
  const [zoneFilter, setZoneFilter] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if no activities available
  const hasNoActivities = data.activityTypes.length === 0;

  // ⭐ For admin: Get available activities per section
  const availableActivitiesForSection = useMemo(() => {
    if (data.currentUser?.role === 'admin') {
      // If no section selected yet, return empty
      if (!formData.section_id) {
        return [];
      }
      
      // Filter activities assigned to selected section
      const sectionActivityIds = data.sectionActivities
        ?.filter(sa => sa.section_id === formData.section_id)
        .map(sa => sa.activity_type_id) || [];

      return data.activityTypes.filter(at => 
        sectionActivityIds.includes(at.id)
      );
    }

    // For section_head/supervisor, return their assigned activities
    return data.activityTypes;
  }, [data.activityTypes, data.sectionActivities, formData.section_id, data.currentUser]);

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
      alert('⚠️ Pilih minimal 1 blok!');
      return;
    }

    // ⭐ Validation: Admin must select section
    if (data.currentUser?.role === 'admin' && !formData.section_id) {
      alert('⚠️ Pilih section terlebih dahulu!');
      return;
    }

    try {
      const activity = data.activityTypes.find(a => a.id === formData.activity_type_id);
      
      // ⭐ Determine section_id based on role
      const targetSectionId = data.currentUser?.role === 'admin' 
        ? formData.section_id 
        : data.currentUser?.section_id;

      for (const blockId of formData.selected_blocks) {
        const block = data.blocks.find(b => b.id === blockId);
        
        const registrationData = {
          block_id: blockId,
          activity_type_id: formData.activity_type_id,
          section_id: targetSectionId, // ⭐ FIX: Always include section_id
          kategori: block.kategori || '',
          varietas: block.varietas || '',
          target_bulan: formData.target_bulan,
          target_luasan: block.luas_total,
          execution_number: formData.execution_number
        };

        await data.addBlockActivity(registrationData);
      }

      const sectionName = data.currentUser?.role === 'admin'
        ? data.sections.find(s => s.id === targetSectionId)?.name
        : data.currentUser?.section_name;

      alert(`✅ Berhasil registrasi ${formData.selected_blocks.length} blok untuk ${activity.name} di ${sectionName}!`);
      
      setFormData({
        section_id: '',
        activity_type_id: '',
        target_bulan: '',
        execution_number: 1,
        selected_blocks: []
      });
      setShowModal(false);
    } catch (err) {
      console.error('Error submitting:', err);
      alert('❌ Error: ' + err.message);
    }
  };

  const handleDelete = async (id, blockName) => {
    if (!confirm(`⚠️ Yakin hapus registrasi ${blockName}?`)) return;

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
      {/* Warning: No Activities Available */}
      {hasNoActivities && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🚫</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-800 mb-2">
                Tidak Ada Aktivitas Tersedia
              </h3>
              <p className="text-red-700 mb-4">
                {data.currentUser?.role === 'admin' 
                  ? 'Anda perlu menambahkan Activity Types terlebih dahulu, lalu assign ke sections di menu "Section Activities".'
                  : 'Section Anda belum di-assign aktivitas apapun. Hubungi admin untuk assign aktivitas ke section Anda.'}
              </p>
              <div className="space-y-2 text-sm text-red-600">
                <p><strong>Langkah yang harus dilakukan (Admin):</strong></p>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Buka menu <strong>"Activity Management"</strong></li>
                  <li>Tambahkan activity types (TANAM, KELENTEK, WEEDING, dll)</li>
                  <li>Buka menu <strong>"Section Activities"</strong></li>
                  <li>Assign activities ke section yang sesuai</li>
                  <li>Baru bisa melakukan block registration</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>📋 Block Registration & Status:</strong> Registrasikan blok untuk aktivitas tertentu 
          dan monitor progress real-time dari transaksi yang masuk.
          {data.currentUser?.role === 'admin' && (
            <span className="block mt-1 text-xs">
              ℹ️ Sebagai admin, Anda bisa registrasi blok untuk section manapun.
            </span>
          )}
          {data.currentUser?.role !== 'admin' && (
            <span className="block mt-1 text-xs">
              ℹ️ Anda hanya bisa registrasi blok untuk aktivitas yang di-assign ke section Anda.
            </span>
          )}
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">📋 Block Registration & Status</h3>
          <button
            onClick={() => setShowModal(true)}
            disabled={hasNoActivities}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            title={hasNoActivities ? 'Tidak ada aktivitas tersedia' : 'Registrasi Blok Baru'}
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
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg">Belum ada blok yang diregistrasi</p>
            <p className="text-gray-400 text-sm mt-2">
              {hasNoActivities 
                ? 'Selesaikan setup aktivitas terlebih dahulu'
                : 'Klik "Registrasi Blok Baru" untuk memulai'}
            </p>
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
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold">
                            {activity?.name}
                            {ba.execution_number > 1 && ` ${ba.execution_number}`}
                          </span>
                          {activity?.requires_material && (
                            <span className="text-xs" title="Memerlukan material">📦</span>
                          )}
                        </div>
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
        title="📋 Registrasi Blok untuk Aktivitas"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ⭐ NEW: Section Selection (Admin Only) */}
          {data.currentUser?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Section * <span className="text-xs text-gray-500">(Admin Only)</span>
              </label>
              <select
                value={formData.section_id}
                onChange={(e) => setFormData({
                  ...formData, 
                  section_id: e.target.value,
                  activity_type_id: '', // Reset activity when section changes
                  selected_blocks: []
                })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">-- Pilih Section --</option>
                {data.sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          )}

          {/* Aktivitas Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Aktivitas *</label>
            <select
              value={formData.activity_type_id}
              onChange={(e) => setFormData({...formData, activity_type_id: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              required
              disabled={data.currentUser?.role === 'admin' && !formData.section_id}
            >
              <option value="">
                {data.currentUser?.role === 'admin' && !formData.section_id 
                  ? '-- Pilih Section Terlebih Dahulu --'
                  : '-- Pilih Aktivitas --'}
              </option>
              {availableActivitiesForSection.map(at => (
                <option key={at.id} value={at.id}>
                  {at.name} {at.requires_material ? '📦' : ''}
                </option>
              ))}
            </select>
            {data.currentUser?.role === 'admin' && formData.section_id && availableActivitiesForSection.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Section ini belum di-assign aktivitas apapun. Assign dulu di "Section Activities".
              </p>
            )}
            
            {/* ⭐ NEW: Material Requirements Info */}
            {formData.activity_type_id && 
             data.activityTypes.find(a => a.id === formData.activity_type_id)?.requires_material && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📦 Info Material:</strong> Aktivitas ini memerlukan material (pupuk/herbisida/pestisida).
                  Material akan dipilih saat input transaksi berdasarkan kategori blok (PC/RC).
                </p>
              </div>
            )}
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
                  section_id: '',
                  activity_type_id: '',
                  target_bulan: '',
                  execution_number: 1,
                  selected_blocks: []
                });
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              ❌ Batal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}