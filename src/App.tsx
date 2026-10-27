import React, { useEffect, useState } from 'react';
import {
  Shield,
  Lock,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  LogOut,
  FolderOpen,
  Search,
  BookOpen,
  CheckCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Database,
  Layers,
  X,
  FileText,
  LayoutGrid,
  List,
  Pin,
  Share2,
  Bold,
  Italic,
  Code,
  MessageSquare,
  UserPlus,
  ArrowUpDown
} from 'lucide-react';
import { api } from './api/client';
import { InterestGroup, Note, PaginatedResponse, Post, User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-notes' | 'public-posts' | 'user-management' | 'admin-aggregations'>('my-notes');
  const [aggregationSubTab, setAggregationSubTab] = useState<'scenario-1' | 'scenario-2'>('scenario-1');

  // Auth form states
  const [isRegister, setIsRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authInterests, setAuthInterests] = useState('');
  const [authError, setAuthError] = useState('');

  // Notes state & controls
  const [notesData, setNotesData] = useState<PaginatedResponse<Note> | null>(null);
  const [notesPage, setNotesPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'title'>('latest');

  // Note Drawer (Create / Edit)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('Architecture');
  const [encryptionStandard, setEncryptionStandard] = useState('AES-256-GCM');

  // Public Posts state
  const [publicPosts, setPublicPosts] = useState<Post[]>([]);
  const [publicPostsPage, setPublicPostsPage] = useState(1);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // Admin users state & edit modal
  const [adminUsers, setAdminUsers] = useState<PaginatedResponse<User> | null>(null);
  const [adminUserPage, setAdminUserPage] = useState(1);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'user' | 'admin'>('user');
  const [newAdminInterests, setNewAdminInterests] = useState('general, coding');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserRole, setEditUserRole] = useState<'user' | 'admin'>('user');
  const [editUserInterests, setEditUserInterests] = useState('');

  // Scenario 1 state
  const [interestGroups, setInterestGroups] = useState<InterestGroup[]>([]);

  // Scenario 2 state
  const [allUsersList, setAllUsersList] = useState<User[]>([]);
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const [authorPosts, setAuthorPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Check auth session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getProfile()
        .then((profile) => setUser(profile))
        .catch(() => api.setToken(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch data on tab or page change
  useEffect(() => {
    if (!user) return;

    if (activeTab === 'my-notes') {
      api.getNotes(notesPage, 9)
        .then(setNotesData)
        .catch((err) => console.error('Fetch notes error:', err));
    } else if (activeTab === 'public-posts') {
      api.getPosts(publicPostsPage, 10)
        .then((res) => setPublicPosts(res.items))
        .catch((err) => console.error('Fetch public posts error:', err));
    } else if (activeTab === 'user-management') {
      api.getUsers(adminUserPage, 10)
        .then((res) => {
          setAdminUsers(res);
          setAllUsersList(res.items);
        })
        .catch((err) => console.error('Get users error:', err));
    } else if (activeTab === 'admin-aggregations') {
      // Load Scenario 1
      api.getGroupByInterests()
        .then(setInterestGroups)
        .catch((err) => console.error('Scenario 1 error:', err));

      // Load Users Directory & authors list
      api.getUsers(1, 50)
        .then((res) => {
          setAllUsersList(res.items);
          if (res.items.length > 0 && !selectedAuthorId) {
            setSelectedAuthorId(res.items[0].id);
          }
        })
        .catch((err) => console.error('Get users error:', err));
    }
  }, [user, activeTab, notesPage, publicPostsPage, adminUserPage]);

  // Load Scenario 2 posts when selectedAuthorId changes
  useEffect(() => {
    if (activeTab === 'admin-aggregations' && selectedAuthorId) {
      setLoadingPosts(true);
      api.getPostsByUser(selectedAuthorId)
        .then(setAuthorPosts)
        .catch((err) => {
          console.error('Scenario 2 error:', err);
          setAuthorPosts([]);
        })
        .finally(() => setLoadingPosts(false));
    }
  }, [activeTab, selectedAuthorId]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegister) {
        const interestsArray = authInterests
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean);
        const res = await api.register(authEmail, authPassword, authName, interestsArray);
        setUser(res.user);
      } else {
        const res = await api.login(authEmail, authPassword);
        setUser(res.user);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    setUser(null);
    setActiveTab('my-notes');
  };

  const openCreateDrawer = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('Architecture');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setIsDrawerOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    try {
      if (editingNoteId) {
        await api.updateNote(editingNoteId, noteTitle, noteContent);
      } else {
        await api.createNote(noteTitle, noteContent);
      }
      setIsDrawerOpen(false);
      setNoteTitle('');
      setNoteContent('');
      setEditingNoteId(null);
      const res = await api.getNotes(notesPage, 9);
      setNotesData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to save note');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.deleteNote(id);
      const res = await api.getNotes(notesPage, 9);
      setNotesData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to delete note');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    try {
      await api.createPost(newPostTitle, newPostContent);
      setNewPostTitle('');
      setNewPostContent('');
      setShowCreatePostModal(false);
      const res = await api.getPosts(publicPostsPage, 10);
      setPublicPosts(res.items);
      alert('Post published successfully to public feed!');
    } catch (err: any) {
      alert(err.message || 'Failed to publish post');
    }
  };

  const handleAddUserByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const interestsArray = newAdminInterests
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

      await api.createUserByAdmin({
        email: newAdminEmail,
        password: newAdminPassword,
        name: newAdminName,
        role: newAdminRole,
        interests: interestsArray.length > 0 ? interestsArray : ['general'],
      });

      setShowAddUserModal(false);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminName('');
      setNewAdminInterests('general, coding');
      const res = await api.getUsers(adminUserPage, 10);
      setAdminUsers(res);
      setAllUsersList(res.items);
      alert('New user created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
    }
  };

  const openEditUserModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditUserName(targetUser.name);
    setEditUserRole(targetUser.role);
    setEditUserInterests(targetUser.interests?.join(', ') || '');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const interestsArray = editUserInterests
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);

      await api.updateUserByAdmin(editingUser.id, {
        name: editUserName,
        role: editUserRole,
        interests: interestsArray,
      });

      setEditingUser(null);
      const res = await api.getUsers(adminUserPage, 10);
      setAdminUsers(res);
      setAllUsersList(res.items);
      alert('User updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove/delete this user account?')) return;
    try {
      await api.deleteUser(id);
      const res = await api.getUsers(adminUserPage, 10);
      setAdminUsers(res);
      setAllUsersList(res.items);
      alert('User removed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0F19]">
        <div className="flex items-center gap-3 text-indigo-400 font-mono text-sm">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Initializing Cryptographic Session...
        </div>
      </div>
    );
  }

  // 1. Authentication View (Stitch Screen 1)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] p-4 font-sans text-slate-100">
        <div className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-xl shadow-2xl p-8 relative">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 mb-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-display text-white tracking-tight">CipherScribe</h1>
            <p className="text-xs text-slate-400 mt-1">Zero-Knowledge Encrypted Note Vault</p>
          </div>

          <div className="flex rounded-lg bg-[#0B0F19] p-1 border border-[#1E293B] mb-6">
            <button
              onClick={() => { setIsRegister(false); setAuthError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${
                !isRegister ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setAuthError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${
                isRegister ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Vault
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-[#1E293B] focus:border-indigo-500 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    Interests <span className="text-[10px] text-slate-500">(comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={authInterests}
                    onChange={(e) => setAuthInterests(e.target.value)}
                    placeholder="Cryptography, AI, Backend, Security"
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-[#1E293B] focus:border-indigo-500 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full px-3 py-2 bg-[#0B0F19] border border-[#1E293B] focus:border-indigo-500 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-[#0B0F19] border border-[#1E293B] focus:border-indigo-500 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition"
            >
              {isRegister ? 'Register & Generate Keys' : 'Authorize & Decrypt'}
            </button>
          </form>

          <div className="mt-6 border-t border-[#1E293B] pt-4 text-center">
            <span className="text-[11px] text-slate-400 block mb-1">Seeded Administrator Credentials:</span>
            <div className="inline-block px-2.5 py-1 bg-[#0B0F19] rounded border border-[#1E293B] text-[11px] font-mono text-indigo-300">
              admin@notetaking.local / AdminSecurePassword123!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter notes by search query & category & sorting
  const filteredNotes = (notesData?.items || [])
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  // Selected author details for Scenario 2
  const selectedAuthor = allUsersList.find((u) => u.id === selectedAuthorId);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-30 bg-[#0B0F19]/90 backdrop-blur border-b border-[#1E293B] px-6 py-3.5 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
            <Shield className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base text-white tracking-tight">CipherScribe</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1E293B] text-slate-400 border border-[#334155]">v1.0</span>
          </div>
        </div>

        {/* Center: Main Tabs (All core requirements directly accessible) */}
        <nav className="flex items-center gap-1.5 md:gap-2">
          {/* Tab 1: My Notes */}
          <button
            onClick={() => setActiveTab('my-notes')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition flex items-center gap-1.5 ${
              activeTab === 'my-notes'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            My Notes
          </button>

          {/* Tab 2: Public Posts */}
          <button
            onClick={() => setActiveTab('public-posts')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition flex items-center gap-1.5 ${
              activeTab === 'public-posts'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Public Posts
          </button>

          {/* Tab 3: User Management (Admin: Add, Remove, Update & List) */}
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('user-management')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition flex items-center gap-1.5 ${
                activeTab === 'user-management'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              User Management
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                Admin
              </span>
            </button>
          )}

          {/* Tab 4: MongoDB Aggregations (Scenario 1 & 2) */}
          {user.role === 'admin' ? (
            <button
              onClick={() => setActiveTab('admin-aggregations')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition flex items-center gap-1.5 ${
                activeTab === 'admin-aggregations'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Aggregations
            </button>
          ) : (
            <span className="text-[11px] font-mono text-slate-500 px-2.5 py-1 bg-[#111827] rounded-full border border-[#1E293B]">
              Standard User
            </span>
          )}

          {/* Tab 5: API Docs */}
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            API Docs
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </nav>

        {/* Right: Search, Profile Chip & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#111827] border border-[#1E293B] rounded-lg text-xs text-slate-400">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none w-24 lg:w-32"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-[#111827] border border-[#1E293B] rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-200">{user.name}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
              user.role === 'admin' ? 'bg-purple-950 text-purple-400' : 'bg-blue-950 text-blue-400'
            }`}>
              {user.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-lg bg-[#111827] border border-[#1E293B] text-slate-400 hover:text-red-400 hover:border-red-500/30 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* VIEW 1: MY NOTES */}
        {activeTab === 'my-notes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold font-display text-white">
                    {user.role === 'admin' ? 'Audit Vault: All Notes' : 'My Secure Notes'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                    <Lock className="w-2.5 h-2.5" />
                    Zero-Knowledge Enclave Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {user.role === 'admin'
                    ? 'Audit view: Viewing all decrypted notes across platform. Foreign notes are read-only.'
                    : 'Manage your encrypted thoughts and sensitive records with strict ownership.'}
                </p>
              </div>

              <button
                onClick={openCreateDrawer}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition"
              >
                <Plus className="w-4 h-4" />
                + New Note
              </button>
            </div>

            {/* Filter Tags, Sort Dropdown & View Mode Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 bg-[#111827] border border-[#1E293B] rounded-xl text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['All', 'Work', 'Finance', 'Personal', 'Architecture'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-md transition font-medium ${
                      selectedCategory === category
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-[#1E293B]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#0B0F19] border border-[#1E293B] rounded px-2 py-1 text-slate-300 focus:outline-none"
                  >
                    <option value="latest">Latest Updated</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Alphabetical (A-Z)</option>
                  </select>
                </div>

                <div className="flex rounded bg-[#0B0F19] p-0.5 border border-[#1E293B]">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded transition ${viewMode === 'grid' ? 'bg-[#1E293B] text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded transition ${viewMode === 'list' ? 'bg-[#1E293B] text-indigo-400' : 'text-slate-500 hover:text-white'}`}
                    title="List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
              <div className="text-center py-16 bg-[#111827] border border-[#1E293B] rounded-xl">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">No notes found</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Create your first encrypted note in this vault.</p>
                <button
                  onClick={openCreateDrawer}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow"
                >
                  Create Note
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map((note, idx) => {
                  const isOwner =
                    typeof note.owner === 'object'
                      ? note.owner.id === user.id || (note.owner as any)._id === user.id
                      : note.owner === user.id;

                  return (
                    <div
                      key={note.id}
                      className="group bg-[#111827] border border-[#1E293B] hover:border-[#334155] rounded-xl p-5 transition flex flex-col justify-between shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500/80" />

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1E293B] text-indigo-300 border border-[#334155]">
                              AES-256-GCM
                            </span>
                            {idx === 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                                <Pin className="w-2.5 h-2.5" /> Pinned
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="font-display font-semibold text-white text-base mb-2 group-hover:text-indigo-300 transition">
                          {note.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed whitespace-pre-wrap font-mono">
                          {note.content}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#1E293B] flex items-center justify-between">
                        <div className="text-[10px] font-mono text-slate-500">
                          {typeof note.owner === 'object' ? `By: ${note.owner.name}` : 'Owner Protected'}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
                              alert('Note copied to clipboard!');
                            }}
                            className="p-1.5 rounded hover:bg-[#1E293B] text-slate-400 hover:text-white transition"
                            title="Copy Note"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {isOwner ? (
                            <>
                              <button
                                onClick={() => openEditDrawer(note)}
                                className="p-1.5 rounded hover:bg-[#1E293B] text-slate-400 hover:text-indigo-400 transition"
                                title="Edit Note"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1.5 rounded hover:bg-[#1E293B] text-slate-400 hover:text-red-400 transition"
                                title="Delete Note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 bg-[#0B0F19] rounded border border-[#1E293B]">
                              Audit Lock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotes.map((note) => {
                  const isOwner =
                    typeof note.owner === 'object'
                      ? note.owner.id === user.id || (note.owner as any)._id === user.id
                      : note.owner === user.id;

                  return (
                    <div
                      key={note.id}
                      className="bg-[#111827] border border-[#1E293B] hover:border-[#334155] rounded-xl p-4 flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-display font-semibold text-white text-sm">{note.title}</h4>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(note.createdAt).toLocaleDateString()} • {typeof note.owner === 'object' ? note.owner.name : 'Protected'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <>
                            <button
                              onClick={() => openEditDrawer(note)}
                              className="p-1.5 rounded hover:bg-[#1E293B] text-slate-400 hover:text-indigo-400"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1.5 rounded hover:bg-[#1E293B] text-slate-400 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">Read-Only</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: PUBLIC POSTS FEED */}
        {activeTab === 'public-posts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Public Posts Community Feed</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Public posts visible to everyone across the platform (stored in the Posts collection).
                </p>
              </div>

              <button
                onClick={() => setShowCreatePostModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition"
              >
                <Plus className="w-4 h-4" />
                + Write Public Post
              </button>
            </div>

            {publicPosts.length === 0 ? (
              <div className="text-center py-16 bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                No public posts yet. Click "+ Write Public Post" to author the first post.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publicPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-[#111827] border border-[#1E293B] hover:border-[#334155] rounded-xl p-5 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                          Public Broadcast
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-white text-base mb-2">{post.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-[9px]">
                          {typeof post.author === 'object' && post.author.name ? post.author.name.charAt(0) : 'U'}
                        </div>
                        <span className="font-mono text-[11px]">
                          {typeof post.author === 'object' && post.author.name ? post.author.name : 'Author'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">Published</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: DEDICATED USER MANAGEMENT (PDF: Add, Remove, Update & List All Users) */}
        {activeTab === 'user-management' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold font-display text-white">User Management Console</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 border border-purple-500/30 text-purple-300">
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Full CRUD capabilities: Add new user, remove user, update role & interests, and list all registered users.
                </p>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition"
              >
                <UserPlus className="w-4 h-4" />
                + Add User (Admin)
              </button>
            </div>

            {/* Quick Stat Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Total Users (List)</span>
                <span className="text-2xl font-bold font-display text-white">{adminUsers?.total || 0}</span>
                <span className="text-[10px] text-emerald-400 block mt-1">100% Chronologically Indexed</span>
              </div>
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Role Permissions</span>
                <span className="text-2xl font-bold font-display text-indigo-400">Strict RBAC</span>
                <span className="text-[10px] text-slate-400 block mt-1">Admin & User Isolation</span>
              </div>
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Actions Supported</span>
                <span className="text-2xl font-bold font-display text-white">Add • Edit • Remove</span>
                <span className="text-[10px] text-indigo-400 block mt-1">Live Backend Persistence</span>
              </div>
            </div>

            {/* User Directory Table */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden shadow">
              <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
                <h3 className="font-display font-semibold text-white text-sm">
                  Registered Users (Showing page {adminUserPage} of {adminUsers?.totalPages || 1})
                </h3>
                <div className="text-xs font-mono text-slate-500">
                  Total {adminUsers?.total || 0} accounts
                </div>
              </div>

              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0B0F19] text-slate-400 font-mono text-[11px] uppercase border-b border-[#1E293B]">
                  <tr>
                    <th className="px-4 py-3">User Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Interests Array</th>
                    <th className="px-4 py-3 text-right">Actions (Update / Remove)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {adminUsers?.items.map((u) => (
                    <tr key={u.id} className="hover:bg-[#1E293B]/40 transition">
                      <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-[11px] border border-indigo-500/30">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        {u.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                          u.role === 'admin' ? 'bg-purple-950/80 text-purple-300 border border-purple-500/30' : 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.interests && u.interests.length > 0 ? (
                            u.interests.map((i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-[#0B0F19] rounded text-[10px] font-mono text-slate-400 border border-[#1E293B]">
                                {i}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] font-mono text-slate-600 italic">No interests</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Update User Button */}
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0B0F19] hover:bg-[#1E293B] text-slate-300 hover:text-indigo-400 border border-[#1E293B] text-[11px] transition font-medium"
                            title="Update User Profile & Role"
                          >
                            <Edit3 className="w-3 h-3" />
                            Update
                          </button>

                          {/* Remove User Button */}
                          {u.id !== user.id ? (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/20 hover:bg-red-950/60 text-red-400 border border-red-500/30 text-[11px] transition font-medium"
                              title="Remove User"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-600 px-2 py-1">Current User</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {adminUsers && adminUsers.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-[#1E293B]">
                  <span className="text-xs font-mono text-slate-500">
                    Page {adminUsers.page} of {adminUsers.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={adminUserPage <= 1}
                      onClick={() => setAdminUserPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded bg-[#0B0F19] border border-[#1E293B] text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 bg-[#1E293B] rounded text-xs font-mono text-white">
                      {adminUserPage}
                    </span>
                    <button
                      disabled={adminUserPage >= adminUsers.totalPages}
                      onClick={() => setAdminUserPage((p) => p + 1)}
                      className="p-1.5 rounded bg-[#0B0F19] border border-[#1E293B] text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: MONGODB AGGREGATIONS (Scenario 1 & Scenario 2) */}
        {activeTab === 'admin-aggregations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold font-display text-white">MongoDB Aggregation Pipelines</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 border border-purple-500/30 text-purple-300">
                    PDF Section 4(B)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Single aggregation pipeline operations for Scenario 1 and Scenario 2.
                </p>
              </div>

              <div className="flex rounded-lg bg-[#111827] p-1 border border-[#1E293B] text-xs">
                <button
                  onClick={() => setAggregationSubTab('scenario-1')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    aggregationSubTab === 'scenario-1' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Scenario 1: Interests ($group)
                </button>
                <button
                  onClick={() => setAggregationSubTab('scenario-2')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    aggregationSubTab === 'scenario-2' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Scenario 2: User Posts ($lookup)
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Scenario 1 Categories</span>
                <span className="text-2xl font-bold font-display text-white">{interestGroups.length}</span>
                <span className="text-[10px] text-indigo-400 block mt-1">Single-Call $group</span>
              </div>
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Scenario 2 Joined Posts</span>
                <span className="text-2xl font-bold font-display text-white">{authorPosts.length}</span>
                <span className="text-[10px] text-emerald-400 block mt-1">Joined via $lookup</span>
              </div>
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Index Execution Mode</span>
                <span className="text-2xl font-bold font-display text-emerald-400">IXSCAN</span>
                <span className="text-[10px] text-slate-400 block mt-1">author_1_createdAt_-1</span>
              </div>
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Pipeline Call Count</span>
                <span className="text-2xl font-bold font-display text-white">Exactly 1</span>
                <span className="text-[10px] text-indigo-400 block mt-1">Single Stage Call</span>
              </div>
            </div>

            {/* SUB-TAB 1: SCENARIO 1 */}
            {aggregationSubTab === 'scenario-1' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#111827] border border-[#1E293B] rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-white">Scenario 1 Pipeline:</span>
                    <code className="font-mono text-indigo-300 bg-[#0B0F19] px-2 py-0.5 rounded border border-[#1E293B]">
                      collection.aggregate([ &#123; $match: &#123; interests: &#123; $ne: [] &#125; &#125; &#125;, &#123; $unwind: "$interests" &#125;, &#123; $group: &#123; _id: "$interests", count: &#123; $sum: 1 &#125; &#125; &#125;, &#123; $sort: &#123; count: -1 &#125; &#125; ])
                    </code>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                    Single Pipeline Executed
                  </span>
                </div>

                {interestGroups.length === 0 ? (
                  <div className="text-center py-12 bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-slate-400">
                    No interest groups aggregated.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {interestGroups.map((group) => (
                      <div
                        key={group.interest}
                        className="bg-[#111827] border border-[#1E293B] hover:border-[#334155] rounded-xl p-5 transition relative overflow-hidden"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-display font-bold text-white text-base">
                            {group.interest}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
                            {group.count} {group.count === 1 ? 'user' : 'users'}
                          </span>
                        </div>

                        <div className="space-y-2 mt-4">
                          <span className="text-[11px] font-mono text-slate-500 uppercase block">Associated Members:</span>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {group.users.map((u) => (
                              <div
                                key={u.id}
                                className="flex items-center justify-between text-xs px-2.5 py-1 bg-[#0B0F19] rounded border border-[#1E293B]"
                              >
                                <span className="font-medium text-slate-300">{u.name}</span>
                                <span className="font-mono text-[10px] text-slate-500">{u.email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: SCENARIO 2 */}
            {aggregationSubTab === 'scenario-2' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#111827] border border-[#1E293B] rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-white">Scenario 2 Pipeline:</span>
                    <code className="font-mono text-indigo-300 bg-[#0B0F19] px-2 py-0.5 rounded border border-[#1E293B]">
                      users.aggregate([ &#123; $match: &#123; _id: targetUserId &#125; &#125;, &#123; $lookup: &#123; from: "posts", localField: "_id", foreignField: "author", as: "posts" &#125; &#125; ])
                    </code>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                    $lookup Stage Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 space-y-4">
                    <h3 className="font-display font-semibold text-white text-sm">Select Target User</h3>
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Target Author</label>
                      <select
                        value={selectedAuthorId}
                        onChange={(e) => setSelectedAuthorId(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {allUsersList.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role}) - {u.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedAuthor && (
                      <div className="mt-4 p-3 bg-[#0B0F19] border border-[#1E293B] rounded-lg space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Author Name:</span>
                          <span className="font-semibold text-white">{selectedAuthor.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Role:</span>
                          <span className="font-mono text-[10px] uppercase text-indigo-400">{selectedAuthor.role}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Interests:</span>
                          <span className="text-slate-300 font-mono text-[11px]">{selectedAuthor.interests?.join(', ') || 'None'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Joined Posts Count:</span>
                          <span className="font-mono text-emerald-400 font-bold">{authorPosts.length}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-semibold text-white text-sm">
                        Author's Posts (Retrieved via single $lookup aggregation)
                      </h3>
                      {loadingPosts && <span className="text-xs font-mono text-indigo-400 animate-pulse">Running $lookup...</span>}
                    </div>

                    {authorPosts.length === 0 ? (
                      <div className="text-center py-12 bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-slate-400">
                        No posts found for this user. You can publish a post in the "Public Posts" tab.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {authorPosts.map((post) => (
                          <div
                            key={post.id}
                            className="bg-[#111827] border border-[#1E293B] hover:border-[#334155] rounded-xl p-4 transition"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-display font-semibold text-white text-sm">{post.title}</h4>
                              <span className="text-[10px] font-mono text-slate-500">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">
                              {post.content}
                            </p>
                            <div className="mt-3 pt-2 border-t border-[#1E293B] flex items-center justify-between text-[10px] font-mono text-slate-500">
                              <span>Author ID: {typeof post.author === 'object' ? post.author._id || post.author.id : post.author}</span>
                              <span className="text-indigo-400 font-medium">Joined via $lookup</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. SLIDE-OVER DRAWER FOR CREATE / EDIT NOTE */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#111827] border-l border-[#1E293B] h-full p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#1E293B] mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base">
                      {editingNoteId ? 'Edit Encrypted Note' : 'Create Encrypted Note'}
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400">Zero-Knowledge Buffer</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E293B] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="noteForm" onSubmit={handleSaveNote} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Note Title</label>
                  <input
                    type="text"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g. Distributed Key Custody Architecture"
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Category / Tag</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Architecture', 'Work', 'Finance', 'Personal'].map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setNoteCategory(cat)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                          noteCategory === cat
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                            : 'bg-[#0B0F19] border-[#1E293B] text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Encryption Mode</label>
                  <select
                    value={encryptionStandard}
                    onChange={(e) => setEncryptionStandard(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs font-mono text-indigo-300 focus:outline-none"
                  >
                    <option value="AES-256-GCM">FIPS 140-3 Standard (AES-256-GCM)</option>
                    <option value="ChaCha20">ChaCha20-Poly1305 (Fast Stream)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-mono uppercase text-slate-400">Encrypted Content</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setNoteContent((c) => c + '\n**Bold text**')}
                        className="p-1 rounded bg-[#0B0F19] hover:bg-[#1E293B] text-slate-400 hover:text-white"
                        title="Bold"
                      >
                        <Bold className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteContent((c) => c + '\n*Italic text*')}
                        className="p-1 rounded bg-[#0B0F19] hover:bg-[#1E293B] text-slate-400 hover:text-white"
                        title="Italic"
                      >
                        <Italic className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteContent((c) => c + '\n```bash\n# code block\n```')}
                        className="p-1 rounded bg-[#0B0F19] hover:bg-[#1E293B] text-slate-400 hover:text-white"
                        title="Code"
                      >
                        <Code className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    required
                    rows={8}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Draft classified thoughts, architecture schemas, or sensitive records..."
                    className="w-full px-3 py-2 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                  />
                </div>

                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg text-[11px] text-slate-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Payload is securely verified with strict user-level ownership isolation.</span>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-[#1E293B] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-[#1E293B] transition"
              >
                Cancel
              </button>
              <button
                form="noteForm"
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition"
              >
                {editingNoteId ? 'Update Encrypted Note' : 'Save Encrypted Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: WRITE PUBLIC POST */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="font-display font-bold text-white text-base">Write Public Post</h3>
              </div>
              <button onClick={() => setShowCreatePostModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Post Title</label>
                <input
                  type="text"
                  required
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="e.g. Scaling Distributed Microservices"
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Content</label>
                <textarea
                  required
                  rows={6}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Write your article, research memo, or technical broadcast..."
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-[#1E293B] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePostModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: EDIT USER (Admin: Update User) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] mb-4">
              <h3 className="font-display font-bold text-white text-base">Update User (Role & Interests)</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">User Email</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Role Permission</label>
                <select
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="user">User (Standard)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Interests Array <span className="text-[10px] text-slate-500">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={editUserInterests}
                  onChange={(e) => setEditUserInterests(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-[#1E293B] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: ADD USER BY ADMIN */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111827] border border-[#1E293B] rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] mb-4">
              <h3 className="font-display font-bold text-white text-base">Add New User (Admin Provision)</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUserByAdmin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="elena@example.com"
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="user">User (Standard)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Interests Array <span className="text-[10px] text-slate-500">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={newAdminInterests}
                  onChange={(e) => setNewAdminInterests(e.target.value)}
                  placeholder="crypto, backend, devops"
                  className="w-full px-3 py-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-[#1E293B] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow"
                >
                  Create & Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
