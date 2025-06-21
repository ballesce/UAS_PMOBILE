"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import Link from "next/link";

export default function DashboardSekretaris() {
  const [userData, setUserData] = useState(null);
  const [ukmData, setUkmData] = useState(null);
  const [agendaUkm, setAgendaUkm] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [jumlahAgenda, setJumlahAgenda] = useState(0);
  const [jumlahDokumentasi, setJumlahDokumentasi] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setLoading(true);
        setError(null);

        if (user) {
          console.log("User authenticated:", user.uid);
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
            console.log("User document not found");
            await signOut(auth);
            router.push("/login");
            return;
          }

          const data = docSnap.data();
          console.log("User data:", data);
          
          if (data.role !== "sekretaris") {
            console.log("User is not sekretaris, redirecting");
            await signOut(auth);
            router.push("/login");
            return;
          }

          const userData = {
            name: data.name,
            email: user.email,
            role: data.role,
            sekretarisId: user.uid,
            ukm: data.ukm || []
          };
          setUserData(userData);

          if (data.ukm && data.ukm.length > 0) {
            console.log("Fetching UKM data...");
            const ukmQuery = query(
              collection(db, "ukms"),
              where("sekretarisId", "==", user.uid)
            );
            
            const ukmSnapshot = await getDocs(ukmQuery);
            console.log("UKM snapshot:", ukmSnapshot.docs.length);
            
            if (!ukmSnapshot.empty) {
              const ukmDoc = ukmSnapshot.docs[0];
              const ukm = { id: ukmDoc.id, ...ukmDoc.data() };
              console.log("UKM data:", ukm);
              setUkmData(ukm);

              // Fetch agenda
              try {
                console.log("Fetching agenda...");
                const agendaQuery = query(
                  collection(db, "agenda"),
                  where("ukmId", "==", ukm.id)
                );
                const agendaSnapshot = await getDocs(agendaQuery);
                const agendaList = agendaSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }));
                console.log("Agenda items:", agendaList.length);
                setAgendaUkm(agendaList);
                setJumlahAgenda(agendaList.length);
              } catch (agendaError) {
                console.error("Error fetching agenda:", agendaError);
                setAgendaUkm([]);
                setJumlahAgenda(0);
              }

              // Fetch dokumentasi
              try {
                console.log("Fetching dokumentasi...");
                const dokumentasiQuery = query(
                  collection(db, "dokumentasi"),
                  where("ukmId", "==", ukm.id)
                );
                const dokumentasiSnapshot = await getDocs(dokumentasiQuery);
                setJumlahDokumentasi(dokumentasiSnapshot.size);
              } catch (dokumentasiError) {
                console.error("Error fetching dokumentasi:", dokumentasiError);
                setJumlahDokumentasi(0);
              }
            } else {
              console.log("No UKM found for this sekretaris");
            }
          } else {
            console.log("User has no UKM assigned");
          }
        } else {
          console.log("No user, redirecting to login");
          router.push("/login");
        }
      } catch (err) {
        console.error("Error in dashboard:", err);
        setError(err.message || "Terjadi kesalahan saat memuat data");
      } finally {
        setLoading(false);
        console.log("Loading complete");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setError("Gagal logout");
    }
  };

  // Function to format date from either string or Timestamp
  const formatDate = (date) => {
    if (!date) return "Tanggal belum ditentukan";
    
    const dateObj = typeof date === 'string' 
      ? new Date(date) 
      : new Date(date.seconds * 1000);
      
    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to check if date is upcoming
  const isUpcoming = (date) => {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' 
      ? new Date(date) 
      : new Date(date.seconds * 1000);
      
    return dateObj > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
          {error && <p className="mt-2 text-red-500">Error: {error}</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md mx-4">
          <h2 className="text-xl font-semibold text-gray-800">Terjadi Kesalahan</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Coba Lagi
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md mx-4">
          <h2 className="text-xl font-semibold text-gray-800">Sesi Tidak Valid</h2>
          <p className="mt-2 text-gray-600">Silakan login kembali</p>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full"
          >
            Ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  if (!ukmData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md mx-4">
          <h2 className="text-xl font-semibold text-gray-800">Anda belum ditugaskan ke UKM</h2>
          <p className="mt-2 text-gray-600">Silakan hubungi administrator untuk ditugaskan ke UKM tertentu</p>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-500 rounded-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-800">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full"
              title="Keluar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="lg:hidden bg-white shadow-md fixed inset-0 z-20 pt-16 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{userData.name}</p>
                <p className="text-xs text-gray-500">{userData.email}</p>
              </div>
            </div>
          </div>
          
          <nav className="px-2 py-4 space-y-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setShowMobileMenu(false); }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === "dashboard" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Dashboard
            </button>
            
            <button
              onClick={() => { setActiveTab("agenda"); setShowMobileMenu(false); }}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === "agenda" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Agenda
            </button>
            
            <Link
              href={`/dashboard/sekretaris/upload?ukmid=${ukmData.id}`}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
              onClick={() => setShowMobileMenu(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Upload Dokumen
            </Link>
            
            <Link
              href={`/dashboard/sekretaris/dokumentasi?ukmid=${ukmData.id}`}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
              onClick={() => setShowMobileMenu(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              Dokumentasi
            </Link>
          </nav>
          
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={() => setShowMobileMenu(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Tutup Menu
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <header className="hidden lg:block bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Dashboard Sekretaris</h1>
              <p className="text-sm text-gray-500">{ukmData.nama}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{userData.name}</p>
              <p className="text-xs text-gray-500">{userData.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              title="Keluar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === "dashboard" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span>Dashboard</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("agenda")}
              className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === "agenda" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>Agenda</span>
              </div>
            </button>
            <Link 
              href={`/dashboard/sekretaris/upload?ukmid=${ukmData.id}`}
              className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === "upload" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Upload Dokumen</span>
              </div>
            </Link>
            <Link 
              href={`/dashboard/sekretaris/dokumentasi?ukmid=${ukmData.id}`}
              className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === "dokumentasi" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span>Dokumentasi</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-md text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg md:text-xl font-bold">Selamat datang, {userData.name}</h2>
                  <p className="mt-1 opacity-90 text-sm md:text-base">Anda login sebagai Sekretaris {ukmData.nama}</p>
                </div>
                <div className="bg-white bg-opacity-20 p-2 md:p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Jumlah Agenda</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{jumlahAgenda}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Jumlah Dokumentasi</p>
                    <p className="text-xl sm:text-2xl font-semibold text-gray-900">{jumlahDokumentasi}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* UKM Profile */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Profil UKM</h2>
              </div>
              <div className="px-4 sm:px-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nama UKM</p>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{ukmData.nama}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pembina</p>
                    <p className="mt-1 text-sm text-gray-900">{ukmData.pembina || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ketua</p>
                    <p className="mt-1 text-sm text-gray-900">{ukmData.ketua || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</p>
                    <p className="mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ukmData.status === "Aktif" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {ukmData.status}
                      </span>
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</p>
                    <p className="mt-1 text-sm text-gray-900">{ukmData.deskripsi || "Tidak ada deskripsi"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agenda Tab */}
        {activeTab === "agenda" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Agenda Kegiatan</h2>
              <Link 
                href={`/dashboard/sekretaris/tambahagenda?ukmid=${ukmData.id}`}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
              >
                Tambah Agenda
              </Link>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              {agendaUkm.length === 0 ? (
                <div className="text-center p-6 sm:p-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">Belum ada agenda</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">Mulai dengan menambahkan agenda kegiatan UKM Anda.</p>
                  <div className="mt-4 sm:mt-6">
                    <Link
                      href={`/dashboard/sekretaris/tambahagenda?ukmid=${ukmData.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Tambah Agenda
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {agendaUkm.map((item) => (
                    <li key={item.id} className="hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">{item.judul}</p>
                          <div className="mt-2 sm:mt-0 sm:ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              isUpcoming(item.tanggal) 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {isUpcoming(item.tanggal) ? "Mendatang" : "Selesai"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-xs sm:text-sm text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(item.tanggal)}
                            </p>
                            <p className="mt-2 sm:mt-0 sm:ml-6 flex items-center text-xs sm:text-sm text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {item.lokasi || "Lokasi belum ditentukan"}
                            </p>
                          </div> 
                        </div>
                        <div className="mt-2">
                          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{item.deskripsi}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}