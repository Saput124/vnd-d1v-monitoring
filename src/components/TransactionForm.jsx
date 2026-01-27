// src/components/TransactionForm.jsx - FIXED VERSION
// Filter blok berdasarkan activity + vendor assignment

import { useState, useMemo, useEffect } from 'react';
  
export default function TransactionForm({ data, loading }) {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    vendor_id: '',
    activity_type_id: '',
    execution_number: 1,
    kondisi: '',
    selectedBlocks: [],
    workerMode: 'manual',
    jumlahPekerja: '',
    selectedWorkers: [],
    estimasi_ton: '',
    actual_ton: '',
    varietas_override: '',
    materials: [],
    catatan: ''
  });

  const [blockFilters, setBlockFilters] = useState({
    zone: '',
    kategori: '',
    search: ''
  });

  // 🔥 AUTO-FILL VENDOR for vendor role
  useEffect(() => {
    if (data.currentUser?.role === 'vendor' && data.currentUser?.vendor_id) {
      setFormData(prev => ({
        ...prev,
        vendor_id: data.currentUser.vendor_id
      }));
    }
  }, [data.currentUser]);

  const selectedActivity = useMemo(() => {
    return data.activityTypes.find(a => a.id === formData.activity_type_id);
  }, [formData.activity_type_id, data.activityTypes]);

  // ⭐ FIXED: Filter blok by activity + vendor assignment
  const availableBlocks = useMemo(() => {
    if (!formData.activity_type_id) return [];

    // Start: Filter by selected activity & not completed
    let filtered = data.blockActivities.filter(ba => 
      ba.activity_type_id === formData.activity_type_id &&
      ba.status !== 'completed' &&
      ba.status !== 'cancelled'
    );

    // ⭐ VENDOR: Filter by assigned sections + activities
    if (data.currentUser?.role === 'vendor') {
      // Get vendor's assignments for this specific activity
      const assignedSectionIds = data.vendorAssignments
        ?.filter(va => 
          va.vendor_id === data.currentUser.vendor_id &&
          va.activity_type_id === formData.activity_type_id
        )
        .map(va => va.section_id) || [];

      if (assignedSectionIds.length === 0) {
        // Vendor not assigned to any section for this activity
        return [];
      }

      filtered = filtered.filter(ba => 
        assignedSectionIds.includes(ba.section_id)
      );
    }

    // ⭐ SECTION STAFF: Filter by own section only
    if (['section_head', 'supervisor'].includes(data.currentUser?.role)) {
      filtered = filtered.filter(ba => 
        ba.section_id === data.currentUser.section_id
      );
    }

    // Apply zone filter
    if (blockFilters.zone) {
      filtered = filtered.filter(ba => {
        const block = data.blocks.find(b => b.id === ba.block_id);
        return block?.zone === blockFilters.zone;
      });
    }

    // Apply kategori filter
    if (blockFilters.kategori) {
      filtered = filtered.filter(ba => ba.kategori === blockFilters.kategori);
    }

    // Apply search filter
    if (blockFilters.search) {
      const search = blockFilters.search.toLowerCase();
      filtered = filtered.filter(ba => {
        const block = data.blocks.find(b => b.id === ba.block_id);
        return block?.name.toLowerCase().includes(search) ||
               block?.code.toLowerCase().includes(search);
      });
    }

    // Map to include block details
    return filtered.map(ba => {
      const block = data.blocks.find(b => b.id === ba.block_id);
      return {
        ...ba,
        block_code: block?.code,
        block_name: block?.name,
        block_zone: block?.zone,
        block_luas_total: block?.luas_total
      };
    });
  }, [
    formData.activity_type_id, 
    formData.execution_number, 
    data.blockActivities, 
    data.blocks, 
    blockFilters,
    data.currentUser,
    data.vendorAssignments // ⭐ Added dependency
  ]);

  const availableWorkers = useMemo(() => {
    if (!formData.vendor_id) return [];
    return data.workers.filter(w => w.vendor_id === formData.vendor_id);
  }, [formData.vendor_id, data.workers]);

  const uniqueZones = [...new Set(data.blocks.map(b => b.zone))];
  const uniqueKategori = [...new Set(data.blocks.map(b => b.kategori).filter(Boolean))];

  const toggleBlock = (blockActivityId) => {
    const exists = formData.selectedBlocks.find(b => b.id === blockActivityId);
    if (exists) {
      setFormData(prev => ({
        ...prev,
        selectedBlocks: prev.selectedBlocks.filter(b => b.id !== blockActivityId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedBlocks: [...prev.selectedBlocks, { id: blockActivityId, luasan: '' }]
      }));
    }
  };

  const updateBlockLuasan = (blockActivityId, luasan) => {
    setFormData(prev => ({
      ...prev,
      selectedBlocks: prev.selectedBlocks.map(b =>
        b.id === blockActivityId ? { ...b, luasan: luasan } : b
      )
    }));
  };

  const toggleWorker = (workerId) => {
    setFormData(prev => ({
      ...prev,
      selectedWorkers: prev.selectedWorkers.includes(workerId)
        ? prev.selectedWorkers.filter(id => id !== workerId)
        : [...prev.selectedWorkers, workerId]
    }));
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { name: '', dosis: '' }]
    }));
  };

  const updateMaterial = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const totalLuasan = useMemo(() => {
    return formData.selectedBlocks.reduce((sum, b) => sum + (parseFloat(b.luasan) || 0), 0);
  }, [formData.selectedBlocks]);

  const totalPekerja = useMemo(() => {
    if (formData.workerMode === 'manual') {
      return parseInt(formData.jumlahPekerja) || 0;
    }
    return formData.selectedWorkers.length;
  }, [formData.workerMode, formData.jumlahPekerja, formData.selectedWorkers]);

  const handleSubmit = async () => {
    if (!formData.vendor_id) {
      alert('❌ Pilih vendor!');
      return;
    }
    if (!formData.activity_type_id) {
      alert('❌ Pilih aktivitas!');
      return;
    }
    if (formData.selectedBlocks.length === 0) {
      alert('❌ Pilih minimal 1 blok!');
      return;
    }

    for (const sb of formData.selectedBlocks) {
      if (!sb.luasan || parseFloat(sb.luasan) <= 0) {
        alert('❌ Isi luasan untuk semua blok yang dipilih!');
        return;
      }
      const ba = availableBlocks.find(b => b.id === sb.id);
      if (parseFloat(sb.luasan) > ba.luas_sisa) {
        alert(`❌ Luasan blok ${ba.block_name} melebihi sisa! Max: ${ba.luas_sisa} Ha`);
        return;
      }
    }

    if (totalPekerja === 0) {
      alert('❌ Input jumlah pekerja atau pilih dari daftar!');
      return;
    }

    if (selectedActivity?.code === 'KELENTEK' || 
        selectedActivity?.code === 'WEEDING' || 
        selectedActivity?.code === 'WEED_CONTROL') {
      if (!formData.kondisi) {
        alert('❌ Pilih kondisi!');
        return;
      }
    }

    if (selectedActivity?.code === 'PANEN' && !formData.estimasi_ton) {
      alert('❌ Isi estimasi ton!');
      return;
    }

    if (selectedActivity?.code === 'WEED_CONTROL') {
      if (formData.materials.length === 0) {
        alert('❌ Tambahkan minimal 1 herbisida!');
        return;
      }
      for (const m of formData.materials) {
        if (!m.name || !m.dosis) {
          alert('❌ Lengkapi data herbisida!');
          return;
        }
      }
    }

    try {
      const transCode = `TRX-${Date.now()}`;
      
      // Get section_id from first selected block
      const firstBlockActivity = availableBlocks.find(ba => ba.id === formData.selectedBlocks[0].id);
      const sectionId = firstBlockActivity.section_id;

      const { data: transData, error: transError } = await data.supabase
        .from('transactions')
        .insert([{
          transaction_code: transCode,
          tanggal: formData.tanggal,
          vendor_id: formData.vendor_id,
          activity_type_id: formData.activity_type_id,
          section_id: sectionId, // ⭐ Get from block_activity
          jumlah_pekerja: totalPekerja,
          kondisi: formData.kondisi || null,
          catatan: formData.catatan || null,
          created_by: data.currentUser?.id
        }])
        .select()
        .single();

      if (transError) throw transError;

      const blockInserts = formData.selectedBlocks.map(sb => ({
        transaction_id: transData.id,
        block_activity_id: sb.id,
        luas_dikerjakan: parseFloat(sb.luasan)
      }));

      const { error: blocksError } = await data.supabase
        .from('transaction_blocks')
        .insert(blockInserts);

      if (blocksError) throw blocksError;

      if (formData.workerMode === 'list' && formData.selectedWorkers.length > 0) {
        const workerInserts = formData.selectedWorkers.map(wid => ({
          transaction_id: transData.id,
          worker_id: wid
        }));

        const { error: workersError } = await data.supabase
          .from('transaction_workers')
          .insert(workerInserts);

        if (workersError) throw workersError;
      }

      if (selectedActivity?.code === 'TANAM') {
        const { error: tanamError } = await data.supabase
          .from('transaction_tanam')
          .insert([{
            transaction_id: transData.id,
            varietas: formData.varietas_override || availableBlocks[0]?.varietas || ''
          }]);

        if (tanamError) throw tanamError;
      }

      if (selectedActivity?.code === 'PANEN') {
        const { error: panenError } = await data.supabase
          .from('transaction_panen')
          .insert([{
            transaction_id: transData.id,
            estimasi_ton: parseFloat(formData.estimasi_ton) || null,
            actual_ton: parseFloat(formData.actual_ton) || null
          }]);

        if (panenError) throw panenError;
      }

      if (selectedActivity?.code === 'WEED_CONTROL') {
        const materialInserts = formData.materials.map(m => ({
          transaction_id: transData.id,
          material_name: m.name,
          dosis_per_ha: parseFloat(m.dosis),
          luasan_aplikasi: totalLuasan
        }));

        const { error: materialsError } = await data.supabase
          .from('transaction_materials')
          .insert(materialInserts);

        if (materialsError) throw materialsError;
      }

      alert(`✅ Transaksi berhasil disimpan!\n\nKode: ${transCode}\nTotal Luasan: ${totalLuasan.toFixed(2)} Ha\nPekerja: ${totalPekerja} orang`);

      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        vendor_id: data.currentUser?.role === 'vendor' ? data.currentUser.vendor_id : '',
        activity_type_id: '',
        execution_number: 1,
        kondisi: '',
        selectedBlocks: [],
        workerMode: 'manual',
        jumlahPekerja: '',
        selectedWorkers: [],
        estimasi_ton: '',
        actual_ton: '',
        varietas_override: '',
        materials: [],
        catatan: ''
      });

      await data.fetchAllData();

    } catch (err) {
      console.error('Error submitting transaction:', err);
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          ➕ Input Transaksi Baru
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tanggal *</label>
              <input
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Vendor *</label>
              {data.currentUser?.role === 'vendor' ? (
                <input
                  type="text"
                  value={data.vendors.find(v => v.id === data.currentUser?.vendor_id)?.name || 'Loading...'}
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                  disabled
                />
              ) : (
                <select
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({
                    ...formData, 
                    vendor_id: e.target.value,
                    selectedWorkers: [],
                    workerMode: 'manual',
                    jumlahPekerja: ''
                  })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">-- Pilih Vendor --</option>
                  {data.vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Aktivitas *</label>
              <select
                value={formData.activity_type_id}
                onChange={(e) => setFormData({
                  ...formData, 
                  activity_type_id: e.target.value,
                  selectedBlocks: [],
                  execution_number: 1,
                  kondisi: '',
                  materials: []
                })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">-- Pilih Aktivitas --</option>
                {data.activityTypes.map(at => (
                  <option key={at.id} value={at.id}>{at.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedActivity?.code === 'WEEDING' && (
            <div>
              <label className="block text-sm font-medium mb-2">Weeding Ke- *</label>
              <div className="flex gap-3">
                {[1, 2, 3].map(num => (
                  <label key={num} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="execution"
                      checked={formData.execution_number === num}
                      onChange={() => setFormData({...formData, execution_number: num, selectedBlocks: []})}
                      className="w-4 h-4"
                    />
                    <span>Weeding {num}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {(selectedActivity?.code === 'KELENTEK' || 
            selectedActivity?.code === 'WEEDING' || 
            selectedActivity?.code === 'WEED_CONTROL') && (
            <div>
              <label className="block text-sm font-medium mb-2">Kondisi *</label>
              <div className="flex gap-3">
                {['ringan', 'sedang', 'berat'].map(k => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="kondisi"
                      checked={formData.kondisi === k}
                      onChange={() => setFormData({...formData, kondisi: k})}
                      className="w-4 h-4"
                    />
                    <span className="capitalize">{k}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.activity_type_id && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">🗺️ Pilih Blok (Multiple)</h3>

              {/* ⭐ Warning jika tidak ada blok tersedia untuk vendor */}
              {data.currentUser?.role === 'vendor' && availableBlocks.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Tidak ada blok tersedia</strong>
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Kemungkinan penyebab:
                  </p>
                  <ul className="list-disc ml-5 text-xs text-yellow-700 mt-1">
                    <li>Vendor Anda belum di-assign untuk aktivitas <strong>{selectedActivity?.name}</strong></li>
                    <li>Belum ada blok yang diregistrasi untuk aktivitas ini di section yang Anda assigned</li>
                    <li>Semua blok sudah completed</li>
                  </ul>
                  <p className="text-xs text-yellow-700 mt-2">
                    Hubungi admin untuk assign vendor Anda ke section + aktivitas yang sesuai.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Filter Zone</label>
                  <select
                    value={blockFilters.zone}
                    onChange={(e) => setBlockFilters({...blockFilters, zone: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="">Semua Zone</option>
                    {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Filter Kategori</label>
                  <select
                    value={blockFilters.kategori}
                    onChange={(e) => setBlockFilters({...blockFilters, kategori: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="">Semua Kategori</option>
                    {uniqueKategori.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Cari Blok</label>
                  <input
                    type="text"
                    value={blockFilters.search}
                    onChange={(e) => setBlockFilters({...blockFilters, search: e.target.value})}
                    placeholder="Nama atau kode..."
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              {availableBlocks.length === 0 && !data.currentUser?.role === 'vendor' ? (
                <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    Tidak ada blok tersedia untuk aktivitas ini.
                    <br/>
                    <span className="text-sm">Registrasi blok terlebih dahulu di tab "Block Registration"</span>
                  </p>
                </div>
              ) : availableBlocks.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    {formData.selectedBlocks.length} blok dipilih dari {availableBlocks.length} tersedia
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
                    {availableBlocks.map(ba => {
                      const isSelected = formData.selectedBlocks.find(b => b.id === ba.id);
                      
                      return (
                        <div
                          key={ba.id}
                          className={`border-2 rounded-lg p-3 transition-all ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!isSelected}
                              onChange={() => toggleBlock(ba.id)}
                              className="w-5 h-5 mt-1"
                            />
                            <div className="flex-1">
                              <p className="font-semibold">{ba.block_name}</p>
                              <p className="text-xs text-gray-600">
                                {ba.block_code} | {ba.block_zone} | {ba.kategori} | {ba.varietas}
                              </p>
                              <div className="flex justify-between items-center mt-1 text-xs">
                                <span>Target: {ba.target_bulan}</span>
                                <span className="font-semibold text-green-600">Sisa: {ba.luas_sisa} Ha</span>
                              </div>
                              <div className="mt-1">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{width: `${Math.min(ba.persen_selesai, 100)}%`}}
                                  />
                                </div>
                              </div>

                              {isSelected && (
                                <div className="mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                                  <label className="block text-xs font-medium mb-1">
                                    Luasan Dikerjakan (Max: {ba.luas_sisa} Ha) *
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    max={ba.luas_sisa}
                                    value={isSelected.luasan}
                                    onChange={(e) => updateBlockLuasan(ba.id, e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="0.00"
                                    required
                                  />
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {formData.selectedBlocks.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Luasan:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {totalLuasan.toFixed(2)} Ha
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Rest of the form continues... (TANAM, PANEN, WEED_CONTROL sections) */}
          {/* Worker selection, materials, etc - keep existing code */}
          
          {selectedActivity?.code === 'TANAM' && formData.selectedBlocks.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Varietas (Opsional - Override dari blok)
              </label>
              <input
                type="text"
                value={formData.varietas_override}
                onChange={(e) => setFormData({...formData, varietas_override: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder={`Default: ${availableBlocks.find(b => b.id === formData.selectedBlocks[0]?.id)?.varietas || 'N/A'}`}
              />
            </div>
          )}

          {selectedActivity?.code === 'PANEN' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Estimasi Ton *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimasi_ton}
                  onChange={(e) => setFormData({...formData, estimasi_ton: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="100.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Actual Ton (Opsional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.actual_ton}
                  onChange={(e) => setFormData({...formData, actual_ton: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Bisa diisi nanti"
                />
              </div>
            </div>
          )}

          {selectedActivity?.code === 'WEED_CONTROL' && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">🧪 Material Herbisida</h3>
                <button
                  type="button"
                  onClick={addMaterial}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  ➕ Tambah Herbisida
                </button>
              </div>

              {formData.materials.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-600">Klik "Tambah Herbisida" untuk menambahkan material</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.materials.map((mat, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg border">
                      <div className="col-span-5">
                        <label className="block text-xs font-medium mb-1">Nama Herbisida *</label>
                        <input
                          type="text"
                          value={mat.name}
                          onChange={(e) => updateMaterial(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                          placeholder="Round-Up"
                          list="herbisida-list"
                          required
                        />
                        <datalist id="herbisida-list">
                          <option value="Round-Up" />
                          <option value="Gramoxone" />
                          <option value="Ally" />
                        </datalist>
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs font-medium mb-1">Dosis (L/Ha) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={mat.dosis}
                          onChange={(e) => updateMaterial(idx, 'dosis', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                          placeholder="2.5"
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs font-medium mb-1">Total Kebutuhan</label>
                        <input
                          type="text"
                          value={`${((parseFloat(mat.dosis) || 0) * totalLuasan).toFixed(2)} L`}
                          className="w-full px-3 py-2 bg-gray-100 border rounded text-sm font-semibold text-blue-600"
                          disabled
                        />
                      </div>
                      <div className="col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeMaterial(idx)}
                          className="w-full py-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {formData.vendor_id && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">👷 Data Pekerja</h3>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-medium mb-2">Pilih Mode Input:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="workerMode"
                      checked={formData.workerMode === 'manual'}
                      onChange={() => setFormData({...formData, workerMode: 'manual', selectedWorkers: []})}
                      className="w-4 h-4"
                    />
                    <span>Input Jumlah Manual</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="workerMode"
                      checked={formData.workerMode === 'list'}
                      onChange={() => setFormData({...formData, workerMode: 'list', jumlahPekerja: ''})}
                      className="w-4 h-4"
                    />
                    <span>Pilih dari Daftar (Auto Count)</span>
                  </label>
                </div>
              </div>

              {formData.workerMode === 'manual' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Jumlah Pekerja *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.jumlahPekerja}
                      onChange={(e) => setFormData({...formData, jumlahPekerja: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Contoh: 25"
                    required
                  />
                </div>
              )}

              {/* List Mode */}
              {formData.workerMode === 'list' && (
                <div>
                  {availableWorkers.length === 0 ? (
                    <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800">
                        Vendor ini belum memiliki pekerja terdaftar.
                        <br/>
                        <span className="text-sm">Tambahkan pekerja di tab "Master Data" terlebih dahulu.</span>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Pekerja Dipilih:</span>
                          <span className="text-2xl font-bold text-green-600">
                            {formData.selectedWorkers.length} orang
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
                        {availableWorkers.map(worker => (
                          <label
                            key={worker.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                              formData.selectedWorkers.includes(worker.id)
                                ? 'bg-blue-100 border-2 border-blue-500'
                                : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedWorkers.includes(worker.id)}
                              onChange={() => toggleWorker(worker.id)}
                              className="w-4 h-4"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{worker.name}</p>
                              <p className="text-xs text-gray-500">{worker.worker_code}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Total Pekerja Display */}
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Pekerja:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {totalPekerja} orang
                  </span>
                </div>
                {totalLuasan > 0 && totalPekerja > 0 && (
                  <div className="text-sm text-purple-700 mt-2">
                    📊 Workload: {(totalLuasan / totalPekerja).toFixed(3)} Ha/pekerja
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium mb-2">Catatan (Opsional)</label>
            <textarea
              value={formData.catatan}
              onChange={(e) => setFormData({...formData, catatan: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
              placeholder="Catatan tambahan tentang transaksi ini..."
            />
          </div>

          {/* Summary */}
          {formData.selectedBlocks.length > 0 && totalPekerja > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3">📋 Ringkasan Transaksi</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Aktivitas:</p>
                  <p className="font-semibold">{selectedActivity?.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Blok:</p>
                  <p className="font-semibold">{formData.selectedBlocks.length}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Luasan:</p>
                  <p className="font-semibold text-blue-600">{totalLuasan.toFixed(2)} Ha</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Pekerja:</p>
                  <p className="font-semibold text-green-600">{totalPekerja} orang</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={formData.selectedBlocks.length === 0 || totalPekerja === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              💾 Simpan Transaksi
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('❓ Reset form? Semua data akan hilang.')) {
                  setFormData({
                    tanggal: new Date().toISOString().split('T')[0],
                    vendor_id: '',
                    activity_type_id: '',
                    execution_number: 1,
                    kondisi: '',
                    selectedBlocks: [],
                    workerMode: 'manual',
                    jumlahPekerja: '',
                    selectedWorkers: [],
                    estimasi_ton: '',
                    actual_ton: '',
                    varietas_override: '',
                    materials: [],
                    catatan: ''
                  });
                }
              }}
              className="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}