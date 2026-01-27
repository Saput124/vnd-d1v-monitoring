import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { getCurrentUser } from '../utils/supabase';

export function useSupabaseData() {
  const [data, setData] = useState({
    blocks: [],
    activityTypes: [],
    blockActivities: [],
    transactions: [],
    vendors: [],
    vendorAssignments: [],
    sections: [],
    workers: [],
    loading: true,
    currentUser: null,
    supabase
  });

  const currentUser = getCurrentUser();

  const fetchAllData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));

      /* ================= SECTIONS ================= */
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('name');

      if (sectionsError) throw sectionsError;

      /* ================= VENDORS ================= */
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (vendorsError) throw vendorsError;

      /* ================= VENDOR ASSIGNMENTS (NEW) ================= */
      const { data: vendorAssignmentsData, error: vaError } = await supabase
        .from('vendor_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (vaError) throw vaError;

      /* ================= ACTIVITY TYPES ================= */
      let activityTypesData = [];

      if (currentUser?.role === 'admin') {
        const { data, error } = await supabase
          .from('activity_types')
          .select('*')
          .eq('active', true)
          .order('name');

        if (error) throw error;
        activityTypesData = data || [];

      } else if (['section_head', 'supervisor'].includes(currentUser?.role)) {
        const { data: sectionActivities, error } = await supabase
          .from('section_activities')
          .select('activity_type_id')
          .eq('section_id', currentUser.section_id);

        if (error) throw error;

        const ids = sectionActivities.map(sa => sa.activity_type_id);
        if (ids.length) {
          const { data, error } = await supabase
            .from('activity_types')
            .select('*')
            .in('id', ids)
            .eq('active', true)
            .order('name');

          if (error) throw error;
          activityTypesData = data || [];
        }

      } else if (currentUser?.role === 'vendor') {
        const { data: vendorSections, error } = await supabase
          .from('vendor_sections')
          .select('section_id')
          .eq('vendor_id', currentUser.vendor_id);

        if (error) throw error;

        const sectionIds = vendorSections.map(vs => vs.section_id);
        if (sectionIds.length) {
          const { data: sectionActivities, error } = await supabase
            .from('section_activities')
            .select('activity_type_id')
            .in('section_id', sectionIds);

          if (error) throw error;

          const ids = [...new Set(sectionActivities.map(sa => sa.activity_type_id))];
          if (ids.length) {
            const { data, error } = await supabase
              .from('activity_types')
              .select('*')
              .in('id', ids)
              .eq('active', true)
              .order('name');

            if (error) throw error;
            activityTypesData = data || [];
          }
        }
      }

      /* ================= BLOCKS ================= */
      const { data: blocksData, error: blocksError } = await supabase
        .from('blocks')
        .select('*')
        .order('name');

      if (blocksError) throw blocksError;

      /* ================= BLOCK ACTIVITIES ================= */
      let blockActivitiesQuery = supabase
        .from('block_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (['section_head', 'supervisor'].includes(currentUser?.role)) {
        blockActivitiesQuery = blockActivitiesQuery.eq('section_id', currentUser.section_id);
      } else if (currentUser?.role === 'vendor') {
        const { data: vendorSections } = await supabase
          .from('vendor_sections')
          .select('section_id')
          .eq('vendor_id', currentUser.vendor_id);

        const ids = vendorSections.map(vs => vs.section_id);
        blockActivitiesQuery = ids.length
          ? blockActivitiesQuery.in('section_id', ids)
          : blockActivitiesQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { data: blockActivitiesData, error: baError } = await blockActivitiesQuery;
      if (baError) throw baError;

      /* ================= TRANSACTIONS ================= */
      let transactionsQuery = supabase
        .from('transactions')
        .select(`
          *,
          vendors(id, code, name),
          activity_types(id, code, name)
        `)
        .order('tanggal', { ascending: false });

      if (['section_head', 'supervisor'].includes(currentUser?.role)) {
        transactionsQuery = transactionsQuery.eq('section_id', currentUser.section_id);
      } else if (currentUser?.role === 'vendor') {
        transactionsQuery = transactionsQuery.eq('vendor_id', currentUser.vendor_id);
      }

      const { data: transactionsData, error: txError } = await transactionsQuery;
      if (txError) throw txError;

      /* ================= WORKERS ================= */
      let workersQuery = supabase.from('workers').select('*').order('name');
      if (currentUser?.role === 'vendor') {
        workersQuery = workersQuery.eq('vendor_id', currentUser.vendor_id);
      }

      const { data: workersData, error: workersError } = await workersQuery;
      if (workersError) throw workersError;

      /* ================= FINAL STATE ================= */
      setData(prev => ({
        ...prev,
        blocks: blocksData || [],
        activityTypes: activityTypesData || [],
        blockActivities: blockActivitiesData || [],
        transactions: transactionsData || [],
        vendors: vendorsData || [],
        vendorAssignments: vendorAssignmentsData || [],
        sections: sectionsData || [],
        workers: workersData || [],
        loading: false,
        currentUser,
        supabase
      }));

    } catch (err) {
      console.error('Error fetching data:', err);
      setData(prev => ({
        ...prev,
        loading: false,
        currentUser,
        supabase
      }));
    }
  };

  useEffect(() => {
    if (currentUser?.id) fetchAllData();
  }, [currentUser?.id]);

  return {
    ...data,
    fetchAllData
  };
}