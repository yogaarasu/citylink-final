import React, { useState, useEffect } from 'react';
import { useAuth, useLang } from '../App';
import { Issue, IssueStatus } from '../types';
import { getIssuesByCity, updateIssueStatus } from '../services/storageService';
import { ISSUE_CATEGORIES } from '../constants';
import { CheckCircle, Clock, AlertTriangle, Search, Filter, X, MapPin, Upload, Camera, Star, MessageSquare, Ban, Share2, Copy, Facebook, Twitter, Link as LinkIcon, ThumbsUp, ThumbsDown, Calendar } from 'lucide-react';

interface Props {
  view: 'overview' | 'issues';
}

export const CityAdminDashboard: React.FC<Props> = ({ view }) => {
  const { user } = useAuth();
  const { t } = useLang();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (user?.city) {
      loadIssues();
    }
  }, [user]);

  const loadIssues = async () => {
    if (user?.city) {
        const data = await getIssuesByCity(user.city);
        setIssues(data);
    }
  };

  const handleStatusUpdate = async (id: string, status: IssueStatus, resolutionImage?: string, rejectionReason?: string) => {
    // Optimistic update
    setIssues(prev => prev.map(i => i.id === id ? { 
        ...i, 
        status, 
        resolutionImageUrl: resolutionImage,
        resolutionDate: resolutionImage ? Date.now() : i.resolutionDate,
        rejectionReason: rejectionReason
    } : i));
    
    if(selectedIssue && selectedIssue.id === id) {
        setSelectedIssue({
            ...selectedIssue, 
            status,
            resolutionImageUrl: resolutionImage,
            resolutionDate: resolutionImage ? Date.now() : selectedIssue.resolutionDate,
            rejectionReason: rejectionReason
        });
    }

    // Backend update
    await updateIssueStatus(id, status, resolutionImage, rejectionReason);
  };

  const filteredIssues = issues.filter(i => {
    const statusMatch = statusFilter === 'ALL' || i.status === statusFilter;
    const catMatch = categoryFilter === 'ALL' || i.category === categoryFilter;
    return statusMatch && catMatch;
  });

  const stats = {
    total: issues.length,
    pending: issues.filter(i => i.status === IssueStatus.PENDING).length,
    progress: issues.filter(i => i.status === IssueStatus.IN_PROGRESS).length,
    resolved: issues.filter(i => i.status === IssueStatus.RESOLVED).length,
    rejected: issues.filter(i => i.status === IssueStatus.REJECTED).length,
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // UPDATED SHARE FORMAT (Consistent with Citizen Dashboard)
  const handleShare = async (issue: Issue) => {
    const mapLink = issue.latitude && issue.longitude 
        ? `https://maps.google.com/?q=${issue.latitude},${issue.longitude}`
        : 'Location not available';
    
    const photoUrl = issue.imageUrls?.[0] || issue.imageUrl || '';
    const imageText = photoUrl.startsWith('data:') 
        ? '[Photo Evidence Attached in CityLink App]' 
        : (photoUrl || 'No photo available');

    const shareText = `*🚨 ${issue.title.toUpperCase()}*
------------------------

*${t('details')}:*
${issue.description}

*${t('location')}:*
${mapLink}

*${t('evidence')}:*
${imageText}

_Reported via CityLink_`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: `CityLink Alert: ${issue.title}`,
                text: shareText
            });
        } catch (err) {
            console.error('Share failed:', err);
        }
    } else {
        navigator.clipboard.writeText(shareText);
        alert(t('shareReport') + ' (Copied to clipboard)');
    }
  };

  const ShareModal = ({ issue }: { issue: Issue }) => {
      return (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
             <button onClick={() => handleShare(issue)} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 shadow transition-colors">
                 <Share2 size={14} /> {t('shareReport')}
             </button>
          </div>
      )
  };

  const IssueDetailModal = ({ issue, onClose }: { issue: Issue, onClose: () => void }) => {
    const [isResolving, setIsResolving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [resolutionFile, setResolutionFile] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('Not a Civic Issue');
    const [loadingAction, setLoadingAction] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const allImages = [
        ...(issue.imageUrls || []),
        ...(issue.imageUrl ? [issue.imageUrl] : [])
    ];
    const uniqueImages = Array.from(new Set(allImages));
    
    const isLocked = issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.REJECTED;

    const onResolutionFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const compressed = await compressImage(e.target.files[0]);
                setResolutionFile(compressed);
            } catch (e) {
                setErrorMsg("Failed to process image");
            }
        }
    };

    const confirmResolution = async () => {
        if (!resolutionFile) {
            setErrorMsg("Photo evidence is required to mark as Resolved.");
            return;
        }
        setLoadingAction(true);
        await handleStatusUpdate(issue.id, IssueStatus.RESOLVED, resolutionFile);
        setLoadingAction(false);
        setIsResolving(false);
    };

    const confirmRejection = async () => {
        setLoadingAction(true);
        await handleStatusUpdate(issue.id, IssueStatus.REJECTED, undefined, rejectionReason);
        setLoadingAction(false);
        setIsRejecting(false);
    };

    return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start sticky top-0 bg-white dark:bg-gray-800 z-10 shrink-0">
              <div>
                  <h2 className="text-xl font-bold dark:text-white pr-4">{issue.title}</h2>
                  <div className="flex gap-2 mt-2">
                     <span className="text-xs font-bold px-2 py-1 rounded bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300">{t(issue.category)}</span>
                  </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <X size={20} className="text-gray-500" />
              </button>
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto">
             {/* Map Preview */}
             <div className="h-48 w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 relative shrink-0">
                 {issue.latitude && issue.longitude ? (
                     <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${issue.latitude},${issue.longitude}&z=15&output=embed`}
                        allowFullScreen
                      ></iframe>
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">No Location Data</div>
                 )}
             </div>

             <div className="flex items-center gap-2 text-gray-500 text-sm">
                 <Calendar size={16} /> Reported on: {new Date(issue.createdAt).toLocaleDateString()}
             </div>

             {/* Evidence */}
             {uniqueImages.length > 0 && (
                <div className="shrink-0">
                   <h3 className="font-bold dark:text-gray-200 text-sm uppercase tracking-wider mb-2">{t('evidence')}</h3>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                       {uniqueImages.map((img, idx) => (
                           <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50">
                                <img 
                                    src={img} 
                                    alt={`Evidence ${idx + 1}`} 
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                    onClick={() => window.open(img, '_blank')} 
                                />
                           </div>
                       ))}
                   </div>
                </div>
             )}

             {/* Description */}
             <div>
                 <h4 className="font-bold text-sm mb-1 dark:text-gray-300">{t('description')}</h4>
                 <p className="text-gray-700 dark:text-gray-300">{issue.description}</p>
             </div>

             {/* Community Votes - Read Only for Admin */}
             <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                 <h4 className="font-bold text-sm dark:text-white text-gray-700">{t('citizenConfirmations')}</h4>
                 <div className="flex gap-4">
                     <span className="flex items-center gap-1.5 text-green-600 font-bold bg-white dark:bg-gray-800 px-3 py-1 rounded shadow-sm">
                         <ThumbsUp size={16} /> {issue.votes?.up || 0}
                     </span>
                     <span className="flex items-center gap-1.5 text-red-600 font-bold bg-white dark:bg-gray-800 px-3 py-1 rounded shadow-sm">
                         <ThumbsDown size={16} /> {issue.votes?.down || 0}
                     </span>
                 </div>
             </div>
             
             {/* Rejection Details */}
             {issue.status === IssueStatus.REJECTED && issue.rejectionReason && (
                 <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                     <h3 className="text-red-700 dark:text-red-400 font-bold text-sm mb-1 flex items-center gap-2"><Ban size={16}/> {t('rejected')}</h3>
                     <p className="text-red-600 dark:text-red-300">Reason: {issue.rejectionReason}</p>
                 </div>
             )}

             {/* Actions */}
             {!isResolving && !isRejecting ? (
                <div className="flex flex-col gap-2 shrink-0 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleStatusUpdate(issue.id, IssueStatus.PENDING)}
                            disabled={isLocked}
                            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all
                                ${issue.status === IssueStatus.PENDING 
                                    ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-500 ring-offset-2' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {t('pending')}
                        </button>
                        <button 
                            onClick={() => handleStatusUpdate(issue.id, IssueStatus.IN_PROGRESS)}
                            disabled={isLocked}
                            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all
                                ${issue.status === IssueStatus.IN_PROGRESS 
                                    ? 'bg-purple-100 text-purple-800 ring-2 ring-purple-500 ring-offset-2' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {t('inProgress')}
                        </button>
                        <button 
                            onClick={() => setIsResolving(true)}
                            disabled={issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.REJECTED}
                            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all
                                ${issue.status === IssueStatus.RESOLVED 
                                    ? 'bg-green-100 text-green-800 ring-2 ring-green-500 ring-offset-2' 
                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200'}
                                ${issue.status === IssueStatus.REJECTED ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {issue.status === IssueStatus.RESOLVED ? t('resolved') : t('markResolved')}
                        </button>
                    </div>
                    
                    {/* Reject Button */}
                    {!isLocked && (
                        <button 
                            onClick={() => setIsRejecting(true)}
                            className="w-full py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                        >
                            {t('rejectIssue')}
                        </button>
                    )}
                </div>
             ) : isResolving ? (
                // Resolve Form
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">{t('uploadEvidence')}</h4>
                    
                    {errorMsg && (
                         <div className="mb-3 p-2 bg-red-100 text-red-700 text-xs rounded flex items-center gap-2">
                             <AlertTriangle size={12} /> {errorMsg}
                         </div>
                    )}

                    {!resolutionFile ? (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-600 transition-colors">
                            <Camera className="text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Click to upload photo</span>
                            <input type="file" className="hidden" accept="image/*" onChange={onResolutionFileChange} />
                        </label>
                    ) : (
                        <div className="relative w-full h-32 bg-black rounded-lg overflow-hidden mb-4">
                            <img src={resolutionFile} className="w-full h-full object-contain" alt="Preview" />
                            <button 
                                onClick={() => setResolutionFile(null)}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full shadow-lg"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2 mt-4">
                        <button 
                            onClick={() => { setIsResolving(false); setResolutionFile(null); setErrorMsg(''); }}
                            className="flex-1 py-2 text-gray-600 text-sm hover:bg-gray-200 rounded"
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            onClick={confirmResolution}
                            disabled={loadingAction || !resolutionFile}
                            className="flex-1 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {loadingAction ? t('saving') : t('confirm')}
                        </button>
                    </div>
                </div>
             ) : (
                // Reject Form
                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900">
                    <h4 className="font-bold text-red-800 dark:text-red-300 mb-2">{t('rejectIssue')}</h4>
                    <p className="text-xs text-red-600 mb-2">{t('rejectReason')}</p>
                    
                    <select 
                        className="w-full p-2 rounded border border-red-300 mb-4 text-sm"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    >
                        <option value="Duplicate Issue">Duplicate Issue</option>
                        <option value="Wrong Location">Wrong Location</option>
                        <option value="Not a Civic Issue">Not a Civic Issue</option>
                        <option value="Spam / Fake Report">Spam / Fake Report</option>
                        <option value="Insufficient Info">Insufficient Information</option>
                    </select>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsRejecting(false)}
                            className="flex-1 py-2 text-gray-600 text-sm hover:bg-white rounded"
                        >
                            {t('cancel')}
                        </button>
                        <button 
                            onClick={confirmRejection}
                            disabled={loadingAction}
                            className="flex-1 py-2 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            {loadingAction ? t('processing') : t('rejectIssue')}
                        </button>
                    </div>
                </div>
             )}
             
             {/* Social Share Section */}
             <div className="pt-2">
                 <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t('shareReport')}</h4>
                 <ShareModal issue={issue} />
             </div>
          </div>
       </div>
    </div>
  )};

  if (view === 'overview') {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold dark:text-white">{t('dashboard')}: {t(user?.city || '')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-green-500 shadow-sm">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm text-gray-500">{t('totalReports')}</p>
                   <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full text-green-600"><AlertTriangle size={20} /></div>
             </div>
           </div>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-orange-500 shadow-sm">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm text-gray-500">{t('pending')}</p>
                   <p className="text-2xl font-bold dark:text-white">{stats.pending}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full text-orange-600"><Clock size={20} /></div>
             </div>
           </div>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-purple-500 shadow-sm">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm text-gray-500">{t('inProgress')}</p>
                   <p className="text-2xl font-bold dark:text-white">{stats.progress}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full text-purple-600"><Clock size={20} /></div>
             </div>
           </div>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-green-500 shadow-sm">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm text-gray-500">{t('resolved')}</p>
                   <p className="text-2xl font-bold dark:text-white">{stats.resolved}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full text-green-600"><CheckCircle size={20} /></div>
             </div>
           </div>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-red-500 shadow-sm">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm text-gray-500">{t('rejected')}</p>
                   <p className="text-2xl font-bold dark:text-white">{stats.rejected}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full text-red-600"><Ban size={20} /></div>
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold dark:text-white">{t('manageIssues')}</h1>
        
        {/* New Improved Toolbar UI */}
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
           
           {/* Segmented Control for Status */}
           <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
               {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map(s => (
                 <button 
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${statusFilter === s ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}
                 >
                   {s === 'ALL' ? t('ALL') : t(s)}
                 </button>
               ))}
           </div>
           
           <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>

           {/* Styled Select for Category */}
           <div className="relative">
                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="pl-9 pr-8 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-green-500 appearance-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                    <option value="ALL">{t('allCategories')}</option>
                    {ISSUE_CATEGORIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
                </select>
           </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredIssues.map(issue => {
          const displayImage = issue.imageUrls?.[0] || issue.imageUrl;
          
          return (
          <div key={issue.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col md:flex-row gap-4 relative hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedIssue(issue)}>
            
            {/* Evidence Image - Large Thumbnail */}
            <div className="w-full md:w-48 h-48 md:h-auto shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden relative group border border-gray-200 dark:border-gray-600">
                {displayImage ? (
                    <img 
                        src={displayImage} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        alt="Issue Evidence"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Camera size={32} />
                        <span className="text-xs mt-2 font-medium">No Evidence</span>
                    </div>
                )}
                {/* Overlay badge for multiple images */}
                {(issue.imageUrls?.length || 0) > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                        <Camera size={12} /> +{(issue.imageUrls?.length || 0) - 1}
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                 <div>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] uppercase font-bold rounded mb-2 tracking-wide border border-gray-200 dark:border-gray-600">
                        {t(issue.category)}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">{issue.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(issue.createdAt).toLocaleDateString()} • {new Date(issue.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                   issue.status === IssueStatus.RESOLVED ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : 
                   issue.status === IssueStatus.IN_PROGRESS ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' : 
                   issue.status === IssueStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' :
                   'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800'
                 }`}>
                   {t(issue.status)}
                 </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-1">
                  {issue.description}
              </p>
              
              {/* Footer Actions/Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
                  <div className="flex gap-3 text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded border border-gray-200 dark:border-gray-600"><ThumbsUp size={12} className="text-green-600"/> {issue.votes?.up || 0}</span>
                      <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded border border-gray-200 dark:border-gray-600"><ThumbsDown size={12} className="text-red-600"/> {issue.votes?.down || 0}</span>
                  </div>

                  <div className="flex items-center gap-2">
                       {/* Share Button (Small) */}
                       <button onClick={(e) => {
                           e.stopPropagation();
                           handleShare(issue);
                       }} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors" title={t('shareReport')}>
                           <Share2 size={16} />
                       </button>

                       <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedIssue(issue); }}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm shadow-green-200 dark:shadow-none"
                        >
                        {t('viewDetails')}
                        </button>
                  </div>
              </div>
            </div>
          </div>
        )})}
        
        {filteredIssues.length === 0 && (
          <div className="text-center py-12 text-gray-500">No issues found matching this filter.</div>
        )}
      </div>

      {selectedIssue && <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />}
    </div>
  );
};