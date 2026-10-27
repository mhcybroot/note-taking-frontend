export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  interests: string[];
  createdAt?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  owner: { id: string; name: string; email: string } | string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: { _id?: string; id?: string; name: string; email: string };
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InterestGroup {
  interest: string;
  count: number;
  users: Array<{ id: string; name: string; email: string; role: string }>;
}
