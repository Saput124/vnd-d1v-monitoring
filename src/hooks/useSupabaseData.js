// src/hooks/useSupabaseData.js - FIXED VERSION

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
    sections: [],
    workers: [],
    loading: true,
    currentUser: null,
    supabase: supabase
  });

  const currentUser = getCurrentUser();

  const fetchAllData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));

      // ========== FETCH SECTIONS (All users can see) ==========
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('name');
      
      if (sectionsError) throw sectionsError;

      // ========== FETCH VENDORS ==========
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('name');
      
      if (vendorsError) throw vendorsError;

      // ========== FETCH ACTIVITY TYPES (dengan filter section) ==========
      let activityTypesData = [];
      
      if (currentUser?.role === 'admin') {
        // Admin: lihat semua
        const { data, error } = await supabase
          .from('activity_types')
          .select('*')
          .eq('active', true)
          .order('name');
        
        if (error) throw error;
        activityTypesData = data || [];
      } else if (['section_head', 'supervisor'].includes(currentUser?.role)) {
        // Section staff: hanya aktivitas yang di-assign ke section mereka
        const { data: sectionActivities, error: saError } = await supabase
          .from('section_activities')
          .select('activity_type_id')
          .eq('section_id', currentUser.section_id);
        
        if (saError) throw saError;

        const allowedActivityIds = sectionActivities?.map(sa => sa.activity_type_id) || [];
        
        if (allowedActivityIds.length > 0) {
          const { data, error } = await supabase
            .from('activity_types')
            .select('*')
            .in('id', allowedActivityIds)
            .eq('active', true)
            .order('name');
          
          if (error) throw error;
          activityTypesData = data || [];
        }
      } else if (currentUser?.role === 'vendor') {
        // Vendor: aktivitas dari section yang dia bisa akses
        const { data: vendorSections, error: vsError } = await supabase
          .from('vendor_sections')
          .select('section_id')
          .eq('vendor_id', currentUser.vendor_id);
        
        if (vsError) throw vsError;

        const allowedSectionIds = vendorSections?.map(vs => vs.section_id) || [];
        
        if (allowedSectionIds.length > 0) {
          const { data: sectionActivities, error: saError } = await supabase
            .from('section_activities')
            .select('activity_type_id')
            .in('section_id', allowedSectionIds);
          
          if (saError) throw saError;

          const allowedActivityIds = [...new Set(sectionActivities?.map(sa => sa.activity_type_id) || [])];
          
          if (allowedActivityIds.length > 0) {
            const { data, error } = await supabase
              .from('activity_types')
              .select('*')
              .in('id', allowedActivityIds)
              .eq('active', true)
              .order('name');
            
            if (error) throw error;
            activityTypesData = data || [];
          }
        }
      }

      // ========== FETCH BLOCKS ==========
      const { data: blocksData, error: blocksError } = await supabase
        .from('blocks')
        .select('*')
        .order('name');
      
      if (blocksError) throw blocksError;

      // ========== FETCH BLOCK ACTIVITIES (dengan filter) ==========
      let blockActivitiesQuery = supabase
        .from('block_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (currentUser?.role === 'section_head' || currentUser?.role === 'supervisor') {
        blockActivitiesQuery = blockActivitiesQuery.eq('section_id', currentUser.section_id);
      } else if (currentUser?.role === 'vendor') {
        // Vendor: hanya lihat block_activities dari section yang dia bisa akses
        const { data: vendorSections } = await supabase
          .from('vendor_sections')
          .select('section_id')
          .eq('vendor_id', currentUser.vendor_id);

        const allowedSectionIds = vendorSections?.map(vs => vs.section_id) || [];

        if (allowedSectionIds.length > 0) {
          blockActivitiesQuery = blockActivitiesQuery.in('section_id', allowedSectionIds);
        } else {
          // Vendor belum di-assign section, return kosong
          blockActivitiesQuery = blockActivitiesQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const { data: blockActivitiesData, error: blockActivitiesError } = await blockActivitiesQuery;
      if (blockActivitiesError) throw blockActivitiesError;

      // ========== FETCH TRANSACTIONS (dengan filter) ==========
      let transactionsQuery = supabase
        .from('transactions')
        .select(`
          *,
          vendors(id, code, name),
          activity_types(id, code, name)
        `)
        .order('tanggal', { ascending: false });

      if (currentUser?.role === 'section_head' || currentUser?.role === 'supervisor') {
        transactionsQuery = transactionsQuery.eq('section_id', currentUser.section_id);
      } else if (currentUser?.role === 'vendor') {
        transactionsQuery = transactionsQuery.eq('vendor_id', currentUser.vendor_id);
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery;
      if (transactionsError) throw transactionsError;

      // ========== FETCH WORKERS ==========
      let workersQuery = supabase.from('workers').select('*').order('name');
      
      if (currentUser?.role === 'vendor') {
        workersQuery = workersQuery.eq('vendor_id', currentUser.vendor_id);
      }

      const { data: workersData, error: workersError } = await workersQuery;
      if (workersError) throw workersError;

      setData({
        blocks: blocksData || [],
        activityTypes: activityTypesData || [],
        blockActivities: blockActivitiesData || [],
        transactions: transactionsData || [],
        vendors: vendorsData || [],
        sections: sectionsData || [],
        workers: workersData || [],
        loading: false,
        currentUser,
        supabase,
        // Helper functions
        addVendor: async (vendorData) => {
          const { data, error } = await supabase
            .from('vendors')
            .insert([vendorData])
            .select()
            .single();
          
          if (error) throw error;
          await fetchAllData();
          return data;
        },
        updateVendor: async (id, vendorData) => {
          const { error } = await supabase
            .from('vendors')
            .update(vendorData)
            .eq('id', id);
          
          if (error) throw error;
          await fetchAllData();
        },
        deleteVendor: async (id) => {
          const { error } = await supabase
            .from('vendors')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          await fetchAllData();
        },
        addBlock: async (blockData) => {
          const { data, error } = await supabase
            .from('blocks')
            .insert([blockData])
            .select()
            .single();
          
          if (error) throw error;
          await fetchAllData();
          return data;
        },
        updateBlock: async (id, blockData) => {
          const { error } = await supabase
            .from('blocks')
            .update(blockData)
            .eq('id', id);
          
          if (error) throw error;
          await fetchAllData();
        },
        deleteBlock: async (id) => {
          const { error } = await supabase
            .from('blocks')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          await fetchAllData();
        },
        addWorker: async (workerData) => {
          const { data, error } = await supabase
            .from('workers')
            .insert([workerData])
            .select()
            .single();
          
          if (error) throw error;
          await fetchAllData();
          return data;
        },
        updateWorker: async (id, workerData) => {
          const { error } = await supabase
            .from('workers')
            .update(workerData)
            .eq('id', id);
          
          if (error) throw error;
          await fetchAllData();
        },
        deleteWorker: async (id) => {
          const { error } = await supabase
            .from('workers')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          await fetchAllData();
        },
        addActivityType: async (activityData) => {
          const { data, error } = await supabase
            .from('activity_types')
            .insert([activityData])
            .select()
            .single();
          
          if (error) throw error;
          await fetchAllData();
          return data;
        },
        updateActivityType: async (id, activityData) => {
          const { error } = await supabase
            .from('activity_types')
            .update(activityData)
            .eq('id', id);
          
          if (error) throw error;
          await fetchAllData();
        },
        deleteActivityType: async (id) => {
          const { error } = await supabase
            .from('activity_types')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          await fetchAllData();
        },
        addBlockActivity: async (blockActivityData) => {
          // Get block and section info
          const block = blocksData?.find(b => b.id === blockActivityData.block_id);
          const section = sectionsData?.find(s => s.id === currentUser?.section_id);
          
          const dataToInsert = {
            ...blockActivityData,
            section_id: currentUser?.role === 'admin' 
              ? blockActivityData.section_id || currentUser?.section_id
              : currentUser?.section_id,
            vendor_id: currentUser?.role === 'vendor' ? currentUser?.vendor_id : null,
            kategori: blockActivityData.kategori || block?.kategori || '',
            varietas: blockActivityData.varietas || block?.varietas || '',
            luas_dikerjakan: 0,
            persen_selesai: 0,
            luas_sisa: blockActivityData.target_luasan
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
        deleteBlockActivity: async (id) => {
          const { error } = await supabase
            .from('block_activities')
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
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser?.id]);

  return {
    ...data,
    fetchAllData
  };
}