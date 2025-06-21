"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export default function KelolaAgenda() {
  const router = useRouter();
  const [agendaList, setAgendaList] = useState([]);
  const [ukmList, setUkmList] = useState([]);
  const [selectedUkm, setSelectedUkm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUkm, setIsLoadingUkm] = useState(false);

  useEffect(() => {
    const fetchUkmList = async () => {
      setIsLoadingUkm(true);
      try {
        const snapshot = await getDocs(collection(db, "ukms"));
        const data = snapshot.docs.map(doc => doc.data().nama);
        setUkmList(data);
      } catch (error) {
        console.error("Gagal memuat UKM:", error);
      } finally {
        setIsLoadingUkm(false);
      }
    };
    fetchUkmList();
  }, []);

  useEffect(() => {
    const fetchAgenda = async () => {
      setIsLoading(true);
      try {
        let q;
        if (selectedUkm) {
          q = query(
            collection(db, "agenda"),
            where("ukm.nama", "==", selectedUkm)
          );
        } else {
          q = query(collection(db, "agenda"));
        }

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
          const agendaData = doc.data();
          const status = getAgendaStatus(agendaData.tanggal);
          return {
            id: doc.id,
            ...agendaData,
            status
          };
        });
        setAgendaList(data);
      } catch (error) {
        console.error("Gagal memuat agenda:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgenda();
  }, [selectedUkm]);

  const getAgendaStatus = (tanggalString) => {
    if (!tanggalString) return "Belum";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const agendaDate = new Date(tanggalString);
    agendaDate.setHours(0, 0, 0, 0);
    
    return agendaDate < today ? "Selesai" : "Belum";
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus agenda ini?")) {
      try {
        await deleteDoc(doc(db, "agenda", id));
        setAgendaList(agendaList.filter(item => item.id !== id));
        alert("Agenda berhasil dihapus.");
      } catch (error) {
        console.error("Gagal menghapus agenda:", error);
        alert("Terjadi kesalahan saat menghapus.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium text-base"
      >
        ← Kembali
      </button>

      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kelola Agenda Kegiatan</h1>
        <p className="text-gray-600 mt-1">Data agenda kegiatan berdasarkan UKM</p>
      </header>

      {/* Filter UKM */}
      <section className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-sm mb-6 md:mb-8 border">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">Filter UKM</h2>
        <select
          value={selectedUkm}
          onChange={(e) => setSelectedUkm(e.target.value)}
          disabled={isLoadingUkm}
          className="w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Semua UKM --</option>
          {ukmList.map((ukm, i) => (
            <option key={i} value={ukm}>{ukm}</option>
          ))}
        </select>
        {isLoadingUkm && <p className="text-sm mt-1 text-gray-500">Memuat UKM...</p>}
      </section>

      {/* Tabel Agenda */}
      <section className="bg-white rounded-lg md:rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 md:p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">
            Daftar Agenda {selectedUkm && `- ${selectedUkm}`}
          </h2>
          <div className="text-sm text-gray-600">Total: {agendaList.length}</div>
        </div>

        {isLoading ? (
          <div className="p-6 md:p-8 text-center">
            <div className="animate-spin h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-blue-500 mx-auto rounded-full" />
            <p className="mt-3 md:mt-4 text-gray-700">Memuat data agenda...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium uppercase">
                <tr>
                  <th className="p-3 md:p-4">No</th>
                  <th className="p-3 md:p-4">Judul</th>
                  <th className="p-3 md:p-4">Tanggal</th>
                  <th className="p-3 md:p-4">Status</th>
                  <th className="p-3 md:p-4 hidden sm:table-cell">Lokasi</th>
                  <th className="p-3 md:p-4 hidden md:table-cell">Deskripsi</th>
                  <th className="p-3 md:p-4">UKM</th>
                  <th className="p-3 md:p-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agendaList.length > 0 ? agendaList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-3 md:p-4 font-medium text-gray-900">{index + 1}</td>
                    <td className="p-3 md:p-4 text-gray-900">{item.judul}</td>
                    <td className="p-3 md:p-4 text-gray-900">{item.tanggal}</td>
                    <td className="p-3 md:p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "Selesai" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 md:p-4 text-gray-900 hidden sm:table-cell">{item.lokasi}</td>
                    <td className="p-3 md:p-4 text-gray-900 hidden md:table-cell">{item.deskripsi}</td>
                    <td className="p-3 md:p-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 md:px-3 md:py-1 rounded-full whitespace-nowrap">
                        {item.ukm?.nama || "-"}
                      </span>
                    </td>
                    <td className="p-3 md:p-4">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Hapus"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="p-6 md:p-8 text-center text-gray-600">
                      {selectedUkm ? "Tidak ada agenda di UKM ini" : "Pilih UKM untuk menampilkan agenda"}
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