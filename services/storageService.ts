import { User, Issue, IssueStatus, UserRole } from '../types';

// Storage Keys
const KEYS = {
  USERS: 'citylink_users',
  ISSUES: 'citylink_issues',
  CURRENT_USER: 'citylink_current_user',
  OTP: 'citylink_otp_temp'
};

// Simulate network delay for realistic UI behavior
const delay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms));

// --- Helper Functions ---

const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem(KEYS.USERS);
  let users: User[] = stored ? JSON.parse(stored) : [];

  // Seed Super Admin if not exists
  if (!users.find(u => u.role === UserRole.SUPER_ADMIN)) {
    const superAdmin: User = {
      id: "SA-998877", // Fixed ID as per constants
      name: "System Super Admin",
      email: "admin@citylink.com",
      role: UserRole.SUPER_ADMIN,
      password: "admin123", // Plain text for local demo
      createdAt: Date.now(),
      country: 'India'
    };
    users.push(superAdmin);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }
  return users;
};

const getStoredIssues = (): Issue[] => {
  const stored = localStorage.getItem(KEYS.ISSUES);
  let issues: Issue[] = stored ? JSON.parse(stored) : [];
  
  // Data Normalization
  issues = issues.map(issue => ({
    ...issue,
    imageUrls: issue.imageUrls || (issue.imageUrl ? [issue.imageUrl] : []),
    votes: issue.votes || { up: 0, down: 0, votedUserIds: [], userVotes: {} }
  }));
  
  return issues;
};

const saveUsers = (users: User[]) => {
  try {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error("Storage Error", e);
    throw new Error("Storage full! Cannot save user data.");
  }
};

const saveIssues = (issues: Issue[]) => {
  try {
    localStorage.setItem(KEYS.ISSUES, JSON.stringify(issues));
  } catch (e) {
    console.error("Storage Error", e);
    throw new Error("Storage full! Cannot save issue data.");
  }
};

// --- Auth Services ---

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  await delay();
  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (user) {
    // Remove password from returned object
    const { password, ...safeUser } = user;
    return safeUser as User;
  }
  return null;
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
  await delay();
  const users = getStoredUsers();
  
  if (users.find(u => u.email.toLowerCase() === userData.email?.toLowerCase())) {
    throw new Error("Email already registered.");
  }

  const newUser: User = {
    id: userData.id || crypto.randomUUID(),
    name: userData.name || '',
    email: userData.email || '',
    password: userData.password || '',
    role: userData.role || UserRole.CITIZEN,
    city: userData.city,
    state: userData.state,
    address: userData.address,
    country: userData.country || 'India',
    createdAt: Date.now()
  };

  users.push(newUser);
  saveUsers(users);
  
  const { password, ...safeUser } = newUser;
  return safeUser as User;
};

export const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
  await delay();
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) throw new Error("User not found");
  
  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  saveUsers(users);
  
  const { password, ...safeUser } = updatedUser;
  return safeUser as User;
};

export const deleteUser = async (id: string): Promise<boolean> => {
    await delay();
    const users = getStoredUsers();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    saveUsers(filtered);
    return true;
};

// --- OTP Services (Simulation) ---

