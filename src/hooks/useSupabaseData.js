// src/hooks/useSupabaseData.js - FIXED VERSION
// Filter di application level, BUKAN RLS

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

      // ========================================
      // FETCH BLOCKS
      // ========================================
      let blocksQuery = supabase.from('blocks').select('*').order('name');
      
      // Section Head/Supervisor: hanya blok section mereka
      if (['section_head', 'supervisor'].includes(currentUser?.role)) {
        blocksQuery = blocksQuery.eq('section_id', currentUser.section_id);
      }
      // Admin & Vendor: lihat semua blocks (vendor filter nanti di block_activities)

      const { data: blocksData, error: blocksError } = await blocksQuery;
      if (blocksError) throw blocksError;

      // ========================================
      // FETCH ACTIVITY TYPES (dengan filter section_activities)
      // ========================================
      let activityTypesData = [];
      
      if (currentUser?.role === 'admin') {
        // Admin: lihat semua activity types
        const { data, error } = await supabase
          .from('activity_types')
          .select('*')
          .eq('active', true)
          .order('name');
        if (error) throw error;
        activityTypesData = data || [];
      } else {
        // Non-admin: hanya activity yang di-assign ke section mereka
        const { data: sectionActivities, error: saError } = await supabase
          .from('section_activities')
          .select(`
            activity_type_id,
            activity_types(*)
          `)
          .eq('section_id', currentUser.section_id);

        if (saError) throw saError;

        activityTypesData = (sectionActivities || [])
          .map(sa => sa.activity_types)
          .filter(Boolean)
          .filter(at => at.active);
      }

      // ========================================
      // FETCH BLOCK ACTIVITIES (CRITICAL FILTERING)
      // ========================================
      let blockActivitiesQuery = supabase
        .from('block_activities')
        .select(`
          *,
          blocks(id, code, name, zone, luas_total),
          activity_types(id, code, name),
          sections(id, code, name)
        `)
        .order('created_at', { ascending: false });

      if (currentUser?.role === 'admin') {
        // Admin: lihat semua
        // No filter
      } else if (['section_head', 'supervisor'].includes(currentUser?.role)) {
        // Section Head/Supervisor: hanya section mereka
        blockActivitiesQuery = blockActivitiesQuery.eq('section_id', currentUser.section_id);
      } else if (currentUser?.role === 'vendor') {
        // 🔥 VENDOR: Filter section yang di-assign DAN hanya untuk vendor ini
        const { data: vendorSections } = await supabase
          .from('vendor_sections')
          .select('section_id')
          .eq('vendor_id', currentUser.vendor_id);

        const allowedSectionIds = vendorSections?.map(vs => vs.section_id) || [];

        if (allowedSectionIds.length > 0) {
          blockActivitiesQuery = blockActivitiesQuery.in('section_id', allowedSectionIds);
        } else {
          // Vendor belum di-assign section apapun
          blockActivitiesQuery = blockActivitiesQuery.eq('id', null);
        }
      }

      const { data: blockActivitiesData, error: blockActivitiesError } = await blockActivitiesQuery;
      if (blockActivitiesError) throw blockActivitiesError;

      // ========================================
      // FETCH TRANSACTIONS (CRITICAL FILTERING)
      // ========================================
      let transactionsQuery = supabase
        .from('transactions')
        .select(`
          *,
          vendors(id, code, name),
          activity_types(id, code, name),
          sections(id, code, name)
        `)
        .order('tanggal', { ascending: false });

      if (currentUser?.role === 'admin') {
        // Admin: lihat semua
        // No filter
      } else if (['section_head', 'supervisor'].includes(currentUser?.role)) {
        // 🔥 Section Head/Supervisor: HANYA transaksi section mereka
        // TIDAK peduli vendor siapa yang mengerjakan
        transactionsQuery = transactionsQuery.eq('section_id', currentUser.section_id);
      } else if (currentUser?.role === 'vendor') {
        // 🔥 VENDOR: Filter ganda
        // 1. Hanya transaksi dari vendor ini
        // 2. Hanya dari section yang di-assign
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
          transactionsQuery = transactionsQuery.eq('id', null);
        }
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery;
      if (transactionsError) throw transactionsError;

      // ========================================
      // FETCH VENDORS
      // ========================================
      let vendorsData = [];

      if (currentUser?.role === 'admin') {
        // Admin: lihat semua vendors
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .order('name');
        if (error) throw error;
        vendorsData = data || [];
      } else if (['section_head', 'supervisor'].includes(currentUser?.role)) {
        // Section Head/Supervisor: hanya vendor yang pernah kerja di section mereka
        // ATAU vendor yang di-assign ke section mereka
        const { data: vendorSections, error: vsError } = await supabase
          .from('vendor_sections')
          .select(`
            vendor_id,
            vendors(*)
          `)
          .eq('section_id', currentUser.section_id);

        if (vsError) throw vsError;

        vendorsData = (vendorSections || [])
          .map(vs => vs.vendors)
          .filter(Boolean);
      } else if (currentUser?.role === 'vendor') {
        // Vendor: hanya lihat data vendor mereka sendiri
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', currentUser.vendor_id)
          .single();

        if (error) throw error;
        vendorsData = data ? [data] : [];
      }

      // ========================================
      // FETCH SECTIONS
      // ========================================
      let sectionsData = [];

      if (currentUser?.role === 'admin') {
        // Admin: lihat semua sections
        const { data, error } = await supabase
          .from('sections')
          .select('*')
          .order('name');
        if (error) throw error;
        sectionsData = data || [];
      } else if (['section_head', 'supervisor'].includes(currentUser?.role)) {
        // Section Head/Supervisor: hanya section mereka
        const { data, error } = await supabase
          .from('sections')
          .select('*')
          .eq('id', currentUser.section_id)
          .single();

        if (error) throw error;
        sectionsData = data ? [data] : [];
      } else if (currentUser?.role === 'vendor') {
        // Vendor: sections yang di-assign ke mereka
        const { data: vendorSections, error: vsError } = await supabase
          .from('vendor_sections')
          .select(`
            section_id,
            sections(*)
          `)
          .eq('vendor_id', currentUser.vendor_id);

        if (vsError) throw vsError;

        sectionsData = (vendorSections || [])
          .map(vs => vs.sections)
          .filter(Boolean);
      }

      // ========================================
      // FETCH WORKERS
      // ========================================
      const { data: workersData, error: workersError } = await supabase
        .from('workers')
        .select('*')
        .order('name');
      if (workersError) throw workersError;

      // ========================================
      // SET STATE
      // ========================================
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
        supabase // Expose untuk detail queries
      });

    } catch (err) {
      console.error('❌ Error fetching data:', err);
      alert('Error loading data: ' + err.message);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    } else {
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [currentUser?.id]);

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  const addBlockActivity = async (activityData) => {
    const { error } = await supabase
      .from('block_activities')
      .insert([activityData]);
    
    if (error) throw error;
    await fetchAllData();
  };

  const updateBlockActivity = async (id, updates) => {
    const { error } = await supabase
      .from('block_activities')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    await fetchAllData();
  };

  const deleteBlockActivity = async (id) => {
    const { error } = await supabase
      .from('block_activities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    await fetchAllData();
  };

  const addActivityType = async (activityData) => {
    const { error } = await supabase
      .from('activity_types')
      .insert([activityData]);
    
    if (error) throw error;
    await fetchAllData();
  };

  const updateActivityType = async (id, updates) => {
    const { error } = await supabase
      .from('activity_types')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    await fetchAllData();
  };

  const deleteActivityType = async (id) => {
    const { error } = await supabase
      .from('activity_types')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    await fetchAllData();
  };

  return {
    ...data,
    fetchAllData,
    addBlockActivity,
    updateBlockActivity,
    deleteBlockActivity,
    addActivityType,
    updateActivityType,
    deleteActivityType
  };
}
