import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { UserAvatar } from '../../components/common/UserAvatar';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'admin' | 'user'>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (u: User) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/admin/users/${u.id}/role`, { role: newRole });
      showToast(`Updated ${u.name}'s role to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'error');
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === currentUser?.id) {
      showToast('You cannot delete your own admin account', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user account "${u.name}" (${u.email})?`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${u.id}`);
      showToast(`Deleted user account ${u.name}`);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/admin/users/create', {
        name: createName.trim(),
        email: createEmail.trim(),
        password: createPassword.trim(),
        role: createRole,
      });

      showToast(`User account "${createName}" created successfully!`);
      setShowCreateModal(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('user');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalCustomers = users.filter((u) => u.role === 'user').length;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span>👥</span> User Accounts & Permissions
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage customer profiles, assign administrator roles, and monitor user registrations on InsForge DB.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="self-start sm:self-auto font-bold text-xs py-2.5 px-4 flex items-center gap-2"
        >
          <span>➕</span> Create User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[#151821] border border-white/10 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total Registered Accounts</p>
            <p className="text-2xl font-black text-white mt-1">{users.length}</p>
          </div>
          <span className="p-3 bg-red-600/20 text-red-400 rounded-xl text-xl">👤</span>
        </div>

        <div className="p-5 bg-[#151821] border border-white/10 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Administrators</p>
            <p className="text-2xl font-black mt-1" style={{ color: 'var(--accent-red)' }}>{totalAdmins}</p>
          </div>
          <span
            className="p-3 rounded-xl text-xl border"
            style={{
              backgroundColor: 'var(--accent-subtle, rgba(229,9,20,0.15))',
              borderColor: 'var(--accent-border, rgba(229,9,20,0.3))',
              color: 'var(--accent-red)',
            }}
          >
            🛡️
          </span>
        </div>

        <div className="p-5 bg-[#151821] border border-white/10 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Customers / Users</p>
            <p className="text-2xl font-black text-blue-400 mt-1">{totalCustomers}</p>
          </div>
          <span className="p-3 bg-blue-600/20 text-blue-400 rounded-xl text-xl">🎬</span>
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div className="p-4 bg-[#151821] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-black/60 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)]"
          />
          <span className="absolute right-3 top-2.5 text-zinc-500 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-zinc-400 font-bold">Filter Role:</span>
          <div className="flex bg-black/60 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                roleFilter === 'all' ? 'bg-[var(--accent-red)] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                roleFilter === 'admin' ? 'bg-[var(--accent-red)] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Admins ({totalAdmins})
            </button>
            <button
              onClick={() => setRoleFilter('user')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                roleFilter === 'user' ? 'bg-[var(--accent-red)] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Customers ({totalCustomers})
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#151821] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-black/60 text-zinc-400 border-b border-white/10 font-bold uppercase tracking-wider">
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-4">
                      <div className="h-8 bg-black/40 rounded-xl animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 font-bold">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={`${u.id}-${idx}`} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={u.avatar}
                          name={u.name}
                          size="sm"
                          showBorder
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{u.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">ID: {u.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-zinc-300 font-mono">{u.email}</td>

                    <td className="p-4">
                      <span
                        className="px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider"
                        style={
                          u.role === 'admin'
                            ? {
                                backgroundColor: 'var(--accent-subtle, rgba(229,9,20,0.15))',
                                color: 'var(--accent-red)',
                                borderColor: 'var(--accent-border, rgba(229,9,20,0.4))',
                              }
                            : {
                                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                color: '#60A5FA',
                                borderColor: 'rgba(59, 130, 246, 0.4)',
                              }
                        }
                      >
                        {u.role === 'admin' ? '🛡️ Admin' : '👤 Customer'}
                      </span>
                    </td>

                    <td className="p-4 text-zinc-400">
                      {new Date(u.joined_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant={u.role === 'admin' ? 'secondary' : 'primary'}
                          onClick={() => handleToggleRole(u)}
                          className="text-[11px] py-1 px-3"
                        >
                          {u.role === 'admin' ? 'Demote to Customer' : 'Promote to Admin'}
                        </Button>

                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Account"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#151821] border border-white/10 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">➕</span>
                <h3 className="text-base font-bold text-white">Create New User Account</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="jane@example.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Account Role
                </label>
                <select
                  value={createRole}
                  onChange={(e: any) => setCreateRole(e.target.value)}
                  className="bg-black/70 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[var(--accent-red)]"
                >
                  <option value="user">👤 Customer (Regular User)</option>
                  <option value="admin">🛡️ Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isSubmitting}>
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
