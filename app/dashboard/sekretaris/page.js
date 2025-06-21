"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

export default function DashboardSekretaris() {
  const [userData, setUserData] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [notifikasi, setNotifikasi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Ambil data user sekretaris
          const userDoc = await getDoc(doc(db, "sekretaris", user.uid));
          
          if (!userDoc.exists()) {
            await signOut(auth);
            router.push("/login");
            return;
          }

          const userData = userDoc.data();
          setUserData({
            name: userData.nama,
            email: user.email,
            ukm: userData.ukm || []
          });

          // 1. Ambil data notifikasi untuk sekretaris ini
          const notifQuery = query(
            collection(db, "notifikasi"),
            where("untuk", "==", user.uid)
          );
          const notifSnapshot = await getDocs(notifQuery);
          setNotifikasi(notifSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // 2. Ambil data agenda untuk UKM yang dikelola
          if (userData.ukm && userData.ukm.length > 0) {
            const agendaQuery = query(
              collection(db, "agenda"),
              where("ukm_id", "in", userData.ukm)
            );
            const agendaSnapshot = await getDocs(agendaQuery);
            setAgenda(agendaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          } else {
            setAgenda([]);
          }

        } catch (error) {
          console.error("Error fetching data:", error);
          await signOut(auth);
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Sekretaris UKM</h1>
            <p className="text-indigo-200">
              Selamat datang, {userData.name} | UKM: {userData.ukm?.join(", ") || "Tidak ada"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white text-indigo-700 rounded-lg hover:bg-indigo-100 transition flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === "dashboard" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("agenda")}
              className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === "agenda" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              Agenda
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Profil Sekretaris</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nama</p>
                    <p className="mt-1 text-sm text-gray-900">{userData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1 text-sm text-gray-900">{userData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">UKM Dikelola</p>
                    <p className="mt-1 text-sm text-gray-900">{userData.ukm?.join(", ") || "Tidak ada"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Notifikasi Terbaru</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {notifikasi.length} baru
                </span>
              </div>
              <div className="divide-y divide-gray-200">
                {notifikasi.length === 0 ? (
                  <div className="px-6 py-4 text-center text-gray-500">
                    Belum ada notifikasi
                  </div>
                ) : (
                  notifikasi.slice(0, 3).map((notif) => (
                    <div key={notif.id} className="px-6 py-4">
                      <p className="text-sm text-gray-800">{notif.pesan}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {notif.tanggal ? new Date(notif.tanggal.seconds * 1000).toLocaleString() : "-"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Jumlah UKM</p>
                    <p className="text-xl font-semibold text-gray-900">{userData.ukm?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Agenda Mendatang</p>
                    <p className="text-xl font-semibold text-gray-900">{agenda.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agenda Tab */}
        {activeTab === "agenda" && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Agenda Kegiatan UKM</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {agenda.length === 0 ? (
                  <div className="px-6 py-4 text-center text-gray-500">
                    Belum ada agenda kegiatan
                  </div>
                ) : (
                  agenda.map((item) => (
                    <div key={item.id} className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-1">
                          <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{item.judul}</h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {item.tanggal ? new Date(item.tanggal.seconds * 1000).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : "Tanggal belum tersedia"}
                          </p>
                          <p className="mt-2 text-sm text-gray-500">{item.deskripsi}</p>
                          <p className="mt-1 text-xs text-indigo-600">
                            Lokasi: {item.lokasi || "Tidak diketahui"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}