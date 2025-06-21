"use client";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  FiLogOut, FiCalendar, FiUsers, FiAward, FiClock, FiArrowRight,
  FiHome, FiSettings, FiBook, FiMessageSquare, FiMenu
} from "react-icons/fi";

export default function DashboardMahasiswa() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.role !== "mahasiswa") {
            router.push("/login");
            return;
          }

          setUserData({
            name: data.name,
            email: user.email,
            role: data.role,
            statusKeanggotaan: data.statusKeanggotaan || "Aktif",
            kegiatanDiikuti: data.kegiatanDiikuti || 0,
            ukm: data.ukm || "Belum memilih UKM",
          });

          const q = query(collection(db, "activities"), where("participants", "array-contains", user.uid));
          const querySnapshot = await getDocs(q);
          let recentActivities = [];
          querySnapshot.forEach((doc) => {
            recentActivities.push({ id: doc.id, ...doc.data() });
          });
          recentActivities = recentActivities.sort((a, b) => b.date.seconds - a.date.seconds).slice(0, 5);
          setActivities(recentActivities);
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
          <Link href="/agenda" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-700">
            <FiCalendar /> <span>Agenda</span>
          </Link>
          <Link href="/anggota" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-700">
            <FiUsers /> <span>Anggota</span>
          </Link>
          <Link href="/pengumuman" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-700">
            <FiMessageSquare /> <span>Pengumuman</span>
          </Link>
          <Link href="/pengaturan" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-700">
            <FiSettings /> <span>Pengaturan</span>
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
        {/* Header */}
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
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-xl p-6 shadow border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                  <FiCalendar size={20} />
                </div>
                <h3 className="text-lg font-medium text-gray-700">Kegiatan Diikuti</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{userData.kegiatanDiikuti}</p>
            </div>
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

          <section className="bg-white rounded-xl shadow p-6 border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FiCalendar className="text-blue-500" /> Kegiatan Terbaru
              </h2>
              <Link href="/agenda" className="text-sm text-blue-600 hover:underline">
                Lihat Semua
              </Link>
            </div>

            {activities.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">Belum ada kegiatan yang diikuti</p>
                <Link href="/agenda" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Cari Kegiatan <FiArrowRight />
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {activities.map((act) => (
                  <li key={act.id} className="border rounded-lg p-4 hover:shadow">
                    <h3 className="text-lg font-semibold text-gray-800">{act.title}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                      <FiClock /> {new Date(act.date.seconds * 1000).toLocaleDateString('id-ID')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
