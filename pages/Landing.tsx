import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Shield, CheckCircle, Globe, Building2, Users, ChevronDown, Radio, Smartphone, Bell, Eye, MousePointer2 } from 'lucide-react';
import { useLang } from '../App';
import { MOCK_CITIES } from '../constants';

// Internal Component for counting up numbers
const CountUp = ({ end, duration = 2500, suffix = '' }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = currentTime - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function: Ease Out Quart for smoother, slower finish
      const easeOut = (x: number) => 1 - Math.pow(1 - x, 4);
      
      setCount(Math.floor(end * easeOut(percentage)));

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return <span className="tabular-nums">{count}{suffix}</span>;
};

export const LandingPage: React.FC = () => {
  const { lang, toggleLang, t } = useLang();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Duplicate cities list for seamless marquee loop
  const marqueeCities = [...MOCK_CITIES, ...MOCK_CITIES];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 selection:bg-green-100 selection:text-green-800 overflow-x-hidden">
      
      {/* Custom Styles for Animations */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseSubtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 10px rgba(34, 197, 94, 0.2); transform: scale(1); }
          50% { text-shadow: 0 0 20px rgba(34, 197, 94, 0.5); transform: scale(1.05); }
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollWheel {
          0% { transform: translateY(2px); opacity: 1; height: 4px; }
          100% { transform: translateY(14px); opacity: 0; height: 4px; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-down {
          animation: fadeInDown 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-pulse-continuous {
          animation: pulseSubtle 3s ease-in-out infinite;
        }
        .animate-text-glow {
          animation: textGlow 3s ease-in-out infinite;
          display: inline-block;
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: scroll 60s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .animate-scroll-wheel {
          animation: scrollWheel 1.5s ease-out infinite;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-500 { animation-delay: 500ms; }
      `}</style>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600 flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform opacity-0 animate-fade-in-down" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-200 dark:shadow-none">
                <MapPin size={18} fill="currentColor" className="text-white" />
            </div>
            CityLink
            </h1>
            <div className="flex items-center gap-4 opacity-0 animate-fade-in-down delay-100">
            <button 
                onClick={toggleLang}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <Globe size={14} />
                {lang === 'en' ? 'தமிழ்' : 'English'}
            </button>
            <div className="hidden sm:flex items-center gap-4">
                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-green-600 font-medium text-sm transition-colors">
                    {t('login')}
                </Link>
                <Link to="/register" className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-sm shadow-lg shadow-green-200 dark:shadow-none transition-all hover:-translate-y-0.5">
                    {t('getStarted')}
                </Link>
            </div>
            </div>
        </div>
      </nav>

      <main className="flex-1 relative z-10 pt-20">
        
        {/* --- HERO SECTION --- */}
        <section className="min-h-[95vh] flex items-center relative pb-20 md:pb-0 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-green-50 to-transparent dark:from-green-900/20 -z-10 opacity-70"></div>
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-[100px] -z-10"></div>
            
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            {/* Left Content */}
            <div className="space-y-8 order-2 md:order-1">
                <div className="opacity-0 animate-fade-in-up delay-200">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-bold tracking-wide border border-green-100 dark:border-green-800 mb-6 shadow-sm cursor-default hover:scale-105 transition-transform">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        {t('tnCoverage')}
                    </span>
                    <h2 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-6">
                        {t('landingTitle')}
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg">
                        {t('landingSubtitle')}
                    </p>
                    <div className="h-1 w-20 bg-green-500 rounded-full mt-6"></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in-up delay-300">
                <Link to="/register" className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg text-center flex items-center justify-center gap-2 shadow-xl shadow-green-200 dark:shadow-green-900/20 hover:shadow-2xl transition-all hover:-translate-y-1">
                    {t('reportIssueBtn')}
                    <MapPin size={20} className="animate-bounce" />
                </Link>
                <Link to="/login" className="px-8 py-4 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-lg text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {t('adminLoginBtn')}
                </Link>
                </div>
                
                {/* Stats Strip - "Impact all time see" */}
                <div className="pt-8 border-t border-gray-200/60 dark:border-gray-800/60 opacity-0 animate-fade-in-up delay-500">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 animate-pulse">{t('tnStatsTitle')}</h4>
                <div className="grid grid-cols-3 gap-6">
                    <div className="group cursor-default p-2 rounded-xl hover:bg-green-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-3 text-3xl font-black text-gray-900 dark:text-white mb-1">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 animate-pulse-continuous">
                                <Building2 size={24} /> 
                            </div>
                            <div className="animate-text-glow">
                              <CountUp end={MOCK_CITIES.length} duration={3000} />
                            </div>
                        </div>
                        <div className="text-xs font-bold text-gray-500 pl-1">{t('cities')}</div>
                    </div>
                    <div className="group cursor-default p-2 rounded-xl hover:bg-teal-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-3 text-3xl font-black text-gray-900 dark:text-white mb-1">
                             <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600 animate-pulse-continuous" style={{animationDelay: '1s'}}>
                                <Users size={24} /> 
                            </div>
                            <div className="animate-text-glow" style={{animationDelay: '1s'}}>
                              <CountUp end={10} duration={3500} suffix="k+" />
                            </div>
                        </div>
                        <div className="text-xs font-bold text-gray-500 pl-1">{t('issuesSolved')}</div>
                    </div>
                    <div className="group cursor-default p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center gap-3 text-3xl font-black text-gray-900 dark:text-white mb-1">
                             <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 animate-pulse-continuous" style={{animationDelay: '2s'}}>
                                <CheckCircle size={24} /> 
                            </div>
                            <div className="animate-text-glow" style={{animationDelay: '2s'}}>
                              <CountUp end={24} duration={3200} suffix="h" />
                            </div>
                        </div>
                        <div className="text-xs font-bold text-gray-500 pl-1">{t('avgResponse')}</div>
                    </div>
                </div>
                </div>
            </div>

            {/* Right Visual - Chennai Central Image */}
            <div className="order-1 md:order-2 mt-8 md:mt-0 hidden md:block opacity-0 animate-fade-in-up delay-300">
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 shadow-2xl space-y-6 border border-gray-100 dark:border-gray-700 animate-float relative z-10 max-w-lg mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    
                    {/* Decorative Blob */}
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-yellow-200 dark:bg-yellow-900/30 rounded-full blur-3xl -z-10 animate-pulse"></div>
                    <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-green-200 dark:bg-green-900/30 rounded-full blur-3xl -z-10 animate-pulse" style={{animationDelay: '1s'}}></div>

                    {/* Main Image */}
                    <div className="relative overflow-hidden rounded-2xl h-64 md:h-80 shadow-lg group border-4 border-white dark:border-gray-700">
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Chennai_Central_Railway_Station.jpg/1200px-Chennai_Central_Railway_Station.jpg" 
                            alt="Chennai Central Railway Station" 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 text-white">
                            <p className="font-bold text-xl drop-shadow-md">Chennai Central</p>
                            <p className="text-sm opacity-90 font-medium bg-green-600/80 px-2 py-0.5 rounded inline-block mt-1 backdrop-blur-sm">Hub of Tamil Nadu</p>
                        </div>
                    </div>
                    
                    {/* Live Badge */}
                    <div className="absolute top-10 right-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 border border-gray-200 dark:border-gray-600 z-20">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                        Live System Active
                    </div>

                    {/* Floating Cards */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-gray-600 transition-colors shadow-lg border border-gray-100 dark:border-gray-600 transform translate-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                             <MapPin size={24} />
                        </div>
                        <div>
                             <h3 className="font-bold text-gray-900 dark:text-white text-sm">Chennai Corp.</h3>
                             <p className="text-xs text-gray-500">Zone 13 - Road Repaired</p>
                        </div>
                        <span className="ml-auto text-white font-bold text-[10px] uppercase bg-green-500 px-2 py-1 rounded-lg shadow-sm shadow-green-200">Resolved</span>
                    </div>
                </div>
            </div>
            </div>
            
            {/* Scroll Indicator - Mouse Animation */}
            <div 
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-20 opacity-70 hover:opacity-100 transition-opacity"
                onClick={() => scrollToSection('features')}>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-[0.2em] uppercase animate-pulse">Scroll</span>
                <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-500 rounded-full flex justify-center p-1">
                    <div className="w-1 h-2 bg-green-500 rounded-full animate-scroll-wheel"></div>
                </div>
            </div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section id="features" className="py-24 bg-gray-50 dark:bg-gray-800/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-100/40 via-transparent to-transparent dark:from-green-900/10 pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('featuresTitle')}</h2>
                    <div className="h-1.5 w-24 bg-gradient-to-r from-green-500 to-teal-500 mx-auto rounded-full"></div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                            <Radio size={36} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('feat1Title')}</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('feat1Desc')}</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 mb-6 group-hover:scale-110 transition-transform">
                            <MapPin size={36} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('feat2Title')}</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('feat2Desc')}</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                            <Bell size={36} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('feat3Title')}</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('feat3Desc')}</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section className="py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('howItWorksTitle')}</h2>
                    <p className="text-gray-500">Three simple steps to make a change.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-1 bg-gradient-to-r from-gray-200 via-green-200 to-gray-200 dark:from-gray-700 dark:via-green-900 dark:to-gray-700 -z-10 rounded-full"></div>

                    <div className="text-center group cursor-default">
                        <div className="w-24 h-24 bg-white dark:bg-gray-900 border-4 border-green-100 dark:border-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:border-green-500 group-hover:shadow-green-200">
                            <Smartphone size={40} className="text-green-600" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold shadow-md">1</div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('stepReport')}</h3>
                        <p className="text-gray-500 text-sm px-4">{t('stepReportDesc')}</p>
                    </div>

                    <div className="text-center group cursor-default">
                        <div className="w-24 h-24 bg-white dark:bg-gray-900 border-4 border-orange-100 dark:border-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:border-orange-500 group-hover:shadow-orange-200">
                            <Eye size={40} className="text-orange-500" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold shadow-md">2</div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('stepVerify')}</h3>
                        <p className="text-gray-500 text-sm px-4">{t('stepVerifyDesc')}</p>
                    </div>

                    <div className="text-center group cursor-default">
                        <div className="w-24 h-24 bg-white dark:bg-gray-900 border-4 border-blue-100 dark:border-gray-700 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:border-blue-600 group-hover:shadow-blue-200">
                            <CheckCircle size={40} className="text-blue-600" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-md">3</div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('stepResolve')}</h3>
                        <p className="text-gray-500 text-sm px-4">{t('stepResolveDesc')}</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- COVERAGE MARQUEE --- */}
        <section className="py-20 bg-gradient-to-r from-green-800 to-teal-800 overflow-hidden relative">
             {/* Gradient Overlays for smooth fade effect at edges */}
             <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-green-800 to-transparent z-10"></div>
             <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-teal-800 to-transparent z-10"></div>

             <div className="max-w-7xl mx-auto px-6 text-center mb-10 relative z-20">
                 <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-green-200 text-xs font-bold mb-3 border border-white/10 uppercase tracking-widest">Statewide Network</span>
                 <h2 className="text-3xl font-bold text-white mb-2">{t('coverageTitle')}</h2>
                 <p className="text-green-100 text-sm opacity-90">Working directly with corporations across every district in Tamil Nadu</p>
             </div>
             
             {/* Infinite Marquee Loop */}
             <div className="marquee-track flex gap-6 px-4">
                 {marqueeCities.map((city, i) => (
                     <div key={`${city}-${i}`} className="shrink-0 flex items-center gap-3 bg-white/10 backdrop-blur-sm px-8 py-4 rounded-full text-white font-bold border border-white/20 hover:bg-white/20 transition-all hover:scale-105 shadow-lg cursor-default whitespace-nowrap group">
                         <Building2 size={20} className="text-green-300 group-hover:text-white transition-colors" />
                         <span className="text-lg">{t(city)}</span>
                     </div>
                 ))}
             </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-gray-900 text-white py-16 border-t border-gray-800 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#22c55e 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-8 relative z-10">
                <div className="col-span-1 md:col-span-2">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-900/50">
                            <MapPin size={18} className="text-white" />
                        </div> 
                        CityLink
                    </h2>
                    <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-6">
                        Empowering citizens of Tamil Nadu to build cleaner, safer, and smarter cities through direct civic engagement. Join the movement today.
                    </p>
                    <div className="flex gap-4">
                        {/* Social Placeholders */}
                        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-green-600 hover:text-white transition-all hover:-translate-y-1 cursor-pointer">X</div>
                        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all hover:-translate-y-1 cursor-pointer">in</div>
                        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all hover:-translate-y-1 cursor-pointer">ig</div>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold mb-6 text-white text-sm uppercase tracking-wider text-green-500">Quick Links</h3>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li><Link to="/login" className="hover:text-green-400 hover:translate-x-1 transition-all inline-block">{t('login')}</Link></li>
                        <li><Link to="/register" className="hover:text-green-400 hover:translate-x-1 transition-all inline-block">{t('register')}</Link></li>
                        <li><a href="#" className="hover:text-green-400 hover:translate-x-1 transition-all inline-block">{t('contactUs')}</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold mb-6 text-white text-sm uppercase tracking-wider text-green-500">Legal</h3>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li><a href="#" className="hover:text-green-400 hover:translate-x-1 transition-all inline-block">{t('privacyPolicy')}</a></li>
                        <li><a href="#" className="hover:text-green-400 hover:translate-x-1 transition-all inline-block">{t('termsOfService')}</a></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto px-6 relative z-10">
                <span>&copy; 2024 CityLink by Yogaarasu. All rights reserved.</span>
                <span className="mt-2 md:mt-0 flex items-center gap-1">Made with <span className="text-red-500 animate-pulse">❤</span> for Tamil Nadu</span>
            </div>
        </footer>

      </main>
    </div>
  );
};