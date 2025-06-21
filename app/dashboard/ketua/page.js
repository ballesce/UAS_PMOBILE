"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from "firebase/firestore";

export default function DashboardKetua() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nama, setNama] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [anggotaBaru, setAnggotaBaru] = useState([]);
  const [kegiatan, setKegiatan] = useState([]);
  const [showTambahKegiatan, setShowTambahKegiatan] = useState(false);
  const [formKegiatan, setFormKegiatan] = useState({
    nama: "",
    tanggal: "",
    lokasi: "",
    deskripsi: ""
  });

  // Data statistik
  const [stats, setStats] = useState({
    totalAnggota: 0,
    pendingApproval: 0,
    kegiatanMendatang: 0
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().role === "ketua") {
          setUser(user);
          setNama(docSnap.data().name);
          loadInitialData();
        } else {
          router.push("/unauthorized");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadInitialData = async () => {
    // Load anggota butuh persetujuan
    const qAnggota = query(collection(db, "pendaftaran"), where("status", "==", "pending"));
    const queryAnggota = await getDocs(qAnggota);
    setAnggotaBaru(queryAnggota.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Load kegiatan mendatang
    const now = new Date();
    const qKegiatan = query(collection(db, "kegiatan"), where("tanggal", ">=", now));
    const queryKegiatan = await getDocs(qKegiatan);
    setKegiatan(queryKegiatan.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Load stats
    const totalAnggota = await getDocs(collection(db, "anggota"));
    setStats({
      totalAnggota: totalAnggota.size,
      pendingApproval: queryAnggota.size,
      kegiatanMendatang: queryKegiatan.size
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const handleApproveAnggota = async (id) => {
    await updateDoc(doc(db, "pendaftaran", id), { status: "approved" });
    setAnggotaBaru(anggotaBaru.filter(item => item.id !== id));
    setStats(prev => ({ ...prev, pendingApproval: prev.pendingApproval - 1 }));
  };

  const handleRejectAnggota = async (id) => {
    await updateDoc(doc(db, "pendaftaran", id), { status: "rejected" });
    setAnggotaBaru(anggotaBaru.filter(item => item.id !== id));
    setStats(prev => ({ ...prev, pendingApproval: prev.pendingApproval - 1 }));
  };

  const handleTambahKegiatan = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "kegiatan"), {
      ...formKegiatan,
      createdAt: new Date()
    });
    setShowTambahKegiatan(false);
    setFormKegiatan({ nama: "", tanggal: "", lokasi: "", deskripsi: "" });
    loadInitialData();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Dashboard Ketua UKM</h1>
          <p className="text-sm text-gray-500 mt-1">Halo, {nama}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveTab("dashboard")} className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left ${activeTab === "dashboard" ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-50 text-gray-700 hover:text-blue-600'} transition-colors`}>
            <span className="text-lg">🏠</span>
            <span>Dashboard</span>
          </button>
          
          <button onClick={() => setActiveTab("anggota")} className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left ${activeTab === "anggota" ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-50 text-gray-700 hover:text-blue-600'} transition-colors`}>
            <span className="text-lg">👥</span>
            <span>Kelola Anggota</span>
          </button>
          
          <button onClick={() => setActiveTab("kegiatan")} className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left ${activeTab === "kegiatan" ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-50 text-gray-700 hover:text-blue-600'} transition-colors`}>
            <span className="text-lg">📅</span>
            <span>Agenda Kegiatan</span>
          </button>
          
          <button onClick={() => setActiveTab("keuangan")} className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left ${activeTab === "keuangan" ? 'bg-blue-50 text-blue-600' : 'hover:bg-blue-50 text-gray-700 hover:text-blue-600'} transition-colors`}>
            <span className="text-lg">💰</span>
            <span>Laporan Keuangan</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === "dashboard" && (
          <div className="p-6 md:p-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Selamat datang, {nama}!</h2>
              <p className="text-gray-600 mb-6">Ini adalah dashboard manajemen UKM Anda.</p>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatCard title="Total Anggota" value={stats.totalAnggota} change="Lihat semua" onClick={() => setActiveTab("anggota")} />
                <StatCard title="Butuh Persetujuan" value={stats.pendingApproval} change="Tinjau sekarang" onClick={() => setActiveTab("anggota")} />
                <StatCard title="Kegiatan Mendatang" value={stats.kegiatanMendatang} change="Lihat agenda" onClick={() => setActiveTab("kegiatan")} />
              </div>
              
              {/* Anggota Butuh Persetujuan */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Pendaftaran Anggota Baru</h3>
                  <span className="text-sm text-gray-500">{anggotaBaru.length} perlu persetujuan</span>
                </div>
                {anggotaBaru.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Daftar</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {anggotaBaru.slice(0, 3).map(anggota => (
                          <tr key={anggota.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{anggota.nama}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{anggota.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(anggota.createdAt?.seconds * 1000).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                              <button 
                                onClick={() => handleApproveAnggota(anggota.id)}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200"
                              >
                                Setujui
                              </button>
                              <button 
                                onClick={() => handleRejectAnggota(anggota.id)}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200"
                              >
                                Tolak
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                    Tidak ada pendaftaran anggota baru yang perlu disetujui
                  </div>
                )}
              </div>
              
              {/* Kegiatan Mendatang */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Kegiatan Mendatang</h3>
                  <button 
                    onClick={() => setActiveTab("kegiatan")}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Lihat semua
                  </button>
                </div>
                {kegiatan.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kegiatan.slice(0, 3).map(item => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-medium text-gray-800">{item.nama}</h4>
                        <p className="text-sm text-gray-500 mt-1">{new Date(item.tanggal?.seconds * 1000).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600 mt-2">{item.lokasi}</p>
                        <button className="mt-3 text-sm text-blue-600 hover:text-blue-800">Detail</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                    Tidak ada kegiatan mendatang
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "anggota" && (
          <div className="p-6 md:p-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Kelola Anggota</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  + Tambah Anggota
                </button>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Persetujuan Anggota Baru</h3>
                {anggotaBaru.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      {/* Table header same as dashboard */}
                      <tbody className="bg-white divide-y divide-gray-200">
                        {anggotaBaru.map(anggota => (
                          <tr key={anggota.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{anggota.nama}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{anggota.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(anggota.createdAt?.seconds * 1000).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                              <button 
                                onClick={() => handleApproveAnggota(anggota.id)}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200"
                              >
                                Setujui
                              </button>
                              <button 
                                onClick={() => handleRejectAnggota(anggota.id)}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200"
                              >
                                Tolak
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                    Tidak ada pendaftaran anggota baru yang perlu disetujui
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Daftar Anggota</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  Fitur daftar anggota lengkap akan segera tersedia
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "kegiatan" && (
          <div className="p-6 md:p-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Agenda Kegiatan</h2>
                <button 
                  onClick={() => setShowTambahKegiatan(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  + Tambah Kegiatan
                </button>
              </div>
              
              {showTambahKegiatan && (
                <div className="mb-8 p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Tambah Kegiatan Baru</h3>
                  <form onSubmit={handleTambahKegiatan}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={formKegiatan.nama}
                          onChange={(e) => setFormKegiatan({...formKegiatan, nama: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={formKegiatan.tanggal}
                          onChange={(e) => setFormKegiatan({...formKegiatan, tanggal: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formKegiatan.lokasi}
                        onChange={(e) => setFormKegiatan({...formKegiatan, lokasi: e.target.value})}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        value={formKegiatan.deskripsi}
                        onChange={(e) => setFormKegiatan({...formKegiatan, deskripsi: e.target.value})}
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowTambahKegiatan(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Simpan Kegiatan
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Daftar Kegiatan</h3>
                {kegiatan.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kegiatan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {kegiatan.map(item => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{item.nama}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(item.tanggal?.seconds * 1000).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{item.lokasi}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                              <button className="text-red-600 hover:text-red-800">Hapus</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                    Belum ada kegiatan yang dijadwalkan
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "keuangan" && (
          <div className="p-6 md:p-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Laporan Keuangan</h2>
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <div className="mx-auto max-w-md">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Fitur Laporan Keuangan</h3>
                  <p className="text-gray-600 mb-6">Fitur ini akan segera hadir dengan berbagai kemampuan untuk mengelola keuangan UKM Anda.</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Beri Masukan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Reusable Components
function StatCard({ title, value, change, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs cursor-pointer hover:shadow-md transition-shadow"
    >
      <h4 className="text-sm font-medium text-gray-500">{title}</h4>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      <p className="text-sm text-blue-600 mt-2">{change}</p>
    </div>
  );
}