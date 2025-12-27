import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useLang } from '../App';
import { authenticateUser, sendOtpToEmail, verifyOtp, resetUserPassword } from '../services/storageService';
import { Lock, Mail, AlertCircle, ArrowLeft, Key, CheckCircle, Globe, Info, Home } from 'lucide-react';

export const LoginPage: React.FC = () => {
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Pass
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null); // For simulation
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { login } = useAuth();
  const { lang, toggleLang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-hide alerts after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  useEffect(() => {
    // Check for success message from registration redirect
    const state = location.state as { message?: string };
    if (state?.message) {
      setSuccess(state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const validateLogin = () => {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(email.trim())) return "Invalid email format.";
     if (password.length < 1) return "Password is required.";
     return null;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const valError = validateLogin();
    if(valError) {
        setError(valError);
        return;
    }

    setLoading(true);
    try {
        // Trim inputs and lowercase email before sending to service
        const user = await authenticateUser(email.trim().toLowerCase(), password.trim());
        
        if (user) {
          login(user);
          navigate('/dashboard-router');
        } else {
          setError('Invalid credentials.');
        }
    } catch (err: any) {
        setError(err.message || "Login failed.");
    } finally {
        setLoading(false);
    }
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = resetEmail.trim().toLowerCase();
    
    if (!emailRegex.test(cleanEmail)) {
        setError("Please enter a valid email.");
        return;
    }

    setLoading(true);
    try {
        // Send simulated OTP
        const generatedOtp = await sendOtpToEmail(cleanEmail);
        setDevOtpCode(generatedOtp); // Show code
        setForgotStep(2);
        setSuccess(`OTP sent to ${cleanEmail}.`);
    } catch (e: any) {
        setError(e.message || "Failed to send OTP. Is the email registered?");
    } finally {
        setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        setError("Password must be 8+ chars, with upper, lower, number, and symbol.");
        return;
    }

    if (newPassword !== confirmNewPassword) {
        setError("Passwords do not match.");
        return;
    }

    setLoading(true);
    try {
      const cleanEmail = resetEmail.trim().toLowerCase();
      const isValid = await verifyOtp(cleanEmail, otp.trim());
      if (!isValid) throw new Error("Invalid or expired OTP code.");

      const resetSuccess = await resetUserPassword(cleanEmail, newPassword.trim());
      if (resetSuccess) {
          setSuccess("Password reset successfully! Please login.");
          setTimeout(() => {
             setShowForgot(false);
             setForgotStep(1);
             setResetEmail('');
             setOtp('');
             setNewPassword('');
             setConfirmNewPassword('');
             setDevOtpCode(null);
          }, 2000);
      } else {
          throw new Error("Failed to reset password.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
      setShowForgot(false);
      setForgotStep(1);
      setError('');
      setSuccess('');
      setResetEmail('');
      setDevOtpCode(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 relative">
       
       <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
         <Link to="/" className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded shadow text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
             <Home size={16}/> {lang === 'ta' ? 'முகப்பு' : 'Home'}
         </Link>
         <button onClick={toggleLang} className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded shadow text-sm border border-gray-200 dark:border-gray-700">
             <Globe size={16}/> {lang === 'en' ? 'தமிழ்' : 'English'}
         </button>
      </div>

      <div className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        
        {!showForgot ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('welcomeBack')}</h2>
              <p className="text-gray-500 dark:text-gray-400">{t('landingSubtitle')}</p>
            </div>

            {success && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center gap-2">
                    <CheckCircle size={16} />
                    {success}
                </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('password')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => { setError(''); setSuccess(''); setShowForgot(true); }}
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 font-medium hover:underline"
                >
                  {t('forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-sm disabled:opacity-50"
              >
                {loading ? t('processing') : t('signIn')}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              {t('noAccount')}{' '}
              <Link to="/register" className="text-green-600 hover:text-green-700 font-bold hover:underline">
                {t('register')}
              </Link>
            </div>
          </>
        ) : (
          <div>
            <button onClick={resetState} className="flex items-center text-gray-500 mb-6 hover:text-gray-700">
              <ArrowLeft size={16} className="mr-2" /> {t('back')}
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('resetPassword')}</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
             
            {success && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg">
                    {success}
                </div>
            )}

            {forgotStep === 1 ? (
                <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                  <p className="text-gray-500 text-sm">Enter your registered email address and we'll send you an OTP.</p>
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('email')}</label>
                    <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="Enter your email"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
                  >
                    {loading ? t('processing') : t('sendOtp')}
                  </button>
                </form>
            ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                    
                    {/* Simulated Email Notification */}
                    {devOtpCode && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                             <Info className="text-green-600 shrink-0 mt-0.5" size={20} />
                             <div>
                                 <h4 className="font-bold text-green-800 text-sm">Email Simulation</h4>
                                 <p className="text-sm text-green-700 mt-1">
                                     Verification code for <b>{resetEmail}</b>: <br/>
                                     <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-green-200 inline-block mt-1">{devOtpCode}</span>
                                 </p>
                             </div>
                        </div>
                    )}

                    <p className="text-gray-500 text-sm">Enter the code sent to <b>{resetEmail}</b></p>
                    
                    <div className="group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('otpCode')}</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono tracking-widest focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="123456"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                        <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="New strong password"
                        />
                    </div>
                    
                    <div className="group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            required
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="Confirm new password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
                    >
                        {loading ? t('processing') : t('resetPassword')}
                    </button>
                </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};