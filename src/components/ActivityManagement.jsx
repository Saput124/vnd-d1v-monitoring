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
      code: formData.get('code').toUpperCase(),
      name: formData.get('name'),
      description: formData.get('description') || null,
      active: formData.get('active') === 'on'
    };

    try {
      if (editData) {
        await data.updateActivityType(editData.id, activityData);
        alert('✅ Aktivitas berhasil diupdate!');
      } else {
        await data.addActivityType(activityData);
        alert('✅ Aktivitas berhasil ditambahkan!');
      }
      closeModal();
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`❓ Yakin hapus aktivitas "${name}"?\n\nPeringatan: Semua transaksi terkait akan terpengaruh!`)) {
      return;
    }

    try {
      await data.deleteActivityType(id);
      alert('✅ Aktivitas berhasil dihapus!');
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