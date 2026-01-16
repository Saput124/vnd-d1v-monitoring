import { useState } from 'react';
import Modal from './Modal';

export default function MasterData({ data, loading }) {
  const [activeTab, setActiveTab] = useState('vendors');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editData, setEditData] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState('');

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

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const blockData = {
      code: formData.get('code'),
      name: formData.get('name'),
      zone: formData.get('zone'),
      kategori: formData.get('kategori'),
      varietas: formData.get('varietas'),
      luas_total: parseFloat(formData.get('luas_total'))
    };

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

  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
      alert('❌ Data kosong!');
      return;
    }

    try {
      const lines = bulkData.trim().split('\n');
      const records = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Format: KODE | NAMA | ZONE | KATEGORI | VARIETAS | LUAS
        const parts = line.split('|').map(p => p.trim());
        
        if (parts.length !== 6) {
          alert(`❌ Baris ${i + 1} format salah! Harusnya: KODE | NAMA | ZONE | KATEGORI | VARIETAS | LUAS`);
          return;
        }

        records.push({
          code: parts[0],
          name: parts[1],
          zone: parts[2],
          kategori: parts[3],
          varietas: parts[4],
          luas_total: parseFloat(parts[5])
        });
      }

      // Bulk insert
      for (const record of records) {
        await data.addBlock(record);
      }

      alert(`✅ Berhasil import ${records.length} blok!`);
      setShowBulkModal(false);
      setBulkData('');
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

      {/* Vendors Tab */}
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

      {/* Blocks Tab */}
      {activeTab === 'blocks' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Master Data Blok</strong> hanya berisi data fisik blok kebun (kode, nama, zone, luas). 
              Untuk registrasi blok ke aktivitas (Tanam, Kelentek, dll), gunakan tab <strong>"Block Registration"</strong>.
            </p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">🗺️ Daftar Blok (Physical)</h3>
            <div className="flex gap-2">
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
            </div>
          </div>

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
                  <th className="px-4 py-3 text-left text-sm font-semibold">Luas Total (Ha)</th>
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
                        block.kategori === 'PC' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
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
                        <button
                          onClick={() => handleDelete('block', block.id, block.name)}
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

      {/* Workers Tab */}
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

      {/* Existing Modals (Vendor, Block, Worker) - TETAP SAMA */}
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

<Modal show={showModal && modalType === 'block'} onClose={closeModal} title={editData ? 'Edit Blok' : 'Tambah Blok'}>
        <form onSubmit={handleBlockSubmit} className="space-y-4">
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
          
          {/* TAMBAH KATEGORI */}
          <div>
            <label className="block text-sm font-medium mb-2">Kategori</label>
            <select name="kategori" defaultValue={editData?.kategori || ''} required className="w-full px-4 py-2 border rounded-lg">
              <option value="">-- Pilih Kategori --</option>
              <option value="PC">PC (Plant Cane)</option>
              <option value="RC">RC (Ratoon Cane)</option>
            </select>
          </div>

          {/* TAMBAH VARIETAS */}
          <div>
            <label className="block text-sm font-medium mb-2">Varietas</label>
            <select name="varietas" defaultValue={editData?.varietas || ''} required className="w-full px-4 py-2 border rounded-lg">
              <option value="">-- Pilih Varietas --</option>
              <option value="PS881">PS881</option>
              <option value="PS862">PS862</option>
              <option value="PS864">PS864</option>
            </select>
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

      {/* NEW: Bulk Import Modal */}
      <Modal show={showBulkModal} onClose={() => setShowBulkModal(false)} title="📋 Bulk Import Blok">
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-yellow-900 mb-2">Format Input:</p>
            <p className="font-mono text-xs text-yellow-800">
              KODE | NAMA | ZONE | KATEGORI | VARIETAS | LUAS
            </p>
            <p className="text-yellow-700 mt-2">Contoh:</p>
            <div className="font-mono text-xs bg-white p-2 rounded mt-1">
              BLOK-011 | Blok K | Zone 1 | PC | PS881 | 7.5<br/>
              BLOK-012 | Blok L | Zone 2 | RC | PS862 | 8.0<br/>
              BLOK-013 | Blok M | Zone 2 | PC | PS864 | 6.5
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Paste Data (satu baris per blok)
            </label>
            <textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
              rows={10}
              placeholder="BLOK-011 | Blok K | Zone 1 | 7.5&#10;BLOK-012 | Blok L | Zone 2 | 8.0"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBulkImport}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
            >
              📥 Import
            </button>
            <button
              onClick={() => {
                setShowBulkModal(false);
                setBulkData('');
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