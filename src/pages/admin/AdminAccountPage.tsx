import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { User, Mail, Key, Shield, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

const AdminAccountPage: React.FC = () => {
  const { user } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'admin' as 'admin' | 'super_admin',
    password: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, role, is_active, created_at, last_login')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!passwordForm.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) newErrors.newPassword = 'New password is required';
    if (passwordForm.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Call the change password function
      const { error } = await supabase.rpc('change_admin_password', {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      
      if (error) throw error;
      
      alert('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Error changing password:', error);
      setErrors({ general: 'Failed to change password. Please check your current password.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form
    const newErrors: Record<string, string> = {};
    if (!inviteForm.email) newErrors.email = 'Email is required';
    if (!inviteForm.password) newErrors.password = 'Password is required';
    if (inviteForm.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!/\S+@\S+\.\S+/.test(inviteForm.email)) newErrors.email = 'Please enter a valid email';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Call the create admin function
      const { error } = await supabase.rpc('create_admin_user', {
        admin_email: inviteForm.email,
        admin_password: inviteForm.password,
        admin_role: inviteForm.role
      });
      
      if (error) throw error;
      
      alert('Admin user created successfully');
      setInviteForm({ email: '', role: 'admin', password: '' });
      setShowInviteForm(false);
      await fetchAdminUsers();
    } catch (error) {
      console.error('Error creating admin user:', error);
      setErrors({ general: 'Failed to create admin user. Email may already exist.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminEmail: string) => {
    if (adminId === user?.id) {
      alert('You cannot delete your own account');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete admin user ${adminEmail}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminId);
      
      if (error) throw error;
      
      await fetchAdminUsers();
    } catch (error) {
      console.error('Error deleting admin user:', error);
      alert('Failed to delete admin user');
    }
  };

  const handleToggleActive = async (adminId: string, currentStatus: boolean) => {
    if (adminId === user?.id) {
      alert('You cannot deactivate your own account');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ is_active: !currentStatus })
        .eq('id', adminId);
      
      if (error) throw error;
      
      await fetchAdminUsers();
    } catch (error) {
      console.error('Error updating admin user:', error);
      alert('Failed to update admin user');
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Account Settings - Bond Admin</title>
        </Helmet>
        <div className="text-center py-8">Loading account settings...</div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Account Settings - Bond Admin</title>
      </Helmet>
      
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          <p className="text-gray-300">Manage your account and admin users</p>
        </div>

        {/* Current User Info */}
        <div className="bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-600">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Your Account
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <div className="mt-1 flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-white">{user?.email}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Role</label>
              <div className="mt-1 flex items-center">
                <Shield className="w-4 h-4 text-gray-400 mr-2" />
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  user?.role === 'super_admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="btn bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </button>
          </div>
        </div>

        {/* Change Password Form */}
        {showPasswordForm && (
          <div className="bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-600">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {errors.general}
              </div>
            )}
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.currentPassword ? 'border-red-300' : 'border-gray-600'
                  }`}
                  required
                />
                {errors.currentPassword && <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.newPassword ? 'border-red-300' : 'border-gray-600'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-600'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="btn bg-white border border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admin Users Management */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-600">
          <div className="p-6 border-b border-gray-600">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Admin Users</h2>
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  className="btn bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Admin
                </button>
              )}
            </div>
          </div>
          
          {/* Invite Form */}
          {showInviteForm && user?.role === 'super_admin' && (
            <div className="p-6 border-b border-gray-600 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Invite New Admin</h3>
              
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {errors.general}
                </div>
              )}
              
              <form onSubmit={handleInviteAdmin} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-600'
                      }`}
                      required
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Role
                    </label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'super_admin' }))}
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={inviteForm.password}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.password ? 'border-red-300' : 'border-gray-600'
                    }`}
                    required
                  />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="btn bg-white border border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Admin'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Admin Users List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  {user?.role === 'super_admin' && (
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-600">
                {adminUsers.map((admin) => (
                  <tr key={admin.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-indigo-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {admin.email}
                            {admin.id === user?.id && (
                              <span className="ml-2 text-xs text-gray-500">(You)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        admin.role === 'super_admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        admin.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.last_login 
                        ? new Date(admin.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    {user?.role === 'super_admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {admin.id !== user?.id && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleToggleActive(admin.id, admin.is_active)}
                              className={`text-sm ${
                                admin.is_active 
                                  ? 'text-red-600 hover:text-red-800' 
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                            >
                              {admin.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAccountPage;