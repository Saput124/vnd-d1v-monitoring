//src/hooks/useSupabaseData.js - FIXED VERSION

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

      // ============================================================================
      // 1️⃣ VENDORS - Filter berdasarkan vendor_sections
      // ============================================================================
      let vendorsQuery = supabase.from('vendors').select('*').order('name');

      if (isSectionStaff && currentUser?.section_id) {
        // Section staff: hanya vendor yang melayani section mereka
        const { data: vendorSections } = await supabase
          .from('vendor_sections')
          .select('vendor_id')
          .eq('section_id', currentUser.section_id);
        
        const vendorIds = vendorSections?.map(vs => vs.vendor_id) || [];
        
        if (vendorIds.length > 0) {
          vendorsQuery = vendorsQuery.in('id', vendorIds);
        } else {
          // Jika section belum assign vendor, return empty
          vendorsQuery = vendorsQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // UUID yang pasti tidak ada
        }
      }

      if (isVendor && currentUser?.vendor_id) {
        // Vendor: hanya lihat vendor mereka sendiri
        vendorsQuery = vendorsQuery.eq('id', currentUser.vendor_id);
      }

      // ============================================================================
      // 2️⃣ BLOCKS - Master blocks (Pool Divisi)
      // ============================================================================
      let blocksQuery = supabase.from('blocks').select('*').order('zone, name');

      // ✅ FIX: Admin & Section staff bisa akses SEMUA master blocks
      // ❌ Vendor TIDAK perlu akses master blocks (cuma via block_activities)
      
      if (isVendor) {
        // Vendor tidak perlu akses master blocks di Master Data tab
        blocksQuery = blocksQuery.limit(0); // Return empty
      }
      // Admin & Section staff: NO FILTER (all master blocks accessible)

      // ============================================================================
      // 3️⃣ WORKERS - Filter by vendor (via vendor_sections untuk section staff)
      // ============================================================================
      let workersQuery = supabase.from('workers').select('*, vendors(name)').order('name');

      if (isSectionStaff && currentUser?.section_id) {
        // Section staff: workers dari vendor yang melayani section mereka
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
      // 4️⃣ BLOCK_ACTIVITIES - Filter by section_id (STRICT)
      // ============================================================================
      let blockActivitiesQuery = supabase
        .from('block_activities')
        .select('*')
        .order('target_bulan, created_at');

      // ✅ STRICT FILTER: Section staff HANYA lihat block_activities section mereka
      if (isSectionStaff && currentUser?.section_id) {
        blockActivitiesQuery = blockActivitiesQuery.eq('section_id', currentUser.section_id);
      } else if (isVendor && currentUser?.vendor_sections?.length > 0) {
        // Vendor: block_activities dari semua section yang mereka layani
        const vendorSectionIds = currentUser.vendor_sections.map(s => s.id);
        blockActivitiesQuery = blockActivitiesQuery.in('section_id', vendorSectionIds);
      }
      // Admin: no filter (all block_activities)

      // ============================================================================
      // 5️⃣ TRANSACTIONS - Filter by vendor (via vendor_sections untuk section staff)
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
        // Section staff: transactions dari vendor yang melayani section mereka
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
      // 6️⃣ ACTIVITY_TYPES - No filter (available to all)
      // ============================================================================
      const activityTypesQuery = supabase.from('activity_types').select('*').order('name');

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
        blockActivities: blockActivitiesRes.data?.length,
        transactions: transactionsRes.data?.length,
        role: currentUser?.role,
        section: currentUser?.section_id
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
  // VENDOR FUNCTIONS
  // ============================================================================
  const addVendor = async (data) => {
    // Vendors tidak punya section_id langsung
    // Assignment ke section dilakukan via vendor_sections (di UserManagement)
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

  // ============================================================================
  // BLOCK FUNCTIONS
  // ============================================================================
  const addBlock = async (data) => {
    // Master blocks tidak punya section_id
    // Section "claim" blocks via block_activities
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

  // ============================================================================
  // WORKER FUNCTIONS
  // ============================================================================
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

  // ============================================================================
  // BLOCK ACTIVITY FUNCTIONS
  // ============================================================================
  const addBlockActivity = async (data) => {
    // Section assignment happens HERE (block_activities table)
    // block_activities.section_id = which section "claims" this block for this activity
    
    // Auto-assign section dari user
    if (!data.section_id && currentUser?.role !== 'admin' && currentUser?.section_id) {
      data.section_id = currentUser.section_id;
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