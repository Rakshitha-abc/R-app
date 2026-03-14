import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, X, Calendar, Lock, Upload, Loader2, LogOut } from 'lucide-react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ACCESS_CODE = import.meta.env.VITE_ACCESS_CODE || 'rakirakshu';

interface DiaryEntry {
  id: number;
  title: string;
  description: string;
  image_url?: string;
  date: string;
}

interface Memory {
  id: number;
  description: string;
  image_url: string;
  created_at: string;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activeTab, setActiveTab] = useState<'diary' | 'memories'>('diary');
  const [showModal, setShowModal] = useState<string | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.removeItem('rr_auth'); // Reset to show the new title
    const savedAuth = localStorage.getItem('rr_auth');
    if (savedAuth === 'true') setIsAuthenticated(true);

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    if (savedAuth === 'true') fetchData();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchData = async () => {
    try {
      const [diaryRes, memoriesRes] = await Promise.all([
        axios.get(`${API_BASE}/diary`),
        axios.get(`${API_BASE}/memories`)
      ]);
      setDiary(diaryRes.data);
      setMemories(memoriesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.toLowerCase() === ACCESS_CODE) {
      setIsAuthenticated(true);
      localStorage.setItem('rr_auth', 'true');
      fetchData();
    } else {
      alert('Incorrect access code, my love.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rr_auth');
    setIsAuthenticated(false);
    setPasscode('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000 // 5 minutes timeout for large files
      });
      setUploadedUrl(res.data.url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Try a smaller image or check server.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (showModal === 'diary') {
        const payload = {
          title: newTitle,
          description: newDesc,
          image_url: uploadedUrl || null,
          date: newDate || null
        };
        await axios.post(`${API_BASE}/diary`, payload);
      } else {
        if (!uploadedUrl) {
          alert('Please upload a photo first!');
          return;
        }
        const payload = {
          description: newDesc,
          image_url: uploadedUrl,
          date: newDate || null
        };
        await axios.post(`${API_BASE}/memories`, payload);
      }
      closeModal();
      await fetchData();
    } catch (err) {
      console.error('Error adding entry:', err);
      alert('Failed to save. Please try again or check server connection.');
    }
  };

  const closeModal = () => {
    setShowModal(null);
    setNewTitle('');
    setNewDesc('');
    setNewDate('');
    setUploadedUrl('');
    setUploading(false);
  }

  if (!isAuthenticated) {
    return (
      <div className="login-gate">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Lock size={48} color="var(--accent)" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontFamily: 'Playfair Display', marginBottom: '0.5rem' }}>Rakshu ❤️ Raki</h1>
          <p style={{ color: 'var(--text-muted)' }}>Only for Rakshitha & Rakesh</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="login-input"
              placeholder="Enter Access Code"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
            <button
              type="submit"
              style={{ background: 'var(--primary)', color: 'white', padding: '1rem 2rem', borderRadius: '30px', fontWeight: 'bold' }}
            >
              Enter Our World
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer' }}>R & R</div>
        <div className="nav-links">
          <button className={`nav-link ${activeTab === 'diary' ? 'active' : ''}`} onClick={() => setActiveTab('diary')}>Diary</button>
          <button className={`nav-link ${activeTab === 'memories' ? 'active' : ''}`} onClick={() => setActiveTab('memories')}>Memories</button>
          <button className="nav-link" onClick={handleLogout} title="Logout" style={{ opacity: 0.6 }}><LogOut size={18} /></button>
        </div>
      </nav>

      <header className="hero" style={{ backgroundImage: `url('/background.jpg')` }}>
        <img src="/background.jpg" alt="R & R Story" className="hero-photo" />
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            R & R
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            story of two childs Rakshitha and Rakesh
          </motion.p>
        </div>
      </header>

      <main className="section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <h2 className="section-title">{activeTab === 'diary' ? 'Our Diary' : 'Captured Memories'}</h2>
          <button
            className="add-btn"
            onClick={() => setShowModal(activeTab)}
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '0.8rem 1.5rem',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={18} /> {activeTab === 'diary' ? 'Write Page' : 'Post Memory'}
          </button>
        </div>

        {activeTab === 'diary' ? (
          <div className="diary-grid">
            {diary.map((item) => (
              <motion.div
                key={item.id}
                className="diary-card"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {item.image_url && <img src={item.image_url} alt={item.title} className="diary-image" />}
                <div className="diary-info">
                  <div className="diary-date">
                    <Calendar size={12} style={{ marginRight: '5px' }} />
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h3 className="diary-title">{item.title}</h3>
                  <p className="diary-desc">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="memories-feed">
            {memories.map((item) => (
              <motion.div
                key={item.id}
                className="memory-post"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <img src={item.image_url} alt="memory" className="memory-post-img" />
                <div className="memory-post-content">
                  <p className="memory-post-desc">
                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>US</span>
                    {item.description}
                  </p>
                  <div className="memory-post-date">
                    {new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)', zIndex: 1000,
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}
            onClick={closeModal}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'white', padding: '2rem', borderRadius: '20px',
                width: '90%', maxWidth: '500px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3>{showModal === 'diary' ? 'Write to Diary' : 'Post to Memories'}</h3>
                <button onClick={closeModal}><X /></button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {showModal === 'diary' && (
                  <input
                    type="text"
                    placeholder="Title of the day"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    required
                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                )}

                <div className="input-group">
                  <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.3rem', display: 'block' }}>When did this happen? (Optional)</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', width: '100%' }}
                  />
                </div>

                <textarea
                  placeholder={showModal === 'diary' ? "The story of today..." : "A caption for this memory..."}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  required={showModal === 'memories'}
                  style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
                />

                <div className="upload-section">
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  {!uploadedUrl ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{
                        width: '100%', padding: '1.5rem', border: '2px dashed #ddd',
                        borderRadius: '12px', color: '#666', display: 'flex',
                        flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                      }}
                    >
                      {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
                      {uploading ? 'Uploading...' : 'Click to Upload Photo'}
                    </button>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={uploadedUrl}
                        alt="preview"
                        style={{ width: '100%', borderRadius: '12px', maxHeight: '200px', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => setUploadedUrl('')}
                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'white', borderRadius: '50%', padding: '5px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {showModal === 'diary' && <p style={{ fontSize: '0.8rem', color: '#888' }}>* Photo is optional for diary entries</p>}

                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    opacity: uploading ? 0.5 : 1
                  }}
                >
                  {showModal === 'diary' ? 'Save Story' : 'Post Memory'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        <p>Made with <Heart size={14} fill="var(--accent)" color="var(--accent)" /> for Rakshitha & Rakesh</p>
      </footer>
    </div>
  );
}

export default App;
