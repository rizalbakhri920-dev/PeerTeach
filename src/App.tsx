import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  UserPlus, 
  MessageSquare, 
  GraduationCap, 
  BookOpen, 
  Award, 
  ChevronRight, 
  X,
  CheckCircle2,
  Users,
  Calendar,
  Video,
  MapPin,
  Star,
  Clock,
  Send,
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  ThumbsUp,
  ThumbsDown,
  Calculator,
  Zap,
  Dna,
  Languages,
  Shield,
  RefreshCw
} from 'lucide-react';

// Types
interface Tutor {
  id: string;
  name: string;
  class: string;
  whatsapp: string;
  achievement: string;
  score: number;
  avatar: string;
  subjects: string[];
  subjects_taught?: string; // Detailed subjects
  rating: number;
  reviewCount: number;
  availability: string[];
  pricing: {
    offline: {
      remedial: number;
      exam: number;
    };
    online: {
      remedial: number;
      exam: number;
    };
  };
}

interface Booking {
  id: string;
  tutorId: string;
  tutorName: string;
  studentName: string;
  date: string;
  count: number;
  method: 'offline' | 'online';
  purpose: string;
  totalPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: number;
}

interface Message {
  id: string;
  bookingId: string;
  sender: 'student' | 'tutor';
  text: string;
  timestamp: number;
}

const INITIAL_TUTORS: Tutor[] = [
  {
    id: '1',
    name: 'Budi Santoso',
    class: '12 MIPA 1',
    whatsapp: '08123456789',
    achievement: 'Juara 2 KSN Fisika Kota',
    score: 95,
    avatar: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=random',
    subjects: ['Fisika', 'Matematika'],
    subjects_taught: 'Mekanika, Termodinamika, Aljabar Linear',
    rating: 4.8,
    reviewCount: 12,
    availability: ['Senin 15:00-17:00', 'Kamis 14:00-16:00'],
    pricing: {
      offline: { remedial: 25000, exam: 35000 },
      online: { remedial: 20000, exam: 30000 }
    }
  },
  {
    id: '2',
    name: 'Siti Aminah',
    class: '11 MIPA 3',
    whatsapp: '08234567890',
    achievement: 'Peringkat 1 Paralel Biologi',
    score: 98,
    avatar: 'https://ui-avatars.com/api/?name=Siti+Aminah&background=random',
    subjects: ['Biologi', 'Kimia'],
    subjects_taught: 'Genetika, Sel, Struktur Atom, Laju Reaksi',
    rating: 4.9,
    reviewCount: 24,
    availability: ['Selasa 14:00-16:00', 'Jumat 13:00-15:00'],
    pricing: {
      offline: { remedial: 20000, exam: 30000 },
      online: { remedial: 15000, exam: 25000 }
    }
  },
  {
    id: '3',
    name: 'Andi Wijaya',
    class: '12 IPS 2',
    whatsapp: '08345678901',
    achievement: 'Finalis Debat Bahasa Inggris',
    score: 92,
    avatar: 'https://ui-avatars.com/api/?name=Andi+Wijaya&background=random',
    subjects: ['Bahasa Inggris', 'Ekonomi'],
    subjects_taught: 'Grammar, Speaking, Akuntansi Dasar',
    rating: 4.7,
    reviewCount: 8,
    availability: ['Rabu 15:00-17:00', 'Sabtu 09:00-11:00'],
    pricing: {
      offline: { remedial: 30000, exam: 40000 },
      online: { remedial: 25000, exam: 35000 }
    }
  }
];

