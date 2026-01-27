// src/components/MaterialManagement.jsx
import { useState, useMemo } from 'react';

export default function MaterialManagement({ data, loading }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    unit: '',
    description: '',
    manufacturer: '',
    active: true
  });

  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    showInactive: false
  });

  const categories = ['herbisida', 'pupuk', 'pestisida', 'alat', 'lainnya'];
  const units = ['liter', 'kg', 'gram', 'botol', 'unit'];

  const filteredMaterials = useMemo(() => {
    let filtered = data.materials || [];

    if (!filters.showInactive) {
      filtered = filtered.filter(m => m.active);
    }

    if (filters.category) {
      filtered = filtered.filter(m => m.category === filters.category);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(m =>
        m.code.toLowerCase().includes(search) ||
        m.name.toLowerCase().includes(search) ||
        (m.manufacturer && m.manufacturer.toLowerCase().includes(search))
      );
    }

    return filtered;
  }, [data.materials, filters]);

  const handleSubmit = async () => {
    if (!formData.code || !formData.name || !formData.category || !formData.unit) {
      alert('❌ Lengkapi semua field yang wajib!');
      return;
    }

    try {
      if (editingId) {
        // Update existing material
        const { error } = await data.supabase
          .from('materials')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('✅ Material berhasil diupdate!');
      } else {
        // Insert new material
        const { error } = await data.supabase
          .from('materials')
          .insert([formData]);

        if (error) throw error;
        alert('✅ Material berhasil ditambahkan!');
      }

      // Reset form
      setFormData({
        code: '',
        name: '',
        category: '',
        unit: '',
        description: '',
        manufacturer: '',
        active: true
      });
      setEditingId(null);

      // Refresh data
      await data.fetchAllData();

    } catch (err) {
      console.error('Error saving material:', err);
      alert('❌ Error: ' + err.message);
    }
  };

  const handleEdit = (material) => {
    setFormData({
      code: material.code,
      name: material.name,
      category: material.category,
      unit: material.unit,
      description: material.description || '',
      manufacturer: material.manufacturer || '',
      active: material.active
    });
    setEditingId(material.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleActive = async (materialId, currentStatus) => {
    try {
      const { error } = await data.supabase
        .from('materials')
        .update({
          active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', materialId);

      if (error) throw error;

      await data.fetchAllData();

    } catch (err) {
      console.error('Error toggling material status:', err);
      alert('❌ Error: ' + err.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      code: '',
      name: '',
      category: '',
      unit: '',
      description: '',
      manufacturer: '',
      active: true
    });
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {editingId ? '✏️ Edit Material' : '➕ Tambah Material Baru'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kode Material *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
              placeholder="e.g., HERB-001"
              className="w-full px-4 py-2 border rounded-lg"
              disabled={editingId !== null}
            />
            <p className="text-xs text-gray-500 mt-1">Format: CATEGORY-NUMBER (e.g., HERB-001)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nama Material *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Roundup 480 SL"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Kategori *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Satuan *</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">-- Pilih Satuan --</option>
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Manufacturer</label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
              placeholder="e.g., Bayer, Syngenta"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-lg">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm">Aktif</span>
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Informasi tambahan tentang material..."
              rows={3}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {editingId ? '💾 Update Material' : '➕ Tambah Material'}
          </button>
          {editingId && (
            <button
              onClick={handleCancel}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              ❌ Batal
            </button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🔍 Filter Material</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kategori</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cari</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              placeholder="Cari kode, nama, atau manufacturer..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border rounded-lg">
              <input
                type="checkbox"
                checked={filters.showInactive}
                onChange={(e) => setFilters({...filters, showInactive: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="text-sm">Tampilkan yang non-aktif</span>
            </label>
          </div>
        </div>

        <div className="text-sm text-gray-600 mt-4">
          Menampilkan <span className="font-semibold text-blue-600">{filteredMaterials.length}</span> dari <span className="font-semibold">{data.materials?.length || 0}</span> material
        </div>
      </div>

      {/* Materials List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">📦 Daftar Material</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satuan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Tidak ada material ditemukan
                  </td>
                </tr>
              ) : (
                filteredMaterials.map(material => (
                  <tr key={material.id} className={material.active ? '' : 'bg-gray-50 opacity-60'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {material.code}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {material.name}
                      {material.description && (
                        <p className="text-xs text-gray-500 mt-1">{material.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {material.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.manufacturer || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {material.active ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          Non-aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(material)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(material.id, material.active)}
                        className={material.active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                      >
                        {material.active ? '🚫 Non-aktifkan' : '✅ Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
