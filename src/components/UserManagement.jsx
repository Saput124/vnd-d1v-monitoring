// src/components/UserManagement.jsx - FIXED VERSION

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import Modal from './Modal';

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

      // ✅ FIXED: Fetch vendors without nested vendor_sections to avoid relationship error
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
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
      // Validation
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
        // ========== UPDATE USER ==========
        const updateData = {
          password_hash: formData.password_hash,
          full_name: formData.full_name,
          email: formData.email || null,
          phone: formData.phone || null,
          role: formData.role,
          section_id: ['section_head', 'supervisor'].includes(formData.role) ? formData.section_id : null,
          active: formData.active,
          updated_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', formData.id);

        if (updateError) {
          console.error('Update user error:', updateError);
          throw new Error(`Gagal update user: ${updateError.message}`);
        }

        // Delete existing user_vendors
        const { error: deleteUVError } = await supabase
          .from('user_vendors')
          .delete()
          .eq('user_id', formData.id);

        if (deleteUVError) {
          console.error('Delete user_vendors error:', deleteUVError);
        }

        // Handle vendor role
        if (formData.role === 'vendor' && formData.vendor_id) {
          // Insert user_vendors
          const { error: uvError } = await supabase
            .from('user_vendors')
            .insert([{ 
              user_id: formData.id, 
              vendor_id: formData.vendor_id 
            }]);
          
          if (uvError) {
            console.error('Insert user_vendors error:', uvError);
            throw new Error(`Gagal assign vendor: ${uvError.message}`);
          }

          // Update vendor_sections (delete old, insert new)
          const { error: deleteVSError } = await supabase
            .from('vendor_sections')
            .delete()
            .eq('vendor_id', formData.vendor_id);

          if (deleteVSError) {
            console.error('Delete vendor_sections error:', deleteVSError);
          }

          if (formData.vendor_sections.length > 0) {
            const vendorSectionInserts = formData.vendor_sections.map(sectionId => ({
              vendor_id: formData.vendor_id,
              section_id: sectionId
            }));

            const { error: vsError } = await supabase
              .from('vendor_sections')
              .insert(vendorSectionInserts);

            if (vsError) {
              console.error('Insert vendor_sections error:', vsError);
              throw new Error(`Gagal assign sections: ${vsError.message}`);
            }
          }
        }

        alert('✅ User berhasil diupdate!');
      } else {
        // ========== INSERT NEW USER ==========
        const insertData = {
          username: formData.username.trim(),
          password_hash: formData.password_hash,
          full_name: formData.full_name.trim(),
          email: formData.email?.trim() || null,
          phone: formData.phone?.trim() || null,
          role: formData.role,
          section_id: ['section_head', 'supervisor'].includes(formData.role) ? formData.section_id : null,
          active: formData.active
        };

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([insertData])
          .select()
          .single();

        if (insertError) {
          console.error('Insert user error:', insertError);
          throw new Error(`Gagal menambah user: ${insertError.message}`);
        }

        if (formData.role === 'vendor' && formData.vendor_id) {
          // Insert user_vendors
          const { error: uvError } = await supabase
            .from('user_vendors')
            .insert([{ 
              user_id: newUser.id, 
              vendor_id: formData.vendor_id 
            }]);

          if (uvError) {
            console.error('Insert user_vendors error:', uvError);
            throw new Error(`Gagal assign vendor: ${uvError.message}`);
          }

          // Insert vendor_sections
          if (formData.vendor_sections.length > 0) {
            const vendorSectionInserts = formData.vendor_sections.map(sectionId => ({
              vendor_id: formData.vendor_id,
              section_id: sectionId
            }));

            const { error: vsError } = await supabase
              .from('vendor_sections')
              .insert(vendorSectionInserts);

            if (vsError) {
              console.error('Insert vendor_sections error:', vsError);
              throw new Error(`Gagal assign sections: ${vsError.message}`);
            }
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
      const { error } = await supabase
        .from('sections')
        .insert([{ 
          code: newSection.code.trim(), 
          name: newSection.name.trim() 
        }]);

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
      const { error } = await supabase
        .from('vendors')
        .insert([{
          code: newVendor.code.trim(),
          name: newVendor.name.trim(),
          contact_person: newVendor.contact_person?.trim() || null,
          phone: newVendor.phone?.trim() || null,
          email: newVendor.email?.trim() || null
        }]);

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
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                        disabled={loading}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        disabled={loading || (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

        {users.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            Belum ada user. Klik "Tambah User Baru" untuk memulai.
          </div>
        )}
      </div>

      {/* Modal User Form */}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editMode ? '✏️ Edit User' : '➕ Tambah User Baru'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="username_login"
                disabled={editMode}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password *</label>
              <input
                type="text"
                value={formData.password_hash}
                onChange={(e) => setFormData({...formData, password_hash: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="password123"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Full Name *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nama Lengkap"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="08123456789"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({
                ...formData, 
                role: e.target.value,
                section_id: null,
                vendor_id: null,
                vendor_sections: []
              })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="admin">Admin (Full Access)</option>
              <option value="section_head">Kepala Seksi</option>
              <option value="supervisor">Supervisor</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>

          {(formData.role === 'section_head' || formData.role === 'supervisor') && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">Assign to Section *</label>
                <button
                  type="button"
                  onClick={() => setShowSectionModal(true)}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  ➕ Section Baru
                </button>
              </div>
              <select
                value={formData.section_id || ''}
                onChange={(e) => setFormData({...formData, section_id: e.target.value || null})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Pilih Section --</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'vendor' && (
            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Assign to Vendor *</label>
                  <button
                    type="button"
                    onClick={() => setShowVendorModal(true)}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    ➕ Vendor Baru
                  </button>
                </div>
                <select
                  value={formData.vendor_id || ''}
                  onChange={(e) => setFormData({...formData, vendor_id: e.target.value || null})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">-- Pilih Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                  ))}
                </select>
              </div>

              {formData.vendor_id && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vendor dapat bekerja di Section: *
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sections.map(s => (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded">
                        <input
                          type="checkbox"
                          checked={formData.vendor_sections.includes(s.id)}
                          onChange={() => toggleVendorSection(s.id)}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-gray-500">({s.code})</span>
                      </label>
                    ))}
                  </div>
                  {formData.vendor_sections.length === 0 && (
                    <p className="text-xs text-red-600 mt-2">⚠️ Minimal pilih 1 section</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="w-4 h-4"
              />
              <span className="font-medium">Active</span>
              <span className="text-sm text-gray-500">(User dapat login)</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 disabled:opacity-50 transition-all"
            >
              {loading ? '⏳ Menyimpan...' : '💾 Simpan'}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              disabled={loading}
              className="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-all disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Tambah Section */}
      <Modal show={showSectionModal} onClose={() => setShowSectionModal(false)} title="➕ Tambah Section Baru">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kode Section *</label>
            <input
              type="text"
              value={newSection.code}
              onChange={(e) => setNewSection({...newSection, code: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., D1, D2, D3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nama Section *</label>
            <input
              type="text"
              value={newSection.name}
              onChange={(e) => setNewSection({...newSection, name: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Divisi 1"
              required
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleAddSection}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳ Menyimpan...' : '💾 Simpan Section'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSectionModal(false);
                setNewSection({ code: '', name: '' });
              }}
              disabled={loading}
              className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Tambah Vendor */}
      <Modal show={showVendorModal} onClose={() => setShowVendorModal(false)} title="➕ Tambah Vendor Baru">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kode Vendor *</label>
              <input
                type="text"
                value={newVendor.code}
                onChange={(e) => setNewVendor({...newVendor, code: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="V001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nama Vendor *</label>
              <input
                type="text"
                value={newVendor.name}
                onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="PT Vendor"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Contact Person</label>
            <input
              type="text"
              value={newVendor.contact_person}
              onChange={(e) => setNewVendor({...newVendor, contact_person: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="Nama PIC"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="text"
                value={newVendor.phone}
                onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="08123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={newVendor.email}
                onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="vendor@mail.com"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleAddVendor}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '⏳ Menyimpan...' : '💾 Simpan Vendor'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowVendorModal(false);
                setNewVendor({ code: '', name: '', contact_person: '', phone: '', email: '' });
              }}
              disabled={loading}
              className="px-6 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}