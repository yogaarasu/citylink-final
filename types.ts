
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CITY_ADMIN = 'CITY_ADMIN',
  CITIZEN = 'CITIZEN'
}

export enum IssueStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city?: string;
  state?: string;
  address?: string;
  password?: string;
  country?: string;
  createdAt: number;
}

export interface IssueVotes {
  up: number;
  down: number;
  votedUserIds: string[];
  userVotes?: Record<string, 'up' | 'down'>;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  category: string;
  latitude?: number;
  longitude?: number;
  address: string;
  imageUrl?: string;
  imageUrls?: string[];
  resolutionImageUrl?: string;
  resolutionDate?: number;
  rejectionReason?: string;
  rating?: number;
  ratingComment?: string;
  votes?: IssueVotes;
  authorId: string;
  authorName: string;
  city: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface CityStats {
  totalIssues: number;
  pending: number;
  inProgress: number;
  resolved: number;
}