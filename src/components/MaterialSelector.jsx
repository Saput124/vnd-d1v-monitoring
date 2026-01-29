// src/components/MaterialSelector.jsx
// Smart Material Selector berdasarkan Activity, Kategori, Stage, dan Alternative

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';

export default function MaterialSelector({ 
  activityTypeId, 
  kategori, // 'PC' or 'RC'
  totalLuasan,
  onMaterialsChange 
}) {
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [materialRequirements, setMaterialRequirements] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch activity stages
  useEffect(() => {
    const fetchStages = async () => {
      const { data, error } = await supabase
        .from('activity_stages')
        .select('*')
        .eq('active', true)
        .order('sequence_order');
      
      if (!error) setStages(data || []);
    };
    fetchStages();
  }, []);

  // Fetch material requirements based on selection
  useEffect(() => {
    if (!activityTypeId) return;

    const fetchMaterials = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('activity_materials')
          .select(`
            *,
            materials (*),
            activity_stages (*)
          `)
          .eq('activity_type_id', activityTypeId);

        // Filter by kategori
        if (kategori) {
          query = query.or(`tanaman_kategori.eq.${kategori},tanaman_kategori.is.null`);
        }

        // Filter by stage
        if (selectedStage) {
          query = query.or(`stage_id.eq.${selectedStage},stage_id.is.null`);
        }

        // Filter by alternative
        if (selectedAlternative) {
          query = query.or(`alternative_option.eq.${selectedAlternative},alternative_option.is.null`);
        }

        const { data, error } = await query;
        
        if (error) throw error;

        setMaterialRequirements(data || []);

        // Auto-select required materials
        const autoSelected = (data || [])
          .filter(req => req.required)
          .map(req => ({
            material_id: req.material_id,
            material_code: req.materials.code,
            material_name: req.materials.name,
            category: req.materials.category,
            unit: req.unit,
            dosis_per_ha: req.default_dosis,
            quantity: (req.default_dosis * totalLuasan).toFixed(2),
            notes: req.notes
          }));

        setSelectedMaterials(autoSelected);
        onMaterialsChange(autoSelected);
      } catch (err) {
        console.error('Error fetching materials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [activityTypeId, kategori, selectedStage, selectedAlternative, totalLuasan]);

  // Get unique alternatives for selected kategori & stage
  const availableAlternatives = useMemo(() => {
    const alts = materialRequirements
      .filter(req => req.alternative_option)
      .map(req => req.alternative_option);
    return [...new Set(alts)];
  }, [materialRequirements]);

  // Group materials by category
  const groupedMaterials = useMemo(() => {
    const groups = {};
    materialRequirements.forEach(req => {
      const cat = req.materials.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(req);
    });
    return groups;
  }, [materialRequirements]);

  const handleMaterialToggle = (req) => {
    const exists = selectedMaterials.find(m => m.material_id === req.material_id);
    
    let updated;
    if (exists) {
      updated = selectedMaterials.filter(m => m.material_id !== req.material_id);
    } else {
      updated = [...selectedMaterials, {
        material_id: req.material_id,
        material_code: req.materials.code,
        material_name: req.materials.name,
        category: req.materials.category,
        unit: req.unit,
        dosis_per_ha: req.default_dosis,
        quantity: (req.default_dosis * totalLuasan).toFixed(2),
        notes: req.notes
      }];
    }
    
    setSelectedMaterials(updated);
    onMaterialsChange(updated);
  };

  const handleDosisChange = (materialId, newDosis) => {
    const updated = selectedMaterials.map(m => 
      m.material_id === materialId 
        ? {
            ...m,
            dosis_per_ha: parseFloat(newDosis),
            quantity: (parseFloat(newDosis) * totalLuasan).toFixed(2)
          }
        : m
    );
    setSelectedMaterials(updated);
    onMaterialsChange(updated);
  };

  const categoryIcons = {
    herbisida: '🌿',
    pestisida: '🐛',
    pupuk: '🌾',
    alat: '🔧'
  };

  if (!activityTypeId) {
    return (
      <div className="bg-gray-50 border rounded-lg p-6 text-center text-gray-500">
        Pilih aktivitas terlebih dahulu untuk melihat material requirements
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-2">📦 Material Requirements</h3>
        <p className="text-sm text-gray-700">
          Kategori: <strong>{kategori === 'PC' ? 'Plant Cane' : 'Ratoon Cane'}</strong> | 
          Total Luasan: <strong>{totalLuasan} Ha</strong>
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stage Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Tahap Aplikasi (Optional)
          </label>
          <select
            value={selectedStage || ''}
            onChange={(e) => setSelectedStage(e.target.value || null)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Semua Tahap</option>
            {stages.map(stage => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>

        {/* Alternative Selection */}
        {availableAlternatives.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Alternative Options
            </label>
            <select
              value={selectedAlternative || ''}
              onChange={(e) => setSelectedAlternative(e.target.value || null)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Semua Alternatif</option>
              {availableAlternatives.map(alt => (
                <option key={alt} value={alt}>{alt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading materials...</p>
        </div>
      ) : materialRequirements.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-800">
            Tidak ada material requirement untuk kombinasi ini
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            Coba ubah filter tahap atau alternatif
          </p>
        </div>
      ) : (
        <>
          {/* Material List by Category */}
          {Object.entries(groupedMaterials).map(([category, materials]) => (
            <div key={category} className="border rounded-lg overflow-hidden">
              <div className={`px-4 py-2 font-semibold ${
                category === 'herbisida' ? 'bg-green-100 text-green-800' :
                category === 'pestisida' ? 'bg-red-100 text-red-800' :
                category === 'pupuk' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {categoryIcons[category]} {category.toUpperCase()} ({materials.length})
              </div>

              <div className="p-4 space-y-3">
                {materials.map((req, idx) => {
                  const isSelected = selectedMaterials.find(m => m.material_id === req.material_id);
                  const totalNeeded = (req.default_dosis * totalLuasan).toFixed(2);

                  return (
                    <div
                      key={idx}
                      className={`border rounded-lg p-3 ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!isSelected}
                              onChange={() => handleMaterialToggle(req)}
                              className="w-4 h-4"
                            />
                            <div>
                              <div className="font-semibold">
                                {req.materials.code} - {req.materials.name}
                                {req.required && (
                                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                    Wajib
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {req.activity_stages?.name && (
                                  <span className="mr-3">
                                    📍 {req.activity_stages.name}
                                  </span>
                                )}
                                {req.alternative_option && (
                                  <span className="mr-3">
                                    🔄 {req.alternative_option}
                                  </span>
                                )}
                              </div>
                              {req.notes && (
                                <div className="text-xs text-gray-500 mt-1">
                                  💬 {req.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          {isSelected ? (
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs text-gray-600">Dosis/Ha:</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={isSelected.dosis_per_ha}
                                  onChange={(e) => handleDosisChange(req.material_id, e.target.value)}
                                  className="w-24 px-2 py-1 border rounded text-sm text-right"
                                />
                                <span className="text-xs ml-1">{req.unit}</span>
                              </div>
                              <div className="text-lg font-bold text-blue-600">
                                {isSelected.quantity} {req.unit}
                              </div>
                              <div className="text-xs text-gray-500">
                                Total untuk {totalLuasan} Ha
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm text-gray-600">
                                Default: {req.default_dosis} {req.unit}/Ha
                              </div>
                              <div className="text-sm font-semibold text-gray-700">
                                Total: {totalNeeded} {req.unit}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Summary */}
          {selectedMaterials.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold mb-3">📊 Summary Material Terpilih</h4>
              <div className="space-y-2">
                {selectedMaterials.map((mat, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{mat.material_name}</span>
                    <span className="font-semibold">
                      {mat.quantity} {mat.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
