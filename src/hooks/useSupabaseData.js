// src/hooks/useSupabaseData.jsx - PRODUCTION VERSION
// Version with PROPER FILTERS for section isolation

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { getCurrentUser } from '../utils/supabase';

export function useSupabaseData() {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [blockActivities, setBlockActivities] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const currentUser = getCurrentUser();

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const isAdmin = currentUser?.role === 'admin';
      const isSectionStaff = ['section_head', 'supervisor'].includes(currentUser?.role);
      const isVendor = currentUser?.role === 'vendor';

      console.log('🔍 Fetching data for:', {
        username: currentUser?.username,
        role: currentUser?.role,
        section_id: currentUser?.section_id
      });

      // ============================================================================
      // VENDORS - Filter berdasarkan vendor_sections
      // ============================================================================
      let vendorsQuery = supabase.from('vendors').select('*').order('name');

      if (isSectionStaff && currentUser?.section_id) {
        const { data: vendorSections } = await supabase
          .from('vendor_sections')
          .select('vendor_id')
          .eq('section_id', currentUser.section_id);
        
        const vendorIds = vendorSections?.map(vs => vs.vendor_id) || [];
        
        if (vendorIds.length > 0) {
          vendorsQuery = vendorsQuery.in('id', vendorIds);
        } else {
          vendorsQuery = vendorsQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      if (isVendor && currentUser?.vendor_id) {
        vendorsQuery = vendorsQuery.eq('id', currentUser.vendor_id);
      }

      // ============================================================================
      // BLOCKS - Master blocks (Pool Divisi - accessible to all admin & section staff)
      // ============================================================================
      let blocksQuery = supabase.from('blocks').select('*').order('zone, name');

      // Admin & Section staff: bisa akses semua master blocks
      // Vendor: tidak perlu akses master blocks
      if (isVendor) {
        blocksQuery = blocksQuery.limit(0);
      }

      // ============================================================================
      // WORKERS - Filter by vendor
      // ============================================================================
      let workersQuery = supabase.from('workers').select('*, vendors(name)').order('name');

      if (isSectionStaff && currentUser?.section_id) {
        const { data: vendorSections } = await supabase
          .from('vendor_sections')
          .select('vendor_id')
          .eq('section_id', currentUser.section_id);
        
        const vendorIds = vendorSections?.map(vs => vs.vendor_id) || [];
        
        if (vendorIds.length > 0) {
          workersQuery = workersQuery.in('vendor_id', vendorIds);
        } else {
          workersQuery = workersQuery.eq('vendor_id', '00000000-0000-0000-0000-000000000000');
        }
      }

      if (isVendor && currentUser?.vendor_id) {
        workersQuery = workersQuery.eq('vendor_id', currentUser.vendor_id);
      }

      // ============================================================================
      // ACTIVITY_TYPES - Filter by section assignment
      // ============================================================================
      let activityTypesQuery = supabase
        .from('activity_types')
        .select('*')
        .eq('active', true)
        .order('name');

      // Section staff: hanya aktivitas yang di-assign ke section mereka
      if (isSectionStaff && currentUser?.section_id) {
        const { data: sectionActivities } = await supabase
          .from('section_activities')
          .select('activity_type_id')
          .eq('section_id', currentUser.section_id);
        
        const assignedActivityIds = sectionActivities?.map(sa => sa.activity_type_id) || [];
        
        console.log('📋 Section activities assigned:', assignedActivityIds.length);
        
        if (assignedActivityIds.length > 0) {
          activityTypesQuery = activityTypesQuery.in('id', assignedActivityIds);
        } else {
          // Section belum di-assign aktivitas apapun
          activityTypesQuery = activityTypesQuery.limit(0);
        }
      }

      // Vendor: aktivitas dari semua section yang mereka layani
      if (isVendor && currentUser?.vendor_sections?.length > 0) {
        const vendorSectionIds = currentUser.vendor_sections.map(s => s.id);
        
        const { data: sectionActivities } = await supabase
          .from('section_activities')
          .select('activity_type_id')
          .in('section_id', vendorSectionIds);
        
        const assignedActivityIds = [...new Set(
          sectionActivities?.map(sa => sa.activity_type_id) || []
        )];
        
        if (assignedActivityIds.length > 0) {
          activityTypesQuery = activityTypesQuery.in('id', assignedActivityIds);
        } else {
          activityTypesQuery = activityTypesQuery.limit(0);
        }
      }

      // ============================================================================
      // BLOCK_ACTIVITIES - Filter by section_id
      // ============================================================================
      let blockActivitiesQuery = supabase
        .from('block_activities')
        .select('*')
        .order('target_bulan, created_at');

      // Section staff: hanya block_activities untuk section mereka
      if (isSectionStaff && currentUser?.section_id) {
        console.log('🔍 Filtering block_activities by section_id:', currentUser.section_id);
        
        blockActivitiesQuery = blockActivitiesQuery.eq('section_id', currentUser.section_id);
      } 
      // Vendor: block_activities dari semua section yang mereka layani
      else if (isVendor && currentUser?.vendor_sections?.length > 0) {
        const vendorSectionIds = currentUser.vendor_sections.map(s => s.id);
        blockActivitiesQuery = blockActivitiesQuery.in('section_id', vendorSectionIds);
      }
      // Admin: no filter (semua)

      // ============================================================================
      // TRANSACTIONS - Filter by vendor
      // ============================================================================
      let transactionsQuery = supabase
        .from('transactions')
        .select(`
          *,
          vendors(name),
          activity_types(name, code)
        `)
        .order('tanggal', { ascending: false });

      if (isSectionStaff && currentUser?.section_id) {
        const { data: vendorSections } = await supabase
          .from('vendor_sections')
          .select('vendor_id')
          .eq('section_id', currentUser.section_id);
        
        const vendorIds = vendorSections?.map(vs => vs.vendor_id) || [];
        
        if (vendorIds.length > 0) {
          transactionsQuery = transactionsQuery.in('vendor_id', vendorIds);
        } else {
          transactionsQuery = transactionsQuery.eq('vendor_id', '00000000-0000-0000-0000-000000000000');
        }
      }

      if (isVendor && currentUser?.vendor_id) {
        transactionsQuery = transactionsQuery.eq('vendor_id', currentUser.vendor_id);
      }

      // ============================================================================
      // Execute all queries
      // ============================================================================
      const [
        vendorsRes, 
        blocksRes, 
        workersRes, 
        activityRes, 
        blockActivitiesRes,
        transactionsRes
      ] = await Promise.all([
        vendorsQuery,
        blocksQuery,
        workersQuery,
        activityTypesQuery,
        blockActivitiesQuery,
        transactionsQuery
      ]);

      if (vendorsRes.error) throw vendorsRes.error;
      if (blocksRes.error) throw blocksRes.error;
      if (workersRes.error) throw workersRes.error;
      if (activityRes.error) throw activityRes.error;
      if (blockActivitiesRes.error) throw blockActivitiesRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      setVendors(vendorsRes.data || []);
      setBlocks(blocksRes.data || []);
      setWorkers(workersRes.data || []);
      setActivityTypes(activityRes.data || []);
      setBlockActivities(blockActivitiesRes.data || []);
      setTransactions(transactionsRes.data || []);
      
      console.log('✅ Data loaded:', {
        vendors: vendorsRes.data?.length,
        blocks: blocksRes.data?.length,
        workers: workersRes.data?.length,
        activityTypes: activityRes.data?.length,
        blockActivities: blockActivitiesRes.data?.length,
        transactions: transactionsRes.data?.length,
        role: currentUser?.role,
        section_id: currentUser?.section_id
      });
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      alert('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ============================================================================
  // CRUD FUNCTIONS
  // ============================================================================
  const addVendor = async (data) => {
    const { error } = await supabase.from('vendors').insert([data]);
    if (error) throw error;
    await fetchAllData();
  };

  const updateVendor = async (id, data) => {
    const { error } = await supabase.from('vendors').update(data).eq('id', id);
    if (error) throw error;
    await fetchAllData();
  };

  const deleteVendor = async (id) => {
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) throw error;
    await fetchAllData();
  };

  const addBlock = async (data) => {
    const { error } = await supabase.from('blocks').insert([data]);
    if (error) throw error;
    await fetchAllData();
  };

  const updateBlock = async (id, data) => {
    const { error } = await supabase.from('blocks').update(data).eq('id', id);
    if (error) throw error;
    await fetchAllData();
  };

  const deleteBlock = async (id) => {
    const { error } = await supabase.from('blocks').delete().eq('id', id);
    if (error) throw error;
    await fetchAllData();
  };

  const addWorker = async (data) => {
    const { error } = await supabase.from('workers').insert([data]);
    if (error) throw error;
    await fetchAllData();
  };

  const updateWorker = async (id, data) => {
    const { error } = await supabase.from('workers').update(data).eq('id', id);
    if (error) throw error;
    await fetchAllData();
  };

  const deleteWorker = async (id) => {
    const { error } = await supabase.from('workers').delete().eq('id', id);
    if (error) throw error;
    await fetchAllData();
  };

  const addBlockActivity = async (data) => {
    // AUTO-ASSIGN section_id jika user bukan admin
    if (!data.section_id && currentUser?.role !== 'admin' && currentUser?.section_id) {
      data.section_id = currentUser.section_id;
      console.log('🔧 Auto-assigned section_id:', data.section_id);
    }
    
    const { error } = await supabase.from('block_activities').insert([data]);
    if (error) throw error;
    await fetchAllData();
  };

  const deleteBlockActivity = async (id) => {
    const { error } = await supabase.from('block_activities').delete().eq('id', id);
    if (error) throw error;
    await fetchAllData();
  };

  return {
    loading,
    vendors,
    blocks,
    workers,
    activityTypes,
    blockActivities,
    transactions,
    fetchAllData,
    addVendor,
    updateVendor,
    deleteVendor,
    addBlock,
    updateBlock,
    deleteBlock,
    addWorker,
    updateWorker,
    deleteWorker,
    addBlockActivity,
    deleteBlockActivity,
    supabase,
    currentUser
  };
}