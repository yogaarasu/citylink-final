import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { createUser, getAllCityAdmins, deleteUser, getAllIssues, updateUser } from '../services/storageService';
import { MOCK_CITIES, CITY_RTO_CODES } from '../constants';
import { UserPlus, AlertCircle, Trash2, X, Edit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useLang } from '../App';

interface Props {
  view: 'overview' | 'users';
}

export const SuperAdminDashboard: React.FC<Props> = ({ view }) => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Custom Delete Modal State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { t } = useLang();
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', city: '', password: '' });
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState<{name: string, issues: number}[]>([]);
  
  useEffect(() => {
    refreshAdmins();
    loadStats();
  }, []);

  // Auto-hide error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const refreshAdmins = async () => {
    try {
        const fetchedAdmins = await getAllCityAdmins();
        setAdmins(fetchedAdmins);
    } catch (e) {
        console.error("Failed to fetch admins");
    }
  };

  const loadStats = async () => {
      try {
          const allIssues = await getAllIssues();
          
          const cityCounts: Record<string, number> = {};
          
          // Initialize mock cities with 0 to show structure
          MOCK_CITIES.slice(0, 7).forEach(c => cityCounts[c] = 0);

          allIssues.forEach(issue => {
              if (issue.city) {
                  cityCounts[issue.city] = (cityCounts[issue.city] || 0) + 1;
              }
          });

          // Convert to array and sort by count desc
          const data = Object.keys(cityCounts)
              .map(city => ({ name: city, issues: cityCounts[city] }))
              .sort((a, b) => b.issues - a.issues)
              .slice(0, 8); // Top 8 cities

          setChartData(data);
      } catch (e) {
          console.error("Failed to load stats", e);
      }
  };

  // Triggered by Delete Button
  const initiateDelete = (admin: User, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setUserToDelete(admin);
  };

  const initiateEdit = (admin: User, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(admin.id);
    setNewAdmin({
        name: admin.name,
        email: admin.email,
        city: admin.city || '',
        password: '' // Don't fill password
    });
    setShowAddModal(true);
  };

  // Triggered by Modal Confirm
  const confirmDelete = async () => {
      if (!userToDelete) return;
      
      try {
          const success = await deleteUser(userToDelete.id);
          if (success) {
              setAdmins(prev => prev.filter(a => a.id !== userToDelete.id));
          } else {
              setError("Failed to delete. The user might have already been removed.");
              refreshAdmins();
          }
      } catch (err) {
          console.error(err);
          setError("An error occurred while deleting.");
      } finally {
          setUserToDelete(null);
      }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingId(null);
    setNewAdmin({ name: '', email: '', city: '', password: '' });
    setError('');
  };

  const generateAdminId = (city: string) => {
    const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits of year (e.g., 24)
    const rto = CITY_RTO_CODES[city] || '00'; // RTO code for city, default 00
    
    // Count existing admins for this city to determine sequence
    const existingCount = admins.filter(a => a.city === city).length + 1;
    
    // Format: YY + CTA + Sequence + RTO
    // Example: 24CTA101
    return `${year}CTA${existingCount}${rto}`;
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Common Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdmin.email)) {
        setError("Invalid email format.");
        return;
    }
    if (!newAdmin.city) {
        setError("District is required.");
        return;
    }

    if (editingId) {
        // Edit Mode
        if (newAdmin.password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(newAdmin.password)) {
                 setError("Password too weak (8+ chars, upper, lower, number, symbol).");
                 return;
            }
        }
        
        try {
            const updates: any = {
                name: newAdmin.name,
                email: newAdmin.email,
                city: newAdmin.city
            };
            if (newAdmin.password) updates.password = newAdmin.password;
            
            await updateUser(editingId, updates);
            handleModalClose();
            refreshAdmins();
        } catch (e: any) {
            setError(e.message || "Failed to update admin.");
        }

    } else {
        // Create Mode
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newAdmin.password)) {
             setError("Password too weak (8+ chars, upper, lower, number, symbol).");
             return;
        }

        try {
            const customId = generateAdminId(newAdmin.city);

            await createUser({
              id: customId,
              name: newAdmin.name,
              email: newAdmin.email,
              city: newAdmin.city,
              password: newAdmin.password,
              role: UserRole.CITY_ADMIN,
              country: 'India'
            });
            handleModalClose();
            refreshAdmins();
        } catch (error: any) {
            setError(error.message || "Failed to create admin");
        }
    }
  };

  if (view === 'overview') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold dark:text-white">{t('systemOverview')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('totalCityAdmins')}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{admins.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('activeDistricts')}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{MOCK_CITIES.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('systemHealth')}</h3>
            <p className="text-3xl font-bold text-green-500 mt-2">100%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold dark:text-white mb-4">{t('topCitiesChart')}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => t(val)}/>
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(val) => t(val as string)}
                />
                <Bar dataKey="issues" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">{t('manageAdmins')}</h1>
        <button 
          onClick={() => { setError(''); setShowAddModal(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <UserPlus size={18} />
          {t('addAdmin')}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
           <AlertCircle size={16} />
           {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">{t('adminId')}</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">{t('firstName')}</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">{t('email')}</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">{t('district')}</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-4">
                      <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">{admin.id}</span>
                  </td>
                  <td className="p-4 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {admin.name}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">{admin.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full border border-green-100 dark:border-green-900">
                      {t(admin.city || '')}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={(e) => initiateEdit(admin, e)}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 text-xs font-bold transition-colors cursor-pointer select-none flex items-center gap-1"
                            title="Edit User"
                        >
                           <Edit size={14} /> {t('edit')}
                        </button>
                        <button 
                            onClick={(e) => initiateDelete(admin, e)}
                            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 text-xs font-bold transition-colors cursor-pointer select-none flex items-center gap-1"
                            title="Delete User"
                        >
                            <Trash2 size={14} /> {t('delete')}
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No administrators found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT ADMIN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold dark:text-white">{editingId ? t('editAdmin') : t('addAdmin')}</h2>
                <button onClick={handleModalClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSaveAdmin} className="space-y-4">
              <input 
                placeholder={t('firstName')}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={newAdmin.name}
                onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
              />
              <input 
                placeholder={t('email')}
                type="email"
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={newAdmin.email}
                onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
              />
              <select 
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={newAdmin.city}
                onChange={e => setNewAdmin({...newAdmin, city: e.target.value})}
              >
                <option value="">{t('selectDistrict')}</option>
                {MOCK_CITIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
              </select>
               <input 
                placeholder={editingId ? "New Password (Optional)" : "Initial Password"} 
                type="password"
                required={!editingId}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={newAdmin.password}
                onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
              />
              {!editingId && <p className="text-xs text-gray-500">System will auto-generate Admin ID (Format: YY-CTA-Count-RTO).</p>}
              {editingId && <p className="text-xs text-gray-500">Leave password blank to keep current password.</p>}
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={handleModalClose} className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t('cancel')}</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {userToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl max-w-sm w-full animate-fade-in border border-red-100 dark:border-red-900/30">
                  <div className="flex items-center gap-3 text-red-600 mb-4">
                      <div className="p-3 bg-red-100 rounded-full">
                          <Trash2 size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('confirmDelete')}?</h3>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {t('deleteUserConfirm')} <b>{userToDelete.name}</b> ({t(userToDelete.city || '')})?
                  </p>

                  <div className="flex gap-3">
                      <button 
                          onClick={() => setUserToDelete(null)}
                          className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg font-medium"
                      >
                          {t('cancel')}
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="flex-1 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-bold shadow-lg shadow-red-200"
                      >
                          {t('delete')}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};