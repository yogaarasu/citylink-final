import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUser, sendOtpToEmail, verifyOtp } from '../services/storageService';
import { UserRole } from '../types';
import { MOCK_CITIES } from '../constants';
import { AlertCircle, Globe, MapPin, Key, Info, X, Crosshair } from 'lucide-react';
import { useLang } from '../App';

// Leaflet declaration
declare const L: any;

export const RegisterPage: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { lang, toggleLang, t } = useLang();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null); // For simulation display
  
  // Map Modal State
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempAddress, setTempAddress] = useState('');
  const [tempCity, setTempCity] = useState('');
  const [tempState, setTempState] = useState('Tamil Nadu');
  const mapRef = useRef<any>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: 'Tamil Nadu'
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Map Initialization Effect
  useEffect(() => {
    if (showMapModal) {
      // Small delay to ensure modal DOM is rendered
      const timer = setTimeout(() => {
        const container = document.getElementById('register-map');
        if (container && !mapRef.current) {
          const map = L.map('register-map').setView([11.1271, 78.6569], 7); // Default Center TN
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
             attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          let marker: any = null;

          // If current geolocation is available, fly to it initially
          if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition((pos) => {
                 map.setView([pos.coords.latitude, pos.coords.longitude], 15);
             }, () => {});
          }

          map.on('click', async (e: any) => {
             const { lat, lng } = e.latlng;

             // Update Marker
             if (marker) map.removeLayer(marker);
             marker = L.marker([lat, lng]).addTo(map);

             setTempAddress(t('fetchingAddress'));
             
             try {
                // Reverse Geocoding
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                
                if (data && data.address) {
                    const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
                    const state = data.address.state || 'Tamil Nadu';
                    setTempAddress(data.display_name);
                    setTempCity(city);
                    setTempState(state);
                } else {
                    setTempAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                }
             } catch (err) {
                setTempAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
             }
          });
          
          mapRef.current = map;
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
        // Cleanup map on modal close
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
        setTempAddress('');
    }
  }, [showMapModal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!strictEmailRegex.test(formData.email.trim())) {
      return "Invalid email format. (Must contain domain extension like .com)";
    }
    if (!passwordRegex.test(formData.password)) {
      return "Password must be at least 8 chars and include uppercase, lowercase, number, and symbol.";
    }
    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }
    if (!formData.city) {
      return "Please select a district.";
    }
    return null;
  };

  // Triggered by button in Map Modal
  const handleLocateMeInMap = () => {
      if (!navigator.geolocation) return;
      
      const map = mapRef.current;
      if (!map) return;

      setTempAddress(t('loading'));
      navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude } = pos.coords;
          map.setView([latitude, longitude], 16);
          
          // Trigger click logic manually to fetch address
          map.fireEvent('click', { latlng: { lat: latitude, lng: longitude } });
      }, () => {
          setTempAddress("Location access denied.");
      });
  };

  const confirmMapSelection = () => {
      // Logic to auto-select district from detected city name
      let detectedDistrict = formData.city;
      if (tempCity) {
          const match = MOCK_CITIES.find(c => tempCity.toLowerCase().includes(c.toLowerCase()));
          if (match) detectedDistrict = match;
      }

      setFormData(prev => ({
          ...prev,
          address: tempAddress,
          city: detectedDistrict,
          state: tempState
      }));
      setShowMapModal(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
        const generatedOtp = await sendOtpToEmail(formData.email.trim().toLowerCase(), true); // true = isRegistration
        setDevOtpCode(generatedOtp); // Show OTP for simulation
        setShowOtpModal(true);
    } catch (err: any) {
        setError(err.message || "Failed to send OTP.");
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
      setLoading(true);
      try {
          const email = formData.email.trim().toLowerCase();
          const isValid = await verifyOtp(email, otp.trim());
          if (!isValid) throw new Error("Invalid OTP");

          await createUser({
            name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            email: email,
            password: formData.password.trim(), // Correctly trim password
            role: UserRole.CITIZEN,
            city: formData.city,
            state: formData.state,
            address: formData.address,
            country: 'India'
          });
          
          navigate('/login', { state: { message: 'Account verified & created successfully! Please login.' } });
      } catch (err: any) {
          setError(err.message || 'Verification failed.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
         <button onClick={toggleLang} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded shadow text-sm border border-gray-200 dark:border-gray-700">
             <Globe size={16}/> {lang === 'en' ? 'தமிழ்' : 'English'}
         </button>
      </div>

      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('register')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('landingSubtitle')}</p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
            </div>
        )}

        {!showOtpModal ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('firstName')}</label>
                <input name="firstName" required onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('lastName')}</label>
                <input name="lastName" required onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                
                <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
                <input type="email" name="email" required onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('district')}</label>
                <select name="city" required value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option value="">{t('selectDistrict')}</option>
                    {MOCK_CITIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
                </select>
                </div>

                <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('address')}</label>
                <div className="relative">
                    <input 
                        name="address" 
                        value={formData.address}
                        placeholder={t('mapInstruction')}
                        onChange={handleInputChange} 
                        className="w-full pl-4 pr-12 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" 
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowMapModal(true)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-green-600 hover:bg-green-50 rounded-full"
                        title={t('pinLocation')}
                    >
                        <MapPin size={20} />
                    </button>
                </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('password')}</label>
                <input type="password" name="password" required onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                <p className="text-xs text-gray-400 mt-1">Min 8 chars, 1 upper, 1 lower, 1 number, 1 symbol.</p>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('confirmPassword')}</label>
                <input type="password" name="confirmPassword" required onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50">
                {loading ? t('processing') : t('verifyRegister')}
            </button>
            </form>
        ) : (
            // OTP Modal / View
            <div className="space-y-6">
                
                {/* Simulated Email Notification */}
                {devOtpCode && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                         <Info className="text-green-600 shrink-0 mt-0.5" size={20} />
                         <div>
                             <h4 className="font-bold text-green-800 text-sm">Email Simulation (Client-Side)</h4>
                             <p className="text-sm text-green-700 mt-1">
                                 Verification code: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-green-200">{devOtpCode}</span>
                             </p>
                         </div>
                    </div>
                )}

                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <Key size={32} />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white">{t('sendOtp')}</h3>
                    <p className="text-sm text-gray-500 mt-2">{t('email')}: <b>{formData.email}</b></p>
                </div>

                <input 
                    type="text" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center text-2xl tracking-widest py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                    maxLength={6}
                />

                <div className="flex gap-4">
                    <button onClick={() => setShowOtpModal(false)} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-lg">{t('back')}</button>
                    <button onClick={handleVerifyAndRegister} disabled={loading} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50">
                        {loading ? t('processing') : t('submit')}
                    </button>
                </div>
            </div>
        )}

         <div className="mt-6 text-center text-sm text-gray-500">
          {t('welcomeBack')}? <Link to="/login" className="text-green-600 font-bold">{t('signIn')}</Link>
        </div>
      </div>

      {/* Map Modal for Accurate Location Selection */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[500px] md:h-[600px] relative">
                
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <MapPin size={18} className="text-green-600"/> {t('selectLocation')}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('mapInstruction')}</p>
                    </div>
                    <button onClick={() => setShowMapModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full">
                        <X size={20} className="text-gray-500 dark:text-gray-300"/>
                    </button>
                </div>
                
                {/* Map Container */}
                <div className="flex-1 relative bg-gray-100">
                    <div id="register-map" className="w-full h-full z-10"></div>
                    
                    {/* Floating 'My Location' Button */}
                    <button 
                        onClick={handleLocateMeInMap}
                        className="absolute top-4 right-4 z-[400] bg-white dark:bg-gray-700 p-2.5 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        title={t('useMyLocation')}
                    >
                        <Crosshair size={24}/>
                    </button>
                </div>
                
                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-gray-400 uppercase">{t('address')}</span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {tempAddress || t('mapInstruction')}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowMapModal(false)} 
                            className="flex-1 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            onClick={confirmMapSelection} 
                            disabled={!tempAddress}
                            className="flex-1 py-2.5 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-200 dark:shadow-none"
                        >
                            {t('confirmLocation')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};