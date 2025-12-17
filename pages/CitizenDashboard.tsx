import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { Issue, IssueStatus } from '../types';
import { createIssue, getIssuesByAuthor, getIssuesByCity, rateIssue, voteIssue } from '../services/storageService';
import { ISSUE_CATEGORIES, MOCK_CITIES } from '../constants';
import { MapPin, Send, Clock, CheckCircle, X, Image as ImageIcon, AlertTriangle, Crosshair, Star, MessageSquare, ThumbsUp, ThumbsDown, Share2, Ban, Copy, List, Map as MapIcon, Filter, AlertOctagon, Calendar, Camera, ArrowRight } from 'lucide-react';
import { useLang } from '../App';

// Define L for typescript if not available globally
declare const L: any;

interface Props {
  view: 'overview' | 'report' | 'community';
}

export const CitizenDashboard: React.FC<Props> = ({ view }) => {
  const { user } = useAuth();
  const { t } = useLang();
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [communityIssues, setCommunityIssues] = useState<Issue[]>([]);
  const [filteredCommunityIssues, setFilteredCommunityIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Community View State
  const [selectedDistrict, setSelectedDistrict] = useState(user?.city || MOCK_CITIES[0]);
  const [communityViewMode, setCommunityViewMode] = useState<'list' | 'map'>('list');
  
  // Filters
  const [communityFilter, setCommunityFilter] = useState<string>('ALL'); // Status Filter
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');   // Category Filter

  // Report Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(ISSUE_CATEGORIES[0]);
  const [address, setAddress] = useState(user?.address || '');
  const [targetDistrict, setTargetDistrict] = useState(user?.city || '');
  const [latLng, setLatLng] = useState<{lat: number, lng: number} | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Map Refs
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null); // Track single marker instance
  
  // Community Map Refs
  const communityMapRef = useRef<any>(null);
  const communityMapContainer = useRef<HTMLDivElement>(null);

  // Calculate Stats
  const stats = {
    total: myIssues.length,
    pending: myIssues.filter(i => i.status === IssueStatus.PENDING).length,
    progress: myIssues.filter(i => i.status === IssueStatus.IN_PROGRESS).length,
    resolved: myIssues.filter(i => i.status === IssueStatus.RESOLVED).length,
    rejected: myIssues.filter(i => i.status === IssueStatus.REJECTED).length,
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Load Community Issues when district changes
  useEffect(() => {
      if (view === 'community') {
          loadCommunityIssues(selectedDistrict);
      }
  }, [selectedDistrict, view]);

  // Apply filters to community issues
  useEffect(() => {
      let filtered = communityIssues;

      // Filter by Status
      if (communityFilter !== 'ALL') {
          filtered = filtered.filter(i => i.status === communityFilter);
      }

      // Filter by Category
      if (categoryFilter !== 'ALL') {
          filtered = filtered.filter(i => i.category === categoryFilter);
      }

      setFilteredCommunityIssues(filtered);
  }, [communityIssues, communityFilter, categoryFilter]);

  // Auto-hide logic
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // --- Helper: Reverse Geocoding & Auto District ---
  const fetchAddressAndDetectCity = async (lat: number, lng: number): Promise<string> => {
      try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.address) {
              const addr = data.address;
              const possibleNames = [addr.state_district, addr.county, addr.city, addr.town, addr.village].filter(Boolean);
              detectDistrictFromText(possibleNames.join(" "));
              return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          }
      } catch (e) {
          console.error("Geocoding error", e);
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // --- Fast District Detection from Text ---
  const detectDistrictFromText = (text: string) => {
      if (!text) return;
      // Fast check against constant list (English names)
      const lowerText = text.toLowerCase();
      const match = MOCK_CITIES.find(c => lowerText.includes(c.toLowerCase()));
      if (match) {
          setTargetDistrict(match); // Set the English Value
      }
  };

  const handleManualAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setAddress(val);
      detectDistrictFromText(val); // Detect as user types
  };

  // --- Leaflet Map: Report Page ---
  useEffect(() => {
      if (view === 'report' && mapContainerRef.current && !mapRef.current) {
          const initialLat = latLng ? latLng.lat : 11.1271; // Tamil Nadu Center
          const initialLng = latLng ? latLng.lng : 78.6569;
          
          const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 7);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // Click to Pin
          map.on('click', async (e: any) => {
              const { lat, lng } = e.latlng;
              setLatLng({ lat, lng });
              setAddress(t('fetchingAddress'));

              // Fix: Ensure only one marker exists using markerRef
              if (markerRef.current) {
                  map.removeLayer(markerRef.current);
              }
              const newMarker = L.marker([lat, lng]).addTo(map);
              markerRef.current = newMarker;
              
              // Fetch Full Address
              const fullAddress = await fetchAddressAndDetectCity(lat, lng);
              setAddress(fullAddress);
          });

          mapRef.current = map;
      }

      return () => {
          if (view !== 'report' && mapRef.current) {
              mapRef.current.remove();
              mapRef.current = null;
              markerRef.current = null;
          }
      };
  }, [view]);

  // --- Leaflet Map: Community Page ---
  useEffect(() => {
    if (view === 'community' && communityMapContainer.current && !communityMapRef.current) {
        const map = L.map(communityMapContainer.current).setView([11.1271, 78.6569], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        communityMapRef.current = map;
    }

    if (view === 'community' && communityViewMode === 'map' && communityMapRef.current) {
        setTimeout(() => {
            communityMapRef.current.invalidateSize();
        }, 100);
    }

    if (view === 'community' && communityMapRef.current) {
        communityMapRef.current.eachLayer((layer: any) => {
            if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
                communityMapRef.current.removeLayer(layer);
            }
        });

        const getStatusColorCode = (status: IssueStatus) => {
            switch (status) {
              case IssueStatus.RESOLVED: return '#16a34a'; // Green
              case IssueStatus.IN_PROGRESS: return '#9333ea'; // Purple
              case IssueStatus.REJECTED: return '#dc2626'; // Red
              default: return '#f97316'; // Orange
            }
        };

        const markers: any[] = [];

        filteredCommunityIssues.forEach(issue => {
            if (issue.latitude && issue.longitude) {
                const color = getStatusColorCode(issue.status);
                const circle = L.circleMarker([issue.latitude, issue.longitude], {
                    radius: 10,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(communityMapRef.current);
                
                circle.bindPopup(`
                    <div class="p-1">
                        <b class="text-sm font-bold block mb-1">${issue.title}</b>
                        <span class="text-xs px-2 py-0.5 rounded text-white" style="background:${color}">${t(issue.status)}</span>
                        <p class="text-xs mt-1 truncate max-w-[150px]">${issue.address}</p>
                    </div>
                `);
                circle.on('click', () => setSelectedIssue(issue));
                markers.push(circle);
            }
        });

        if (markers.length > 0) {
            const group = new L.featureGroup(markers);
            communityMapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }

     return () => {
          if (view !== 'community' && communityMapRef.current) {
              communityMapRef.current.remove();
              communityMapRef.current = null;
          }
      };
  }, [view, filteredCommunityIssues, communityViewMode]);


  const loadData = async () => {
    if (user) {
        const my = await getIssuesByAuthor(user.id);
        setMyIssues(my);
    }
  };

  const loadCommunityIssues = async (city: string) => {
      const issues = await getIssuesByCity(city);
      setCommunityIssues(issues);
      setFilteredCommunityIssues(issues);
  };

  // --- Local State Update Handler ---
  // This ensures changes (like ratings/comments) are reflected in the list immediately
  const handleIssueUpdate = (updatedIssue: Issue) => {
      // Update My Issues List
      setMyIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));
      
      // Update Community Lists
      setCommunityIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));
      setFilteredCommunityIssues(prev => prev.map(i => i.id === updatedIssue.id ? updatedIssue : i));
      
      // Update Selected Issue View if it matches
      if (selectedIssue && selectedIssue.id === updatedIssue.id) {
          setSelectedIssue(updatedIssue);
      }
  };

  // --- Voting Handler for Card & Modal ---
  const handleCardVote = async (e: React.MouseEvent, issue: Issue, isAccurate: boolean) => {
      e.stopPropagation(); // Prevent opening modal
      if (!user) return;
      
      // Restriction: Author cannot vote on their own issue
      if (issue.authorId === user.id) {
          alert("You cannot confirm your own report.");
          return;
      }

      if (issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.REJECTED) return;
      
      try {
          // Backend Call
          await voteIssue(issue.id, user.id, isAccurate);
          
          // Optimistic UI Update Logic
          const updateVotes = (i: Issue) => {
              const votes = i.votes || { up: 0, down: 0, votedUserIds: [], userVotes: {} };
              if (!votes.userVotes) votes.userVotes = {};
              
              const voteType = isAccurate ? 'up' : 'down';
              const previousVote = votes.userVotes[user.id];

              let newUp = votes.up;
              let newDown = votes.down;
              let newVotedIds = [...votes.votedUserIds];
              const newUserVotes = { ...votes.userVotes };

              if (previousVote === voteType) {
                  // Toggle Off (Remove vote)
                  delete newUserVotes[user.id];
                  newVotedIds = newVotedIds.filter(id => id !== user.id);
                  if (voteType === 'up') newUp = Math.max(0, newUp - 1);
                  else newDown = Math.max(0, newDown - 1);
              } else {
                  // Switch or New Vote
                  if (previousVote) {
                      // Switch: remove old count
                      if (previousVote === 'up') newUp = Math.max(0, newUp - 1);
                      else newDown = Math.max(0, newDown - 1);
                  } else {
                      // New: add ID
                      newVotedIds.push(user.id);
                  }
                  
                  // Add new count
                  if (voteType === 'up') newUp++;
                  else newDown++;
                  newUserVotes[user.id] = voteType;
              }

              return {
                  ...votes,
                  up: newUp,
                  down: newDown,
                  votedUserIds: newVotedIds,
                  userVotes: newUserVotes
              };
          };

          const applyUpdates = (list: Issue[]) => list.map(i => i.id === issue.id ? { ...i, votes: updateVotes(i) } : i);

          setCommunityIssues(prev => applyUpdates(prev));
          setFilteredCommunityIssues(prev => applyUpdates(prev));
          setMyIssues(prev => applyUpdates(prev));
          
          if (selectedIssue && selectedIssue.id === issue.id) {
              setSelectedIssue({ ...selectedIssue, votes: updateVotes(selectedIssue) });
          }
      } catch (err) {
          console.error("Voting failed", err);
      }
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setErrorMsg('');
    if (files && files.length > 0) {
      if (files.length + images.length > 5) {
          setErrorMsg("You can only upload a maximum of 5 photos.");
          return;
      }
      try {
        for (let i = 0; i < files.length; i++) {
          const base64 = await compressImage(files[i]);
          setImages(prev => [...prev, base64]);
        }
      } catch (err) {
        setErrorMsg('Error processing images.');
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatLng({ lat, lng });
          
          setAddress(t('fetchingAddress'));
          const fullAddr = await fetchAddressAndDetectCity(lat, lng);
          setAddress(fullAddr);
          
          if (mapRef.current) {
              mapRef.current.setView([lat, lng], 15);
              // Fix: Remove old marker before adding new one
              if (markerRef.current) {
                  mapRef.current.removeLayer(markerRef.current);
              }
              const newMarker = L.marker([lat, lng]).addTo(mapRef.current);
              markerRef.current = newMarker;
          }

          setLoading(false);
          setSuccessMsg(t('confirmLocation'));
        },
        (error) => {
          setErrorMsg("Unable to retrieve location.");
          setLoading(false);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) return;
    if (!targetDistrict) {
        setErrorMsg("Please enter/select the district where this issue is located.");
        return;
    }
    if (!address.trim()) {
        setErrorMsg("Address or Location is required. Please pin on map or enter address.");
        return;
    }
    
    setLoading(true);
    try {
      await createIssue({
        title,
        description,
        category,
        address,
        latitude: latLng?.lat,
        longitude: latLng?.lng,
        city: targetDistrict, 
        authorId: user.id,
        authorName: user.name,
        status: IssueStatus.PENDING,
        imageUrls: images
      });

      setSuccessMsg('Issue reported successfully!');
      setTitle('');
      setDescription('');
      setAddress('');
      setLatLng(null);
      setImages([]);
      
      loadData();
    } catch (err: any) {
        setErrorMsg(err.message || 'Failed to submit report.');
    } finally {
        setLoading(false);
    }
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case IssueStatus.RESOLVED: return 'text-green-800 bg-green-100';
      case IssueStatus.IN_PROGRESS: return 'text-purple-800 bg-purple-100';
      case IssueStatus.REJECTED: return 'text-red-800 bg-red-100';
      default: return 'text-orange-800 bg-orange-100';
    }
  };

  // UPDATED SHARE FORMAT
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

  const ShareButtons = ({ issue }: { issue: Issue }) => {
    return (
        <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
             <button onClick={() => handleShare(issue)} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-bold hover:bg-green-700 shadow transition-colors">
                 <Share2 size={16} /> {t('shareReport')}
             </button>
        </div>
    );
  };

  const IssueDetailModal = ({ issue, onClose, onUpdate }: { issue: Issue, onClose: () => void, onUpdate: (i: Issue) => void }) => {
    const { user } = useAuth();
    const isAuthor = user?.id === issue.authorId;
    
    const [userRating, setUserRating] = useState(issue.rating || 0);
    const [comment, setComment] = useState(issue.ratingComment || '');
    const [isRatingSubmitted, setIsRatingSubmitted] = useState(!!issue.rating);
    
    const allImages = [...(issue.imageUrls || []), ...(issue.imageUrl ? [issue.imageUrl] : [])];
    const uniqueImages = Array.from(new Set(allImages));

    // Get current user's vote state
    const currentVote = issue.votes?.userVotes?.[user?.id || ''];
    const isResolvedOrRejected = issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.REJECTED;

    const handleSubmitRating = async () => {
        if (!isAuthor) return;
        await rateIssue(issue.id, userRating, comment);
        setIsRatingSubmitted(true);
        
        // IMPORTANT: Trigger update to parent component so list view and local state are synced
        const updatedIssue = { ...issue, rating: userRating, ratingComment: comment };
        onUpdate(updatedIssue);
    };

    return (
    // Z-Index z-[9999] ensures modal is on top of everything
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
       <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start sticky top-0 bg-white dark:bg-gray-800 z-10 shrink-0">
              <div>
                  <h2 className="text-2xl font-bold dark:text-white pr-4">{issue.title}</h2>
                  <div className="flex gap-2 mt-2">
                     <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(issue.status)}`}>{t(issue.status)}</span>
                     <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600">{t(issue.category)}</span>
                  </div>
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <X size={20} className="text-gray-500" />
                </button>
              </div>
          </div>
          
          <div className="p-6 space-y-6 overflow-y-auto">
             
             {/* Layout: Map and Details side-by-side on large screens */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Left Column: Location & Map */}
                 <div>
                     {issue.latitude && issue.longitude ? (
                         <div className="h-64 w-full rounded-xl overflow-hidden bg-gray-100 relative shrink-0 border border-gray-200 dark:border-gray-700">
                             <iframe
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                style={{ border: 0 }}
                                src={`https://maps.google.com/maps?q=${issue.latitude},${issue.longitude}&z=15&output=embed`}
                                allowFullScreen
                              ></iframe>
                         </div>
                     ) : <div className="text-gray-400 text-sm italic h-64 flex items-center justify-center bg-gray-100 rounded-xl">No map location provided</div>}
                     
                     <div className="mt-3">
                         <h4 className="font-bold text-sm mb-1 dark:text-gray-300">{t('address')}</h4>
                         <p className="text-sm text-gray-500 dark:text-gray-400">{issue.address}</p>
                     </div>
                 </div>

                 {/* Right Column: Details & Images */}
                 <div className="space-y-4">
                     <div className="flex items-center gap-2 text-gray-500 text-sm">
                         <Calendar size={16} /> Reported on: {new Date(issue.createdAt).toLocaleDateString()}
                     </div>

                     {/* Rejection Msg */}
                     {issue.status === IssueStatus.REJECTED && (
                         <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex gap-2 items-center text-red-800 dark:text-red-300">
                             <Ban size={20} />
                             <div>
                                 <span className="font-bold">Issue Rejected:</span> {issue.rejectionReason}
                             </div>
                         </div>
                     )}

                     <div>
                         <h4 className="font-bold text-sm mb-1 dark:text-gray-300">{t('description')}</h4>
                         <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{issue.description}</p>
                     </div>

                     {/* Evidence */}
                     {uniqueImages.length > 0 && (
                        <div>
                            <h4 className="font-bold text-sm mb-2 dark:text-gray-300">{t('evidence')}</h4>
                            <div className="grid grid-cols-3 gap-2">
                            {uniqueImages.map((img, idx) => (
                                <img key={idx} src={img} className="rounded-lg h-24 w-full object-cover cursor-pointer hover:opacity-90 border border-gray-100 dark:border-gray-700" onClick={() => window.open(img)} />
                            ))}
                            </div>
                        </div>
                     )}
                 </div>
             </div>
             
             <ShareButtons issue={issue} />

             {/* Voting / Citizen Confirmation */}
             {!isResolvedOrRejected && (
                 <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                     <div className="flex items-center justify-between mb-3">
                         <h4 className="font-bold text-sm dark:text-white flex items-center gap-2">
                             <CheckCircle size={16} className="text-blue-600"/>
                             {t('citizenConfirmations')}
                         </h4>
                         <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                             {issue.votes?.up || 0} {t('confirmedBy')} {t('people')}
                         </span>
                     </div>

                     {isAuthor ? (
                         <div className="p-3 text-center text-sm text-gray-500 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                             You cannot verify your own report. Waiting for community confirmation.
                         </div>
                     ) : (
                         <div className="flex flex-col sm:flex-row gap-3">
                             <button 
                                onClick={(e) => handleCardVote(e, issue, true)} 
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all font-bold text-sm shadow-sm active:scale-95 transform
                                    ${currentVote === 'up' 
                                        ? 'bg-green-600 text-white border-green-600' 
                                        : 'text-green-700 bg-white dark:bg-gray-800 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/30'
                                    }
                                `}
                            >
                                 <ThumbsUp size={18}/> {t('confirmIssue')} ({issue.votes?.up || 0})
                             </button>
                             <button 
                                onClick={(e) => handleCardVote(e, issue, false)} 
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all font-medium text-sm shadow-sm active:scale-95 transform
                                    ${currentVote === 'down'
                                        ? 'bg-red-600 text-white border-red-600'
                                        : 'text-red-600 bg-white dark:bg-gray-800 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/30'
                                    }
                                `}
                            >
                                 <ThumbsDown size={18}/> {t('flagIssue')} ({issue.votes?.down || 0})
                             </button>
                         </div>
                     )}
                 </div>
             )}

             {/* Resolution & Rating */}
             {issue.status === IssueStatus.RESOLVED && (
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800">
                   <h3 className="font-bold text-green-800 dark:text-green-300 text-sm mb-2 flex items-center gap-2">
                       <CheckCircle size={16}/> {t('resolutionProof')}
                   </h3>
                   
                   {issue.resolutionImageUrl ? (
                        <img src={issue.resolutionImageUrl} className="w-full rounded-lg mb-4 object-cover max-h-64" />
                   ) : (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 mb-4 text-center text-gray-500 text-sm italic">
                           Resolution marked by admin. No photo provided.
                        </div>
                   )}
                   
                   <div className="border-t border-green-200 dark:border-green-800 pt-4">
                      <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-2">
                          {isAuthor ? t('rateResolution') : "Public Rating"}
                      </h4>
                      
                      <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                             <Star 
                                key={star} 
                                size={28} 
                                fill={(userRating) >= star ? '#FBBF24' : 'none'} 
                                color={(userRating) >= star ? '#FBBF24' : '#9CA3AF'} 
                                onClick={() => isAuthor && setUserRating(star)} 
                                className={`transition-transform ${isAuthor ? 'cursor-pointer hover:scale-110' : ''}`} 
                             />
                          ))}
                      </div>
                      
                      {isAuthor && (
                          <div className="mt-4 flex flex-col gap-2">
                             <textarea 
                                value={comment} 
                                onChange={e => setComment(e.target.value)} 
                                className="w-full p-3 text-sm border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                                placeholder="How satisfied are you with the resolution?"
                                rows={2}
                             />
                             <button 
                                onClick={handleSubmitRating} 
                                disabled={userRating === 0} 
                                className="self-end bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                            >
                                {isRatingSubmitted ? t('update') : t('submit')} Feedback
                            </button>
                          </div>
                      )}
                      
                      {(isRatingSubmitted || (!isAuthor && issue.rating)) && (
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-100 dark:border-gray-700 mt-2">
                              <p className="text-sm italic text-gray-600 dark:text-gray-400">
                                  "{comment || t('noComment')}"
                              </p>
                          </div>
                      )}
                   </div>
                </div>
             )}
          </div>
       </div>
    </div>
  )};

  // Main Render Logic Refactored to allow Modal to be reachable
  const renderContent = () => {
    if (view === 'overview') {
      return (
        <div className="space-y-8">
          {/* Updated Welcome Section */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
              <h1 className="text-3xl font-bold mb-2">{t('welcome')}, {user?.name}!</h1>
              <p className="opacity-90 text-lg">
                  Connected to <span className="font-bold underline decoration-2 underline-offset-2">{t(user?.city || '') || user?.city}</span>. 
                  Report local issues and help us build a cleaner, safer community together.
              </p>
          </div>
          
          {/* Horizontal Stats Strip */}
          <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto">
              <div className="flex items-center gap-3 px-4 min-w-[140px]">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
                      <AlertTriangle size={18} />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">{t('totalReports')}</p>
                      <p className="text-xl font-bold dark:text-white">{stats.total}</p>
                  </div>
              </div>
              
              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

              <div className="flex items-center gap-3 px-4 min-w-[140px]">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600">
                      <Clock size={18} />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">{t('pending')}</p>
                      <p className="text-xl font-bold dark:text-white">{stats.pending}</p>
                  </div>
              </div>

              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

              <div className="flex items-center gap-3 px-4 min-w-[140px]">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600">
                      <AlertOctagon size={18} />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">{t('inProgress')}</p>
                      <p className="text-xl font-bold dark:text-white">{stats.progress}</p>
                  </div>
              </div>

              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

              <div className="flex items-center gap-3 px-4 min-w-[140px]">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
                      <CheckCircle size={18} />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">{t('resolved')}</p>
                      <p className="text-xl font-bold dark:text-white">{stats.resolved}</p>
                  </div>
              </div>

              <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

              <div className="flex items-center gap-3 px-4 min-w-[140px]">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
                      <Ban size={18} />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">{t('rejected')}</p>
                      <p className="text-xl font-bold dark:text-white">{stats.rejected}</p>
                  </div>
              </div>
          </div>

          {/* My Recent Reports (Consistent Style) */}
          <div>
            <h2 className="text-xl font-bold dark:text-white mb-4">{t('myReports')}</h2>
            <div className="grid gap-4">
              {myIssues.length === 0 ? (
                  <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                      <p className="text-gray-500">You haven't reported any issues yet.</p>
                  </div>
              ) : (
                myIssues.map(issue => (
                  <div key={issue.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 cursor-pointer hover:border-green-200 transition-colors" onClick={() => setSelectedIssue(issue)}>
                    <div className="flex items-start gap-4 flex-1">
                          {issue.imageUrls?.[0] ? (
                              <img src={issue.imageUrls[0]} className="w-16 h-16 rounded-lg object-cover border border-gray-100" />
                          ) : (
                              <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                  <ImageIcon size={24} className="text-gray-400" />
                              </div>
                          )}
                          <div>
                              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {issue.title}
                                {issue.rating && (
                                    <span className="flex items-center gap-1 text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-100">
                                        <Star size={10} fill="currentColor" /> {issue.rating}
                                    </span>
                                )}
                              </h4>
                              <p className="text-sm text-gray-500 line-clamp-1">{issue.description}</p>
                              <div className="flex gap-2 mt-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusColor(issue.status)}`}>
                                      {t(issue.status)}
                                  </span>
                                  <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded">{t(issue.category)}</span>
                              </div>
                          </div>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-2">
                        <div className="flex gap-3 text-xs text-gray-500">
                            <span className={`flex items-center gap-1 ${issue.votes?.userVotes?.[user?.id || ''] === 'up' ? 'text-green-600 font-bold' : ''}`}>
                                <ThumbsUp size={14} className={issue.votes?.userVotes?.[user?.id || ''] === 'up' ? "fill-green-600 text-green-600" : ""}/> 
                                {issue.votes?.up || 0}
                            </span>
                            <span className={`flex items-center gap-1 ${issue.votes?.userVotes?.[user?.id || ''] === 'down' ? 'text-red-600 font-bold' : ''}`}>
                                <ThumbsDown size={14} className={issue.votes?.userVotes?.[user?.id || ''] === 'down' ? "fill-red-600 text-red-600" : ""}/> 
                                {issue.votes?.down || 0}
                            </span>
                        </div>
                        
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedIssue(issue); }}
                            className="text-xs text-green-600 font-bold flex items-center gap-1 hover:underline"
                          >
                            {t('viewDetails')} <ArrowRight size={12} />
                        </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // ... (rest of the file remains same, report and community views)
    
    if (view === 'report') {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                  <h1 className="text-2xl font-bold dark:text-white">{t('reportNew')}</h1>
                  
                  {errorMsg && <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2"><AlertTriangle size={18}/> {errorMsg}</div>}
                  {successMsg && <div className="p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2"><CheckCircle size={18}/> {successMsg}</div>}

                  <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                      {/* ... fields ... */}
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('title')}</label>
                              <input 
                                  value={title} onChange={e => setTitle(e.target.value)} required 
                                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                  placeholder={t('issueTitlePlaceholder')}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('category')}</label>
                              <select 
                                  value={category} onChange={e => setCategory(e.target.value)}
                                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              >
                                  {ISSUE_CATEGORIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
                              <textarea 
                                  value={description} onChange={e => setDescription(e.target.value)} required rows={4}
                                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('pinLocation')}</label>
                          <div className="relative h-64 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                              <div ref={mapContainerRef} className="w-full h-full z-0" />
                              <button type="button" onClick={handleGetCurrentLocation} className="absolute top-2 right-2 z-10 bg-white dark:bg-gray-700 p-2 rounded shadow hover:bg-gray-100">
                                  <Crosshair size={20} className="text-green-600" />
                              </button>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('address')}</label>
                                  <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700">
                                      <MapPin size={16} className="text-gray-400 shrink-0"/>
                                      <input 
                                          value={address} 
                                          onChange={handleManualAddressChange}
                                          placeholder="Enter address..."
                                          className="w-full bg-transparent outline-none text-sm dark:text-white"
                                      />
                                  </div>
                              </div>
                              
                              <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">{t('district')}</label>
                                  <div className="relative">
                                      {/* Replaced input list with strict Select dropdown */}
                                      <select 
                                          value={targetDistrict} 
                                          onChange={(e) => setTargetDistrict(e.target.value)}
                                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-sm dark:text-white appearance-none"
                                      >
                                          <option value="">{t('selectDistrict')}</option>
                                          {MOCK_CITIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
                                      </select>
                                      <div className="absolute right-3 top-3 pointer-events-none">
                                          {targetDistrict ? (
                                              <CheckCircle size={14} className="text-green-500" />
                                          ) : (
                                              <ArrowRight size={14} className="text-gray-400 rotate-90" />
                                          )}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('photos')}</label>
                          <div className="flex flex-wrap items-center gap-4">
                              <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                  <ImageIcon size={24} className="text-gray-400"/>
                                  <span className="text-xs text-gray-400 mt-1">Gallery</span>
                                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                              </label>

                              <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-gray-50 dark:bg-gray-800">
                                  <Camera size={24} className="text-green-600"/>
                                  <span className="text-xs text-green-600 mt-1 font-bold">Camera</span>
                                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                              </label>

                              {images.map((img, i) => (
                                  <div key={i} className="relative w-24 h-24">
                                      <img src={img} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                                      <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm">
                                          <X size={12}/>
                                      </button>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                          {loading ? t('processing') : t('submitReport')}
                      </button>
                  </form>
            </div>
        )
    }

    if (view === 'community') {
        return (
            <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                      <h1 className="text-2xl font-bold dark:text-white">{t('communityIssues')}</h1>
                      <div className="flex flex-wrap items-center gap-3">
                          <select 
                              value={selectedDistrict} 
                              onChange={(e) => setSelectedDistrict(e.target.value)}
                              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                          >
                              {MOCK_CITIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
                          </select>
                          
                          {/* Category Filter */}
                          <select 
                              value={categoryFilter}
                              onChange={(e) => setCategoryFilter(e.target.value)}
                              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                          >
                              <option value="ALL">{t('allCategories')}</option>
                              {ISSUE_CATEGORIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
                          </select>

                          <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                              <button onClick={() => setCommunityViewMode('list')} className={`p-2 rounded ${communityViewMode === 'list' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}><List size={20}/></button>
                              <button onClick={() => setCommunityViewMode('map')} className={`p-2 rounded ${communityViewMode === 'map' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}><MapIcon size={20}/></button>
                          </div>
                      </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0">
                      {['ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].map(s => (
                          <button 
                              key={s} 
                              onClick={() => setCommunityFilter(s)}
                              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                                  communityFilter === s 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                              }`}
                          >
                              {s === 'ALL' ? t('ALL') : t(s)}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 min-h-0 relative">
                      {communityViewMode === 'list' ? (
                          <div className="h-full overflow-y-auto space-y-4 pr-2">
                              {filteredCommunityIssues.map(issue => (
                                  <div key={issue.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 cursor-pointer hover:border-green-200 transition-colors" onClick={() => setSelectedIssue(issue)}>
                                      <div className="w-24 h-24 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                          {issue.imageUrls?.[0] ? (
                                              <img src={issue.imageUrls[0]} className="w-full h-full object-cover" />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon size={24}/></div>
                                          )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-start">
                                              <div>
                                                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{issue.title}</h3>
                                                  <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{t(issue.category)}</span>
                                              </div>
                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusColor(issue.status)}`}>{t(issue.status)}</span>
                                          </div>
                                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{issue.description}</p>
                                          <div className="flex items-center gap-4 mt-3">
                                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                                  <Clock size={12}/> {new Date(issue.createdAt).toLocaleDateString()}
                                              </div>
                                              {/* Clickable Action Icons */}
                                              <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                                                  <button 
                                                      type="button"
                                                      onClick={(e) => handleCardVote(e, issue, true)} 
                                                      className={`flex items-center gap-1 transition-colors active:scale-110 
                                                      ${issue.votes?.userVotes?.[user?.id || ''] === 'up' ? 'text-green-600 font-bold' : 'hover:text-green-600'}
                                                      ${issue.authorId === user?.id ? 'opacity-50 cursor-not-allowed hover:text-gray-500' : ''}
                                                      `}
                                                  >
                                                      <ThumbsUp size={14} className={issue.votes?.userVotes?.[user?.id || ''] === 'up' ? "fill-green-600" : ""} /> 
                                                      {issue.votes?.up || 0}
                                                  </button>
                                                  <button 
                                                      type="button"
                                                      onClick={(e) => handleCardVote(e, issue, false)} 
                                                      className={`flex items-center gap-1 transition-colors active:scale-110 
                                                      ${issue.votes?.userVotes?.[user?.id || ''] === 'down' ? 'text-red-600 font-bold' : 'hover:text-red-600'}
                                                      ${issue.authorId === user?.id ? 'opacity-50 cursor-not-allowed hover:text-gray-500' : ''}
                                                      `}
                                                  >
                                                      <ThumbsDown size={14} className={issue.votes?.userVotes?.[user?.id || ''] === 'down' ? "fill-red-600" : ""} /> 
                                                      {issue.votes?.down || 0}
                                                  </button>
                                              </div>
                                              
                                              <button 
                                                  type="button"
                                                  onClick={(e) => { e.stopPropagation(); setSelectedIssue(issue); }}
                                                  className="ml-auto text-xs text-green-600 font-bold flex items-center gap-1 hover:underline"
                                              >
                                                  {t('viewDetails')} <ArrowRight size={12} />
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                              {filteredCommunityIssues.length === 0 && (
                                  <div className="text-center py-20 text-gray-500">No issues found matching filters.</div>
                              )}
                          </div>
                      ) : (
                          <div className="h-full w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 relative">
                              <div ref={communityMapContainer} className="w-full h-full z-0"/>
                              <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 p-2 rounded shadow text-xs space-y-1 z-[400]">
                                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Pending</div>
                                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-600"></div> In Progress</div>
                                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600"></div> Resolved</div>
                              </div>
                          </div>
                      )}
                  </div>
            </div>
        )
    }

    return null;
  }

  return (
    <>
        {renderContent()}
        {selectedIssue && <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} onUpdate={handleIssueUpdate} />}
    </>
  );
};