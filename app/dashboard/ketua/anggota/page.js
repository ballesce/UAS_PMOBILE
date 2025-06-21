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
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function VerifikasiAnggotaPage() {
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ketuaUkmId, setKetuaUkmId] = useState("");
  const [ukmId, setUkmId] = useState("");
  const [ukmName, setUkmName] = useState("");
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

  const fetchUkmId = async (uid) => {
    try {
      const q = query(collection(db, "ukms"), where("ketuaId", "==", uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const ukmDoc = querySnapshot.docs[0];
        setUkmId(ukmDoc.id);
        setUkmName(ukmDoc.data().nama);
        await fetchAnggota(ukmDoc.id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error loading UKM:", err);
      setLoading(false);
    }
  };

  const fetchAnggota = async (ukmId) => {
    try {
      const q = query(collection(db, "anggota"), where("ukmId", "==", ukmId));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnggota(data);
    } catch (err) {
      console.error("Error loading anggota:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifikasi = async (id, status) => {
    try {
      await updateDoc(doc(db, "anggota", id), {
        status,
        verifiedAt: status === "verified" ? new Date().toISOString() : null
      });

      // Update jumlahAnggota jika status menjadi verified
      if (status === "verified") {
        const ukmRef = doc(db, "ukms", ukmId);
        await updateDoc(ukmRef, {
          jumlahAnggota: increment(1),
        });
      }

      setAnggota((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status, verifiedAt: new Date().toISOString() } : a
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data anggota...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Verifikasi Anggota UKM</h1>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
            {ukmName}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {anggota.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Belum ada pendaftar</h3>
              <p className="mt-1 text-sm text-gray-500">
                Saat ini belum ada yang mendaftar untuk UKM {ukmName}.
              </p>
            </div>
          ) : (
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
                      Fakultas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jurusan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {anggota.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{a.nama}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {a.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {a.fakultas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {a.jurusan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            a.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : a.status === "verified"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {a.status === "pending" ? "Menunggu" : a.status === "verified" ? "Diterima" : "Ditolak"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {a.status === "pending" ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleVerifikasi(a.id, "verified")}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Terima
                            </button>
                            <button
                              onClick={() => handleVerifikasi(a.id, "rejected")}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sudah diverifikasi</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}