export const sendOtpToEmail = async (email: string, isRegistration = false): Promise<string> => {
  await delay(1000);
  const users = getStoredUsers();
  
  // If forgot password flow, check if user exists
  if (!isRegistration) {
      const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!exists) throw new Error("Email not found.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  localStorage.setItem(`${KEYS.OTP}_${email}`, JSON.stringify({ code: otp, expires: Date.now() + 300000 })); // 5 min
  return otp;
};

export const verifyOtp = async (email: string, code: string): Promise<boolean> => {
  await delay(500);
  const stored = localStorage.getItem(`${KEYS.OTP}_${email}`);
  if (!stored) return false;
  
  const { code: storedCode, expires } = JSON.parse(stored);
  if (Date.now() > expires) return false;
  
  if (storedCode === code) {
      localStorage.removeItem(`${KEYS.OTP}_${email}`);
      return true;
  }
  return false;
};

export const resetUserPassword = async (email: string, newPass: string): Promise<boolean> => {
    await delay();
    const users = getStoredUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (index === -1) return false;
    
    users[index].password = newPass;
    saveUsers(users);
    return true;
};

// --- Issue Services ---

export const getAllIssues = async (): Promise<Issue[]> => {
    await delay(500);
    return getStoredIssues();
};

export const createIssue = async (issueData: Partial<Issue>): Promise<Issue> => {
  await delay();
  const issues = getStoredIssues();
  
  const newIssue: Issue = {
    id: crypto.randomUUID(),
    title: issueData.title || '',
    description: issueData.description || '',
    category: issueData.category || 'Other',
    status: IssueStatus.PENDING,
    latitude: issueData.latitude,
    longitude: issueData.longitude,
    address: issueData.address || '',
    imageUrls: issueData.imageUrls || [],
    authorId: issueData.authorId || '',
    authorName: issueData.authorName || 'Anonymous',
    city: issueData.city || '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    votes: { up: 0, down: 0, votedUserIds: [], userVotes: {} }
  };

  issues.unshift(newIssue); // Add to top
  saveIssues(issues);
  return newIssue;
};

export const getIssuesByCity = async (city: string): Promise<Issue[]> => {
  await delay();
  const issues = getStoredIssues();
  return issues.filter(i => i.city.toLowerCase() === city.toLowerCase());
};

export const getIssuesByAuthor = async (authorId: string): Promise<Issue[]> => {
  await delay();
  const issues = getStoredIssues();
  return issues.filter(i => i.authorId === authorId);
};

export const updateIssueStatus = async (id: string, status: IssueStatus, resolutionImage?: string, rejectionReason?: string): Promise<Issue> => {
  await delay();
  const issues = getStoredIssues();
  const index = issues.findIndex(i => i.id === id);
  
  if (index === -1) throw new Error("Issue not found");
  
  issues[index].status = status;
  issues[index].updatedAt = Date.now();
  
  if (status === IssueStatus.RESOLVED && resolutionImage) {
      issues[index].resolutionImageUrl = resolutionImage;
      issues[index].resolutionDate = Date.now();
  }
  
  if (status === IssueStatus.REJECTED && rejectionReason) {
      issues[index].rejectionReason = rejectionReason;
  }

  saveIssues(issues);
  return issues[index];
};

export const rateIssue = async (id: string, rating: number, comment: string): Promise<void> => {
    await delay();
    const issues = getStoredIssues();
    const index = issues.findIndex(i => i.id === id);
    if (index !== -1) {
        issues[index].rating = rating;
        issues[index].ratingComment = comment;
        saveIssues(issues);
    }
};

export const voteIssue = async (issueId: string, userId: string, isUpvote: boolean): Promise<Issue> => {
    await delay(300); // Faster
    const issues = getStoredIssues();
    const index = issues.findIndex(i => i.id === issueId);
    
    if (index === -1) throw new Error("Issue not found");
    
    const issue = issues[index];
    if (!issue.votes) {
        issue.votes = { up: 0, down: 0, votedUserIds: [], userVotes: {} };
    }
    
    const voteType = isUpvote ? 'up' : 'down';
    const previousVote = issue.votes.userVotes?.[userId];
    
    // Logic: 
    // If clicking same vote -> Toggle Off
    // If clicking different vote -> Switch
    // If new -> Add
    
    let newUp = issue.votes.up;
    let newDown = issue.votes.down;
    const newUserVotes = { ...(issue.votes.userVotes || {}) };
    let newVotedIds = [...(issue.votes.votedUserIds || [])];

    if (previousVote === voteType) {
        // Toggle Off
        delete newUserVotes[userId];
        newVotedIds = newVotedIds.filter(id => id !== userId);
        if (voteType === 'up') newUp = Math.max(0, newUp - 1);
        else newDown = Math.max(0, newDown - 1);
    } else {
        // Switch or New
        if (previousVote) {
             // Switch: Remove old
             if (previousVote === 'up') newUp = Math.max(0, newUp - 1);
             else newDown = Math.max(0, newDown - 1);
        } else {
             // New
             newVotedIds.push(userId);
        }
        
        // Add new
        newUserVotes[userId] = voteType;
        if (voteType === 'up') newUp++;
        else newDown++;
    }

    issue.votes = {
        up: newUp,
        down: newDown,
        votedUserIds: newVotedIds,
        userVotes: newUserVotes
    };
    
    issues[index] = issue;
    saveIssues(issues);
    return issue;
};

// --- Admin Services ---

export const getAllCityAdmins = async (): Promise<User[]> => {
  await delay();
  const users = getStoredUsers();
  return users.filter(u => u.role === UserRole.CITY_ADMIN);
};