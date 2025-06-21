'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";
import { FiUsers, FiUser, FiInfo } from "react-icons/fi";

export default function DaftarUKM() {
  const [ukms, setUkms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUKM = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ukms"));
        const data = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          // Default values untuk field yang mungkin kosong
          jumlahAnggota: doc.data().jumlahAnggota || 0,
          status: doc.data().status || 'Aktif'
        }));
        setUkms(data);
      } catch (error) {
        console.error("Error fetching UKM:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUKM();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse text-gray-500">Memuat data UKM...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Daftar Unit Kegiatan Mahasiswa</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Temukan UKM yang sesuai dengan minat dan bakat Anda
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ukms.length > 0 ? (
            ukms.map((ukm) => (
              <div key={ukm.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-gray-800">{ukm.nama}</h2>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ukm.status === 'Aktif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ukm.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">{ukm.deskripsi}</p>
                  
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FiUsers className="mr-2 text-blue-500" />
                      <span>{ukm.jumlahAnggota} anggota</span>
                    </div>
                    
                    {ukm.pembina && (
                      <div className="flex items-center">
                        <FiUser className="mr-2 text-blue-500" />
                        <span>Pembina: {ukm.pembina}</span>
                      </div>
                    )}
                  </div>

          
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Tidak ada UKM yang terdaftar saat ini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}