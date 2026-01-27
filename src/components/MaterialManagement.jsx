// src/components/MaterialManagement.jsx
// Component untuk manage materials dengan stock tracking

import { useState, useMemo } from 'react';
import { supabase } from '../utils/supabase';

export default function MaterialManagement({ data, loading, onRefresh }) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category_id: '',
    satuan: 'L',
    harga_satuan: '',
    stock_available: '',
    stock_minimum: '',
    supplier: '',
    catatan: ''
  });

  const [stockMovement, setStockMovement] = useState({
    material_id: '',
    movement_type: 'IN',
    quantity: '',
    reference_number: '',
    catatan: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [filter, setFilter] = useState({
    category: '',
    search: '',
    stock_status: ''
  });

  const filteredMaterials = useMemo(() => {
    let filtered = [...(data.materials || [])];

    if (filter.category) {
      filtered = filtered.filter(m => m.category_id === filter.category);
    }

    if (filter.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(m => 
        m.code.toLowerCase().includes(search) ||
        m.name.toLowerCase().includes(search)
      );
    }

    if (filter.stock_status) {
      filtered = filtered.filter(m => {
        const stockDiff = m.stock_available - m.stock_minimum;
        if (filter.stock_status === 'OUT_OF_STOCK') return m.stock_available <= 0;
        if (filter.stock_status === 'LOW_STOCK') return stockDiff > 0 && stockDiff <= 0;
        if (filter.stock_status === 'WARNING') return stockDiff > 0 && m.stock_available <= m.stock_minimum * 1.5;
        if (filter.stock_status === 'OK') return m.stock_available > m.stock_minimum * 1.5;
        return true;
      });
    }

    return filtered;
  }, [data.materials, filter]);

  const getStockStatus = (material) => {
    if (material.stock_available <= 0) return { status: 'OUT_OF_STOCK', color: 'red', text: 'Habis' };
    if (material.stock_available <= material.stock_minimum) return { status: 'LOW_STOCK', color: 'orange', text: 'Rendah' };
    if (material.stock_available <= material.stock_minimum * 1.5) return { status: 'WARNING', color: 'yellow', text: 'Warning' };
    return { status: 'OK', color: 'green', text: 'OK' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      alert('❌ Kode dan nama material wajib diisi!');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('materials')
          .update({
            code: formData.code,
            name: formData.name,
            category_id: formData.category_id || null,
            satuan: formData.satuan,
            harga_satuan: parseFloat(formData.harga_satuan) || null,
            stock_available: parseFloat(formData.stock_available) || 0,
            stock_minimum: parseFloat(formData.stock_minimum) || 0,
            supplier: formData.supplier || null,
            catatan: formData.catatan || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
        alert('✅ Material berhasil diupdate!');
      } else {
        const { error } = await supabase
          .from('materials')
          .insert({
            code: formData.code,
            name: formData.name,
            category_id: formData.category_id || null,
            satuan: formData.satuan,
            harga_satuan: parseFloat(formData.harga_satuan) || null,
            stock_available: parseFloat(formData.stock_available) || 0,
            stock_minimum: parseFloat(formData.stock_minimum) || 0,
            supplier: formData.supplier || null,
            catatan: formData.catatan || null
          });

        if (error) throw error;
        alert('✅ Material berhasil ditambahkan!');
      }

      resetForm();
      onRefresh?.();
    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Gagal menyimpan: ${error.message}`);
    }
  };

  const handleStockMovement = async (e) => {
    e.preventDefault();

    if (!stockMovement.material_id || !stockMovement.quantity) {
      alert('❌ Material dan jumlah wajib diisi!');
      return;
    }

    try {
      const material = data.materials.find(m => m.id === stockMovement.material_id);
      const quantity = parseFloat(stockMovement.quantity);
      const stockBefore = material.stock_available;
      let stockAfter = stockBefore;

      if (stockMovement.movement_type === 'IN') {
        stockAfter = stockBefore + quantity;
      } else if (stockMovement.movement_type === 'OUT') {
        stockAfter = stockBefore - quantity;
      } else if (stockMovement.movement_type === 'ADJUSTMENT') {
        stockAfter = quantity; // Direct adjustment
      }

      // Insert movement record
      const { error: movementError } = await supabase
        .from('material_stock_movements')
        .insert({
          material_id: stockMovement.material_id,
          movement_type: stockMovement.movement_type,
          quantity: stockMovement.movement_type === 'ADJUSTMENT' ? quantity - stockBefore : quantity,
          satuan: material.satuan,
          reference_number: stockMovement.reference_number || null,
          catatan: stockMovement.catatan || null,
          stock_before: stockBefore,
          stock_after: stockAfter,
          created_by: data.currentUser.id
        });

      if (movementError) throw movementError;

      // Update material stock
      const { error: updateError } = await supabase
        .from('materials')
        .update({
          stock_available: stockAfter,
          updated_at: new Date().toISOString()
        })
        .eq('id', stockMovement.material_id);

      if (updateError) throw updateError;

      alert('✅ Stock berhasil diupdate!');
      setStockMovement({
        material_id: '',
        movement_type: 'IN',
        quantity: '',
        reference_number: '',
        catatan: ''
      });
      setShowStockForm(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Gagal update stock: ${error.message}`);
    }
  };

  const handleEdit = (material) => {
    setFormData({
      code: material.code,
      name: material.name,
      category_id: material.category_id || '',
      satuan: material.satuan,
      harga_satuan: material.harga_satuan || '',
      stock_available: material.stock_available,
      stock_minimum: material.stock_minimum,
      supplier: material.supplier || '',
      catatan: material.catatan || ''
    });
    setEditingId(material.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('❓ Hapus material ini?')) return;

    try {
      const { error } = await supabase
        .from('materials')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      alert('✅ Material berhasil dihapus!');
      onRefresh?.();
    } catch (error) {
      console.error('Error:', error);
      alert(`❌ Gagal menghapus: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category_id: '',
      satuan: 'L',
      harga_satuan: '',
      stock_available: '',
      stock_minimum: '',
      supplier: '',
      catatan: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-8">Loading materials...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🧪 Material Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStockForm(!showStockForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📦 Kelola Stock
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ➕ Tambah Material
          </button>
        </div>
      </div>

      {/* Stock Movement Form */}
      {showStockForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">📦 Update Stock Material</h3>
          <form onSubmit={handleStockMovement} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Material *</label>
                <select
                  value={stockMovement.material_id}
                  onChange={(e) => setStockMovement({...stockMovement, material_id: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">-- Pilih Material --</option>
                  {data.materials?.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} (Stock: {m.stock_available} {m.satuan})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipe Pergerakan *</label>
                <select
                  value={stockMovement.movement_type}
                  onChange={(e) => setStockMovement({...stockMovement, movement_type: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="IN">Masuk (IN)</option>
                  <option value="OUT">Keluar (OUT)</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Jumlah *</label>
                <input
                  type="number"
                  step="0.01"
                  value={stockMovement.quantity}
                  onChange={(e) => setStockMovement({...stockMovement, quantity: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">No. Referensi</label>
                <input
                  type="text"
                  value={stockMovement.reference_number}
                  onChange={(e) => setStockMovement({...stockMovement, reference_number: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="PO-001, DO-123, dll"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Catatan</label>
                <textarea
                  value={stockMovement.catatan}
                  onChange={(e) => setStockMovement({...stockMovement, catatan: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Catatan pergerakan stock..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                💾 Simpan
              </button>
              <button
                type="button"
                onClick={() => setShowStockForm(false)}
                className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Material Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">
            {editingId ? '✏️ Edit Material' : '➕ Tambah Material'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kode *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="PEST-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Nama *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Decis 2.5 EC"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kategori</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {data.materialCategories?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Satuan *</label>
                <select
                  value={formData.satuan}
                  onChange={(e) => setFormData({...formData, satuan: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="L">Liter</option>
                  <option value="Kg">Kg</option>
                  <option value="Gram">Gram</option>
                  <option value="mL">mL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Harga Satuan</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.harga_satuan}
                  onChange={(e) => setFormData({...formData, harga_satuan: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stock Awal</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.stock_available}
                  onChange={(e) => setFormData({...formData, stock_available: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stock Minimum</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.stock_minimum}
                  onChange={(e) => setFormData({...formData, stock_minimum: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="PT Supplier ABC"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Catatan</label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({...formData, catatan: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                💾 Simpan
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Kategori</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({...filter, category: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="">Semua Kategori</option>
              {data.materialCategories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Status Stock</label>
            <select
              value={filter.stock_status}
              onChange={(e) => setFilter({...filter, stock_status: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
            >
              <option value="">Semua Status</option>
              <option value="OUT_OF_STOCK">Habis</option>
              <option value="LOW_STOCK">Rendah</option>
              <option value="WARNING">Warning</option>
              <option value="OK">OK</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Cari</label>
            <input
              type="text"
              placeholder="Kode atau nama..."
              value={filter.search}
              onChange={(e) => setFilter({...filter, search: e.target.value})}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Kode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Minimum</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Harga</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMaterials.map(material => {
                const status = getStockStatus(material);
                const category = data.materialCategories?.find(c => c.id === material.category_id);
                
                return (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{material.code}</td>
                    <td className="px-4 py-3">{material.name}</td>
                    <td className="px-4 py-3 text-sm">{category?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{material.stock_available}</span> {material.satuan}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {material.stock_minimum} {material.satuan}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {material.harga_satuan ? `Rp ${material.harga_satuan.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredMaterials.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada material ditemukan
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
