import React, { useState, useEffect } from 'react';
import { useAuth, useLang } from '../App';
import { User, UserRole } from '../types';
import { updateUser } from '../services/storageService';
import { MOCK_CITIES } from '../constants';
import { User as UserIcon, Mail, MapPin, Shield, Edit2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, login } = useAuth();
  const { t } = useLang();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Auto-hide alerts
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (!user) return null;

  const handleEditClick = () => {
    setFormData({
      address: user.address,
      city: user.city,
      name: user.name,
      country: user.country || 'India' // Persist country
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const updatedUser = await updateUser(user.id, formData);
      login(updatedUser); // Update context to reflect changes everywhere
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (error) {
      setError("Failed to update profile");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 shadow-sm">
           <CheckCircle size={20} /> {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 shadow-sm">
           <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">{t('myProfile')}</h1>
        
        {/* Only Citizens can edit their profile */}
        {!isEditing && user.role === UserRole.CITIZEN ? (
          <button onClick={handleEditClick} className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium">
            <Edit2 size={16} /> {t('editProfile')}
          </button>
        ) : isEditing ? (
          <div className="flex gap-2">
             <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium px-3 py-1">
                <X size={16} /> {t('cancel')}
             </button>
             <button onClick={handleSave} className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 font-medium px-4 py-1 rounded-lg">
                <Save size={16} /> {t('save')}
             </button>
          </div>
        ) : null}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-green-500 to-teal-600"></div>
        <div className="px-8 pb-8">
          <div className="relative -top-12 mb-[-30px]">
            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full p-2">
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <UserIcon size={40} />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            {isEditing ? (
                <input 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="text-2xl font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-2 rounded border border-gray-300 dark:border-gray-600 w-full mb-2"
                  placeholder="Full Name"
                />
            ) : (
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
            )}
            
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm mt-1">
              <Shield size={14} />
              {user.role.replace('_', ' ')}
            </div>
          </div>

          <div className="mt-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">{t('contactInfo')}</label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-2">
                    <Mail size={18} className="text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{user.email}</span>
                  </div>
                </div>
                
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">{t('locationDetails')}</label>
                   
                   {(user.role === UserRole.CITIZEN || user.role === UserRole.CITY_ADMIN) && (
                      <div className="space-y-2">
                         <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <MapPin size={18} className="text-gray-400" />
                            {isEditing ? (
                                <div className="flex-1 space-y-2">
                                     <select 
                                        value={formData.city}
                                        onChange={e => setFormData({...formData, city: e.target.value})}
                                        className="w-full bg-transparent border-b border-gray-400 dark:text-white outline-none text-sm py-1 dark:bg-gray-800"
                                      >
                                        <option value="">{t('selectDistrict')}</option>
                                        {MOCK_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                     <input 
                                        value={formData.address}
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                        className="bg-transparent text-gray-700 dark:text-gray-300 w-full outline-none border-b border-gray-400 text-sm"
                                        placeholder={t('address')}
                                      />
                                </div>
                            ) : (
                                <span className="text-gray-700 dark:text-gray-300">
                                  {user.city ? `${user.city}, Tamil Nadu` : 'No District'}
                                  {user.address && ` - ${user.address}`}
                                </span>
                            )}
                         </div>
                         <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-sm font-bold text-gray-400 pl-1">{t('country')}:</span>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">{user.country || 'India'}</span>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
