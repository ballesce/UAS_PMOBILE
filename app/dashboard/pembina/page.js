"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";

export default function DashboardPembina() {
  const [userData, setUserData] = useState(null);
  const [peringkatUKM, setPeringkatUKM] = useState([]);
  const [notifikasi, setNotifikasi] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Ambil data user pembina
          const userDoc = await getDoc(doc(db, "users", user.uid));
          
          if (!userDoc.exists() || userDoc.data().role !== "pembina") {
            await signOut(auth);
            router.push("/login");
            return;
          }

          const userData = userDoc.data();
          setUserData({
            name: userData.name,
            email: user.email,
            role: userData.role,
            ukm: userData.ukm || []
          });

          // 1. Ambil data peringkat UKM (hanya UKM yang dibina)
          if (userData.ukm && userData.ukm.length > 0) {
            const peringkatQuery = query(
              collection(db, "peringkat_ukm"),
              where("ukm_id", "in", userData.ukm)
            );
            const peringkatSnapshot = await getDocs(peringkatQuery);
            setPeringkatUKM(peringkatSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          } else {
            setPeringkatUKM([]);
          }

          // 2. Ambil data notifikasi untuk pembina ini
          const notifQuery = query(
            collection(db, "notifikasi"),
            where("untuk", "==", user.uid)
          );
          const notifSnapshot = await getDocs(notifQuery);
          setNotifikasi(notifSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // 3. Ambil data agenda untuk UKM yang dibina
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

          // 4. Ambil data anggota untuk UKM yang dibina
          if (userData.ukm && userData.ukm.length > 0) {
            const anggotaPromises = userData.ukm.map(async (ukmId) => {
              // Ambil data UKM terlebih dahulu
              const ukmDoc = await getDoc(doc(db, "ukm", ukmId));
              if (ukmDoc.exists()) {
                const ukmData = ukmDoc.data();
                
                // Ambil data anggota dari koleksi users
                if (ukmData.anggota && ukmData.anggota.length > 0) {
                  // Gunakan query dengan batasan 10 ID (limitation Firestore)
                  const batchSize = 10;
                  const anggotaBatches = [];
                  
                  for (let i = 0; i < ukmData.anggota.length; i += batchSize) {
                    const batch = ukmData.anggota.slice(i, i + batchSize);
                    anggotaBatches.push(batch);
                  }
                  
                  const batchResults = await Promise.all(
                    anggotaBatches.map(async (batch) => {
                      const anggotaQuery = query(
                        collection(db, "users"),
                        where("uid", "in", batch)
                      );
                      const anggotaSnapshot = await getDocs(anggotaQuery);
                      return anggotaSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        ukm: ukmData.name
                      }));
                    })
                  );
                  
                  return batchResults.flat();
                }
              }
              return [];
            });

            const anggotaResults = await Promise.all(anggotaPromises);
            setAnggota(anggotaResults.flat());
          } else {
            setAnggota([]);
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
            <h1 className="text-2xl font-bold">Dashboard Pembina UKM</h1>
            <p className="text-indigo-200">
              Selamat datang, {userData.name} | UKM: {userData.ukm?.length || 0}
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
              onClick={() => setActiveTab("peringkat")}
              className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === "peringkat" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              Peringkat UKM
            </button>
            <button
              onClick={() => setActiveTab("agenda")}
              className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === "agenda" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              Agenda
            </button>
            <button
              onClick={() => setActiveTab("anggota")}
              className={`px-4 py-3 font-medium text-sm border-b-2 ${activeTab === "anggota" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
            >
              Anggota
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
                <h2 className="text-lg font-semibold text-gray-800">Profil Pembina</h2>
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
                    <p className="text-sm font-medium text-gray-500">Jumlah UKM Dibina</p>
                    <p className="mt-1 text-sm text-gray-900">{userData.ukm?.length || 0}</p>
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
              {notifikasi.length > 3 && (
                <div className="px-6 py-3 bg-gray-50 text-right">
                  <button 
                    onClick={() => setActiveTab("notifikasi")}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Lihat semua notifikasi
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">UKM Dibina</p>
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

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Total Anggota</p>
                    <p className="text-xl font-semibold text-gray-900">{anggota.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Peringkat UKM Tab */}
        {activeTab === "peringkat" && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Peringkat UKM yang Dibina</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peringkat
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama UKM
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Skor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {peringkatUKM.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        Tidak ada data peringkat UKM saat ini
                      </td>
                    </tr>
                  ) : (
                    peringkatUKM.map((ukm, index) => (
                      <tr key={ukm.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              index < 3 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{ukm.nama_ukm}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ukm.skor}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Aktif
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                            UKM: {item.ukm_name || "Tidak diketahui"}
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

        {/* Anggota Tab */}
        {activeTab === "anggota" && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Daftar Anggota UKM</h2>
                <div className="text-sm text-gray-500">
                  Total: {anggota.length} anggota
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UKM
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {anggota.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        Belum ada anggota terdaftar di UKM yang Anda bina
                      </td>
                    </tr>
                  ) : (
                    anggota.map((angg) => (
                      <tr key={angg.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                              {angg.name?.charAt(0) || 'A'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{angg.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {angg.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {angg.ukm || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Aktif
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}