export default function App() {
  const [tutors] = useState<Tutor[]>(INITIAL_TUTORS);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // User Role State (Simulated)
  const [userRole, setUserRole] = useState<'student' | 'tutor'>('student');
  const [currentUserId] = useState('student_123'); // Simulated student ID
  
  // Bookings & Messages State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatBookingId, setActiveChatBookingId] = useState<string | null>(null);
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [tempRating, setTempRating] = useState(5);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [communityMessages, setCommunityMessages] = useState<Record<string, any[]>>({
    'Matematika': [
      { id: 1, type: 'text', content: 'Selamat datang di Komunitas Matematika! Di sini admin akan membagikan rumus-rumus cepat.', sender: 'Admin', timestamp: new Date().toISOString() },
      { id: 2, type: 'image', content: 'https://picsum.photos/seed/math/800/400', caption: 'Rumus Turunan Dasar', sender: 'Admin', timestamp: new Date().toISOString() }
    ],
    'Fisika': [],
    'Biologi': [],
    'Bahasa Inggris': []
  });
  const [newMessage, setNewMessage] = useState('');
  const [newImage, setNewImage] = useState('');

  const fetchCommunityMessages = async (communityName: string) => {
    try {
      const res = await fetch(`/api/community-messages/${encodeURIComponent(communityName)}`);
      const data = await res.json();
      setCommunityMessages(prev => ({
        ...prev,
        [communityName]: Array.isArray(data) ? data : []
      }));
    } catch (error) {
      console.error("Failed to fetch community messages:", error);
      setCommunityMessages(prev => ({
        ...prev,
        [communityName]: []
      }));
    }
  };

  useEffect(() => {
    if (showCommunityModal && selectedCommunity) {
      fetchCommunityMessages(selectedCommunity);
    }
  }, [showCommunityModal, selectedCommunity]);

  const handleSendMessage = async () => {
    if (!selectedCommunity || (!newMessage && !newImage)) return;
    
    const msgData = {
      community_name: selectedCommunity,
      type: newImage ? 'image' : 'text',
      content: newImage || newMessage,
      caption: newImage ? newMessage : undefined,
      sender: 'Admin'
    };

    try {
      const res = await fetch('/api/community-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgData)
      });
      
      if (res.ok) {
        fetchCommunityMessages(selectedCommunity);
        setNewMessage('');
        setNewImage('');
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [siteConfig, setSiteConfig] = useState({
    heroTitle: 'Belajar Lebih Asik Bareng Teman Seangkatan',
    heroSubtitle: 'Tingkatkan prestasimu dengan bimbingan dari teman-teman terbaik di sekolah. Mudah, santai, dan pastinya seru!',
  });
  const [isEditingSite, setIsEditingSite] = useState(false);
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);

  const fetchRegistrations = async () => {
    try {
      const res = await fetch('/api/tutor-registrations');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRegistrations(data);
      } else {
        console.error("Registrations data is not an array:", data);
        setRegistrations([]);
      }
    } catch (err) {
      console.error("Failed to fetch registrations:", err);
      setRegistrations([]);
    }
  };

  const fetchSiteConfig = async () => {
    try {
      const res = await fetch('/api/site-config');
      const data = await res.json();
      if (data.heroTitle) {
        setSiteConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch site config:", error);
    }
  };

  const saveSiteConfig = async () => {
    try {
      await fetch('/api/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteConfig)
      });
      setIsEditingSite(false);
    } catch (error) {
      console.error("Failed to save site config:", error);
    }
  };

  useEffect(() => {
    fetchSiteConfig();
  }, []);

  useEffect(() => {
    if (showSpreadsheet) {
      fetchRegistrations();
    }
  }, [showSpreadsheet]);
  
  // Booking Form State
  const [bookingCount, setBookingCount] = useState(1);
  const [bookingMethod, setBookingMethod] = useState<'offline' | 'online'>('offline');
  const [bookingPurpose, setBookingPurpose] = useState<'remedial' | 'exam'>('remedial');
  const [bookingDate, setBookingDate] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);

  const filteredTutors = tutors.filter(tutor => 
    tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openBooking = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsBookingModalOpen(true);
    setBookingCount(1);
    setBookingMethod('offline');
    setBookingPurpose('remedial');
    setBookingDate('');
  };

  const calculatePrice = () => {
    if (!selectedTutor) return 0;
    const basePrice = selectedTutor.pricing[bookingMethod][bookingPurpose as 'remedial' | 'exam'];
    return basePrice * bookingCount;
  };

  const handleConfirmBooking = () => {
    if (!selectedTutor || !bookingDate) {
      alert('Mohon lengkapi tanggal pertemuan!');
      return;
    }

    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      tutorId: selectedTutor.id,
      tutorName: selectedTutor.name,
      studentName: 'Rizal Bakhri', // Simulated student name
      date: bookingDate,
      count: bookingCount,
      method: bookingMethod,
      purpose: bookingPurpose,
      totalPrice: calculatePrice(),
      status: 'pending',
      createdAt: Date.now()
    };

    setBookings([newBooking, ...bookings]);
    alert(`Pesanan berhasil dikirim ke ${selectedTutor.name}! Tunggu konfirmasi dari tutor.`);
    closeBooking();
  };

  const updateBookingStatus = (bookingId: string, status: 'accepted' | 'rejected' | 'completed') => {
    if (status === 'completed') {
      setRatingBookingId(bookingId);
    } else {
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
    }
  };

  const submitRating = () => {
    if (!ratingBookingId) return;
    setBookings(bookings.map(b => b.id === ratingBookingId ? { ...b, status: 'completed' } : b));
    setRatingBookingId(null);
    alert('Terima kasih atas ulasan Anda!');
  };

  const sendMessage = (bookingId: string, text: string, sender: 'student' | 'tutor') => {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      bookingId,
      sender,
      text,
      timestamp: Date.now()
    };
    setMessages([...messages, newMessage]);
  };

  const closeBooking = () => {
    setIsBookingModalOpen(false);
    setSelectedTutor(null);
  };

  const activeChatBooking = bookings.find(b => b.id === activeChatBookingId);
  const chatMessages = messages.filter(m => m.bookingId === activeChatBookingId);

  const handleDeleteRegistration = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pendaftaran ini?')) return;
    try {
      const res = await fetch(`/api/tutor-registrations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRegistrations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (res.ok) {
        setIsAdminLoggedIn(true);
        setShowAdminLogin(false);
        setAdminPassword('');
        fetchRegistrations();
      } else {
        alert('Password salah!');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                SMADA <span className="text-blue-600">Hub</span>
              </h1>
            </div>
              <div className="hidden md:flex space-x-8">
                <a href="#cari" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Cari Tutor</a>
                <a href="#daftar" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Jadi Tutor</a>
                <a href="#forum" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Forum</a>
                {isAdminLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowSpreadsheet(true)}
                      className="flex items-center gap-2 text-sm font-bold text-white bg-blue-600 px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 animate-pulse"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Kelola Pendaftar
                    </button>
                    <button 
                      onClick={() => setIsAdminLoggedIn(false)}
                      className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-xl hover:bg-red-100 transition-all shadow-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout Admin
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowAdminLogin(true)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    Admin
                  </button>
                )}
                <button 
                  onClick={() => setUserRole(userRole === 'student' ? 'tutor' : 'student')}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {userRole === 'student' ? 'Mode Tutor' : 'Mode Siswa'}
                </button>
              </div>
            <button className="md:hidden p-2 text-slate-600">
              <Users className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white pt-16 pb-24 border-b border-slate-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-3xl opacity-50" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 mb-6 border border-blue-100">
              Platform Tutor Sebaya SMAN 2 Pasuruan
            </span>
            <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
              {isAdminLoggedIn && isEditingSite ? (
                <input 
                  value={siteConfig.heroTitle}
                  onChange={(e) => setSiteConfig({...siteConfig, heroTitle: e.target.value})}
                  className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <>Belajar Lebih Asik Bareng <span className="text-blue-600">Teman Seangkatan</span></>
              )}
            </h2>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              {isAdminLoggedIn && isEditingSite ? (
                <textarea 
                  value={siteConfig.heroSubtitle}
                  onChange={(e) => setSiteConfig({...siteConfig, heroSubtitle: e.target.value})}
                  className="w-full bg-blue-50 border border-blue-200 rounded-xl p-2 outline-none focus:ring-2 focus:ring-blue-500 h-24"
                />
              ) : (
                siteConfig.heroSubtitle
              )}
            </p>
            {isAdminLoggedIn && (
              <div className="mb-8 flex justify-center gap-4">
                <button 
                  onClick={() => isEditingSite ? saveSiteConfig() : setIsEditingSite(true)}
                  className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-full hover:bg-slate-900 transition-all"
                >
                  {isEditingSite ? 'Simpan Perubahan' : 'Edit Teks Hero'}
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="#cari" 
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Cari Tutor Sekarang
              </a>
              <a 
                href="#daftar" 
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-semibold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Daftar Jadi Tutor
              </a>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-32">
        
        {/* Dashboard Section */}
        {bookings.length > 0 && (
          <section className="scroll-mt-24">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">
                  {userRole === 'student' ? 'Pesanan Saya' : 'Dashboard Tutor'}
                </h3>
                <div className="flex items-center gap-4">
                  <p className="text-slate-500">
                    {userRole === 'student' 
                      ? 'Pantau status belajarmu di sini.' 
                      : 'Kelola permintaan belajar dari siswa.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bookings
                .filter(b => userRole === 'student' || b.tutorId === '1') // Simulated tutor ID
                .map(booking => (
                  <div key={booking.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          booking.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          booking.status === 'accepted' ? 'bg-green-50 text-green-600' :
                          booking.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {booking.status}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {booking.date}
                        </span>
                      </div>
                      <h4 className="font-bold text-lg mb-1">
                        {userRole === 'student' ? `Tutor: ${booking.tutorName}` : `Siswa: ${booking.studentName}`}
                      </h4>
                      <p className="text-sm text-slate-500 mb-4">{booking.purpose} • {booking.count} Sesi • {booking.method}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {booking.status === 'accepted' && (
                          <button 
                            onClick={() => setActiveChatBookingId(booking.id)}
                            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Buka Chat
                          </button>
                        )}
                        {userRole === 'tutor' && booking.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateBookingStatus(booking.id, 'accepted')}
                              className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all"
                            >
                              Terima
                            </button>
                            <button 
                              onClick={() => updateBookingStatus(booking.id, 'rejected')}
                              className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-all"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {userRole === 'student' && booking.status === 'accepted' && (
                          <button 
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
                          >
                            Selesaikan & Beri Rating
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="sm:w-32 flex flex-col items-end justify-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                      <p className="text-lg font-black text-slate-900">Rp {booking.totalPrice.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Search & List Section */}
        <section id="cari" className="scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-2">Daftar Tutor Tersedia</h3>
              <p className="text-slate-500">Pilih tutor yang paling cocok dengan gaya belajarmu.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Cari nama atau kelas..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredTutors.map((tutor) => (
                <motion.div 
                  key={tutor.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={tutor.avatar} 
                          alt={tutor.name} 
                          className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-50"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" title="Online" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{tutor.name}</h4>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-xs font-bold">{tutor.rating}</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                          {tutor.class}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tutor.subjects.map((subject, idx) => (
                        <span key={idx} className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                          {subject}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p><strong>Capaian:</strong> {tutor.achievement}</p>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <BookOpen className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900 mb-0.5">Materi Spesifik:</p>
                        <p className="text-xs leading-relaxed">{tutor.subjects_taught || tutor.subjects.join(', ')}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pilihan Biaya</p>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                          <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50/30 rounded-2xl border border-blue-100/50 hover:bg-blue-50 transition-colors">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Video className="w-3 h-3 text-blue-600" />
                            <p className="text-[10px] font-bold text-blue-600 uppercase">Online</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-500">Materi</span>
                              <span className="font-bold text-slate-700">Rp{tutor.pricing.online.remedial / 1000}k</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-500">Ujian</span>
                              <span className="font-bold text-slate-700">Rp{tutor.pricing.online.exam / 1000}k</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 hover:bg-indigo-50 transition-colors">
                          <div className="flex items-center gap-1.5 mb-2">
                            <MapPin className="w-3 h-3 text-indigo-600" />
                            <p className="text-[10px] font-bold text-indigo-600 uppercase">Offline</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-500">Materi</span>
                              <span className="font-bold text-slate-700">Rp{tutor.pricing.offline.remedial / 1000}k</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-slate-500">Ujian</span>
                              <span className="font-bold text-slate-700">Rp{tutor.pricing.offline.exam / 1000}k</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        <strong>Tersedia:</strong> 
                        {tutor.availability.map((a, i) => (
                          <span key={i} className="bg-slate-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-100">{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => openBooking(tutor)}
                      className="flex-1 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      Pesan Tutor
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <a 
                      href={`https://wa.me/${tutor.whatsapp.replace(/^0/, '62')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all flex items-center justify-center"
                      title="Chat via WhatsApp"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {filteredTutors.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Tidak ada tutor yang ditemukan.</p>
            </div>
          )}
        </section>

        {/* Registration Section */}
        <section id="daftar" className="scroll-mt-24">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
              <div>
                <h3 className="text-4xl font-bold mb-6">Ayo Jadi Tutor!</h3>
                <p className="text-blue-100 text-lg mb-10 leading-relaxed">
                  Bagikan ilmumu, bantu teman-temanmu, dan dapatkan poin portofolio serta sertifikat penghargaan dari sekolah.
                </p>
                
                <ul className="space-y-6">
                  {[
                    "Sertifikat Tutor Sebaya Resmi",
                    "Poin Portofolio Ekstrakurikuler",
                    "Melatih Skill Komunikasi & Mengajar",
                    "Relasi dengan Angkatan Lain"
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-blue-300" />
                      <span className="font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-3xl p-8 text-slate-900 shadow-2xl">
                <form className="space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  if (isRegistering) return;
                  setIsRegistering(true);
                  
                  const formData = new FormData(e.currentTarget);
                  const data = {
                    name: formData.get('name'),
                    class: formData.get('class'),
                    whatsapp: formData.get('whatsapp'),
                    subject: formData.get('subject'),
                    subjects_taught: formData.get('subjects_taught'),
                    price_online_remedial: Number(formData.get('price_online_remedial')) || 0,
                    price_online_exam: Number(formData.get('price_online_exam')) || 0,
                    price_offline_remedial: Number(formData.get('price_offline_remedial')) || 0,
                    price_offline_exam: Number(formData.get('price_offline_exam')) || 0,
                    achievements: formData.get('achievements'),
                    availability: formData.get('availability'),
                  };

                  try {
                    const res = await fetch('/api/register-tutor', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data),
                    });
                    if (res.ok) {
                      alert('Pendaftaran berhasil! Data Anda telah masuk ke sistem.');
                      e.currentTarget.reset();
                    } else {
                      const errData = await res.json();
                      alert(`Gagal mendaftar: ${errData.error || 'Silakan coba lagi.'}`);
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Terjadi kesalahan koneksi. Pastikan internet Anda stabil.');
                  } finally {
                    setIsRegistering(false);
                  }
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nama Lengkap</label>
                      <input name="name" type="text" required placeholder="Contoh: Ahmad Fauzi" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Kelas</label>
                      <select name="class" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Pilih Kelas</option>
                        <option value="10">10</option>
                        <option value="11">11</option>
                        <option value="12">12</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nomor WhatsApp</label>
                      <input name="whatsapp" type="tel" required placeholder="Contoh: 08123456789" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Mata Pelajaran Unggulan</label>
                      <input name="subject" type="text" required placeholder="Contoh: Matematika, Fisika" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Materi yang Diampu (Detail)</label>
                    <input name="subjects_taught" type="text" placeholder="Contoh: Aljabar, Trigonometri, Mekanika" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tarif Per Sesi (Rp)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Online - Remedial/Materi</span>
                        <input name="price_online_remedial" type="number" placeholder="20000" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Online - Ujian/Tugas</span>
                        <input name="price_online_exam" type="number" placeholder="25000" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Offline - Remedial/Materi</span>
                        <input name="price_offline_remedial" type="number" placeholder="25000" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Offline - Ujian/Tugas</span>
                        <input name="price_offline_exam" type="number" placeholder="30000" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Pencapaian & Motivasi</label>
                    <textarea name="achievements" placeholder="Ceritakan sedikit tentang dirimu..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"></textarea>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Hari & Jam Ketersediaan</label>
                    <input name="availability" type="text" placeholder="Contoh: Senin (15:00-17:00), Sabtu (09:00-12:00)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isRegistering}
                    className={`w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 ${isRegistering ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isRegistering ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Ajukan Diri Sebagai Tutor'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section id="forum" className="scroll-mt-24">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Komunitas <span className="text-blue-600">Belajar</span></h3>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Pusat berbagi materi dan informasi dari Admin untuk setiap mata pelajaran.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Matematika', icon: <Calculator className="w-8 h-8 text-blue-600" />, color: 'blue' },
              { title: 'Fisika', icon: <Zap className="w-8 h-8 text-orange-600" />, color: 'orange' },
              { title: 'Biologi', icon: <Dna className="w-8 h-8 text-emerald-600" />, color: 'emerald' },
              { title: 'Bahasa Inggris', icon: <Languages className="w-8 h-8 text-purple-600" />, color: 'purple' }
            ].map((comm, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -8 }}
                onClick={() => {
                  setSelectedCommunity(comm.title);
                  setShowCommunityModal(true);
                }}
                className="group p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-2xl bg-${comm.color}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {comm.icon}
                </div>
                <h4 className="font-bold text-xl mb-2 text-slate-900">{comm.title}</h4>
                <p className="text-sm text-slate-500 mb-6">Update materi & soal-soal terbaru.</p>
                <div className={`text-sm font-bold text-${comm.color}-600 flex items-center gap-2`}>
                  Masuk Komunitas <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <GraduationCap className="text-white w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  SMADA <span className="text-blue-500">Hub</span>
                </h1>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed">
                Inisiatif siswa SMAN 2 Pasuruan untuk menciptakan lingkungan belajar yang kolaboratif dan suportif melalui tutor sebaya.
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-slate-200">Navigasi</h5>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#cari" className="hover:text-white transition-colors">Cari Tutor</a></li>
                <li><a href="#daftar" className="hover:text-white transition-colors">Jadi Tutor</a></li>
                <li><a href="#forum" className="hover:text-white transition-colors">Forum Diskusi</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-6 text-slate-200">Kontak</h5>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> SMAN 2 Pasuruan</li>
                <li className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> OSIS SMADA</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} SMADA Learning Hub. Dibuat dengan ❤️ oleh Siswa SMADA.
          </div>
        </div>
      </footer>

      {/* Community Modal */}
      <AnimatePresence>
        {showCommunityModal && selectedCommunity && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCommunityModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Komunitas {selectedCommunity}</h3>
                    <p className="text-xs text-slate-500">Hanya Admin yang dapat mengirim pesan</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCommunityModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                {Array.isArray(communityMessages[selectedCommunity]) && communityMessages[selectedCommunity].map((msg) => (
                  <div key={msg.id} className="flex flex-col gap-2">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 max-w-[85%]">
                      <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">{msg.sender}</p>
                      {msg.type === 'image' ? (
                        <div className="space-y-2">
                          <img src={msg.content} alt="Materi" className="rounded-xl w-full object-cover max-h-64" referrerPolicy="no-referrer" />
                          {msg.caption && <p className="text-sm text-slate-700">{msg.caption}</p>}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700 leading-relaxed">{msg.content}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {(communityMessages[selectedCommunity] || []).length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400">Belum ada materi yang dibagikan.</p>
                  </div>
                )}
              </div>

              {isAdminLoggedIn ? (
                <div className="p-6 border-t border-slate-100 bg-white space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Masukkan URL Foto (Opsional)..."
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      onClick={() => setNewImage('https://picsum.photos/seed/' + Date.now() + '/800/600')}
                      className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200"
                    >
                      Random Image
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Tulis materi atau pesan..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 text-center border-t border-blue-100">
                  <p className="text-xs font-bold text-blue-600 flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    Hanya Admin yang dapat mengirim materi ke komunitas ini.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSpreadsheet && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSpreadsheet(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Spreadsheet Pendaftar Tutor</h3>
                  <p className="text-slate-500">Data pendaftar tutor sebaya SMADA.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={fetchRegistrations}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-blue-600"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRegistering ? 'animate-spin' : ''}`} />
                  </button>
                  <a 
                    href="/api/export-csv" 
                    className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Download CSV
                  </a>
                  <button 
                    onClick={() => setShowSpreadsheet(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-8">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Nama</th>
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Kelas</th>
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">WhatsApp</th>
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Mapel</th>
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Ketersediaan</th>
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Pencapaian</th>
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 text-sm font-bold text-slate-900">{reg.name}</td>
                        <td className="py-4 px-4 text-sm text-slate-600">{reg.class}</td>
                        <td className="py-4 px-4 text-sm text-blue-600 font-medium">
                          <a href={`https://wa.me/${reg.whatsapp.replace(/^0/, '62')}`} target="_blank" rel="noreferrer">
                            {reg.whatsapp}
                          </a>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-600">{reg.subject}</td>
                        <td className="py-4 px-4 text-sm text-slate-500 max-w-xs truncate">{reg.availability}</td>
                        <td className="py-4 px-4 text-sm text-slate-500 max-w-xs truncate">{reg.achievements}</td>
                        <td className="py-4 px-4 text-xs text-slate-400">{new Date(reg.created_at).toLocaleDateString()}</td>
                        {isAdminLoggedIn && (
                          <td className="py-4 px-4 text-sm">
                            <button 
                              onClick={() => handleDeleteRegistration(reg.id)}
                              className="text-red-600 hover:text-red-800 font-bold"
                            >
                              Hapus
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {registrations.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-20 text-center text-slate-400">Belum ada pendaftar.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingBookingId && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-8 text-center"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-amber-500 fill-current" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Beri Rating Tutor</h3>
              <p className="text-slate-500 mb-8">Bagaimana pengalaman belajarmu bareng tutor ini?</p>
              
              <div className="flex justify-center gap-2 mb-10">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star}
                    onClick={() => setTempRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star className={`w-10 h-10 ${star <= tempRating ? 'text-amber-500 fill-current' : 'text-slate-200'}`} />
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setRatingBookingId(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Nanti Saja
                </button>
                <button 
                  onClick={submitRating}
                  className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Kirim Rating
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {activeChatBookingId && activeChatBooking && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveChatBookingId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveChatBookingId(null)}
                    className="p-2 hover:bg-white rounded-xl transition-colors md:hidden"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                  </button>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Chat dengan {userRole === 'student' ? activeChatBooking.tutorName : activeChatBooking.studentName}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Aktif selama periode pesanan
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveChatBookingId(null)}
                  className="p-2 hover:bg-white rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Belum ada pesan. Mulai percakapan sekarang!</p>
                  </div>
                ) : (
                  chatMessages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.sender === userRole ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                        msg.sender === userRole 
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-200' 
                          : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 opacity-60 ${msg.sender === userRole ? 'text-blue-100' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t border-slate-100 bg-white">
                <form 
                  className="flex gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                    if (input.value.trim()) {
                      sendMessage(activeChatBookingId, input.value, userRole);
                      input.value = '';
                    }
                  }}
                >
                  <input 
                    name="message"
                    type="text" 
                    placeholder="Tulis pesan..." 
                    className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <button className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminLogin(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-slate-900">Login Admin</h3>
                  <button onClick={() => setShowAdminLogin(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Password Admin</label>
                    <input 
                      type="password" 
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Masukkan password..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    Masuk
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && selectedTutor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeBooking}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Pesan Tutor</h3>
                    <p className="text-slate-500">Belajar bareng {selectedTutor.name}</p>
                  </div>
                  <button 
                    onClick={closeBooking}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Tanggal Pertemuan
                    </label>
                    <input 
                      type="date" 
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-sm font-bold text-slate-700">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Jumlah Pertemuan
                      </span>
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      value={bookingCount}
                      onChange={(e) => setBookingCount(parseInt(e.target.value) || 1)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Video className="w-4 h-4 text-blue-600" />
                      Metode Belajar
                    </label>
                    <select 
                      value={bookingMethod}
                      onChange={(e) => setBookingMethod(e.target.value as 'offline' | 'online')}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="offline">Offline (Ketemu di Sekolah)</option>
                      <option value="online">Online (G-Meet/Zoom)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      Tujuan Belajar
                    </label>
                    <select 
                      value={bookingPurpose}
                      onChange={(e) => setBookingPurpose(e.target.value as 'remedial' | 'exam')}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="remedial">Jelaskan Materi / Bantu Tugas</option>
                      <option value="exam">Persiapan Ujian / Ulangan</option>
                    </select>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Rincian Biaya</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Tarif Sesi ({bookingMethod === 'online' ? 'Online' : 'Offline'} - {bookingPurpose === 'remedial' ? 'Materi/Tugas' : 'Persiapan Ujian'})</span>
                        <span className="font-bold">Rp {selectedTutor.pricing[bookingMethod][bookingPurpose as 'remedial' | 'exam'].toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Jumlah Pertemuan</span>
                        <span className="font-bold">x{bookingCount}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-slate-900">Total Biaya</span>
                        <span className="text-xl font-black text-blue-600">Rp {calculatePrice().toLocaleString('id-ID')}</span>
                      </div>
                      <p className="text-[10px] text-blue-400 font-medium italic mt-2 text-center">
                        *Bayar langsung ke tutor setelah sesi selesai
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={closeBooking}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleConfirmBooking}
                      className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                    >
                      Konfirmasi Pesanan
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
