// src/components/ActivityStageManagement.jsx
// Management untuk Activity Stages (Pre Emergence, Post Emergence, dll)

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Modal from './Modal';

export default function ActivityStageManagement() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    sequence_order: 1,
    active: true
  });

  const fetchStages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_stages')
        .select('*')
        .order('sequence_order', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (err) {
      console.error('Error fetching stages:', err);
      alert('❌ Error loading stages: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  const handleNew = () => {
    // Get next sequence order
    const maxOrder = stages.length > 0 
      ? Math.max(...stages.map(s => s.sequence_order || 0)) 
      : 0;

    setFormData({
      code: '',
      name: '',
      description: '',
      sequence_order: maxOrder + 1,
      active: true
    });
    setEditData(null);
    setShowModal(true);
  };

  const handleEdit = (stage) => {
    setFormData({
      code: stage.code,
      name: stage.name,
      description: stage.description || '',
      sequence_order: stage.sequence_order || 1,
      active: stage.active
    });
    setEditData(stage);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.code || !formData.name || !formData.sequence_order) {
        alert('❌ Kode, Nama, dan Urutan harus diisi!');
        return;
      }

      setLoading(true);

      const dataToSave = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        sequence_order: parseInt(formData.sequence_order),
        active: formData.active
      };

      if (editData) {
        // Update
        const { error } = await supabase
          .from('activity_stages')
          .update(dataToSave)
          .eq('id', editData.id);

        if (error) throw error;
        alert('✅ Stage berhasil diupdate!');
      } else {
        // Check for duplicate code
        const { data: existing } = await supabase
          .from('activity_stages')
          .select('id')
          .eq('code', dataToSave.code)
          .single();

        if (existing) {
          alert('❌ Kode stage sudah digunakan!');
          setLoading(false);
          return;
        }

        // Insert
        const { error } = await supabase
          .from('activity_stages')
          .insert([dataToSave]);

        if (error) throw error;
        alert('✅ Stage berhasil ditambahkan!');
      }

      setShowModal(false);
      fetchStages();
    } catch (err) {
      console.error('Error saving stage:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`❓ Yakin hapus stage "${name}"?\n\n⚠️ Stage yang sudah digunakan dalam konfigurasi material tidak bisa dihapus!`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('activity_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('✅ Stage berhasil dihapus!');
      fetchStages();
    } catch (err) {
      console.error('Error deleting stage:', err);
      alert('❌ Error: ' + err.message + '\n\nKemungkinan stage ini sudah digunakan dalam konfigurasi material.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus, name) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('activity_stages')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      alert(`✅ Stage "${name}" ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}!`);
      fetchStages();
    } catch (err) {
      console.error('Error toggling active:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const moveStage = async (stageId, direction) => {
    const currentIndex = stages.findIndex(s => s.id === stageId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    try {
      setLoading(true);

      // Swap sequence orders
      const currentStage = stages[currentIndex];
      const targetStage = stages[targetIndex];

      await supabase
        .from('activity_stages')
        .update({ sequence_order: targetStage.sequence_order })
        .eq('id', currentStage.id);

      await supabase
        .from('activity_stages')
        .update({ sequence_order: currentStage.sequence_order })
        .eq('id', targetStage.id);

      fetchStages();
    } catch (err) {
      console.error('Error moving stage:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter stages
  const filteredStages = stages.filter(stage => {
    if (searchQuery === '') return true;
    return (
      stage.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stage.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stage.description && stage.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  if (loading && stages.length === 0) {
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
          <strong>ℹ️ Activity Stages:</strong> Tahapan aplikasi material seperti Pre Emergence, 
          Post Emergence, Bassal Dressing, dll. Stage ini digunakan untuk menentukan material 
          apa saja yang perlu diaplikasikan pada tahapan tertentu.
        </p>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🎯 Activity Stages</h2>
            <p className="text-gray-600 text-sm mt-1">
              Manage tahapan aplikasi material
            </p>
          </div>
          <button
            onClick={handleNew}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 disabled:opacity-50"
          >
            ➕ Tambah Stage Baru
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Cari stage (nama, kode, deskripsi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Stages</p>
            <p className="text-2xl font-bold text-blue-600">{stages.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">
              {stages.filter(s => s.active).length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Inactive</p>
            <p className="text-2xl font-bold text-gray-600">
              {stages.filter(s => !s.active).length}
            </p>
          </div>
        </div>

        {/* Stages Table */}
        {filteredStages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery ? '🔍 Tidak ada stage yang sesuai pencarian' : '📭 Belum ada stage terdaftar'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleNew}
                className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
              >
                ➕ Tambah Stage Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Urutan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Kode</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Nama Stage</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Deskripsi</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStages.map((stage, idx) => (
                  <tr 
                    key={stage.id} 
                    className={`border-b hover:bg-gray-50 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-blue-600">
                          {stage.sequence_order}
                        </span>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveStage(stage.id, 'up')}
                            disabled={idx === 0 || loading}
                            className="text-gray-600 hover:text-blue-600 disabled:opacity-30"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveStage(stage.id, 'down')}
                            disabled={idx === filteredStages.length - 1 || loading}
                            className="text-gray-600 hover:text-blue-600 disabled:opacity-30"
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                        {stage.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{stage.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md">
                      {stage.description || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(stage.id, stage.active, stage.name)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          stage.active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {stage.active ? '✓ Active' : '✗ Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(stage)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-lg"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(stage.id, stage.name)}
                          className="text-red-600 hover:text-red-800 font-semibold text-lg"
                          title="Delete"
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

      {/* Modal Form */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={editData ? '✏️ Edit Stage' : '➕ Tambah Stage Baru'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Kode Stage * <span className="text-xs text-gray-500">(e.g., PRE_EMERGENCE)</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_')})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="PRE_EMERGENCE"
                required
                disabled={editData !== null}
              />
              {editData && (
                <p className="text-xs text-gray-500 mt-1">Kode tidak bisa diubah</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Urutan *</label>
              <input
                type="number"
                min="1"
                value={formData.sequence_order}
                onChange={(e) => setFormData({...formData, sequence_order: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Urutan aplikasi (1, 2, 3, ...)
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nama Stage *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Pre Emergence"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="e.g., Aplikasi sebelum gulma tumbuh"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="font-medium">Stage Aktif</span>
              <span className="text-sm text-gray-500">(dapat digunakan)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 disabled:opacity-50"
            >
              {loading ? '⏳ Menyimpan...' : '💾 Simpan'}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={loading}
              className="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
