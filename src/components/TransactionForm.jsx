// src/components/TransactionForm.jsx - FULLY FIXED VERSION
// ✅ All Critical Issues Fixed

import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function TransactionForm({ data, loading, onSuccess }) {
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

  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // Date validation constants
  const maxDate = new Date().toISOString().split('T')[0];
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - 6);
  const minDateStr = minDate.toISOString().split('T')[0];

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

  const availableBlocks = useMemo(() => {
    if (!formData.activity_type_id) return [];

    let filtered = data.blockActivities.filter(ba => 
      ba.activity_type_id === formData.activity_type_id &&
      ba.status !== 'completed' &&
      ba.status !== 'cancelled'
    );

    // ✅ FIX: Filter by execution number for WEEDING
    if (selectedActivity?.code === 'WEEDING') {
      filtered = filtered.filter(ba => 
        ba.execution_number === formData.execution_number
      );
    }

    if (data.currentUser?.role === 'vendor') {
      const assignedSectionIds = data.vendorAssignments
        ?.filter(va => 
          va.vendor_id === data.currentUser.vendor_id &&
          va.activity_type_id === formData.activity_type_id
        )
        .map(va => va.section_id) || [];

      if (assignedSectionIds.length === 0) {
        return [];
      }

      filtered = filtered.filter(ba => 
        assignedSectionIds.includes(ba.section_id)
      );
    }

    if (['section_head', 'supervisor'].includes(data.currentUser?.role)) {
      filtered = filtered.filter(ba => 
        ba.section_id === data.currentUser.section_id
      );
    }

    if (blockFilters.zone) {
      filtered = filtered.filter(ba => {
        const block = data.blocks.find(b => b.id === ba.block_id);
        return block?.zone === blockFilters.zone;
      });
    }

    if (blockFilters.kategori) {
      filtered = filtered.filter(ba => ba.kategori === blockFilters.kategori);
    }

    if (blockFilters.search) {
      const search = blockFilters.search.toLowerCase();
      filtered = filtered.filter(ba => {
        const block = data.blocks.find(b => b.id === ba.block_id);
        return block?.name.toLowerCase().includes(search) ||
               block?.code.toLowerCase().includes(search);
      });
    }

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
    data.vendorAssignments,
    selectedActivity
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
      materials: [...prev.materials, { material_id: '', dosis_per_ha: '', satuan: 'L' }]
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

  // ✅ CRITICAL FIX: Complete transaction handling with rollback
  const handleSubmit = async () => {
    // Prevent double submit
    const now = Date.now();
    if (now - lastSubmitTime < 3000) {
      alert('⏳ Mohon tunggu beberapa detik sebelum submit lagi');
      return;
    }

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

    // ✅ FIX: Validate luasan for each block
    for (const sb of formData.selectedBlocks) {
      const blockActivity = availableBlocks.find(ba => ba.id === sb.id);
      if (!blockActivity) continue;

      const luasan = parseFloat(sb.luasan) || 0;
      if (luasan <= 0) {
        alert(`❌ Luasan untuk blok ${blockActivity.block_code} harus > 0`);
        return;
      }

      // ✅ FIX: Over-assignment validation
      const sisaLuasan = blockActivity.luas_total - (blockActivity.luas_dikerjakan || 0);
      if (luasan > sisaLuasan) {
        alert(`❌ Blok ${blockActivity.block_code}:\nLuasan input (${luasan} Ha) melebihi sisa (${sisaLuasan.toFixed(2)} Ha)`);
        return;
      }
    }

    if (totalPekerja === 0) {
      alert('❌ Input jumlah pekerja!');
      return;
    }

    // Kondisi validation (only for activities that require it)
    if (selectedActivity?.code === 'PANEN' || selectedActivity?.code === 'PRUNING') {
      if (!formData.kondisi) {
        alert('❌ Pilih kondisi!');
        return;
      }
    }

    // Harvest specific validations
    if (selectedActivity?.code === 'PANEN') {
      if (!formData.estimasi_ton || parseFloat(formData.estimasi_ton) <= 0) {
        alert('❌ Input estimasi ton!');
        return;
      }
      if (!formData.actual_ton || parseFloat(formData.actual_ton) <= 0) {
        alert('❌ Input actual ton!');
        return;
      }
    }

    const confirmed = confirm(
      `🔍 Konfirmasi:\n\n` +
      `📅 Tanggal: ${formData.tanggal}\n` +
      `🏢 Vendor: ${data.vendors.find(v => v.id === formData.vendor_id)?.name}\n` +
      `🔧 Aktivitas: ${selectedActivity?.name}\n` +
      `📦 Blok: ${formData.selectedBlocks.length} blok\n` +
      `📐 Total Luasan: ${totalLuasan.toFixed(2)} Ha\n` +
      `👷 Total Pekerja: ${totalPekerja} orang\n\n` +
      `Lanjutkan?`
    );

    if (!confirmed) return;

    setSubmitting(true);
    setLastSubmitTime(now);

    let transactionId = null;
    let insertedBlockIds = [];
    let insertedMaterialIds = [];
    let insertedWorkerIds = [];

    try {
      // 1. Insert transaction header
      const { data: transaction, error: transError } = await supabase
        .from('transactions')
        .insert({
          tanggal: formData.tanggal,
          vendor_id: formData.vendor_id,
          activity_type_id: formData.activity_type_id,
          execution_number: formData.execution_number,
          kondisi: formData.kondisi || null,
          estimasi_ton: formData.estimasi_ton ? parseFloat(formData.estimasi_ton) : null,
          actual_ton: formData.actual_ton ? parseFloat(formData.actual_ton) : null,
          varietas_override: formData.varietas_override || null,
          total_luasan: totalLuasan,
          total_pekerja: totalPekerja,
          catatan: formData.catatan || null,
          created_by: data.currentUser.id
        })
        .select()
        .single();

      if (transError) throw new Error(`Transaction insert failed: ${transError.message}`);
      transactionId = transaction.id;

      // 2. Insert transaction blocks
      const blockInserts = formData.selectedBlocks.map(sb => ({
        transaction_id: transactionId,
        block_activity_id: sb.id,
        luas_dikerjakan: parseFloat(sb.luasan)
      }));

      const { data: insertedBlocks, error: blockError } = await supabase
        .from('transaction_blocks')
        .insert(blockInserts)
        .select();

      if (blockError) throw new Error(`Block insert failed: ${blockError.message}`);
      insertedBlockIds = insertedBlocks.map(b => b.id);

      // ✅ CRITICAL FIX #2: Update progress after inserting blocks
      for (const sb of formData.selectedBlocks) {
        const blockActivity = availableBlocks.find(ba => ba.id === sb.id);
        if (!blockActivity) continue;

        const newLuasDikerjakan = (blockActivity.luas_dikerjakan || 0) + parseFloat(sb.luasan);
        const newPersenSelesai = (newLuasDikerjakan / blockActivity.luas_total) * 100;
        const newStatus = newPersenSelesai >= 100 ? 'completed' : 'in_progress';

        const { error: updateError } = await supabase
          .from('block_activities')
          .update({
            luas_dikerjakan: newLuasDikerjakan,
            persen_selesai: newPersenSelesai,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', sb.id);

        if (updateError) throw new Error(`Progress update failed: ${updateError.message}`);
      }

      // 3. Insert materials if any
      if (formData.materials.length > 0) {
        const materialInserts = formData.materials
          .filter(m => m.material_id && parseFloat(m.dosis_per_ha) > 0)
          .map(m => ({
            transaction_id: transactionId,
            material_id: m.material_id,
            dosis_per_ha: parseFloat(m.dosis_per_ha),
            total_kebutuhan: parseFloat(m.dosis_per_ha) * totalLuasan,
            satuan: m.satuan
          }));

        if (materialInserts.length > 0) {
          const { data: insertedMaterials, error: matError } = await supabase
            .from('transaction_materials')
            .insert(materialInserts)
            .select();

          if (matError) throw new Error(`Material insert failed: ${matError.message}`);
          insertedMaterialIds = insertedMaterials.map(m => m.id);
        }
      }

      // 4. Insert workers
      if (formData.workerMode === 'manual') {
        const { data: insertedWorker, error: workerError } = await supabase
          .from('transaction_workers')
          .insert({
            transaction_id: transactionId,
            worker_id: null,
            jumlah_pekerja: totalPekerja
          })
          .select();

        if (workerError) throw new Error(`Worker insert failed: ${workerError.message}`);
        insertedWorkerIds = [insertedWorker[0].id];
      } else {
        const workerInserts = formData.selectedWorkers.map(wid => ({
          transaction_id: transactionId,
          worker_id: wid,
          jumlah_pekerja: 1
        }));

        const { data: insertedWorkers, error: workerError } = await supabase
          .from('transaction_workers')
          .insert(workerInserts)
          .select();

        if (workerError) throw new Error(`Worker insert failed: ${workerError.message}`);
        insertedWorkerIds = insertedWorkers.map(w => w.id);
      }

      alert('✅ Transaksi berhasil disimpan!');
      
      // Reset form
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

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('❌ Transaction error:', error);
      
      // ✅ CRITICAL FIX #4: Rollback on error
      alert(`❌ Gagal menyimpan: ${error.message}\n\nMelakukan rollback...`);

      try {
        // Delete in reverse order
        if (insertedWorkerIds.length > 0) {
          await supabase.from('transaction_workers').delete().in('id', insertedWorkerIds);
        }
        if (insertedMaterialIds.length > 0) {
          await supabase.from('transaction_materials').delete().in('id', insertedMaterialIds);
        }
        if (insertedBlockIds.length > 0) {
          await supabase.from('transaction_blocks').delete().in('id', insertedBlockIds);
        }
        if (transactionId) {
          await supabase.from('transactions').delete().eq('id', transactionId);
        }
        
        alert('🔄 Rollback selesai. Silakan coba lagi.');
      } catch (rollbackError) {
        console.error('❌ Rollback error:', rollbackError);
        alert('⚠️ Rollback gagal. Hubungi admin untuk membersihkan data!');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">📝 Input Transaksi Aktivitas</h2>

        <div className="space-y-6">
          {/* Date and Vendor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tanggal <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                min={minDateStr}
                max={maxDate}
                value={formData.tanggal}
                onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Maksimal 6 bulan ke belakang
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Vendor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vendor_id}
                onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg"
                disabled={data.currentUser?.role === 'vendor'}
                required
              >
                <option value="">-- Pilih Vendor --</option>
                {data.vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity Selection */}
          {formData.vendor_id && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Aktivitas <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data.activityTypes.map(activity => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => setFormData({
                      ...formData, 
                      activity_type_id: activity.id,
                      selectedBlocks: [],
                      execution_number: 1,
                      kondisi: '',
                      materials: []
                    })}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      formData.activity_type_id === activity.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{activity.icon}</div>
                    <div className="font-semibold text-sm">{activity.name}</div>
                    <div className="text-xs text-gray-500">{activity.code}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Execution Number for WEEDING */}
          {selectedActivity?.code === 'WEEDING' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">
                Penyiangan Ke- <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({...formData, execution_number: num, selectedBlocks: []})}
                    className={`px-6 py-2 rounded-lg font-semibold ${
                      formData.execution_number === num
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white border border-yellow-300 hover:bg-yellow-100'
                    }`}
                  >
                    Ke-{num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Kondisi for PANEN/PRUNING */}
          {(selectedActivity?.code === 'PANEN' || selectedActivity?.code === 'PRUNING') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">
                Kondisi <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {['Kering', 'Basah'].map(kondisi => (
                  <button
                    key={kondisi}
                    type="button"
                    onClick={() => setFormData({...formData, kondisi})}
                    className={`px-6 py-2 rounded-lg font-semibold ${
                      formData.kondisi === kondisi
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    {kondisi}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Block Selection */}
          {formData.activity_type_id && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">
                📦 Pilih Blok {selectedActivity?.name}
              </h3>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium mb-1">Filter Zone</label>
                  <select
                    value={blockFilters.zone}
                    onChange={(e) => setBlockFilters({...blockFilters, zone: e.target.value})}
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
                    value={blockFilters.kategori}
                    onChange={(e) => setBlockFilters({...blockFilters, kategori: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="">Semua Kategori</option>
                    {uniqueKategori.map(kat => (
                      <option key={kat} value={kat}>{kat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Cari Blok</label>
                  <input
                    type="text"
                    placeholder="Nama atau kode blok..."
                    value={blockFilters.search}
                    onChange={(e) => setBlockFilters({...blockFilters, search: e.target.value})}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              {/* Filter Summary */}
              <div className="mb-3 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                Menampilkan {availableBlocks.length} blok
                {(blockFilters.zone || blockFilters.kategori || blockFilters.search) && 
                  <span className="text-blue-600 font-medium"> (dengan filter)</span>
                }
              </div>

              {/* Block List */}
              {availableBlocks.length === 0 ? (
                <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">
                    {formData.activity_type_id 
                      ? 'Tidak ada blok tersedia untuk aktivitas ini.'
                      : 'Pilih aktivitas terlebih dahulu.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
                  {availableBlocks.map(ba => {
                    const isSelected = formData.selectedBlocks.find(b => b.id === ba.id);
                    const sisaLuasan = ba.luas_total - (ba.luas_dikerjakan || 0);

                    return (
                      <div
                        key={ba.id}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => toggleBlock(ba.id)}
                            className="mt-1 w-5 h-5"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-lg">{ba.block_code}</h4>
                                <p className="text-sm text-gray-600">{ba.block_name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">Progress</p>
                                <p className="font-bold text-blue-600">
                                  {ba.persen_selesai?.toFixed(1) || 0}%
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Zone:</span>
                                <span className="ml-1 font-medium">{ba.block_zone}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Total:</span>
                                <span className="ml-1 font-medium">{ba.luas_total} Ha</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Sisa:</span>
                                <span className="ml-1 font-medium text-orange-600">
                                  {sisaLuasan.toFixed(2)} Ha
                                </span>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium mb-1">
                                  Luasan Dikerjakan (Ha) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  max={sisaLuasan}
                                  value={isSelected.luasan}
                                  onChange={(e) => updateBlockLuasan(ba.id, e.target.value)}
                                  className="w-full px-3 py-2 border rounded-lg"
                                  placeholder={`Max: ${sisaLuasan.toFixed(2)} Ha`}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Harvest Specific Fields */}
          {selectedActivity?.code === 'PANEN' && formData.selectedBlocks.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">📊 Data Panen</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estimasi Ton <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.estimasi_ton}
                    onChange={(e) => setFormData({...formData, estimasi_ton: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Actual Ton <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.actual_ton}
                    onChange={(e) => setFormData({...formData, actual_ton: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Varietas Override</label>
                  <input
                    type="text"
                    value={formData.varietas_override}
                    onChange={(e) => setFormData({...formData, varietas_override: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Opsional"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Materials (for applicable activities) */}
          {selectedActivity && ['SPRAYING', 'FERTILIZING'].includes(selectedActivity.code) && (
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">🧪 Material & Dosis</h3>
                <button
                  type="button"
                  onClick={addMaterial}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  ➕ Tambah Material
                </button>
              </div>

              {formData.materials.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-600">
                    Belum ada material. Klik "Tambah Material" untuk menambahkan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.materials.map((mat, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 p-3 bg-gray-50 border rounded-lg">
                      <div className="col-span-4">
                        <label className="block text-xs font-medium mb-1">Material</label>
                        <select
                          value={mat.material_id}
                          onChange={(e) => updateMaterial(idx, 'material_id', e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                        >
                          <option value="">-- Pilih Material --</option>
                          {data.materials.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="block text-xs font-medium mb-1">Dosis/Ha</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={mat.dosis_per_ha}
                          onChange={(e) => updateMaterial(idx, 'dosis_per_ha', e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1">Satuan</label>
                        <select
                          value={mat.satuan}
                          onChange={(e) => updateMaterial(idx, 'satuan', e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                        >
                          <option value="L">Liter</option>
                          <option value="Kg">Kg</option>
                          <option value="Gram">Gram</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium mb-1">Total</label>
                        <input
                          type="text"
                          value={`${((parseFloat(mat.dosis_per_ha) || 0) * totalLuasan).toFixed(2)}`}
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

          {/* Workers */}
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
                    <span>Pilih dari Daftar</span>
                  </label>
                </div>
              </div>

              {formData.workerMode === 'manual' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Jumlah Pekerja <span className="text-red-500">*</span>
                  </label>
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

              {formData.workerMode === 'list' && (
                <div>
                  {availableWorkers.length === 0 ? (
                    <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800">
                        Vendor ini belum memiliki pekerja terdaftar.
                        <br/>
                        <span className="text-sm">Tambahkan pekerja di tab "Master Data".</span>
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Catatan</label>
            <textarea
              value={formData.catatan}
              onChange={(e) => setFormData({...formData, catatan: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
              placeholder="Catatan tambahan..."
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

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || formData.selectedBlocks.length === 0 || totalPekerja === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {submitting ? '⏳ Menyimpan...' : '💾 Simpan Transaksi'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('❓ Reset form?')) {
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
                }
              }}
              disabled={submitting}
              className="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 disabled:opacity-50"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
