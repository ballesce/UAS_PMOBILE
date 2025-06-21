'use client';

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ChevronLeftIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function VerifikasiAnggotaPage() {
  const [absensi, setAbsensi] = useState([]);
  const [filteredAbsensi, setFilteredAbsensi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ketuaUkmId, setKetuaUkmId] = useState("");
  const [ukmId, setUkmId] = useState("");
  const [ukmName, setUkmName] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setKetuaUkmId(user.uid);
        await fetchUkmId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Filter data berdasarkan tanggal
    if (dateFilter) {
      const filtered = absensi.filter(item => 
        item.tanggal.includes(dateFilter)
      );
      setFilteredAbsensi(filtered);
    } else {
      setFilteredAbsensi(absensi);
    }
  }, [absensi, dateFilter]);

  const fetchUkmId = async (uid) => {
    try {
      const q = query(collection(db, "ukms"), where("ketuaId", "==", uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const ukmDoc = querySnapshot.docs[0];
        setUkmId(ukmDoc.id);
        setUkmName(ukmDoc.data().nama);
        await fetchAbsensi(ukmDoc.id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error loading UKM:", err);
      setLoading(false);
    }
  };

  const fetchAbsensi = async (ukmId) => {
    try {
      const q = query(collection(db, "absensi"), where("ukmId", "==", ukmId));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setAbsensi(data);
      setFilteredAbsensi(data);
    } catch (err) {
      console.error("Error loading absensi:", err);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: "Hadir", value: absensi.filter((a) => a.status === "hadir").length },
    { name: "Izin", value: absensi.filter((a) => a.status === "izin").length },
    { name: "Tidak Hadir", value: absensi.filter((a) => a.status === "tidak hadir").length },
  ];

  const COLORS = ["#34D399", "#FBBF24", "#F87171"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Memuat data absensi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Data Absensi UKM</h1>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {ukmName}
          </div>
        </div>
      </header>

      <main className="px-4 py-4">

        {/* Grafik Statistik Kehadiran */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Statistik Kehadiran</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} orang`, 'Jumlah']}
                />
                <Legend 
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 p-2 rounded">
              <p className="text-green-800 font-bold">{pieData[0].value}</p>
              <p className="text-xs text-green-600">Hadir</p>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <p className="text-yellow-800 font-bold">{pieData[1].value}</p>
              <p className="text-xs text-yellow-600">Izin</p>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <p className="text-red-800 font-bold">{pieData[2].value}</p>
              <p className="text-xs text-red-600">Tidak Hadir</p>
            </div>
          </div>
        </div>

        {/* Tabel Preview Absensi dengan Filter Tanggal */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Detail Absensi</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Menampilkan {filteredAbsensi.length} dari {absensi.length} catatan absensi
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Date Filter Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      <span className="text-sm">×</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alasan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAbsensi.length > 0 ? (
                  filteredAbsensi.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.userName}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.tanggal}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.status === "hadir"
                            ? "bg-green-100 text-green-800"
                            : item.status === "izin"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">{item.alasan || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">
                      {absensi.length === 0 
                        ? "Tidak ada data absensi yang tercatat" 
                        : "Tidak ada data absensi pada tanggal yang dipilih"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}