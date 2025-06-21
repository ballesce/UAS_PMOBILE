"use client";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  FiLogOut, FiCalendar, FiUsers, FiUser, FiBook, FiMenu, FiHome
} from "react-icons/fi";

export default function DashboardMahasiswa() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          if (!["mahasiswa", "ketua"].includes(data.role)) {
            router.push("/login");
            return;
          }

          let ukmNama = "Belum memilih UKM";
          if (data.ukm) {
            const ukmRef = doc(db, "ukms", data.ukm);
            const ukmSnap = await getDoc(ukmRef);
            if (ukmSnap.exists()) {
              const ukmData = ukmSnap.data();
              ukmNama = ukmData.nama || ukmSnap.id;
            }
          }

          setUserData({
            name: data.name,
            email: user.email,
            role: data.role,
            statusKeanggotaan: data.statusKeanggotaan || "Aktif",
            kegiatanDiikuti: data.kegiatanDiikuti || 0,
            ukm: ukmNama,
          });

          setLoading(false);
        } else {
          await signOut(auth);
          router.push("/login");
        }

        setLoading(false);
      } else {
        router.push("/login");
        setLoading(false);
      }
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Hidden by default on all screens */}
      <div className={`fixed z-40 inset-y-0 left-0 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} w-64 bg-blue-700 text-white transition-transform duration-300 ease-in-out`}>
        <div className="p-4 flex items-center justify-between border-b border-blue-600">
          <h1 className="text-xl font-bold">UKM Dashboard</h1>
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-white">
            ✕
          </button>
        </div>
        <nav className="p-4 space-y-1">

          <Link href="/dashboard/ketua/agenda" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 transition-colors">
            <FiCalendar className="text-lg" /> <span>Kegiatan</span>
          </Link>
          <Link href="/dashboard/ketua/anggota" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 transition-colors">
            <FiUsers className="text-lg" /> <span>Anggota</span>
          </Link>
          {userData.role === "ketua" && (
            <>
              <Link href="/dashboard/ketua/dokumentasi" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 transition-colors">
                <FiUser className="text-lg" /> <span>Dokumentasi</span>
              </Link>
              <Link href="/dashboard/ketua/absensi" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 transition-colors">
                <FiBook className="text-lg" /> <span>Absensi</span>
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-blue-600 absolute bottom-0 w-full">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-600 transition-colors w-full"
          >
            <FiLogOut className="text-lg" /> <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-4 md:p-6 bg-white shadow-sm flex items-center justify-between sticky top-0 z-30">
          <button 
            className="p-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FiMenu size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Selamat Datang, <span className="text-blue-600">{userData.name}</span>
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Dashboard {userData.role === "ketua" ? "Ketua UKM" : "Mahasiswa"} - {userData.ukm}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
              {userData.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Main Section */}
        <main className="p-4 md:p-8 flex-1 space-y-8">
          {userData.role === "ketua" ? (
            <>
              {/* Informasi UKM */}
              <div className="bg-white p-6 rounded-xl shadow space-y-2 border border-blue-100">
                <h2 className="text-xl font-bold text-blue-700">Informasi UKM</h2>
                <p className="text-gray-800"><strong>Nama UKM:</strong> {userData.ukm}</p>
                <p className="text-xs text-gray-500">Dibuat pada: 20 Juni 2025</p>
              </div>

              {/* Navigasi Cepat */}
              <div className="bg-white p-6 rounded-xl shadow border border-blue-100">
                <h2 className="text-xl font-bold text-blue-700 mb-4">Navigasi Cepat</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link href="/dashboard/ketua/agenda" className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition">
                    📅 Lihat Agenda
                  </Link>
                  <Link href="/dashboard/ketua/anggota" className="bg-green-600 hover:bg-green-700 text-white text-center py-3 rounded-lg font-medium transition">
                    👥 Lihat Anggota
                  </Link>
                  <Link href="/dashboard/ketua/dokumentasi" className="bg-indigo-600 hover:bg-indigo-700 text-white text-center py-3 rounded-lg font-medium transition">
                    📸 Dokumentasi Kegiatan
                  </Link>
                  <Link href="/dashboard/ketua/absensi" className="bg-yellow-500 hover:bg-yellow-600 text-white text-center py-3 rounded-lg font-medium transition">
                    📝 Kelola Absensi
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow border border-blue-100">
              <h2 className="text-xl font-bold text-blue-700 mb-4">Dashboard Mahasiswa</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-700">Status Keanggotaan</h3>
                  <p className="text-gray-800">{userData.statusKeanggotaan}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-700">UKM</h3>
                  <p className="text-gray-800">{userData.ukm}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-700">Kegiatan Diikuti</h3>
                  <p className="text-gray-800">{userData.kegiatanDiikuti} kegiatan</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
