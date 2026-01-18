// src/components/MasterData.jsx - FIXED WITH SECTION

import { useState, useEffect } from 'react';
import Modal from './Modal';

export default function MasterData({ data, loading }) {
  const [activeTab, setActiveTab] = useState('vendors');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editData, setEditData] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [sections, setSections] = useState([]);
  
  // State untuk bulk import dengan tabel
  const [bulkRows, setBulkRows] = useState([
    { code: '', name: '', zone: '', kategori: '', varietas: '', luas_total: '', section_id: '' }
  ]);

  // Fetch sections for dropdown
  useEffect(() => {
    const fetchSections = async () => {
      const { data: sectionsData } = await data.supabase
        .from('sections')
        .select('*')
        .order('name');
      
      setSections(sectionsData || []);
    };
    
    fetchSections();
  }, [data.supabase]);

  // Function untuk update single cell
  const updateBulkRow = (index, field, value) => {
    const newRows = [...bulkRows];
    newRows[index][field] = value;
    setBulkRows(newRows);
  };

  const openModal = (type, data = null) => {
    setModalType(type);
    setEditData(data);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditData(null);
  };

  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const vendorData = {
      code: formData.get('code'),
      name: formData.get('name'),
      contact_person: formData.get('contact_person'),
      phone: formData.get('phone')
    };

    try {
      if (editData) {
        await data.updateVendor(editData.id, vendorData);
        alert('✅ Vendor berhasil diupdate!');
      } else {
        await data.addVendor(vendorData);
        alert('✅ Vendor berhasil ditambahkan!');
      }
      closeModal();
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const parseDecimal = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    return parseFloat(value.toString().replace(',', '.'));
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const blockData = {
      code: formData.get('code'),
      name: formData.get('name'),
      zone: formData.get('zone'),
      kategori: formData.get('kategori'),
      varietas: formData.get('varietas'),
      luas_total: parseDecimal(formData.get('luas_total')),
      section_id: formData.get('section_id') || null
    };

    // Auto-assign section untuk non-admin jika tidak dipilih
    if (!blockData.section_id && data.currentUser?.role !== 'admin' && data.currentUser?.section_id) {
      blockData.section_id = data.currentUser.section_id;
    }

    try {
      if (editData) {
        await data.updateBlock(editData.id, blockData);
        alert('✅ Blok berhasil diupdate!');
      } else {
        await data.addBlock(blockData);
        alert('✅ Blok berhasil ditambahkan!');
      }
      closeModal();
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handleWorkerSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const workerData = {
      vendor_id: formData.get('vendor_id'),
      worker_code: formData.get('worker_code'),
      name: formData.get('name')
    };

    try {
      if (editData) {
        await data.updateWorker(editData.id, workerData);
        alert('✅ Pekerja berhasil diupdate!');
      } else {
        await data.addWorker(workerData);
        alert('✅ Pekerja berhasil ditambahkan!');
      }
      closeModal();
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handlePasteFromExcel = (e, startRowIndex = 0, startField = 'code') => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    
    if (!pastedText || pastedText.trim() === '') {
      alert('❌ Tidak ada data yang di-paste!');
      return;
    }
    
    const lines = pastedText.trim().split('\n');
    const newRows = [];
    const fields = ['code', 'name', 'zone', 'kategori', 'varietas', 'luas_total'];
    const startFieldIndex = fields.indexOf(startField);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      let cols;
      if (line.includes('\t')) {
        cols = line.split('\t').map(c => c.trim());
      } else if (line.includes('|')) {
        cols = line.split('|').map(c => c.trim());
      } else {
        if (startFieldIndex >= 0) {
          const row = { code: '', name: '', zone: '', kategori: '', varietas: '', luas_total: '', section_id: '' };
          row[startField] = line;
          newRows.push(row);
        }
        continue;
      }
      
      const firstCol = (cols[0] || '').toLowerCase();
      if (firstCol.includes('kode') || firstCol.includes('code') ||
          firstCol.includes('nama') || firstCol.includes('name')) {
        continue;
      }
      
      const row = { code: '', name: '', zone: '', kategori: '', varietas: '', luas_total: '', section_id: '' };
      
      for (let j = 0; j < cols.length && (startFieldIndex + j) < fields.length; j++) {
        const fieldName = fields[startFieldIndex + j];
        row[fieldName] = cols[j] || '';
      }
      
      if (!row.code && !row.name && !row.zone) {
        continue;
      }
      
      newRows.push(row);
    }
    
    if (newRows.length === 0) {
      alert('❌ Tidak ada data valid yang berhasil di-parse!');
      return;
    }
    
    if (startRowIndex === 0) {
      setBulkRows(newRows);
    } else {
      const updatedRows = [...bulkRows];
      updatedRows.splice(startRowIndex, Math.min(newRows.length, updatedRows.length - startRowIndex), ...newRows);
      if (newRows.length > updatedRows.length - startRowIndex) {
        updatedRows.push(...newRows.slice(updatedRows.length - startRowIndex));
      }
      setBulkRows(updatedRows);
    }
    
    alert(`✅ Berhasil paste ${newRows.length} baris!`);
  };

  const addBulkRow = () => {
    setBulkRows([...bulkRows, { code: '', name: '', zone: '', kategori: '', varietas: '', luas_total: '', section_id: '' }]);
  };

  const removeBulkRow = (index) => {
    if (bulkRows.length > 1) {
      setBulkRows(bulkRows.filter((_, i) => i !== index));
    }
  };

  const handleBulkImport = async () => {
    const validRows = bulkRows.filter(row => row.code && row.name && row.zone);
    
    if (validRows.length === 0) {
      alert('❌ Tidak ada data yang valid untuk diimport!');
      return;
    }

    // Default section untuk bulk import (non-admin)
    const defaultSectionId = data.currentUser?.role !== 'admin' && data.currentUser?.section_id
      ? data.currentUser.section_id
      : null;

    try {
      for (const row of validRows) {
        await data.addBlock({
          code: row.code,
          name: row.name,
          zone: row.zone,
          kategori: row.kategori,
          varietas: row.varietas,
          luas_total: parseDecimal(row.luas_total) || 0,
          section_id: row.section_id || defaultSectionId
        });
      }

      alert(`✅ Berhasil import ${validRows.length} blok!`);
      setShowBulkModal(false);
      setBulkRows([{ code: '', name: '', zone: '', kategori: '', varietas: '', luas_total: '', section_id: '' }]);
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };
  
  const handleDelete = async (type, id, name) => {
    if (!confirm(`❓ Yakin hapus ${name}?`)) return;

    try {
      if (type === 'vendor') await data.deleteVendor(id);
      if (type === 'block') await data.deleteBlock(id);
      if (type === 'worker') await data.deleteWorker(id);
      alert('✅ Data berhasil dihapus!');
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
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'vendors'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            👥 Vendors ({data.vendors.length})
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'blocks'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🗺️ Blocks ({data.blocks.length})
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'workers'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            👷 Workers ({data.workers.length})
          </button>
        </div>
      </div>

      {/* Vendors Tab - NO CHANGES */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">👥 Daftar Vendor</h3>
            <button
              onClick={() => openModal('vendor')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
            >
              ➕ Tambah Vendor
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold">No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Kode</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Nama Vendor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Contact Person</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.vendors.map((vendor, i) => (
                  <tr key={vendor.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono">{vendor.code}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{vendor.name}</td>
                    <td className="px-4 py-3 text-sm">{vendor.contact_person || '-'}</td>
                    <td className="px-4 py-3 text-sm">{vendor.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal('vendor', vendor)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete('vendor', vendor.id, vendor.name)}
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
        </div>
      )}

      {/* Blocks Tab - WITH SECTION COLUMN */}
      {activeTab === 'blocks' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Master Data Blok</strong> adalah pool blok divisi yang bisa diakses semua section. 
              Section "mengklaim" blok via <strong>Block Registration</strong> untuk aktivitas mereka.
              1 blok fisik bisa di-registrasi untuk multiple aktivitas berbeda.
            </p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">🗺️ Master Blok Divisi (Pool)</h3>
            <div className="flex gap-2">
              {(data.currentUser?.role === 'admin' || ['section_head', 'supervisor'].includes(data.currentUser?.role)) && (
                <>
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
                  >
                    📋 Bulk Import
                  </button>
                  <button
                    onClick={() => openModal('block')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    ➕ Tambah Blok
                  </button>
                </>
              )}
            </div>
          </div>

          {data.blocks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {data.currentUser?.role === 'vendor' 
                ? 'Vendor tidak perlu akses Master Blocks. Gunakan Block Registration untuk input transaksi.'
                : 'Belum ada master blocks. Klik "Tambah Blok" untuk menambahkan.'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold">No</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Kode</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Nama Blok</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Zone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Kategori</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Varietas</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Luas (Ha)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.blocks.map((block, i) => (
                    <tr key={block.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-mono">{block.code}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{block.name}</td>
                      <td className="px-4 py-3 text-sm">{block.zone}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          block.kategori === 'PC' ? 'bg-green-100 text-green-800' : 
                          block.kategori === 'RC' ? 'bg-blue-100 text-blue-800' : 
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {block.kategori || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{block.varietas || '-'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">{block.luas_total} Ha</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal('block', block)}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            ✏️
                          </button>
                          {data.currentUser?.role === 'admin' && (
                            <button
                              onClick={() => handleDelete('block', block.id, block.name)}
                              className="text-red-600 hover:text-red-800 font-semibold"
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
      )}

      {/* Workers Tab - NO CHANGES... (rest of component continues) */}
      {activeTab === 'workers' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">👷 Daftar Pekerja</h3>
            <button
              onClick={() => openModal('worker')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
            >
              ➕ Tambah Pekerja
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-3 text-left text-sm font-semibold">No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Kode</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Nama Pekerja</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Vendor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.workers.map((worker, i) => (
                  <tr key={worker.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-mono">{worker.worker_code}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{worker.name}</td>
                    <td className="px-4 py-3 text-sm">{worker.vendors?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal('worker', worker)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete('worker', worker.id, worker.name)}
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
        </div>
      )}

      {/* Modal: Vendor - NO CHANGES */}
      <Modal show={showModal && modalType === 'vendor'} onClose={closeModal} title={editData ? 'Edit Vendor' : 'Tambah Vendor'}>
        <form onSubmit={handleVendorSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kode Vendor</label>
            <input name="code" defaultValue={editData?.code || ''} required className="w-full px-4 py-2 border rounded-lg" placeholder="VND-A" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nama Vendor</label>
            <input name="name" defaultValue={editData?.name || ''} required className="w-full px-4 py-2 border rounded-lg" placeholder="PT Maju Jaya" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Person</label>
            <input name="contact_person" defaultValue={editData?.contact_person || ''} className="w-full px-4 py-2 border rounded-lg" placeholder="Budi Santoso" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input name="phone" defaultValue={editData?.phone || ''} className="w-full px-4 py-2 border rounded-lg" placeholder="081234567890" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Simpan</button>
            <button type="button" onClick={closeModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Batal</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Block - WITH SECTION DROPDOWN */}
      <Modal show={showModal && modalType === 'block'} onClose={closeModal} title={editData ? 'Edit Blok' : 'Tambah Blok'}>
        <form onSubmit={handleBlockSubmit} className="space-y-4">
          {/* Section Assignment */}
          {data.currentUser?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium mb-2">Section *</label>
              <select name="section_id" defaultValue={editData?.section_id || ''} required className="w-full px-4 py-2 border rounded-lg">
                <option value="">-- Pilih Section --</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">⚠️ Pilih section tempat blok ini berada</p>
            </div>
          )}

          {data.currentUser?.role !== 'admin' && data.currentUser?.section_name && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Section:</strong> {data.currentUser.section_name}
                <input type="hidden" name="section_id" value={data.currentUser.section_id} />
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Kode Blok</label>
            <input name="code" defaultValue={editData?.code || ''} required className="w-full px-4 py-2 border rounded-lg" placeholder="BLOK-001" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nama Blok</label>
            <input name="name" defaultValue={editData?.name || ''} required className="w-full px-4 py-2 border rounded-lg" placeholder="Blok A" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Zone</label>
            <input name="zone" defaultValue={editData?.zone || ''} required className="w-full px-4 py-2 border rounded-lg" placeholder="Zone 1" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Kategori</label>
            <select name="kategori" defaultValue={editData?.kategori || ''} required className="w-full px-4 py-2 border rounded-lg">
              <option value="">-- Pilih Kategori --</option>
              <option value="PC">PC (Plant Cane)</option>
              <option value="RC">RC (Ratoon Cane)</option>
              <option value="R1">R1 (Ratoon 1)</option>
              <option value="R2">R2 (Ratoon 2)</option>
              <option value="R3">R3 (Ratoon 3)</option>
              <option value="Bibit">Bibit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Varietas</label>
            <input 
              name="varietas" 
              defaultValue={editData?.varietas || ''} 
              required 
              className="w-full px-4 py-2 border rounded-lg" 
              placeholder="Contoh: PS881, PS862, PS864"
              list="varietas-list"
            />
            <datalist id="varietas-list">
              <option value="PS881" />
              <option value="PS862" />
              <option value="PS864" />
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Luas Total (Ha)</label>
            <input name="luas_total" type="number" step="0.01" defaultValue={editData?.luas_total || ''} required className="w-full px-4 py-2 border rounded-lg" placeholder="8.00" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Simpan</button>
            <button type="button" onClick={closeModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Batal</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Worker */}
      <Modal show={showModal && modalType === 'worker'} onClose={closeModal} title={editData ? 'Edit Pekerja' : 'Tambah Pekerja'}>
        <form onSubmit={handleWorkerSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kode Pekerja</label>
            <input name="worker_code" defaultValue={editData?.worker_code || ''} required className="w-full px-4 py-2 border rounded-lg" placeholder="P001" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nama Pekerja</label>
            <input name="name" defaultValue={editData?.name || ''} required className="w-full px-4 py-2 border rounded-lg" placeholder="Budi Santoso" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Vendor</label>
            <select name="vendor_id" defaultValue={editData?.vendor_id || ''} required className="w-full px-4 py-2 border rounded-lg">
              <option value="">-- Pilih Vendor --</option>
              {data.vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Simpan</button>
            <button type="button" onClick={closeModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Batal</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Bulk Import */}
      <Modal show={showBulkModal} onClose={() => setShowBulkModal(false)} title="📋 Bulk Import Blok">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm space-y-2">
            <p className="font-semibold text-blue-900">📌 Cara Import dari Excel:</p>
            <ol className="text-blue-800 space-y-1 ml-4 list-decimal">
              <li><strong>Select 6 kolom</strong> dari Excel (Kode, Nama, Zone, Kategori, Varietas, Luas)</li>
              <li><strong>Copy</strong> (Ctrl+C / Cmd+C)</li>
              <li><strong>Klik di baris pertama</strong> kolom "Kode" di tabel bawah</li>
              <li><strong>Paste</strong> (Ctrl+V / Cmd+V)</li>
              <li>Data otomatis terisi ke semua baris & kolom</li>
              <li>Periksa data, lalu klik <strong>Import</strong></li>
            </ol>
          </div>

          <div className="overflow-x-auto max-h-96 border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold">No</th>
                  <th className="px-2 py-2 text-left font-semibold">Kode</th>
                  <th className="px-2 py-2 text-left font-semibold">Nama Blok</th>
                  <th className="px-2 py-2 text-left font-semibold">Zone</th>
                  <th className="px-2 py-2 text-left font-semibold">Kategori</th>
                  <th className="px-2 py-2 text-left font-semibold">Varietas</th>
                  <th className="px-2 py-2 text-left font-semibold">Luas (Ha)</th>
                  {data.currentUser?.role === 'admin' && (
                    <th className="px-2 py-2 text-left font-semibold">Section</th>
                  )}
                  <th className="px-2 py-2 text-left font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {bulkRows.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-2 text-center">{index + 1}</td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={row.code}
                        onChange={(e) => updateBulkRow(index, 'code', e.target.value)}
                        onPaste={index === 0 ? handlePasteFromExcel : undefined}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="BLOK-001"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateBulkRow(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="Blok A"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={row.zone}
                        onChange={(e) => updateBulkRow(index, 'zone', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="Zone 1"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={row.kategori}
                        onChange={(e) => updateBulkRow(index, 'kategori', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="">--</option>
                        <option value="PC">PC</option>
                        <option value="RC">RC</option>
                        <option value="R1">R1</option>
                        <option value="R2">R2</option>
                        <option value="R3">R3</option>
                        <option value="Bibit">Bibit</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={row.varietas}
                        onChange={(e) => updateBulkRow(index, 'varietas', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="PS881"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={row.luas_total}
                        onChange={(e) => updateBulkRow(index, 'luas_total', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="8.00"
                      />
                    </td>
                    {data.currentUser?.role === 'admin' && (
                      <td className="px-2 py-2">
                        <select
                          value={row.section_id}
                          onChange={(e) => updateBulkRow(index, 'section_id', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        >
                          <option value="">--</option>
                          {sections.map(s => (
                            <option key={s.id} value={s.id}>{s.code}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => removeBulkRow(index)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                        disabled={bulkRows.length === 1}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={addBulkRow}
              className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 font-semibold"
            >
              ➕ Tambah Baris
            </button>
            <button
              onClick={handleBulkImport}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
            >
              📥 Import ({bulkRows.filter(r => r.code && r.name && r.zone).length} valid)
            </button>
            <button
              onClick={() => {
                setShowBulkModal(false);
                setBulkRows([{ code: '', name: '', zone: '', kategori: '', varietas: '', luas_total: '', section_id: '' }]);
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}