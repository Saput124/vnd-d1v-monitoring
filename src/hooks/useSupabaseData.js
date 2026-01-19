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
  const [sections, setSections] = useState([]);

  const currentUser = getCurrentUser();

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const isAdmin = currentUser?.role === 'admin';
      const isVendor = currentUser?.role === 'vendor';
      const isSectionHead = currentUser?.role === 'section_head';
      const isSupervisor = currentUser?.role === 'supervisor';

      // 1. Fetch Sections (for filters)
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('name');
      
      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

      // 2. Fetch Vendors
      let vendorsQuery = supabase.from('vendors').select('*').order('name');
      
      // Filter vendors based on role
      if (isVendor && currentUser?.vendor_sections?.length > 0) {
        // Vendor can see vendors in their assigned sections
        const sectionIds = currentUser.vendor_sections.map(s => s.id);
        const { data: vendorSectionsData } = await supabase
          .from('vendor_sections')
          .select('vendor_id')
          .in('section_id', sectionIds);
        
        const vendorIds = [...new Set(vendorSectionsData?.map(vs => vs.vendor_id) || [])];
        if (vendorIds.length > 0) {
          vendorsQuery = vendorsQuery.in('id', vendorIds);
        }
      } else if ((isSectionHead || isSupervisor) && currentUser?.section_id) {
        // Section head/supervisor see vendors in their section
        const { data: vendorSectionsData } = await supabase
          .from('vendor_sections')
          .select('vendor_id')
          .eq('section_id', currentUser.section_id);
        
        const vendorIds = [...new Set(vendorSectionsData?.map(vs => vs.vendor_id) || [])];
        if (vendorIds.length > 0) {
          vendorsQuery = vendorsQuery.in('id', vendorIds);
        }
      }

      const vendorsRes = await vendorsQuery;
      if (vendorsRes.error) throw vendorsRes.error;

      // 3. Fetch Blocks
      let blocksQuery = supabase.from('blocks').select('*').order('zone, name');
      
      if (isVendor && currentUser?.vendor_sections?.length > 0) {
        const sectionIds = currentUser.vendor_sections.map(s => s.id);
        blocksQuery = blocksQuery.in('section_id', sectionIds);
      } else if ((isSectionHead || isSupervisor) && currentUser?.section_id) {
        blocksQuery = blocksQuery.eq('section_id', currentUser.section_id);
      }

      const blocksRes = await blocksQuery;
      if (blocksRes.error) throw blocksRes.error;

      // 4. Fetch Workers
      let workersQuery = supabase.from('workers').select('*, vendors(name)').order('name');
      
      if (isVendor && currentUser?.vendor_id) {
        workersQuery = workersQuery.eq('vendor_id', currentUser.vendor_id);
      }

      const workersRes = await workersQuery;
      if (workersRes.error) throw workersRes.error;

      // 5. Fetch Activity Types
      const activityRes = await supabase
        .from('activity_types')
        .select('*')
        .order('name');
      
      if (activityRes.error) throw activityRes.error;

      // 6. Fetch Block Activities
      let blockActivitiesQuery = supabase
        .from('block_activities')
        .select('*')
        .order('target_bulan, created_at');
      
      if (isVendor && currentUser?.vendor_sections?.length > 0) {
        const sectionIds = currentUser.vendor_sections.map(s => s.id);
        blockActivitiesQuery = blockActivitiesQuery.in('section_id', sectionIds);
      } else if ((isSectionHead || isSupervisor) && currentUser?.section_id) {
        blockActivitiesQuery = blockActivitiesQuery.eq('section_id', currentUser.section_id);
      }

      const blockActivitiesRes = await blockActivitiesQuery;
      if (blockActivitiesRes.error) throw blockActivitiesRes.error;

      // 7. Fetch Transactions
      let transactionsQuery = supabase
        .from('transactions')
        .select(`
          *,
          vendors(name, code),
          activity_types(name, code)
        `)
        .order('tanggal', { ascending: false });
      
      if (isVendor && currentUser?.vendor_id) {
        transactionsQuery = transactionsQuery.eq('vendor_id', currentUser.vendor_id);
      } else if ((isSectionHead || isSupervisor) && currentUser?.section_id) {
        // Get transactions from vendors assigned to this section
        const { data: vendorSectionsData } = await supabase
          .from('vendor_sections')
          .select('vendor_id')
          .eq('section_id', currentUser.section_id);
        
        const vendorIds = [...new Set(vendorSectionsData?.map(vs => vs.vendor_id) || [])];
        if (vendorIds.length > 0) {
          transactionsQuery = transactionsQuery.in('vendor_id', vendorIds);
        }
      }

      const transactionsRes = await transactionsQuery;
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
    const { error } = await supabase.from('block_activities').insert([data]);
    if (error) throw error;
    await fetchAllData();
  };

  const deleteBlockActivity = async (id) => {
    const { error } = await supabase.from('block_activities').delete().eq('id', id);
    if (error) throw error;
    await fetchAllData();
  };

  // ACTIVITY TYPE FUNCTIONS
  const addActivityType = async (data) => {
    const { error } = await supabase.from('activity_types').insert([data]);
    if (error) throw error;
    await fetchAllData();
  };

  const updateActivityType = async (id, data) => {
    const { error } = await supabase.from('activity_types').update(data).eq('id', id);
    if (error) throw error;
    await fetchAllData();
  };

  const deleteActivityType = async (id) => {
    const { error } = await supabase.from('activity_types').delete().eq('id', id);
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
    sections,
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
    addActivityType,
    updateActivityType,
    deleteActivityType,
    supabase,
    currentUser
  };
}