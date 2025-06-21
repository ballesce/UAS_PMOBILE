"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function KelolaMahasiswa() {
  const router = useRouter();
  const [mahasiswa, setMahasiswa] = useState([]);
  const [ukmList, setUkmList] = useState([]);
  const [selectedUkm, setSelectedUkm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUkm, setIsLoadingUkm] = useState(false);

  useEffect(() => {
    const fetchUkmList = async () => {
      setIsLoadingUkm(true);
      try {
        const querySnapshot = await getDocs(collection(db, "ukms"));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          nama: doc.data().nama,
        }));
        setUkmList(data);
      } catch (error) {
        console.error("Error fetching UKM list:", error);
      } finally {
        setIsLoadingUkm(false);
      }
    };

    fetchUkmList();
  }, []);

  useEffect(() => {
    if (selectedUkm) {
      const fetchMahasiswa = async () => {
        setIsLoading(true);
        try {
          const q = query(
            collection(db, "anggota"),
            where("ukmId", "==", selectedUkm),
            where("status", "==", "verified")
          );
          const querySnapshot = await getDocs(q);
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMahasiswa(data);
        } catch (error) {
          console.error("Error fetching verified anggota:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMahasiswa();
    } else {
      setMahasiswa([]);
    }
  }, [selectedUkm]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Tombol Kembali */}
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali
      </button>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Kelola Data Mahasiswa</h1>
          <p className="text-gray-500 mt-1">Manajemen anggota mahasiswa terverifikasi per UKM</p>
        </div>
      </header>

      {/* Filter UKM */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filter Data</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih UKM</label>
            <select
              value={selectedUkm}
              onChange={(e) => setSelectedUkm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoadingUkm}
            >
              <option value="">-- Semua UKM --</option>
              {ukmList.map((ukm) => (
                <option key={ukm.id} value={ukm.id}>{ukm.nama}</option>
              ))}
            </select>
            {isLoadingUkm && (
              <p className="mt-1 text-sm text-gray-500">Memuat daftar UKM...</p>
            )}
          </div>
        </div>
      </section>

      {/* Tabel Mahasiswa */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Daftar Mahasiswa Terverifikasi {selectedUkm && `- ${ukmList.find(u => u.id === selectedUkm)?.nama}`}
          </h2>
          <div className="text-sm text-gray-500">
            Total: {mahasiswa.length} mahasiswa
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-sm font-medium uppercase tracking-wider">
                  <th className="p-4">No</th>
                  <th className="p-4">Nama</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Fakultas</th>
                  <th className="p-4">Jurusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mahasiswa.length > 0 ? (
                  mahasiswa.map((mhs, index) => (
                    <tr key={mhs.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-700 font-medium">{index + 1}</td>
                      <td className="p-4 font-medium text-gray-800">{mhs.nama}</td>
                      <td className="p-4 text-gray-600">{mhs.email}</td>
                      <td className="p-4 text-gray-600">{mhs.fakultas}</td>
                      <td className="p-4 text-gray-600">{mhs.jurusan}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      {selectedUkm
                        ? "Tidak ada mahasiswa terverifikasi di UKM ini"
                        : "Pilih UKM untuk melihat daftar mahasiswa"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
