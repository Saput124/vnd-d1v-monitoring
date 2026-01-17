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
      // Determine filter based on role
      const isAdmin = currentUser?.role === 'admin';

      // Fetch based on role
      let vendorsQuery = supabase.from('vendors').select('*').order('name');
      let blocksQuery = supabase.from('blocks').select('*').order('zone, name');
      let workersQuery = supabase.from('workers').select('*, vendors(name)').order('name');
      let blockActivitiesQuery = supabase.from('block_activities').select('*').order('target_bulan, created_at');
      let transactionsQuery = supabase.from('transactions').select(`
        *,
        vendors(name),
        activity_types(name, code)
      `).order('tanggal', { ascending: false });

      // Apply section filter for non-admin
      if (!isAdmin && currentUser?.section_id) {
        vendorsQuery = vendorsQuery.eq('section_id', currentUser.section_id);
        blocksQuery = blocksQuery.eq('section_id', currentUser.section_id);
        blockActivitiesQuery = blockActivitiesQuery.eq('section_id', currentUser.section_id);
      }

      // Apply vendor filter for vendor role
      if (currentUser?.role === 'vendor' && currentUser?.vendor_id) {
        workersQuery = workersQuery.eq('vendor_id', currentUser.vendor_id);
        transactionsQuery = transactionsQuery.eq('vendor_id', currentUser.vendor_id);
      }

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
        supabase.from('activity_types').select('*').order('name'),
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
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // VENDOR FUNCTIONS
  const addVendor = async (data) => {
    // Auto-assign section for non-admin
    if (currentUser?.role !== 'admin' && currentUser?.section_id) {
      data.section_id = currentUser.section_id;
    }
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

  // BLOCK FUNCTIONS
  const addBlock = async (data) => {
    // Auto-assign section for non-admin
    if (currentUser?.role !== 'admin' && currentUser?.section_id) {
      data.section_id = currentUser.section_id;
    }
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

  // WORKER FUNCTIONS
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

  // BLOCK ACTIVITY FUNCTIONS
  const addBlockActivity = async (data) => {
    // Auto-assign section for non-admin
    if (currentUser?.role !== 'admin' && currentUser?.section_id) {
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