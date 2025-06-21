"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import Link from 'next/link';
import { format, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';



export default function DashboardDosen() {
  const [userData, setUserData] = useState(null);
  const [ukmData, setUkmData] = useState(null);
  const [anggotaUkm, setAnggotaUkm] = useState([]);
  const [agendaUkm, setAgendaUkm] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          if (data.role !== "pembina") {
            router.push("/login");
          } else {
            setUserData({
              name: data.name,
              email: user.email,
              role: data.role,
              pembinaId: user.uid
            });

            // 1. Ambil data UKM yang dibina oleh dosen ini
            const ukmQuery = query(
              collection(db, "ukms"),
              where("pembinaId", "==", user.uid)
            );
            
            const ukmSnapshot = await getDocs(ukmQuery);
            if (!ukmSnapshot.empty) {
              const ukmDoc = ukmSnapshot.docs[0];
              const ukm = { id: ukmDoc.id, ...ukmDoc.data() };
              setUkmData(ukm);

              // 2. Ambil anggota UKM ini
              const anggotaQuery = query(
                collection(db, "users"),
                where("ukm", "==", ukm.nama),
                where("role", "==", "mahasiswa")
              );
              
              const anggotaSnapshot = await getDocs(anggotaQuery);
              const anggotaList = [];
              anggotaSnapshot.forEach((doc) => {
                anggotaList.push({ id: doc.id, ...doc.data() });
              });
              setAnggotaUkm(anggotaList);

              // 3. Ambil agenda UKM ini dengan pengurutan berdasarkan tanggal
              try {
                const agendaQuery = query(
                  collection(db, "agenda"),
                  where("ukmId", "==", ukm.id),
                );
                
                const agendaSnapshot = await getDocs(agendaQuery);
                const agendaList = [];
                agendaSnapshot.forEach((doc) => {
                  agendaList.push({ 
                    id: doc.id, 
                    ...doc.data(),
                    formattedDate: doc.data().tanggal 
                      ? format(new Date(doc.data().tanggal), 'PPPP p', { locale: id })
                      : 'Tanggal belum ditentukan',
                    dateObject: doc.data().tanggal ? new Date(doc.data().tanggal) : null
                  });
                });
                // Urutkan agenda berdasarkan tanggal (terdekat ke depan)
                agendaList.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
                setAgendaUkm(agendaList);
              } catch (error) {
                console.log("Collection agenda tidak ditemukan:", error);
              }
            } else {
              console.log("Dosen ini tidak membina UKM manapun");
            }
          }
        } else {
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

  // Function to highlight days with events in the calendar
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasEvent = agendaUkm.some(agenda => 
        agenda.dateObject && isSameDay(date, agenda.dateObject)
      );
      
      return hasEvent ? (
        <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full"></div>
      ) : null;
    }
  };

  // Function to get events for the selected date
  const getEventsForDate = (date) => {
    return agendaUkm.filter(agenda => 
      agenda.dateObject && isSameDay(date, agenda.dateObject)
    );
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

  if (!userData || !ukmData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Anda tidak membina UKM apapun</h2>
          <p className="mt-2 text-gray-600">Silakan hubungi admin untuk ditugaskan ke UKM</p>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Pembina {ukmData.nama}</h1>
            <p className="text-indigo-200">Selamat datang, {userData.name}</p>
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
      {/* Dashboard - Tetap pakai button dengan state */}
      <button
        onClick={() => setActiveTab("dashboard")}
        className={`px-4 py-3 font-medium text-sm border-b-2 ${
          activeTab === "dashboard" 
            ? "border-indigo-600 text-indigo-600" 
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Dashboard
      </button>

      {/* Anggota - Pakai Link */}
   <Link
  href={`/dashboard/pembina/anggota`}
  className="px-4 py-3 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
>
  Anggota
</Link>

      {/* Agenda - Tetap pakai button dengan state */}
      <button
        onClick={() => setActiveTab("agenda")}
        className={`px-4 py-3 font-medium text-sm border-b-2 ${
          activeTab === "agenda" 
            ? "border-indigo-600 text-indigo-600" 
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
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
            {/* UKM Profile Card */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Profil UKM</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nama UKM</p>
                    <p className="mt-1 text-sm text-gray-900">{ukmData.nama}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pembina</p>
                    <p className="mt-1 text-sm text-gray-900">{ukmData.pembina}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Deskripsi</p>
                    <p className="mt-1 text-sm text-gray-900">{ukmData.deskripsi}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Jumlah Anggota</p>
                    <p className="mt-1 text-sm text-gray-900">{ukmData.jumlahAnggota}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="mt-1 text-sm text-gray-900">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ukmData.status === "Aktif" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {ukmData.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <p className="text-sm font-medium text-gray-500">Total Anggota</p>
                    <p className="text-xl font-semibold text-gray-900">{ukmData.jumlahAnggota}</p>
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
                    <p className="text-xl font-semibold text-gray-900">
                      {agendaUkm.filter(agenda => new Date(agenda.tanggal) > new Date()).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar and Upcoming Agenda */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="bg-white shadow rounded-lg overflow-hidden lg:col-span-1">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Kalender Agenda</h2>
                </div>
                <div className="p-4">
                  <Calendar
                    onChange={setCalendarDate}
                    value={calendarDate}
                    locale="id-ID"
                    tileContent={tileContent}
                    className="border-0 w-full"
                  />
                </div>
                <div className="px-6 py-4 border-t border-gray-200">
                  <h3 className="text-md font-medium text-gray-800 mb-2">
                    Agenda pada {format(calendarDate, 'PPPP', { locale: id })}
                  </h3>
                  <div className="space-y-2">
                    {getEventsForDate(calendarDate).length === 0 ? (
                      <p className="text-sm text-gray-500">Tidak ada agenda pada hari ini</p>
                    ) : (
                      getEventsForDate(calendarDate).map(agenda => (
                        <div key={agenda.id} className="p-2 bg-indigo-50 rounded">
                          <p className="text-sm font-medium text-indigo-800">{agenda.namaKegiatan || agenda.judul}</p>
                          <p className="text-xs text-indigo-600">
                            {agenda.lokasi || 'Lokasi belum ditentukan'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Upcoming Agenda */}
              <div className="bg-white shadow rounded-lg overflow-hidden lg:col-span-2">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Agenda Mendatang</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {agendaUkm.filter(agenda => new Date(agenda.tanggal) > new Date()).length === 0 ? (
                    <div className="px-6 py-4 text-center text-gray-500">
                      Tidak ada agenda mendatang
                    </div>
                  ) : (
                    agendaUkm
                      .filter(agenda => new Date(agenda.tanggal) > new Date())
                      .slice(0, 5)
                      .map((agenda) => (
                        <div key={agenda.id} className="px-6 py-4 hover:bg-gray-50">
                          <h3 className="text-md font-medium text-gray-900">{agenda.namaKegiatan || agenda.judul}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Tanggal:</strong> {agenda.formattedDate || 
                              (agenda.tanggal ? format(new Date(agenda.tanggal), 'PPPP p', { locale: id }) : 'Tanggal belum ditentukan')}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Lokasi:</strong> {agenda.lokasi || 'Lokasi belum ditentukan'}
                          </p>
                          {agenda.deskripsi && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{agenda.deskripsi}</p>
                          )}
                        </div>
                      ))
                  )}
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
                <h2 className="text-lg font-semibold text-gray-800">Kalender Agenda</h2>
              </div>
              <div className="p-4">
                <Calendar
                  onChange={setCalendarDate}
                  value={calendarDate}
                  locale="id-ID"
                  tileContent={tileContent}
                  className="border-0 w-full"
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-800 mb-2">
                  Agenda pada {format(calendarDate, 'PPPP', { locale: id })}
                </h3>
                <div className="space-y-2">
                  {getEventsForDate(calendarDate).length === 0 ? (
                    <p className="text-sm text-gray-500">Tidak ada agenda pada hari ini</p>
                  ) : (
                    getEventsForDate(calendarDate).map(agenda => (
                      <div key={agenda.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <h4 className="text-md font-medium text-gray-900">{agenda.namaKegiatan || agenda.judul}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Waktu:</strong> {agenda.tanggal ? format(new Date(agenda.tanggal), 'p', { locale: id }) : 'Waktu belum ditentukan'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Lokasi:</strong> {agenda.lokasi || 'Lokasi belum ditentukan'}
                        </p>
                        {agenda.deskripsi && (
                          <p className="text-sm text-gray-500 mt-2">{agenda.deskripsi}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {agendaUkm.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Belum ada agenda</h3>
                <p className="mt-2 text-gray-500">Mulai dengan menambahkan agenda baru untuk UKM Anda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Semua Agenda</h3>
                {agendaUkm.map((agenda) => (
                  <div key={agenda.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">{agenda.namaKegiatan || agenda.judul}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Tanggal:</strong> {agenda.formattedDate || 
                            (agenda.tanggal ? format(new Date(agenda.tanggal), 'PPPP p', { locale: id }) : 'Tanggal belum ditentukan')}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Lokasi:</strong> {agenda.lokasi || 'Lokasi belum ditentukan'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        new Date(agenda.tanggal) > new Date() 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {new Date(agenda.tanggal) > new Date() ? 'Mendatang' : 'Selesai'}
                      </span>
                    </div>
                    {agenda.deskripsi && (
                      <p className="mt-3 text-gray-600">{agenda.deskripsi}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}