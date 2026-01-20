// src/components/SectionActivityManagement.jsx
// KOMPONEN BARU: Untuk assign aktivitas ke sections

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function SectionActivityManagement() {
  const [sections, setSections] = useState([]);
  const [activities, setActivities] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('name');
      
      if (sectionsError) throw sectionsError;

      // Fetch activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activity_types')
        .select('*')
        .eq('active', true)
        .order('name');
      
      if (activitiesError) throw activitiesError;

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('section_activities')
        .select(`
          *,
          sections(id, code, name),
          activity_types(id, code, name)
        `);
      
      if (assignmentsError) throw assignmentsError;

      setSections(sectionsData || []);
      setActivities(activitiesData || []);
      setAssignments(assignmentsData || []);
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

  const isAssigned = (sectionId, activityId) => {
    return assignments.some(
      a => a.section_id === sectionId && a.activity_type_id === activityId
    );
  };

  const toggleAssignment = async (sectionId, activityId) => {
    try {
      setLoading(true);
      
      const assigned = isAssigned(sectionId, activityId);

      if (assigned) {
        // UNASSIGN
        const { error } = await supabase
          .from('section_activities')
          .delete()
          .eq('section_id', sectionId)
          .eq('activity_type_id', activityId);

        if (error) throw error;
        console.log('✅ Unassigned activity from section');
      } else {
        // ASSIGN
        const { error } = await supabase
          .from('section_activities')
          .insert([{
            section_id: sectionId,
            activity_type_id: activityId
          }]);

        if (error) throw error;
        console.log('✅ Assigned activity to section');
      }

      await fetchData();
    } catch (err) {
      console.error('Error toggling assignment:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAssignedActivitiesCount = (sectionId) => {
    return assignments.filter(a => a.section_id === sectionId).length;
  };

  if (loading && sections.length === 0) {
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
          <strong>📋 Section Activity Assignment:</strong> Tetapkan aktivitas mana yang menjadi tanggung jawab setiap section.
          Section staff hanya bisa registrasi blok dan input transaksi untuk aktivitas yang di-assign ke section mereka.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <p className="text-sm opacity-90 mb-1">Total Sections</p>
          <p className="text-4xl font-bold">{sections.length}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <p className="text-sm opacity-90 mb-1">Total Activities</p>
          <p className="text-4xl font-bold">{activities.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <p className="text-sm opacity-90 mb-1">Total Assignments</p>
          <p className="text-4xl font-bold">{assignments.length}</p>
        </div>
      </div>

      {/* Section Selector for Mobile */}
      <div className="md:hidden">
        <label className="block text-sm font-medium mb-2">Pilih Section:</label>
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value="">-- Lihat Semua --</option>
          {sections.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({getAssignedActivitiesCount(s.id)} activities)
            </option>
          ))}
        </select>
      </div>

      {/* Assignment Matrix */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-800">
            📊 Assignment Matrix
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Klik checkbox untuk assign/unassign aktivitas ke section
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold sticky left-0 bg-blue-600">
                  Section
                </th>
                {activities.map(activity => (
                  <th key={activity.id} className="px-4 py-4 text-center font-semibold min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs bg-white text-blue-600 px-2 py-1 rounded font-mono">
                        {activity.code}
                      </span>
                      <span className="text-sm">{activity.name}</span>
                    </div>
                  </th>
                ))}
                <th className="px-6 py-4 text-center font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sections
                .filter(s => !selectedSection || s.id === selectedSection)
                .map((section, idx) => (
                  <tr key={section.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-semibold sticky left-0 bg-inherit border-r">
                      <div className="flex flex-col">
                        <span className="text-blue-600">{section.name}</span>
                        <span className="text-xs text-gray-500 font-mono">{section.code}</span>
                      </div>
                    </td>
                    {activities.map(activity => {
                      const assigned = isAssigned(section.id, activity.id);
                      return (
                        <td key={activity.id} className="px-4 py-4 text-center border-r">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={assigned}
                              onChange={() => toggleAssignment(section.id, activity.id)}
                              disabled={loading}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <td className="px-6 py-4 text-center font-bold text-blue-600 border-l">
                      {getAssignedActivitiesCount(section.id)}
                    </td>
                  </tr>
                ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2">
              <tr>
                <td className="px-6 py-4 font-bold sticky left-0 bg-gray-100">
                  Total Sections
                </td>
                {activities.map(activity => {
                  const count = assignments.filter(
                    a => a.activity_type_id === activity.id
                  ).length;
                  return (
                    <td key={activity.id} className="px-4 py-4 text-center font-bold text-purple-600">
                      {count}
                    </td>
                  );
                })}
                <td className="px-6 py-4 text-center font-bold text-gray-800">
                  {assignments.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Detailed Assignments List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📝 Detailed Assignments
        </h3>

        {sections.map(section => {
          const sectionAssignments = assignments.filter(
            a => a.section_id === section.id
          );

          if (selectedSection && section.id !== selectedSection) return null;

          return (
            <div key={section.id} className="mb-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="font-bold text-blue-600">{section.name}</h4>
                  <p className="text-xs text-gray-500">Code: {section.code}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {sectionAssignments.length} activities
                </span>
              </div>

              {sectionAssignments.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  ⚠️ Belum ada aktivitas yang di-assign ke section ini
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sectionAssignments.map(assignment => (
                    <div
                      key={assignment.id}
                      className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                    >
                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-mono">
                        {assignment.activity_types.code}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {assignment.activity_types.name}
                      </span>
                      <button
                        onClick={() => toggleAssignment(section.id, assignment.activity_type_id)}
                        disabled={loading}
                        className="ml-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                        title="Remove assignment"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning if sections have no assignments */}
      {sections.some(s => getAssignedActivitiesCount(s.id) === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Warning:</strong> Beberapa section belum di-assign aktivitas apapun.
            Section staff tidak akan bisa registrasi blok atau input transaksi sampai aktivitas di-assign.
          </p>
        </div>
      )}
    </div>
  );
}