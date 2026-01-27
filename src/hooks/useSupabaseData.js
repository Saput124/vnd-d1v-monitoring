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
        const { data: sa, error } = await supabase
          .from('section_activities')
          .select('activity_type_id')
          .eq('section_id', currentUser.section_id);
        if (error) throw error;

        const ids = sa.map(x => x.activity_type_id);
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
        const { data: vs, error } = await supabase
          .from('vendor_sections')
          .select('section_id')
          .eq('vendor_id', currentUser.vendor_id);
        if (error) throw error;

        const sectionIds = vs.map(v => v.section_id);
        if (sectionIds.length) {
          const { data: sa, error } = await supabase
            .from('section_activities')
            .select('activity_type_id')
            .in('section_id', sectionIds);
          if (error) throw error;

          const ids = [...new Set(sa.map(x => x.activity_type_id))];
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
        const { data: vs } = await supabase
          .from('vendor_sections')
          .select('section_id')
          .eq('vendor_id', currentUser.vendor_id);

        const ids = vs.map(v => v.section_id);
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

      /* ================= SET STATE + HELPERS ================= */
      setData({
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
        supabase,

        /* ===== VENDOR ===== */
        addVendor: async payload => {
          const { data, error } = await supabase.from('vendors').insert([payload]).select().single();
          if (error) throw error;
          await fetchAllData();
          return data;
        },
        updateVendor: async (id, payload) => {
          const { error } = await supabase.from('vendors').update(payload).eq('id', id);
          if (error) throw error;
          await fetchAllData();
        },
        deleteVendor: async id => {
          const { error } = await supabase.from('vendors').delete().eq('id', id);
          if (error) throw error;
          await fetchAllData();
        },

        /* ===== BLOCK ===== */
        addBlock: async payload => {
          const { data, error } = await supabase.from('blocks').insert([payload]).select().single();
          if (error) throw error;
          await fetchAllData();
          return data;
        },
        updateBlock: async (id, payload) => {
          const { error } = await supabase.from('blocks').update(payload).eq('id', id);
          if (error) throw error;
          await fetchAllData();
        },
        deleteBlock: async id => {
          const { error } = await supabase.from('blocks').delete().eq('id', id);
          if (error) throw error;
          await fetchAllData();
        },

        /* ===== WORKER ===== */
        addWorker: async payload => {
          const { data, error } = await supabase.from('workers').insert([payload]).select().single();
          if (error) throw error;
          await fetchAllData();
          return data;
        },
        updateWorker: async (id, payload) => {
          const { error } = await supabase.from('workers').update(payload).eq('id', id);
          if (error) throw error;
          await fetchAllData();
        },
        deleteWorker: async id => {
          const { error } = await supabase.from('workers').delete().eq('id', id);
          if (error) throw error;
          await fetchAllData();
        },

        /* ===== ACTIVITY TYPE ===== */
        addActivityType: async payload => {
          const { data, error } = await supabase.from('activity_types').insert([payload]).select().single();
          if (error) throw error;
          await fetchAllData();
          return data;
        },
        updateActivityType: async (id, payload) => {
          const { error } = await supabase.from('activity_types').update(payload).eq('id', id);
          if (error) throw error;
          await fetchAllData();
        },
        deleteActivityType: async id => {
          const { error } = await supabase.from('activity_types').delete().eq('id', id);
          if (error) throw error;
          await fetchAllData();
        },

        /* ===== BLOCK ACTIVITY ===== */
        addBlockActivity: async payload => {
          const block = blocksData.find(b => b.id === payload.block_id);

          const dataToInsert = {
            ...payload,
            section_id:
              currentUser.role === 'admin'
                ? payload.section_id
                : currentUser.section_id,
            vendor_id:
              currentUser.role === 'vendor'
                ? currentUser.vendor_id
                : null,
            kategori: payload.kategori || block?.kategori || '',
            varietas: payload.varietas || block?.varietas || '',
            luas_dikerjakan: 0,
            persen_selesai: 0,
            luas_sisa: payload.target_luasan
          };

          const { data, error } = await supabase
            .from('block_activities')
            .insert([dataToInsert])
            .select()
            .single();

          if (error) throw error;
          await fetchAllData();
          return data;
        },
        deleteBlockActivity: async id => {
          const { error } = await supabase.from('block_activities').delete().eq('id', id);
          if (error) throw error;
          await fetchAllData();
        },

        /* ===== VENDOR ASSIGNMENT (NEW) ===== */
        addVendorAssignment: async payload => {
          const { data, error } = await supabase
            .from('vendor_assignments')
            .insert([payload])
            .select()
            .single();
          if (error) throw error;
          await fetchAllData();
          return data;
        },
        deleteVendorAssignment: async id => {
          const { error } = await supabase
            .from('vendor_assignments')
            .delete()
            .eq('id', id);
          if (error) throw error;
          await fetchAllData();
        }
      });

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