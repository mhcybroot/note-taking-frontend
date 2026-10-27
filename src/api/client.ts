import {
  InterestGroup,
  Note,
  PaginatedResponse,
  Post,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg =
        data.message ||
        (Array.isArray(data.message) ? data.message.join(', ') : 'Request failed');
      throw new Error(errorMsg);
    }

    // Unpack response envelope ({ success: true, data: ... })
    return data.data !== undefined ? data.data : data;
  }

  // Auth
  async login(email: string, password: string): Promise<{ user: User; access_token: string }> {
    const res = await this.request<{ user: User; access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async register(
    email: string,
    password: string,
    name: string,
    interests: string[]
  ): Promise<{ user: User; access_token: string }> {
    const res = await this.request<{ user: User; access_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, interests }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  // Notes
  async getNotes(page = 1, limit = 10): Promise<PaginatedResponse<Note>> {
    return this.request<PaginatedResponse<Note>>(`/notes?page=${page}&limit=${limit}`);
  }

  async createNote(title: string, content: string): Promise<Note> {
    return this.request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  }

  async updateNote(id: string, title?: string, content?: string): Promise<Note> {
    return this.request<Note>(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, content }),
    });
  }

  async deleteNote(id: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>(`/notes/${id}`, {
      method: 'DELETE',
    });
  }

  // Users (Admin & Self)
  async getUsers(page = 1, limit = 10): Promise<PaginatedResponse<User>> {
    return this.request<PaginatedResponse<User>>(`/users?page=${page}&limit=${limit}`);
  }

  async createUserByAdmin(user: Partial<User> & { password: string }): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUserByAdmin(
    id: string,
    data: { name?: string; role?: 'user' | 'admin'; interests?: string[] }
  ): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Scenario 1: Group by interests
  async getGroupByInterests(): Promise<InterestGroup[]> {
    return this.request<InterestGroup[]>('/users/by-interests');
  }

  // Posts (Scenario 2)
  async getPosts(page = 1, limit = 10): Promise<PaginatedResponse<Post>> {
    return this.request<PaginatedResponse<Post>>(`/posts?page=${page}&limit=${limit}`);
  }

  async createPost(title: string, content: string): Promise<Post> {
    return this.request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
  }

  async getPostsByUser(userId: string): Promise<Post[]> {
    return this.request<Post[]>(`/posts/user/${userId}`);
  }
}

export const api = new ApiClient();
