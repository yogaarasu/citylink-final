import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { LucideIcon, Menu, X, Sun, Moon, LogOut, LayoutDashboard, FileText, User as UserIcon, MapPin, Users, Globe } from 'lucide-react';

// --- Imports from components ---
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { CityAdminDashboard } from './pages/CityAdminDashboard';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ProfilePage } from './pages/Profile';

// --- Contexts ---

// 1. Auth Context
interface AuthContextType {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType>({ user: null, login: () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

// 2. Theme Context
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType>({ isDark: false, toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

// 3. Language Context
type Lang = 'en' | 'ta';
interface LangContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    // Auth & General
    login: "Login",
    register: "Register",
    logout: "Logout",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    firstName: "First Name",
    lastName: "Last Name",
    district: "District",
    address: "Address",
    submit: "Submit",
    update: "Update",
    cancel: "Cancel",
    save: "Save",
    loading: "Loading...",
    processing: "Processing...",
    welcomeBack: "Welcome Back",
    signIn: "Sign In",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    resetPassword: "Reset Password",
    sendOtp: "Send OTP",
    otpCode: "OTP Code",
    verifyRegister: "Verify & Register",
    selectDistrict: "Select District",
    selectLocation: "Select Accurate Location",
    mapInstruction: "Tap anywhere on the map to pin your address.",
    useMyLocation: "Use My Location",
    confirmLocation: "Confirm Location",
    back: "Back",
    
    // Landing - HERO
    landingTitle: "Building a Better Tamil Nadu, Together.",
    landingSubtitle: "The official civic engagement platform connecting citizens across all 38 districts with their local administration.",
    landingTagline: "Your Voice. Your City. Your Change.",
    tnCoverage: "Covering all 38 Districts of Tamil Nadu",
    tnStatsTitle: "Statewide Impact",
    getStarted: "Get Started",
    reportIssueBtn: "Report Issue Now",
    adminLoginBtn: "Official Admin Login",
    avgResponse: "Avg Response Time",
    issuesSolved: "Issues Resolved",
    cities: "Districts Active",
    
    // Landing - FEATURES
    featuresTitle: "Why Choose CityLink?",
    feat1Title: "Direct Official Connection",
    feat1Desc: "Connect directly with local administration to ensure your reports reach the right department immediately.",
    feat2Title: "Geo-Tagged Evidence",
    feat2Desc: "Pinpoint accuracy using GPS ensures officials know exactly where the problem lies.",
    feat3Title: "Real-Time Tracking",
    feat3Desc: "Get SMS and App notifications at every step—from 'Received' to 'Resolved'.",
    
    // Landing - WORKFLOW
    howItWorksTitle: "How It Works",
    stepReport: "Snap & Report",
    stepVerify: "Admin Verify",
    stepResolve: "Quick Resolution",
    stepReportDesc: "Take a photo of any civic issue (roads, garbage, lights) and pin the location.",
    stepVerifyDesc: "City administrators verify the report and assign it to the right department.",
    stepResolveDesc: "Track progress in real-time and get notified when the issue is fixed.",
    
    // Landing - COVERAGE
    coverageTitle: "Serving Major Corporations",
    joinMovement: "Join the Movement",
    footerRights: "© 2024 CityLink Tamil Nadu. All rights reserved.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    contactUs: "Contact Support",
    
    // Dashboard
    dashboard: "Dashboard",
    myReports: "My Recent Reports",
    communityIssues: "Community Issues",
    reportNew: "Report New Issue",
    welcome: "Welcome",
    
    // Report Form
    title: "Title",
    issueTitlePlaceholder: "e.g., Broken Street Light",
    description: "Description",
    category: "Category",
    allCategories: "All Categories",
    photos: "Photos (Max 5)",
    pinLocation: "Pin Location on Map",
    fetchingAddress: "Fetching address...",
    targetDistrict: "Target District",
    submitReport: "Submit Report",
    
    // Issue Card/Modal
    status: "Status",
    pending: "Pending",
    inProgress: "In Progress",
    resolved: "Resolved",
    rejected: "Rejected",
    viewDetails: "View Full Details",
    shareReport: "Share Report",
    citizenConfirmations: "Citizen Confirmations",
    confirmIssue: "I see this too (Confirm)",
    flagIssue: "Flag as Incorrect",
    confirmedBy: "Confirmed by",
    people: "citizens",
    resolutionProof: "Resolution Proof",
    rateResolution: "Rate Resolution",
    isAccurate: "Is this report accurate?",
    thanksVote: "Thanks for your confirmation!",
    noComment: "No comment provided.",
    
    // Share Text
    alert: "ALERT",
    details: "Details",
    location: "Location",
    evidence: "Evidence",
    reportedVia: "Reported via CityLink",
    
    // Admin
    systemOverview: "System Overview",
    manageIssues: "Manage Issues",
    totalReports: "Total Reports",
    totalCityAdmins: "Total City Admins",
    activeDistricts: "Active Districts (TN)",
    systemHealth: "System Health",
    topCitiesChart: "Issues by Top Cities",
    manageAdmins: "Manage City Administrators",
    addAdmin: "Add Administrator",
    editAdmin: "Edit Administrator",
    adminId: "Admin ID",
    delete: "Delete",
    edit: "Edit",
    confirmDelete: "Confirm Delete",
    deleteUserConfirm: "Are you sure you want to permanently delete",
    markResolved: "Mark Resolved",
    rejectIssue: "Reject Issue",
    uploadEvidence: "Upload Resolution Evidence",
    rejectReason: "Select Rejection Reason",
    saving: "Saving...",
    confirm: "Confirm",
    
    // Profile
    myProfile: "My Profile",
    editProfile: "Edit Profile",
    contactInfo: "Contact Information",
    locationDetails: "Location Details",
    role: "Role",
    country: "Country",
    language: "Language",

    // Status Filters
    ALL: "All",
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    REJECTED: "Rejected"
  },
  ta: {
    // Auth & General
    login: "உள்நுழைய",
    register: "பதிவு செய்ய",
    logout: "வெளியேறு",
    email: "மின்னஞ்சல்",
    password: "கடவுச்சொல்",
    confirmPassword: "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
    firstName: "பெயர்",
    lastName: "இனிஷியல்",
    district: "மாவட்டம்",
    address: "முகவரி",
    submit: "சமர்ப்பிக்கவும்",
    update: "புதுப்பிக்கவும்",
    cancel: "ரத்துசெய்",
    save: "சேமி",
    loading: "ஏற்றுகிறது...",
    processing: "செயலாக்குகிறது...",
    welcomeBack: "மீண்டும் வருக",
    signIn: "உள்நுழைய",
    forgotPassword: "கடவுச்சொல்லை மறந்துவிட்டீர்களா?",
    noAccount: "கணக்கு இல்லையா?",
    resetPassword: "கடவுச்சொல்லை மீட்டமை",
    sendOtp: "OTP அனுப்பு",
    otpCode: "OTP குறியீடு",
    verifyRegister: "சரிபார்த்து பதிவு செய்",
    selectDistrict: "மாவட்டத்தைத் தேர்ந்தெடுக்கவும்",
    selectLocation: "துல்லியமான இடத்தைத் தேர்ந்தெடுக்கவும்",
    mapInstruction: "முகவரியைக் குறிக்க வரைபடத்தில் எங்கும் தட்டவும்.",
    useMyLocation: "என் இருப்பிடத்தைப் பயன்படுத்து",
    confirmLocation: "இடத்தை உறுதிசெய்",
    back: "திரும்ப",
    
    // Landing - HERO
    landingTitle: "சிறந்த தமிழ்நாட்டை உருவாக்குவோம், ஒன்றாக.",
    landingSubtitle: "தமிழ்நாட்டின் 38 மாவட்டங்களிலும் உள்ள மக்களை உள்ளூர் நிர்வாகத்துடன் இணைக்கும் அதிகாரப்பூர்வ தளம்.",
    landingTagline: "உங்கள் குரல். உங்கள் ஊர். உங்கள் மாற்றம்.",
    tnCoverage: "தமிழ்நாட்டின் 38 மாவட்டங்களையும் உள்ளடக்கியது",
    tnStatsTitle: "மாநிலம் தழுவிய தாக்கம்",
    getStarted: "தொடங்குங்கள்",
    reportIssueBtn: "புகாரைப் பதிவு செய்",
    adminLoginBtn: "அதிகாரிகள் உள்நுழைவு",
    avgResponse: "சராசரி பதில் நேரம்",
    issuesSolved: "தீர்க்கப்பட்ட புகார்கள்",
    cities: "மாவட்டங்கள்",
    
    // Landing - FEATURES
    featuresTitle: "CityLink-ஐ ஏன் தேர்வு செய்ய வேண்டும்?",
    feat1Title: "நேரடி நிர்வாக இணைப்பு",
    feat1Desc: "உங்கள் புகார்கள் உடனடியாக சரியான துறையைச் சென்றடைவதை உறுதிசெய்ய உள்ளூர் நிர்வாகத்துடன் நேரடியாக இணையுங்கள்.",
    feat2Title: "Geo-Tagging வசதி",
    feat2Desc: "GPS தொழில்நுட்பம் மூலம் பிரச்சனையின் துல்லியமான இடத்தை அதிகாரிகளுக்கு தெரிவிக்கிறது.",
    feat3Title: "நிகழ்நேர கண்காணிப்பு",
    feat3Desc: "புகார் அளித்தது முதல் தீர்வு கிடைக்கும் வரை ஒவ்வொரு நிலையிலும் SMS அறிவிப்புகளைப் பெறுங்கள்.",

    // Landing - WORKFLOW
    howItWorksTitle: "இது எப்படி செயல்படுகிறது?",
    stepReport: "புகாரளி",
    stepVerify: "சரிபார்",
    stepResolve: "தீர்வு",
    stepReportDesc: "சாலை, குப்பை, விளக்கு போன்ற புகார்களை புகைப்படம் எடுத்து அனுப்பவும்.",
    stepVerifyDesc: "நிர்வாகிகள் ஆய்வு செய்து நடவடிக்கை எடுப்பார்கள்.",
    stepResolveDesc: "புகார் தீர்க்கப்பட்டதும் அறிவிப்பைப் பெறுங்கள்.",
    
    // Landing - COVERAGE
    coverageTitle: "சேவை வழங்கப்படும் மாநகராட்சிகள்",
    joinMovement: "இணைந்திடுங்கள்",
    footerRights: "© 2024 CityLink தமிழ்நாடு. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    privacyPolicy: "தனியுரிமைக் கொள்கை",
    termsOfService: "விதிமுறைகள்",
    contactUs: "உதவிக்கு",

    // Dashboard
    dashboard: "முகப்பு",
    myReports: "எனது புகார்கள்",
    communityIssues: "சமூக புகார்கள்",
    reportNew: "புதிய புகாரை பதிவு செய்",
    welcome: "வணக்கம்",
    
    // Report Form
    title: "தலைப்பு",
    issueTitlePlaceholder: "எ.கா., உடைந்த தெரு விளக்கு",
    description: "விளக்கம்",
    category: "வகை",
    allCategories: "அனைத்து வகைகள்",
    photos: "புகைப்படங்கள் (அதிகபட்சம் 5)",
    pinLocation: "வரைபடத்தில் இடத்தை குறிக்கவும்",
    fetchingAddress: "முகவரி பெறப்படுகிறது...",
    targetDistrict: "மாவட்டம்",
    submitReport: "புகாரை பதிவு செய்",
    
    // Issue Card/Modal
    status: "நிலை",
    pending: "நிலுவையில் உள்ளது",
    inProgress: "செயல்பாட்டில் உள்ளது",
    resolved: "தீர்க்கப்பட்டது",
    rejected: "நிராகரிக்கப்பட்டது",
    viewDetails: "விவரங்களை காண்க",
    shareReport: "பகிர்",
    citizenConfirmations: "பொதுமக்கள் உறுதிப்படுத்தல்",
    confirmIssue: "உறுதிப்படுத்துகிறேன்",
    flagIssue: "தவறான தகவல்",
    confirmedBy: "உறுதி செய்தவர்கள்",
    people: "நபர்கள்",
    resolutionProof: "தீர்வுக்கான ஆதாரம்",
    rateResolution: "மதிப்பிடுங்கள்",
    isAccurate: "இந்த தகவல் சரியானதா?",
    thanksVote: "நன்றி!",
    noComment: "கருத்து எதுவும் இல்லை.",
    
    // Share Text
    alert: "எச்சரிக்கை",
    details: "விவரங்கள்",
    location: "இடம்",
    evidence: "ஆதாரம்",
    reportedVia: "CityLink மூலம் புகாரளிக்கப்பட்டது",
    
    // Admin
    systemOverview: "அமைப்பு கண்ணோட்டம்",
    manageIssues: "புகார்களை நிர்வகி",
    totalReports: "மொத்த புகார்கள்",
    totalCityAdmins: "மொத்த நகர நிர்வாகிகள்",
    activeDistricts: "செயலில் உள்ள மாவட்டங்கள் (TN)",
    systemHealth: "கணினி ஆரோக்கியம்",
    topCitiesChart: "அதிக புகார்கள் உள்ள நகரங்கள்",
    manageAdmins: "நகர நிர்வாகிகளை நிர்வகிக்கவும்",
    addAdmin: "நிர்வாகியைச் சேர்க்கவும்",
    editAdmin: "நிர்வாகியைத் திருத்து",
    adminId: "நிர்வாகி ஐடி",
    delete: "நீக்கு",
    edit: "திருத்து",
    confirmDelete: "நீக்குவதை உறுதிப்படுத்தவும்",
    deleteUserConfirm: "நீங்கள் நிச்சயமாக பயனரை நிரந்தரமாக நீக்க விரும்புகிறீர்களா",
    markResolved: "தீர்க்கப்பட்டது",
    rejectIssue: "நிராகரி",
    uploadEvidence: "ஆதாரத்தைப் பதிவேற்று",
    rejectReason: "காரணத்தைத் தேர்ந்தெடு",
    saving: "சேமிக்கிறது...",
    confirm: "உறுதிசெய்",
    
    // Profile
    myProfile: "என் விவரம்",
    editProfile: "திருத்து",
    contactInfo: "தொடர்பு தகவல்",
    locationDetails: "இருப்பிட விவரங்கள்",
    role: "பங்கு",
    country: "நாடு",
    language: "மொழி",

    // Status Filters
    ALL: "அனைத்தும்",
    PENDING: "நிலுவை",
    IN_PROGRESS: "செயல்பாட்டில்",
    RESOLVED: "முடிந்தது",
    REJECTED: "நிராகரிக்கப்பட்டது",

    // --- Dynamic Data Translations ---
    
    // Categories
    "Infrastructure (Potholes, Roads)": "உள்கட்டமைப்பு (சாலைகள், பள்ளங்கள்)",
    "Sanitation (Garbage, Debris)": "சுகாதாரம் (குப்பை, கழிவுகள்)",
    "Utilities (Water, Power, Gas)": "பயன்பாடுகள் (நீர், மின்சாரம், எரிவாயு)",
    "Public Safety": "பொது பாதுகாப்பு",
    "Parks & Recreation": "பூங்காக்கள் மற்றும் பொழுதுபோக்கு",
    "Other": "மற்றவை",

    // Districts (Tamil Nadu) - ALL 38
    "Ariyalur": "அரியலூர்",
    "Chengalpattu": "செங்கல்பட்டு",
    "Chennai": "சென்னை",
    "Coimbatore": "கோயம்புத்தூர்",
    "Cuddalore": "கடலூர்",
    "Dharmapuri": "தருமபுரி",
    "Dindigul": "திண்டுக்கல்",
    "Erode": "ஈரோடு",
    "Kallakurichi": "கள்ளக்குறிச்சி",
    "Kancheepuram": "காஞ்சிபுரம்",
    "Kanyakumari": "கன்னியாகுமரி",
    "Karur": "கரூர்",
    "Krishnagiri": "கிருஷ்ணகிரி",
    "Madurai": "மதுரை",
    "Mayiladuthurai": "மயிலாடுதுறை",
    "Nagapattinam": "நாகப்பட்டினம்",
    "Namakkal": "நாமக்கல்",
    "Nilgiris": "நீலகிரி",
    "Perambalur": "பெரம்பலூர்",
    "Pudukkottai": "புதுக்கோட்டை",
    "Ramanathapuram": "ராமநாதபுரம்",
    "Ranipet": "ராணிப்பேட்டை",
    "Salem": "சேலம்",
    "Sivaganga": "சிவகங்கை",
    "Tenkasi": "தென்காசி",
    "Thanjavur": "தஞ்சாவூர்",
    "Theni": "தேனி",
    "Thoothukudi": "தூத்துக்குடி",
    "Tiruchirappalli": "திருச்சிராப்பள்ளி",
    "Tirunelveli": "திருநெல்வேலி",
    "Tirupathur": "திருப்பத்தூர்",
    "Tiruppur": "திருப்பூர்",
    "Tiruvallur": "திருவள்ளூர்",
    "Tiruvannamalai": "திருவண்ணாமலை",
    "Tiruvarur": "திருவாரூர்",
    "Vellore": "வேலூர்",
    "Viluppuram": "விழுப்புரம்",
    "Virudhunagar": "விருதுநகர்"
  }
};

const LangContext = createContext<LangContextType>({ lang: 'en', toggleLang: () => {}, t: (k) => k });
export const useLang = () => useContext(LangContext);

// --- Components ---

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === UserRole.SUPER_ADMIN) return <Navigate to="/admin" />;
    if (user.role === UserRole.CITY_ADMIN) return <Navigate to="/city-admin" />;
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLang();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getNavItems = () => {
    if (!user) return [];
    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return [
          { label: t('systemOverview'), path: '/admin', icon: LayoutDashboard },
          { label: t('manageAdmins'), path: '/admin/users', icon: Users },
          { label: t('myProfile'), path: '/profile', icon: UserIcon },
        ];
      case UserRole.CITY_ADMIN:
        return [
          { label: t('dashboard'), path: '/city-admin', icon: LayoutDashboard },
          { label: t('manageIssues'), path: '/city-admin/issues', icon: FileText },
          { label: t('myProfile'), path: '/profile', icon: UserIcon },
        ];
      case UserRole.CITIZEN:
        return [
          { label: t('dashboard'), path: '/dashboard', icon: LayoutDashboard },
          { label: t('reportIssueBtn'), path: '/report', icon: MapPin },
          { label: t('communityIssues'), path: '/community', icon: Users },
          { label: t('myProfile'), path: '/profile', icon: UserIcon },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl md:shadow-none transform transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              CityLink
            </h1>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {getNavItems().map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
            <button
              onClick={toggleLang}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Globe size={20} />
              <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={20} />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 dark:text-gray-300">
            <Menu size={24} />
          </button>
          <span className="font-semibold text-gray-800 dark:text-white">CityLink</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- App Root ---

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
        const storedUser = localStorage.getItem('citylink_current_user');
        if (storedUser) setUser(JSON.parse(storedUser));
        
        const storedTheme = localStorage.getItem('citylink_theme');
        if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          setIsDark(true);
          document.documentElement.classList.add('dark');
        }

        const storedLang = localStorage.getItem('citylink_lang') as Lang;
        if (storedLang) setLang(storedLang);

        setLoading(false);
    };
    init();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('citylink_current_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('citylink_current_user');
  };

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('citylink_theme', next ? 'dark' : 'light');
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return next;
    });
  };

  const toggleLang = () => {
    setLang(prev => {
        const next = prev === 'en' ? 'ta' : 'en';
        localStorage.setItem('citylink_lang', next);
        return next;
    });
  }

  const t = (key: string) => {
      // @ts-ignore
      return translations[lang][key] || key;
  }

  if (loading) return <div className="h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <ThemeContext.Provider value={{ isDark, toggleTheme }}>
        <LangContext.Provider value={{ lang, toggleLang, t }}>
            <HashRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={user ? <Navigate to="/dashboard-router" /> : <LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                <Route path="/dashboard-router" element={
                <ProtectedRoute>
                    {user?.role === UserRole.SUPER_ADMIN && <Navigate to="/admin" />}
                    {user?.role === UserRole.CITY_ADMIN && <Navigate to="/city-admin" />}
                    {user?.role === UserRole.CITIZEN && <Navigate to="/dashboard" />}
                </ProtectedRoute>
                } />

                {/* Super Admin */}
                <Route path="/admin/*" element={
                <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                    <Layout>
                    <Routes>
                        <Route path="/" element={<SuperAdminDashboard view="overview" />} />
                        <Route path="/users" element={<SuperAdminDashboard view="users" />} />
                    </Routes>
                    </Layout>
                </ProtectedRoute>
                } />

                {/* City Admin */}
                <Route path="/city-admin/*" element={
                <ProtectedRoute allowedRoles={[UserRole.CITY_ADMIN]}>
                    <Layout>
                    <Routes>
                        <Route path="/" element={<CityAdminDashboard view="overview" />} />
                        <Route path="/issues" element={<CityAdminDashboard view="issues" />} />
                    </Routes>
                    </Layout>
                </ProtectedRoute>
                } />

                {/* Citizen */}
                <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={[UserRole.CITIZEN]}>
                    <Layout><CitizenDashboard view="overview" /></Layout>
                </ProtectedRoute>
                } />
                <Route path="/report" element={
                <ProtectedRoute allowedRoles={[UserRole.CITIZEN]}>
                    <Layout><CitizenDashboard view="report" /></Layout>
                </ProtectedRoute>
                } />
                <Route path="/community" element={
                <ProtectedRoute allowedRoles={[UserRole.CITIZEN]}>
                    <Layout><CitizenDashboard view="community" /></Layout>
                </ProtectedRoute>
                } />

                {/* Shared */}
                <Route path="/profile" element={
                <ProtectedRoute>
                    <Layout><ProfilePage /></Layout>
                </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            </HashRouter>
        </LangContext.Provider>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;