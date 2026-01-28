// src/components/ActivityMaterialConfiguration.jsx
// Konfigurasi Material Requirements per Activity, Stage, Kategori, dan Alternative

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Modal from './Modal';

export default function ActivityMaterialConfiguration() {
  const [configurations, setConfigurations] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // Filters
  const [filterActivity, setFilterActivity] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterMaterial, setFilterMaterial] = useState('');

  const [formData, setFormData] = useState({
    activity_type_id: '',
    material_id: '',
    stage_id: '',
    tanaman_kategori: '',
    alternative_option: '',
    default_dosis: '',
    unit: 'liter',
    required: false,
    notes: ''
  });

  const units = ['liter', 'kg', 'gram', 'botol', 'karung', 'unit', 'pack'];

  // Fetch master data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [activitiesRes, materialsRes, stagesRes] = await Promise.all([
          supabase.from('activity_types').select('*').eq('active', true).order('name'),
          supabase.from('materials').select('*').eq('active', true).order('category, name'),
          supabase.from('activity_stages').select('*').eq('active', true).order('sequence_order')
        ]);

        setActivityTypes(activitiesRes.data || []);
        setMaterials(materialsRes.data || []);
        setStages(stagesRes.data || []);
      } catch (err) {
        console.error('Error fetching master data:', err);
      }
    };

    fetchMasterData();
  }, []);

  // Fetch configurations
  const fetchConfigurations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activity_materials')
        .select(`
          *,
          activity_types (id, name, code),
          materials (id, name, code, category, manufacturer),
          activity_stages (id, name, code, sequence_order)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      setConfigurations(data || []);
    } catch (err) {
      console.error('Error fetching configurations:', err);
      alert('❌ Error loading configurations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const handleNew = () => {
    setFormData({
      activity_type_id: '',
      material_id: '',
      stage_id: '',
      tanaman_kategori: '',
      alternative_option: '',
      default_dosis: '',
      unit: 'liter',
      required: false,
      notes: ''
    });
    setEditData(null);
    setShowModal(true);
  };

  const handleEdit = (config) => {
    setFormData({
      activity_type_id: config.activity_type_id,
      material_id: config.material_id,
      stage_id: config.stage_id || '',
      tanaman_kategori: config.tanaman_kategori || '',
      alternative_option: config.alternative_option || '',
      default_dosis: config.default_dosis,
      unit: config.unit,
      required: config.required,
      notes: config.notes || ''
    });
    setEditData(config);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.activity_type_id || !formData.material_id || !formData.default_dosis || !formData.unit) {
        alert('❌ Activity, Material, Dosis, dan Unit harus diisi!');
        return;
      }

      setLoading(true);

      const dataToSave = {
        activity_type_id: formData.activity_type_id,
        material_id: formData.material_id,
        stage_id: formData.stage_id || null,
        tanaman_kategori: formData.tanaman_kategori || null,
        alternative_option: formData.alternative_option.trim() || null,
        default_dosis: parseFloat(formData.default_dosis),
        unit: formData.unit,
        required: formData.required,
        notes: formData.notes.trim() || null
      };

      if (editData) {
        // Update
        const { error } = await supabase
          .from('activity_materials')
          .update(dataToSave)
          .eq('id', editData.id);

        if (error) throw error;
        alert('✅ Konfigurasi berhasil diupdate!');
      } else {
        // Check for duplicate
        let duplicateQuery = supabase
          .from('activity_materials')
          .select('id')
          .eq('activity_type_id', dataToSave.activity_type_id)
          .eq('material_id', dataToSave.material_id);

        if (dataToSave.stage_id) {
          duplicateQuery = duplicateQuery.eq('stage_id', dataToSave.stage_id);
        } else {
          duplicateQuery = duplicateQuery.is('stage_id', null);
        }

        if (dataToSave.tanaman_kategori) {
          duplicateQuery = duplicateQuery.eq('tanaman_kategori', dataToSave.tanaman_kategori);
        } else {
          duplicateQuery = duplicateQuery.is('tanaman_kategori', null);
        }

        if (dataToSave.alternative_option) {
          duplicateQuery = duplicateQuery.eq('alternative_option', dataToSave.alternative_option);
        } else {
          duplicateQuery = duplicateQuery.is('alternative_option', null);
        }

        const { data: existing } = await duplicateQuery.single();

        if (existing) {
          alert('❌ Konfigurasi dengan kombinasi Activity, Material, Stage, Kategori, dan Alternative ini sudah ada!');
          setLoading(false);
          return;
        }

        // Insert
        const { error } = await supabase
          .from('activity_materials')
          .insert([dataToSave]);

        if (error) throw error;
        alert('✅ Konfigurasi berhasil ditambahkan!');
      }

      setShowModal(false);
      fetchConfigurations();
    } catch (err) {
      console.error('Error saving configuration:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('❓ Yakin hapus konfigurasi ini?')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('activity_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('✅ Konfigurasi berhasil dihapus!');
      fetchConfigurations();
    } catch (err) {
      console.error('Error deleting configuration:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter configurations
  const filteredConfigurations = configurations.filter(config => {
    if (filterActivity && config.activity_type_id !== filterActivity) return false;
    if (filterKategori && config.tanaman_kategori !== filterKategori) return false;
    if (filterStage && config.stage_id !== filterStage) return false;
    if (filterMaterial && config.material_id !== filterMaterial) return false;
    return true;
  });

  // Group by activity
  const configsByActivity = {};
  filteredConfigurations.forEach(config => {
    const activityName = config.activity_types?.name || 'Unknown';
    if (!configsByActivity[activityName]) {
      configsByActivity[activityName] = [];
    }
    configsByActivity[activityName].push(config);
  });

  if (loading && configurations.length === 0) {
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
          <strong>ℹ️ Material Configuration:</strong> Konfigurasi material yang dibutuhkan untuk setiap 
          aktivitas. Anda bisa menentukan dosis berbeda untuk Plant Cane (PC) vs Ratoon Cane (RC), 
          stage yang berbeda (Pre/Post Emergence), dan alternative options (Alt 1, Alt 2, Normal A, Normal B).
        </p>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">⚙️ Material Configuration</h2>
            <p className="text-gray-600 text-sm mt-1">
              Configure material requirements per activity
            </p>
          </div>
          <button
            onClick={handleNew}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 disabled:opacity-50"
          >
            ➕ Tambah Konfigurasi
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Configs</p>
            <p className="text-2xl font-bold text-blue-600">{configurations.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Required</p>
            <p className="text-2xl font-bold text-green-600">
              {configurations.filter(c => c.required).length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">PC Specific</p>
            <p className="text-2xl font-bold text-purple-600">
              {configurations.filter(c => c.tanaman_kategori === 'PC').length}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">RC Specific</p>
            <p className="text-2xl font-bold text-orange-600">
              {configurations.filter(c => c.tanaman_kategori === 'RC').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Filter Activity:</label>
            <select
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Activities</option>
              {activityTypes.map(act => (
                <option key={act.id} value={act.id}>{act.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter Kategori:</label>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Kategori</option>
              <option value="PC">PC (Plant Cane)</option>
              <option value="RC">RC (Ratoon Cane)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter Stage:</label>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Stages</option>
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Filter Material:</label>
            <select
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Materials</option>
              {materials.map(mat => (
                <option key={mat.id} value={mat.id}>
                  {mat.name} ({mat.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Configurations Table */}
        {filteredConfigurations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {Object.keys(configsByActivity).length === 0 && configurations.length === 0
                ? '📭 Belum ada konfigurasi material'
                : '🔍 Tidak ada konfigurasi yang sesuai filter'}
            </p>
            {configurations.length === 0 && (
              <button
                onClick={handleNew}
                className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
              >
                ➕ Tambah Konfigurasi Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(configsByActivity).map(([activityName, configs]) => (
              <div key={activityName} className="border rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-4 py-3">
                  <h3 className="font-bold text-lg">
                    {activityName} ({configs.length} materials)
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Material</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Category</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Kategori</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Stage</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Alternative</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Dosis</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Required</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Notes</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs.map((config, idx) => (
                        <tr key={config.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2">
                            <div>
                              <p className="font-semibold text-sm">{config.materials?.name}</p>
                              <p className="text-xs text-gray-500">{config.materials?.code}</p>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              config.materials?.category === 'herbisida' ? 'bg-green-100 text-green-800' :
                              config.materials?.category === 'pestisida' ? 'bg-red-100 text-red-800' :
                              config.materials?.category === 'pupuk' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {config.materials?.category}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {config.tanaman_kategori ? (
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                config.tanaman_kategori === 'PC' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {config.tanaman_kategori}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">Both</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {config.activity_stages?.name || '-'}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {config.alternative_option || '-'}
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-semibold">
                              {config.default_dosis} {config.unit}/ha
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {config.required ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                ✓ Yes
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                Optional
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">
                            {config.notes || '-'}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(config)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(config.id)}
                                className="text-red-600 hover:text-red-800"
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
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={editData ? '✏️ Edit Konfigurasi' : '➕ Tambah Konfigurasi Baru'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Activity Type *</label>
            <select
              value={formData.activity_type_id}
              onChange={(e) => setFormData({...formData, activity_type_id: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={editData !== null}
            >
              <option value="">-- Pilih Activity --</option>
              {activityTypes.map(act => (
                <option key={act.id} value={act.id}>{act.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Material *</label>
            <select
              value={formData.material_id}
              onChange={(e) => {
                const selectedMaterial = materials.find(m => m.id === e.target.value);
                setFormData({
                  ...formData, 
                  material_id: e.target.value,
                  unit: selectedMaterial?.unit || 'liter'
                });
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              disabled={editData !== null}
            >
              <option value="">-- Pilih Material --</option>
              {materials.map(mat => (
                <option key={mat.id} value={mat.id}>
                  {mat.name} ({mat.category} - {mat.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Stage</label>
              <select
                value={formData.stage_id}
                onChange={(e) => setFormData({...formData, stage_id: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Generic (All Stages) --</option>
                {stages.map(stage => (
                  <option key={stage.id} value={stage.id}>
                    {stage.sequence_order}. {stage.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Kategori Tanaman</label>
              <select
                value={formData.tanaman_kategori}
                onChange={(e) => setFormData({...formData, tanaman_kategori: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Both PC & RC --</option>
                <option value="PC">PC (Plant Cane)</option>
                <option value="RC">RC (Ratoon Cane)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Alternative Option 
              <span className="text-xs text-gray-500 ml-2">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.alternative_option}
              onChange={(e) => setFormData({...formData, alternative_option: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Alt 1, Alt 2, Normal A, Normal B"
            />
            <p className="text-xs text-gray-500 mt-1">
              Untuk membedakan pilihan alternative dalam stage yang sama
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Dosis per Ha *</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.default_dosis}
                onChange={(e) => setFormData({...formData, default_dosis: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 0.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Unit *</label>
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Usage instructions, warnings, etc..."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.required}
                onChange={(e) => setFormData({...formData, required: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="font-medium">Required (Auto-select)</span>
              <span className="text-sm text-gray-500">
                Material ini akan otomatis dipilih saat membuat transaksi
              </span>
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
