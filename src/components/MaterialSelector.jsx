// src/components/MaterialSelector.jsx
// ENHANCED: Smart Material Selector dengan Stage dan Alternative Options

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';

export default function MaterialSelector({ 
  activityTypeId, 
  kategori, // 'PC' or 'RC'
  totalLuasan,
  onMaterialsChange 
}) {
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedAlternative, setSelectedAlternative] = useState('');
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
            manufacturer: req.materials.manufacturer,
            safety_notes: req.materials.safety_notes,
            unit: req.unit,
            dosis_per_ha: req.default_dosis,
            quantity: (req.default_dosis * totalLuasan).toFixed(3),
            stage_name: req.activity_stages?.name,
            alternative: req.alternative_option,
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

  // Recalculate quantities when totalLuasan changes
  useEffect(() => {
    if (selectedMaterials.length > 0 && totalLuasan) {
      const updated = selectedMaterials.map(mat => ({
        ...mat,
        quantity: (mat.dosis_per_ha * totalLuasan).toFixed(3)
      }));
      setSelectedMaterials(updated);
      onMaterialsChange(updated);
    }
  }, [totalLuasan]);

  // Get unique alternatives for selected kategori & stage
  const availableAlternatives = useMemo(() => {
    const alts = materialRequirements
      .filter(req => req.alternative_option)
      .map(req => req.alternative_option);
    return [...new Set(alts)].sort();
  }, [materialRequirements]);

  // Group materials by category
  const groupedMaterials = useMemo(() => {
    const groups = {
      herbisida: [],
      pestisida: [],
      pupuk: [],
      alat: []
    };
    
    materialRequirements.forEach(req => {
      const cat = req.materials.category;
      if (groups[cat]) {
        groups[cat].push(req);
      }
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
        manufacturer: req.materials.manufacturer,
        safety_notes: req.materials.safety_notes,
        unit: req.unit,
        dosis_per_ha: req.default_dosis,
        quantity: (req.default_dosis * totalLuasan).toFixed(3),
        stage_name: req.activity_stages?.name,
        alternative: req.alternative_option,
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
            quantity: (parseFloat(newDosis) * totalLuasan).toFixed(3)
          }
        : m
    );
    setSelectedMaterials(updated);
    onMaterialsChange(updated);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'herbisida': return '🌿';
      case 'pestisida': return '🐛';
      case 'pupuk': return '🌾';
      case 'alat': return '🔧';
      default: return '📦';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'herbisida': return 'bg-green-100 text-green-800 border-green-300';
      case 'pestisida': return 'bg-red-100 text-red-800 border-red-300';
      case 'pupuk': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'alat': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!activityTypeId) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500">
          ⚠️ Pilih activity terlebih dahulu untuk melihat material requirements
        </p>
      </div>
    );
  }

  if (!kategori) {
    return (
      <div className="bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-lg p-8 text-center">
        <p className="text-yellow-800">
          ⚠️ Pilih blocks terlebih dahulu. Kategori (PC/RC) akan terdeteksi otomatis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-semibold text-blue-900">Material Selection untuk {kategori === 'PC' ? 'Plant Cane' : 'Ratoon Cane'}</p>
            <p className="text-sm text-blue-700 mt-1">
              Pilih stage dan alternative (jika ada) untuk mendapatkan material recommendations. 
              Material dengan tanda ⭐ akan otomatis terpilih.
            </p>
          </div>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-bold text-lg mb-4">🎯 Filter Material</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Stage Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Application Stage:
            </label>
            <select
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setSelectedAlternative(''); // Reset alternative when stage changes
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stages (Generic)</option>
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.sequence_order}. {stage.name}
                </option>
              ))}
            </select>
            {selectedStage && (
              <p className="text-xs text-gray-500 mt-1">
                {stages.find(s => s.id === selectedStage)?.description}
              </p>
            )}
          </div>

          {/* Alternative Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Alternative Option:
            </label>
            <select
              value={selectedAlternative}
              onChange={(e) => setSelectedAlternative(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={availableAlternatives.length === 0}
            >
              <option value="">Default / All Alternatives</option>
              {availableAlternatives.map(alt => (
                <option key={alt} value={alt}>{alt}</option>
              ))}
            </select>
            {availableAlternatives.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No alternatives available for this selection
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading materials...</span>
        </div>
      )}

      {/* No Materials Found */}
      {!loading && materialRequirements.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">
            📭 Tidak ada material yang dikonfigurasi untuk kombinasi ini
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Silakan tambahkan konfigurasi material di menu Material Configuration
          </p>
        </div>
      )}

      {/* Materials by Category */}
      {!loading && materialRequirements.length > 0 && (
        <div className="space-y-4">
          {Object.entries(groupedMaterials).map(([category, materials]) => {
            if (materials.length === 0) return null;

            return (
              <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className={`px-4 py-3 font-bold ${getCategoryColor(category)} border-b-2`}>
                  {getCategoryIcon(category)} {category.toUpperCase()} ({materials.length} items)
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {materials.map(req => {
                      const isSelected = selectedMaterials.some(m => m.material_id === req.material_id);
                      const isRequired = req.required;

                      return (
                        <div
                          key={req.id}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleMaterialToggle(req)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-5 h-5"
                                />
                                <h4 className="font-bold text-gray-900">
                                  {req.materials.name}
                                  {isRequired && <span className="ml-2 text-yellow-500">⭐</span>}
                                </h4>
                              </div>

                              <div className="space-y-1 text-sm">
                                <p className="text-gray-600">
                                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">
                                    {req.materials.code}
                                  </span>
                                </p>

                                {req.materials.manufacturer && (
                                  <p className="text-gray-600">
                                    🏭 {req.materials.manufacturer}
                                  </p>
                                )}

                                {req.activity_stages && (
                                  <p className="text-purple-600">
                                    📍 Stage: {req.activity_stages.name}
                                  </p>
                                )}

                                {req.alternative_option && (
                                  <p className="text-orange-600">
                                    🔀 Alternative: {req.alternative_option}
                                  </p>
                                )}

                                <p className="font-semibold text-green-700">
                                  💧 {req.default_dosis} {req.unit}/ha
                                </p>

                                <p className="text-blue-700 font-bold">
                                  📦 Total: {(req.default_dosis * totalLuasan).toFixed(3)} {req.unit}
                                  <span className="text-xs text-gray-500 ml-2">
                                    (untuk {totalLuasan} ha)
                                  </span>
                                </p>

                                {req.notes && (
                                  <p className="text-gray-600 text-xs italic">
                                    📝 {req.notes}
                                  </p>
                                )}

                                {req.materials.safety_notes && (
                                  <p className="text-red-600 text-xs">
                                    ⚠️ {req.materials.safety_notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Materials Summary */}
      {selectedMaterials.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-lg mb-4">
            ✅ Selected Materials ({selectedMaterials.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2">
                <tr>
                  <th className="px-4 py-2 text-left text-sm">Material</th>
                  <th className="px-4 py-2 text-left text-sm">Category</th>
                  <th className="px-4 py-2 text-left text-sm">Stage</th>
                  <th className="px-4 py-2 text-left text-sm">Dosis/Ha</th>
                  <th className="px-4 py-2 text-left text-sm">Total Qty</th>
                  <th className="px-4 py-2 text-left text-sm">Adjust</th>
                </tr>
              </thead>
              <tbody>
                {selectedMaterials.map(mat => (
                  <tr key={mat.material_id} className="border-b">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{mat.material_name}</p>
                      <p className="text-xs text-gray-500">{mat.material_code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(mat.category)}`}>
                        {mat.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {mat.stage_name || '-'}
                      {mat.alternative && (
                        <p className="text-xs text-gray-500">({mat.alternative})</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={mat.dosis_per_ha}
                        onChange={(e) => handleDosisChange(mat.material_id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-24 px-2 py-1 border rounded text-sm"
                      />
                      <span className="text-xs ml-1">{mat.unit}/ha</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-700">
                      {mat.quantity} {mat.unit}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = selectedMaterials.filter(m => m.material_id !== mat.material_id);
                          setSelectedMaterials(updated);
                          onMaterialsChange(updated);
                        }}
                        className="text-red-600 hover:text-red-800 font-bold"
                        title="Remove"
                      >
                        ✖️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
