// src/hooks/useSupabaseData.js - UPDATED WITH SECTION FILTERING

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
    loading: true
  });

  const currentUser = getCurrentUser();

  const fetchAllData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }));

      // ========== FETCH BLOCKS ==========
      let blocksQuery = supabase.from('blocks').select('*').order('name');
      
      // Admin: lihat semua
      // Section Head/Supervisor: hanya blok section mereka
      // Vendor: tidak perlu filter di blocks, filter di block_activities
      if (['section_head', 'supervisor'].includes(currentUser?.role)) {
        blocksQuery = blocksQuery.eq('section_id', currentUser.section_id);
      }

      const { data: blocksData, error: blocksError } = await blocksQuery;
      if (blocksError) throw blocksError;

      // ========== FETCH ACTIVITY TYPES (dengan filter section) ==========
      let activityTypesQuery = supabase
        .from('activity_types')
        .select('*')
        .eq('active', true)
        .order('name');

      // Jika bukan admin, filter hanya aktivitas yang di-assign ke section user
      if (currentUser?.role !== 'admin') {
        const { data: sectionActivities } = await supabase
          .from('section_activities')
          .select('activity_type_id')
          .eq('section_id', currentUser.section_id);

        const allowedActivityIds = sectionActivities?.map(sa => sa.activity_type_id) || [];
        
        if (allowedActivityIds.length > 0) {
          activityTypesQuery = activityTypesQuery.in('id', allowedActivityIds);
        } else {
          // Tidak ada aktivitas untuk section ini
          const { data: activityTypesData } = await activityTypesQuery;
          setData({
            blocks: blocksData || [],
            activityTypes: [], // ❌ Kosongkan activity types
            blockActivities: [],
            transactions: [],
            vendors: [],
            sections: [],
            workers: [],
            loading: false,
            currentUser
          });
          return;
        }
      }

      const { data: activityTypesData, error: activityTypesError } = await activityTypesQuery;
      if (activityTypesError) throw activityTypesError;

      // ========== FETCH BLOCK ACTIVITIES (CRITICAL: Filter section) ==========
      let blockActivitiesQuery = supabase
        .from('block_activities')
        .select(`
          *,
          blocks(id, code, name, zone, luas_total),
          activity_types(id, code, name),
          sections(id, code, name)
        `)
        .order('created_at', { ascending: false });

      // 🔒 FILTER BERDASARKAN ROLE
      if (currentUser?.role === 'section_head' || currentUser?.role === 'supervisor') {
        blockActivitiesQuery = blockActivitiesQuery.eq('section_id', currentUser.section_id);
      } else if (currentUser?.role === 'vendor') {
        // 🔥 FIX UTAMA: Vendor hanya lihat section yang di-assign
        const { data: vendorSections } = await supabase
          .from('vendor_sections')
          .select('section_id')
          .eq('vendor_id', currentUser.vendor_id);

        const allowedSectionIds = vendorSections?.map(vs => vs.section_id) || [];

        if (allowedSectionIds.length > 0) {
          blockActivitiesQuery = blockActivitiesQuery
            .eq('vendor_id', currentUser.vendor_id)
            .in('section_id', allowedSectionIds);
        } else {
          // Vendor belum di-assign section
          blockActivitiesQuery = blockActivitiesQuery.eq('id', null); // Return empty
        }
      }

      const { data: blockActivitiesData, error: blockActivitiesError } = await blockActivitiesQuery;
      if (blockActivitiesError) throw blockActivitiesError;

      // ========== FETCH TRANSACTIONS (CRITICAL: Filter section) ==========
      let transactionsQuery = supabase
        .from('transactions')
        .select(`
          *,
          vendors(id, code, name),
          activity_types(id, code, name),
          sections(id, code, name)
        `)
        .order('tanggal', { ascending: false });

      // 🔒 FILTER BERDASARKAN ROLE
      if (currentUser?.role === 'section_head' || currentUser?.role === 'supervisor') {
        transactionsQuery = transactionsQuery.eq('section_id', currentUser.section_id);
      } else if (currentUser?.role === 'vendor') {
        // 🔥 FIX UTAMA: Vendor hanya lihat transaksi dari section yang di-assign
        const { data: vendorSections } = await supabase
          .from('vendor_sections')
          .select('section_id')
          .eq('vendor_id', currentUser.vendor_id);

        const allowedSectionIds = vendorSections?.map(vs => vs.section_id) || [];

        if (allowedSectionIds.length > 0) {
          transactionsQuery = transactionsQuery
            .eq('vendor_id', currentUser.vendor_id)
            .in('section_id', allowedSectionIds);
        } else {
          transactionsQuery = transactionsQuery.eq('id', null); // Return empty
        }
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery;
      if (transactionsError) throw transactionsError;

      // ========== FETCH VENDORS ==========
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('name');
      if (vendorsError) throw vendorsError;

      // ========== FETCH SECTIONS ==========
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('name');
      if (sectionsError) throw sectionsError;

      // ========== FETCH WORKERS ==========
      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .order('name');
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
        supabase // Expose supabase untuk detail queries
      });

    } catch (err) {
      console.error('Error fetching data:', err);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser?.id]);

  // Return dengan helper functions
  return {
    ...data,
    fetchAllData,
    // Helper: Check if user can access a section
    canAccessSection: (sectionId) => {
      if (currentUser?.role === 'admin') return true;
      if (['section_head', 'supervisor'].includes(currentUser?.role)) {
        return currentUser.section_id === sectionId;
      }
      if (currentUser?.role === 'vendor') {
        // Check vendor_sections
        return data.blockActivities.some(ba => ba.section_id === sectionId);
      }
      return false;
    }
  };
}