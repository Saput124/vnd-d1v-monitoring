// src/components/VendorAssignmentManagement.jsx
// Component untuk assign vendor ke section + activity

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function VendorAssignmentManagement() {
  const [vendors, setVendors] = useState([]);
  const [sections, setSections] = useState([]);
  const [activities, setActivities] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterVendor, setFilterVendor] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vendorsRes, sectionsRes, activitiesRes, assignmentsRes] = await Promise.all([
        supabase.from('vendors').select('*').order('name'),
        supabase.from('sections').select('*').order('name'),
        supabase.from('activity_types').select('*').eq('active', true).order('name'),
        supabase.from('vendor_assignments').select(`
          *,
          vendors(id, code, name),
          sections(id, code, name),
          activity_types(id, code, name)
        `)
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      if (sectionsRes.error) throw sectionsRes.error;
      if (activitiesRes.error) throw activitiesRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      setVendors(vendorsRes.data || []);
      setSections(sectionsRes.data || []);
      setActivities(activitiesRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('❌ Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAssigned = (vendorId, sectionId, activityId) => {
    return assignments.some(a => 
      a.vendor_id === vendorId && 
      a.section_id === sectionId && 
      a.activity_type_id === activityId
    );
  };

  const toggleAssignment = async (vendorId, sectionId, activityId) => {
    try {
      setLoading(true);
      const assigned = isAssigned(vendorId, sectionId, activityId);

      if (assigned) {
        // Unassign
        const { error } = await supabase
          .from('vendor_assignments')
          .delete()
          .eq('vendor_id', vendorId)
          .eq('section_id', sectionId)
          .eq('activity_type_id', activityId);

        if (error) throw error;
        console.log('✅ Unassigned');
      } else {
        // Assign
        const { error } = await supabase
          .from('vendor_assignments')
          .insert([{
            vendor_id: vendorId,
            section_id: sectionId,
            activity_type_id: activityId
          }]);

        if (error) throw error;
        console.log('✅ Assigned');
      }

      await fetchData();
    } catch (err) {
      console.error('Error toggling assignment:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentCount = (vendorId) => {
    return assignments.filter(a => a.vendor_id === vendorId).length;
  };

  const assignAllActivities = async (vendorId, sectionId) => {
    if (!confirm('Assign vendor ke SEMUA aktivitas di section ini?')) return;

    try {
      setLoading(true);
      
      const inserts = activities.map(activity => ({
        vendor_id: vendorId,
        section_id: sectionId,
        activity_type_id: activity.id
      }));

      const { error } = await supabase
        .from('vendor_assignments')
        .upsert(inserts, { 
          onConflict: 'vendor_id,section_id,activity_type_id',
          ignoreDuplicates: true 
        });

      if (error) throw error;

      alert('✅ Berhasil assign semua aktivitas!');
      await fetchData();
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAllAssignments = async (vendorId, sectionId) => {
    if (!confirm('⚠️ Hapus SEMUA assignment vendor di section ini?')) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('vendor_assignments')
        .delete()
        .eq('vendor_id', vendorId)
        .eq('section_id', sectionId);

      if (error) throw error;

      alert('✅ Semua assignment dihapus!');
      await fetchData();
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = filterVendor 
    ? vendors.filter(v => v.id === filterVendor)
    : vendors;

  if (loading && vendors.length === 0) {
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
          🔗 <strong>Vendor Assignment (Granular):</strong> Assign vendor ke kombinasi section + activity tertentu.
          Vendor hanya bisa input transaksi untuk kombinasi yang di-assign.
        </p>
        <div className="mt-2 text-xs text-blue-700">
          <p>📌 <strong>Contoh:</strong></p>
          <ul className="list-disc ml-5 mt-1 space-y-1">
            <li>Vendor A → Section TANAM + Activity TANAM ✓</li>
            <li>Vendor A → Section MANUAL + Activity WEEDING ✓</li>
            <li>Vendor A tidak bisa input WEEDING di Section TANAM (not assigned)</li>
          </ul>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <p className="text-sm opacity-90 mb-1">Total Vendors</p>
          <p className="text-4xl font-bold">{vendors.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <p className="text-sm opacity-90 mb-1">Total Sections</p>
          <p className="text-4xl font-bold">{sections.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <p className="text-sm opacity-90 mb-1">Total Assignments</p>
          <p className="text-4xl font-bold">{assignments.length}</p>
        </div>
      </div>

      {/* Filter Vendor */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <label className="block text-sm font-medium mb-2">Filter Vendor:</label>
        <select
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border rounded-lg"
        >
          <option value="">-- Semua Vendor --</option>
          {vendors.map(v => (
            <option key={v.id} value={v.id}>
              {v.name} ({getAssignmentCount(v.id)} assignments)
            </option>
          ))}
        </select>
      </div>

      {/* Assignment Matrix per Vendor */}
      <div className="space-y-4">
        {filteredVendors.map(vendor => (
          <div key={vendor.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Vendor Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">👷 {vendor.name}</h3>
                  <p className="text-sm opacity-90">
                    {vendor.code} • {getAssignmentCount(vendor.id)} assignments
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-75">Contact: {vendor.contact_person || '-'}</p>
                  <p className="text-xs opacity-75">Phone: {vendor.phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Assignment Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Section
                    </th>
                    {activities.map(act => (
                      <th key={act.id} className="px-4 py-3 text-center font-semibold min-w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono">
                            {act.code}
                          </span>
                          <span className="text-xs font-normal">{act.name}</span>
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section, idx) => {
                    const sectionAssignments = assignments.filter(
                      a => a.vendor_id === vendor.id && a.section_id === section.id
                    );
                    
                    return (
                      <tr key={section.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-semibold border-r">
                          <div className="flex flex-col">
                            <span className="text-blue-600">{section.name}</span>
                            <span className="text-xs text-gray-500 font-mono">{section.code}</span>
                          </div>
                        </td>
                        {activities.map(activity => {
                          const assigned = isAssigned(vendor.id, section.id, activity.id);
                          return (
                            <td key={activity.id} className="px-4 py-3 text-center border-r">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={assigned}
                                  onChange={() => toggleAssignment(vendor.id, section.id, activity.id)}
                                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={loading}
                                />
                              </label>
                              {assigned && (
                                <div className="mt-1 text-xs text-green-600 font-semibold">
                                  ✓ Active
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => assignAllActivities(vendor.id, section.id)}
                              disabled={loading}
                              className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs disabled:opacity-50"
                              title="Assign semua aktivitas"
                            >
                              ✓ All
                            </button>
                            <button
                              onClick={() => clearAllAssignments(vendor.id, section.id)}
                              disabled={loading || sectionAssignments.length === 0}
                              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs disabled:opacity-50"
                              title="Clear semua assignment"
                            >
                              ✕ Clear
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2">
                  <tr>
                    <td className="px-4 py-3 font-bold">
                      Total per Activity
                    </td>
                    {activities.map(activity => {
                      const count = assignments.filter(
                        a => a.vendor_id === vendor.id && a.activity_type_id === activity.id
                      ).length;
                      return (
                        <td key={activity.id} className="px-4 py-3 text-center font-bold text-purple-600">
                          {count}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-bold text-gray-800">
                      {getAssignmentCount(vendor.id)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Warning if vendors have no assignments */}
      {vendors.some(v => getAssignmentCount(v.id) === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Warning:</strong> Beberapa vendor belum di-assign ke section + activity apapun.
            Vendor tidak akan bisa input transaksi sampai ada assignment.
          </p>
          <div className="mt-2 text-xs text-yellow-700">
            Vendor tanpa assignment:
            <ul className="list-disc ml-5 mt-1">
              {vendors
                .filter(v => getAssignmentCount(v.id) === 0)
                .map(v => <li key={v.id}>{v.name}</li>)
              }
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}