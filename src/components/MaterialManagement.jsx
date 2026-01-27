// src/components/MaterialManagement.jsx
// Master Data Management untuk Materials (Herbisida, Pupuk, Pestisida, dll)

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Modal from './Modal';

export default function MaterialManagement() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'herbisida',
    unit: 'liter',
    description: '',
    manufacturer: '',
    safety_notes: '',
    active: true
  });

  const categories = [
    { value: 'herbisida', label: '🌿 Herbisida', color: 'bg-green-100 text-green-800' },
    { value: 'pupuk', label: '🌾 Pupuk', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'pestisida', label: '🐛 Pestisida', color: 'bg-red-100 text-red-800' },
    { value: 'alat', label: '🔧 Alat', color: 'bg-blue-100 text-blue-800' },
    { value: 'lainnya', label: '📦 Lainnya', color: 'bg-gray-100 text-gray-800' }
  ];

  const units = ['liter', 'kg', 'gram', 'botol', 'karung', 'unit', 'pack'];

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setMaterials(data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
      alert('❌ Error loading materials: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleNew = () => {
    setFormData({
      code: '',
      name: '',
      category: 'herbisida',
      unit: 'liter',
      description: '',
      manufacturer: '',
      safety_notes: '',
      active: true
    });
    setEditData(null);
    setShowModal(true);
  };

  const handleEdit = (material) => {
    setFormData({
      code: material.code,
      name: material.name,
      category: material.category || 'herbisida',
      unit: material.unit,
      description: material.description || '',
      manufacturer: material.manufacturer || '',
      safety_notes: material.safety_notes || '',
      active: material.active
    });
    setEditData(material);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.code || !formData.name || !formData.unit) {
        alert('❌ Kode, Nama, dan Satuan harus diisi!');
        return;
      }

      setLoading(true);

      const dataToSave = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        description: formData.description.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        safety_notes: formData.safety_notes.trim() || null,
        active: formData.active,
        updated_at: new Date().toISOString()
      };

      if (editData) {
        // Update
        const { error } = await supabase
          .from('materials')
          .update(dataToSave)
          .eq('id', editData.id);

        if (error) throw error;
        alert('✅ Material berhasil diupdate!');
      } else {
        // Insert
        const { error } = await supabase
          .from('materials')
          .insert([dataToSave]);

        if (error) throw error;
        alert('✅ Material berhasil ditambahkan!');
      }

      setShowModal(false);
      fetchMaterials();
    } catch (err) {
      console.error('Error saving material:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`❓ Yakin hapus material "${name}"?\n\n⚠️ Material yang sudah digunakan dalam transaksi tidak bisa dihapus!`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('✅ Material berhasil dihapus!');
      fetchMaterials();
    } catch (err) {
      console.error('Error deleting material:', err);
      alert('❌ Error: ' + err.message + '\n\nKemungkinan material ini sudah digunakan dalam transaksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus, name) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('materials')
        .update({ active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      alert(`✅ Material "${name}" ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}!`);
      fetchMaterials();
    } catch (err) {
      console.error('Error toggling active:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter materials
  const filteredMaterials = materials.filter(m => {
    const matchCategory = filterCategory === '' || m.category === filterCategory;
    const matchSearch = searchQuery === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchCategory && matchSearch;
  });

  // Group by category
  const materialsByCategory = categories.map(cat => ({
    ...cat,
    items: filteredMaterials.filter(m => m.category === cat.value)
  }));

  const getCategoryInfo = (category) => {
    return categories.find(c => c.value === category) || categories[4]; // default to 'lainnya'
  };

  if (loading && materials.length === 0) {
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
          <strong>📦 Material Management:</strong> Kelola master data untuk semua material yang digunakan dalam aktivitas 
          (herbisida, pupuk, pestisida, alat, dll). Material ini akan digunakan saat input transaksi untuk aktivitas 
          yang membutuhkan material.
        </p>
      </div>

      {/* Header & Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              📦 Material Master Data
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total: {materials.length} material | Aktif: {materials.filter(m => m.active).length}
            </p>
          </div>
          <button
            onClick={handleNew}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold whitespace-nowrap"
          >
            ➕ Tambah Material
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Filter Kategori</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cari Material</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nama, kode, atau manufaktur..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Materials List Grouped by Category */}
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg">Tidak ada material yang sesuai filter</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-blue-600 hover:underline"
              >
                Reset pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {materialsByCategory.map(category => {
              if (category.items.length === 0) return null;
              
              return (
                <div key={category.value} className="border rounded-lg overflow-hidden">
                  <div className={`${category.color} px-4 py-2 font-semibold`}>
                    {category.label} ({category.items.length})
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold">Kode</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">Nama Material</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">Satuan</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">Manufaktur</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">Deskripsi</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items.map((material, idx) => (
                          <tr key={material.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                                {material.code}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold">{material.name}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {material.unit}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {material.manufacturer || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                              {material.description || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleActive(material.id, material.active, material.name)}
                                className={`px-2 py-1 rounded text-xs font-semibold ${
                                  material.active
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {material.active ? '✓ Active' : '✗ Inactive'}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(material)}
                                  className="text-blue-600 hover:text-blue-800 font-semibold"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(material.id, material.name)}
                                  className="text-red-600 hover:text-red-800 font-semibold"
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={editData ? '✏️ Edit Material' : '➕ Tambah Material Baru'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Kode Material * <span className="text-xs text-gray-500">(e.g., HERB-001)</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="HERB-001"
                required
                disabled={editData !== null}
              />
              {editData && (
                <p className="text-xs text-gray-500 mt-1">Kode tidak bisa diubah</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Kategori *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nama Material *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Roundup 480 SL"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Satuan *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Manufaktur</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Monsanto"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Deskripsi singkat material..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Catatan Keamanan 
              <span className="text-xs text-gray-500 ml-2">(untuk bahan kimia)</span>
            </label>
            <textarea
              value={formData.safety_notes}
              onChange={(e) => setFormData({...formData, safety_notes: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="e.g., Gunakan APD lengkap. Hindari kontak dengan kulit..."
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
              <span className="font-medium">Material Aktif</span>
              <span className="text-sm text-gray-500">(dapat digunakan dalam transaksi)</span>
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
