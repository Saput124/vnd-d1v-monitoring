// src/components/UserManagement.jsx - FIXED

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

function VendorSections({ vendorId }) {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase
        .from('vendor_sections')
        .select('sections(code, name)')
        .eq('vendor_id', vendorId);
      
      setSections(data?.map(d => d.sections) || []);
    };

    if (vendorId) fetchSections();
  }, [vendorId]);

  if (sections.length === 0) return <span className="text-xs text-gray-500">No sections</span>;

  return (
    <div className="text-xs text-gray-600 mt-1">
      Sections: {sections.map(s => s.name).join(', ')}
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  
  const [newSection, setNewSection] = useState({ code: '', name: '' });
  const [newVendor, setNewVendor] = useState({ 
    code: '', 
    name: '', 
    contact_person: '',
    phone: '',
    email: ''
  });

  const [formData, setFormData] = useState({
    id: null,
    username: '',
    password_hash: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'vendor',
    section_id: null,
    vendor_id: null,
    vendor_sections: [],
    active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          sections(id, code, name),
          user_vendors(
            vendor_id,
            vendors(id, code, name)
          )
        `)
        .order('role', { ascending: true })
        .order('username', { ascending: true });

      if (usersError) throw usersError;

      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select(`
          *,
          vendor_sections(
            section_id,
            sections(id, code, name)
          )
        `)
        .order('name');

      if (vendorsError) throw vendorsError;

      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('name');

      if (sectionsError) throw sectionsError;

      setUsers(usersData || []);
      setVendors(vendorsData || []);
      setSections(sectionsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Error loading data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleNew = () => {
    setFormData({
      id: null,
      username: '',
      password_hash: '',
      full_name: '',
      email: '',
      phone: '',
      role: 'vendor',
      section_id: null,
      vendor_id: null,
      vendor_sections: [],
      active: true
    });
    setEditMode(false);
    setShowModal(true);
  };

  const handleEdit = async (user) => {
    let vendorSections = [];
    let vendorId = null;

    if (user.role === 'vendor' && user.user_vendors?.[0]?.vendor_id) {
      vendorId = user.user_vendors[0].vendor_id;
      
      const { data } = await supabase
        .from('vendor_sections')
        .select('section_id')
        .eq('vendor_id', vendorId);
      
      vendorSections = data?.map(vs => vs.section_id) || [];
    }

    setFormData({
      id: user.id,
      username: user.username,
      password_hash: user.password_hash,
      full_name: user.full_name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      section_id: user.section_id || null,
      vendor_id: vendorId,
      vendor_sections: vendorSections,
      active: user.active
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.username || !formData.full_name || !formData.role) {
        alert('❌ Username, Full Name, dan Role harus diisi!');
        return;
      }

      if (!formData.password_hash) {
        alert('❌ Password harus diisi!');
        return;
      }

      if ((formData.role === 'section_head' || formData.role === 'supervisor') && !formData.section_id) {
        alert('❌ Kepala Seksi/Supervisor harus di-assign ke section!');
        return;
      }

      if (formData.role === 'vendor' && !formData.vendor_id) {
        alert('❌ User vendor harus di-assign ke vendor!');
        return;
      }

      if (formData.role === 'vendor' && formData.vendor_sections.length === 0) {
        alert('❌ Vendor harus di-assign ke minimal 1 section!');
        return;
      }

      setLoading(true);

      if (editMode) {
        // UPDATE USER
        const updateData = {
          password_hash: formData.password_hash,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          section_id: ['section_head', 'supervisor'].includes(formData.role) ? formData.section_id : null,
          active: formData.active
        };

        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', formData.id);

        if (updateError) throw updateError;

        // Update user_vendors
        await supabase.from('user_vendors').delete().eq('user_id', formData.id);

        if (formData.role === 'vendor' && formData.vendor_id) {
          const { error: uvError } = await supabase
            .from('user_vendors')
            .insert([{ user_id: formData.id, vendor_id: formData.vendor_id }]);
          
          if (uvError) throw uvError;

          // 🔧 FIX: Update vendor_sections
          await supabase.from('vendor_sections').delete().eq('vendor_id', formData.vendor_id);

          if (formData.vendor_sections.length > 0) {
            const vendorSectionInserts = formData.vendor_sections.map(sectionId => ({
              vendor_id: formData.vendor_id,
              section_id: sectionId
            }));

            const { error: vsError } = await supabase
              .from('vendor_sections')
              .insert(vendorSectionInserts);

            if (vsError) throw vsError;
          }
        }

        alert('✅ User berhasil diupdate!');
      } else {
        // INSERT NEW USER
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            username: formData.username,
            password_hash: formData.password_hash,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            section_id: ['section_head', 'supervisor'].includes(formData.role) ? formData.section_id : null,
            active: formData.active
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        if (formData.role === 'vendor' && formData.vendor_id) {
          const { error: uvError } = await supabase
            .from('user_vendors')
            .insert([{ user_id: newUser.id, vendor_id: formData.vendor_id }]);

          if (uvError) throw uvError;

          if (formData.vendor_sections.length > 0) {
            const vendorSectionInserts = formData.vendor_sections.map(sectionId => ({
              vendor_id: formData.vendor_id,
              section_id: sectionId
            }));

            const { error: vsError } = await supabase
              .from('vendor_sections')
              .insert(vendorSectionInserts);

            if (vsError) throw vsError;
          }
        }

        alert('✅ User berhasil ditambahkan!');
      }

      setShowModal(false);
      await fetchData();
    } catch (err) {
      console.error('Error saving user:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, username) => {
    if (!confirm(`❓ Hapus user "${username}"?\n\nPeringatan: Ini akan menghapus semua relasi user ini!`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Delete user_vendors first
      await supabase.from('user_vendors').delete().eq('user_id', userId);
      
      // Delete user
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      
      alert('✅ User berhasil dihapus!');
      await fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleVendorSection = (sectionId) => {
    setFormData(prev => ({
      ...prev,
      vendor_sections: prev.vendor_sections.includes(sectionId)
        ? prev.vendor_sections.filter(id => id !== sectionId)
        : [...prev.vendor_sections, sectionId]
    }));
  };

  const handleAddSection = async () => {
    if (!newSection.code || !newSection.name) {
      alert('❌ Kode dan Nama Section harus diisi!');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sections')
        .insert([{ code: newSection.code, name: newSection.name }])
        .select()
        .single();

      if (error) throw error;

      alert('✅ Section berhasil ditambahkan!');
      setNewSection({ code: '', name: '' });
      setShowSectionModal(false);
      await fetchData();
    } catch (err) {
      console.error('Error adding section:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async () => {
    if (!newVendor.code || !newVendor.name) {
      alert('❌ Kode dan Nama Vendor harus diisi!');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .insert([{
          code: newVendor.code,
          name: newVendor.name,
          contact_person: newVendor.contact_person,
          phone: newVendor.phone,
          email: newVendor.email
        }])
        .select()
        .single();

      if (error) throw error;

      alert('✅ Vendor berhasil ditambahkan!');
      setNewVendor({ code: '', name: '', contact_person: '', phone: '', email: '' });
      setShowVendorModal(false);
      await fetchData();
    } catch (err) {
      console.error('Error adding vendor:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      section_head: 'bg-blue-100 text-blue-800',
      supervisor: 'bg-purple-100 text-purple-800',
      vendor: 'bg-green-100 text-green-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      section_head: 'Kepala Seksi',
      supervisor: 'Supervisor',
      vendor: 'Vendor'
    };
    return labels[role] || role;
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">👥 User Management</h2>
          <p className="text-gray-600 mt-1">Kelola user, role, hak akses, sections & vendors</p>
        </div>
        <button
          onClick={handleNew}
          className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 shadow-lg"
        >
          ➕ Tambah User Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 font-semibold">Admin</p>
          <p className="text-3xl font-bold text-gray-800">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-semibold">Kepala Seksi</p>
          <p className="text-3xl font-bold text-gray-800">
            {users.filter(u => u.role === 'section_head').length}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-semibold">Supervisor</p>
          <p className="text-3xl font-bold text-gray-800">
            {users.filter(u => u.role === 'supervisor').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-semibold">Vendor</p>
          <p className="text-3xl font-bold text-gray-800">
            {users.filter(u => u.role === 'vendor').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Username</th>
                <th className="px-6 py-4 text-left font-semibold">Password</th>
                <th className="px-6 py-4 text-left font-semibold">Full Name</th>
                <th className="px-6 py-4 text-left font-semibold">Role</th>
                <th className="px-6 py-4 text-left font-semibold">Assignment</th>
                <th className="px-6 py-4 text-left font-semibold">Contact</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={user.id} className={`border-t hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm font-semibold">{user.username}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm text-blue-600 font-semibold">
                      {showPassword ? user.password_hash : '••••••••'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{user.full_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'admin' && (
                      <span className="text-gray-500 text-sm italic">All Access</span>
                    )}
                    {(user.role === 'section_head' || user.role === 'supervisor') && (
                      <div className="text-sm">
                        <span className="font-semibold text-blue-600">
                          {user.sections?.name || '-'}
                        </span>
                      </div>
                    )}
                    {user.role === 'vendor' && (
                      <div className="text-sm">
                        <div className="font-semibold text-green-600">
                          {user.user_vendors?.[0]?.vendors?.name || '-'}
                        </div>
                        {user.user_vendors?.[0]?.vendor_id && (
                          <VendorSections vendorId={user.user_vendors[0].vendor_id} />
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>{user.email || '-'}</div>
                    <div className="text-gray-500">{user.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {user.active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        ✓ Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                        ✗ Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-semibold"
          >
            {showPassword ? '🙈 Sembunyikan Password' : '👁️ Tampilkan Password'}
          </button>
          <div className="text-sm text-gray-600">
            Total Users: <span className="font-bold">{users.length}</span>
          </div>
        </div>
      </div>

      {/* User Modal - continues in next artifact... */}
    </div>
  );
}