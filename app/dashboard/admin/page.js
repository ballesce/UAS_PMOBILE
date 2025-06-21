"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function AdminDashboard() {
  const router = useRouter();
  const [ukms, setUkms] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const ukmsSnapshot = await getDocs(collection(db, "ukms"));
        const ukmsData = ukmsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUkms(ukmsData);

        const q = query(
          collection(db, "users"),
          where("role", "==", "mahasiswa")
        );
        const querySnapshot = await getDocs(q);
        setTotalStudents(querySnapshot.size);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    router.push("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const filteredUkms = ukms.filter(ukm => 
    ukm.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ukm.deskripsi && ukm.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-blue-800 font-medium">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Mobile-Optimized Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-lg py-2" : "bg-gradient-to-r from-blue-600 to-indigo-600 py-3"}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-1.5 rounded-md ${scrolled ? "bg-blue-100 text-blue-600" : "bg-white/20 text-white"}`}>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className={`text-lg font-bold ${scrolled ? "text-gray-800" : "text-white"}`}>Sistem UKM</h1>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogout}
                className={`hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium ${scrolled ? "bg-gradient-to-r from-red-500 to-pink-600 text-white" : "bg-white text-blue-600"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden md:inline">Keluar</span>
              </button>

              <button
                onClick={toggleMenu}
                className={`sm:hidden p-1.5 rounded-md ${scrolled ? "text-gray-600 hover:bg-gray-100" : "text-white hover:bg-white/20"}`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="sm:hidden mt-3 pb-2">
              <button
                onClick={handleLogout}
                className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${scrolled ? "bg-gradient-to-r from-red-500 to-pink-600 text-white" : "bg-white text-blue-600"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="pt-20 pb-6 px-3 container mx-auto">
        {/* Dashboard Header */}
        <div className="mb-6 px-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard Admin</h1>
          <p className="text-blue-700 text-sm sm:text-base mt-1">Selamat datang di panel admin Sistem Informasi UKM</p>
        </div>

        {/* Stats Cards - Stack on mobile */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg p-4 shadow-sm border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-medium text-blue-800 uppercase tracking-wider">Total UKM</h2>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">{ukms.length}</p>
              </div>
              <div className="p-2 rounded-full bg-white text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${(ukms.filter(u => u.status === "Aktif").length / ukms.length * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs sm:text-sm text-blue-700 mt-1.5">
                <span className="font-medium">{ukms.filter(u => u.status === "Aktif").length}</span> UKM aktif
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg p-4 shadow-sm border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-medium text-indigo-800 uppercase tracking-wider">Mahasiswa</h2>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-1">{totalStudents}</p>
              </div>
              <div className="p-2 rounded-full bg-white text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full bg-indigo-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full" 
                  style={{ width: `${(ukms.reduce((sum, ukm) => sum + (ukm.jumlahAnggota || 0), 0) / totalStudents * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs sm:text-sm text-indigo-700 mt-1.5">
                <span className="font-medium">
                  {ukms.reduce((sum, ukm) => sum + (ukm.jumlahAnggota || 0), 0)}
                </span> anggota UKM
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions - Single column on mobile */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <a href="/admin/ukm" className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm border border-blue-100 hover:border-blue-300 transition">
            <div className="p-2 rounded-md bg-blue-100 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-800">Manajemen UKM</h3>
              <p className="text-xs sm:text-sm text-gray-600">Kelola unit kegiatan mahasiswa</p>
            </div>
          </a>
          
          <a href="/admin/mahasiswa" className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm border border-indigo-100 hover:border-indigo-300 transition">
            <div className="p-2 rounded-md bg-indigo-100 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-800">Data Mahasiswa</h3>
              <p className="text-xs sm:text-sm text-gray-600">Kelola data anggota UKM</p>
            </div>
          </a>
          
          <a href="/admin/kegiatan" className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm border border-purple-100 hover:border-purple-300 transition">
            <div className="p-2 rounded-md bg-purple-100 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-800">Jadwal Kegiatan</h3>
              <p className="text-xs sm:text-sm text-gray-600">Lihat agenda kegiatan UKM</p>
            </div>
          </a>
        </section>

        {/* UKM Table with Mobile Optimization */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-lg font-bold text-gray-800">Daftar UKM</h2>
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                placeholder="Cari UKM..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="bg-gradient-to-r from-blue-100 to-indigo-100 text-left text-gray-700 text-xs sm:text-sm font-medium uppercase tracking-wider">
                  <th className="p-3">No</th>
                  <th className="p-3">Nama UKM</th>
                  <th className="p-3 hidden sm:table-cell">Pembina</th>
                  <th className="p-3">Anggota</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUkms.map((ukm, index) => (
                  <tr key={ukm.id} className="hover:bg-blue-50/30 transition">
                    <td className="p-3 text-gray-700 font-medium text-xs sm:text-sm">{index + 1}</td>
                    <td className="p-3">
                      <div className="font-medium text-gray-800 text-sm">{ukm.nama}</div>
                      <div className="text-gray-600 text-xs line-clamp-1">{ukm.deskripsi || "Tidak ada deskripsi"}</div>
                    </td>
                    <td className="p-3 text-gray-700 text-sm hidden sm:table-cell">{ukm.pembina || "-"}</td>
                    <td className="p-3 text-gray-700 text-sm">{ukm.jumlahAnggota || 0}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        ukm.status === "Aktif" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {ukm.status || "Tidak diketahui"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs sm:text-sm text-gray-600 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div>Menampilkan 1-{filteredUkms.length} dari {filteredUkms.length} UKM</div>
            <div className="flex gap-1.5">
              <button className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 transition text-xs">Sebelumnya</button>
              <button className="px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition text-xs">1</button>
              <button className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 transition text-xs">Selanjutnya</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}