"use client";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import {
  onAuthStateChanged, signOut
} from "firebase/auth";
import {
  doc, getDoc, collection, query, where, getDocs
} from "firebase/firestore";
import {
  FiLogOut, FiCalendar, FiUsers, FiAward, FiClock, FiHome, FiMessageSquare, FiMenu
} from "react-icons/fi";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardMahasiswa() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [absensiData, setAbsensiData] = useState({ total: 0, hadir: 0, persentase: 0 });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await signOut(auth);
          router.push("/login");
          return;
        }

        const userDataRaw = userSnap.data();
        if (userDataRaw.role !== "mahasiswa") {
          router.push("/login");
          return;
        }

        let statusKeanggotaan = "Belum diverifikasi";
        let ukm = "Belum memilih UKM";

        const anggotaQuery = query(
          collection(db, "anggota"),
          where("userId", "==", user.uid)
        );
        const anggotaSnap = await getDocs(anggotaQuery);

        if (!anggotaSnap.empty) {
          const anggotaData = anggotaSnap.docs[0].data();
          if (anggotaData.status === "verified") {
            statusKeanggotaan = "Terverifikasi";
            if (anggotaData.ukmId) {
              const ukmRef = doc(db, "ukms", anggotaData.ukmId);
              const ukmSnap = await getDoc(ukmRef);
              if (ukmSnap.exists()) {
                ukm = ukmSnap.data().nama || "UKM tidak ditemukan";
              }
            }
          }
        }

        const userDataFinal = {
          name: userDataRaw.name,
          email: user.email,
          role: userDataRaw.role,
          statusKeanggotaan,
          ukm,
        };

        setUserData(userDataFinal);

        // Fetch absensi
        const q = query(collection(db, "absensi"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const total = snapshot.size;
        const hadir = snapshot.docs.filter(doc => doc.data().status === "hadir").length;
        const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;
        setAbsensiData({ total, hadir, persentase });

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed z-40 inset-y-0 left-0 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:inset-0 w-64 bg-blue-800 text-white transition-transform duration-300 ease-in-out`}>
        <div className="p-4 flex items-center justify-between border-b border-blue-700">
          <h1 className="text-xl font-bold">Anggota</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-white">✕</button>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/dashboard/mahasiswa" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-700">
            <FiHome /> <span>Dashboard</span>
          </Link>
          <Link href="/dashboard/mahasiswa/agenda" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-700">
            <FiCalendar /> <span>Agenda</span>
          </Link>
          <Link href="/dashboard/mahasiswa/dokumentasi" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-700">
            <FiMessageSquare /> <span>Dokumentasi</span>
          </Link>
          <Link href="/dashboard/mahasiswa/absensi" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-700">
            <FiMessageSquare /> <span>Absensi</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-blue-700">
          <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-700 w-full">
            <FiLogOut /> <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 md:p-6 bg-white shadow-sm flex items-center justify-between">
          <button className="md:hidden p-2 text-blue-800" onClick={() => setSidebarOpen(true)}>
            <FiMenu size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Selamat Datang, <span className="text-blue-600">{userData.name}</span>
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Dashboard Mahasiswa - {userData.ukm}
            </p>
          </div>
        </div>

        <main className="p-4 md:p-8 bg-gradient-to-br from-blue-50 to-blue-100 flex-1">
          {/* Status UKM */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-xl p-6 shadow border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-full text-green-600">
                  <FiUsers size={20} />
                </div>
                <h3 className="text-lg font-medium text-gray-700">Status Keanggotaan</h3>
              </div>
              <p className="text-3xl font-bold text-green-600 capitalize">{userData.statusKeanggotaan.toLowerCase()}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                  <FiAward size={20} />
                </div>
                <h3 className="text-lg font-medium text-gray-700">UKM</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600">{userData.ukm}</p>
            </div>
          </section>

          {/* Statistik Absensi */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-xl p-6 shadow border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                  <FiClock size={20} />
                </div>
                <h3 className="text-lg font-medium text-gray-700">Total Kehadiran</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{absensiData.hadir} / {absensiData.total}</p>
              <p className="text-gray-500 text-sm">Jumlah kehadiran dari total absensi</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                  <FiAward size={20} />
                </div>
                <h3 className="text-lg font-medium text-gray-700">Persentase Kehadiran</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{absensiData.persentase}%</p>
              <p className="text-gray-500 text-sm">Kehadiran terhadap semua agenda</p>
            </div>
          </section>

          {/* Grafik Pie */}
          <section className="bg-white rounded-xl p-6 shadow border mb-10">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Visualisasi Kehadiran</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={[
                      { name: 'Hadir', value: absensiData.hadir },
                      { name: 'Tidak Hadir', value: absensiData.total - absensiData.hadir }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#f87171" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
