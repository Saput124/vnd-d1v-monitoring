// src/hooks/useSupabaseData.jsx - DEBUG VERSION
// TEMPORARY: Disable semua filter untuk debug

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
      console.log('🔍 DEBUG: Current User:', currentUser);

      // ============================================================================
      // TEMPORARY DEBUG: Fetch SEMUA data tanpa filter
      // ============================================================================
      
      const [
        vendorsRes, 
        blocksRes, 
        workersRes, 
        activityRes, 
        blockActivitiesRes,
        transactionsRes
      ] = await Promise.all([
        supabase.from('vendors').select('*').order('name'),
        supabase.from('blocks').select('*').order('zone, name'),
        supabase.from('workers').select('*, vendors(name)').order('name'),
        supabase.from('activity_types').select('*').order('name'),
        supabase.from('block_activities').select('*').order('target_bulan, created_at'),
        supabase.from('transactions').select('*, vendors(name), activity_types(name, code)').order('tanggal', { ascending: false })
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
      
      console.log('✅ DEBUG: Data loaded (NO FILTER):', {
        vendors: vendorsRes.data?.length,
        blocks: blocksRes.data?.length,
        workers: workersRes.data?.length,
        activityTypes: activityRes.data?.length,
        blockActivities: blockActivitiesRes.data?.length,
        transactions: transactionsRes.data?.length,
        role: currentUser?.role,
        section: currentUser?.section_id
      });

      // Debug: Log block_activities details
      console.log('📋 DEBUG: Block Activities:', blockActivitiesRes.data);

      // Debug: Check section_activities
      const { data: sectionActivities } = await supabase
        .from('section_activities')
        .select('*');
      console.log('🔗 DEBUG: Section Activities:', sectionActivities);

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

  // CRUD functions (unchanged)
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
    // AUTO-ASSIGN section_id dari current user
    if (!data.section_id && currentUser?.section_id) {
      data.section_id = currentUser.section_id;
      console.log('🔧 Auto-assigned section_id:', data.section_id);
    }
    
    console.log('➕ Adding block activity:', data);
    
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