'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import Navbar from "../components/Navbar";
import { motion } from 'framer-motion';
import Head from 'next/head';
import { TrophyIcon } from '@heroicons/react/24/solid';

export default function PeringkatUKMPage() {
  const [ukmList, setUkmList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUKMs = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'ukms'));

        const ukms = querySnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            nama: data.nama || 'UKM Tanpa Nama',
            jumlahAnggota: data.jumlahAnggota || 0
          };
        });

        const sorted = ukms.sort((a, b) => b.jumlahAnggota - a.jumlahAnggota);
        setUkmList(sorted);
      } catch (err) {
        console.error('Gagal mengambil data UKM:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUKMs();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Head>
        <title>Peringkat UKM | Sistem Informasi Kampus</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Peringkat UKM
            </span>
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Daftar Unit Kegiatan Mahasiswa berdasarkan jumlah anggota terbanyak
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : ukmList.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="inline-flex items-center justify-center bg-red-100 rounded-full p-3 mb-3">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada data UKM</h3>
            <p className="text-sm text-gray-600">Belum ada UKM yang terdaftar dalam sistem</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {/* Top 3 Cards - Stacked on mobile */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              {ukmList.slice(0, 3).map((ukm, index) => (
                <motion.div
                  key={ukm.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className={`rounded-xl shadow-lg overflow-hidden ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-300' :
                    index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-200' :
                    'bg-gradient-to-br from-amber-600 to-amber-500'
                  }`}
                >
                  <div className="p-4 sm:p-6 text-center">
                    <div className="flex justify-center mb-3">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{ukm.nama}</h3>
                    <div className="text-white font-medium mb-2">
                      {ukm.jumlahAnggota} Anggota
                    </div>
                    <div className="flex justify-center">
                      <TrophyIcon className={`h-12 w-12 ${
                        index === 0 ? 'text-yellow-100' :
                        index === 1 ? 'text-gray-100' :
                        'text-amber-100'
                      }`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Full Ranking Table - Simplified for mobile */}
            <motion.div 
              variants={itemVariants}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Rank
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        UKM
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Anggota
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ukmList.map((ukm, index) => (
                      <motion.tr
                        key={ukm.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold ${
                              index < 3 ? 
                                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                index === 1 ? 'bg-gray-100 text-gray-800' :
                                'bg-amber-100 text-amber-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <TrophyIcon className={`h-6 w-6 ${
                                index < 3 ? 
                                  index === 0 ? 'text-yellow-500' :
                                  index === 1 ? 'text-gray-400' :
                                  'text-amber-500' :
                                  'text-blue-400'
                              }`} />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-semibold text-gray-900 line-clamp-1">{ukm.nama}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{ukm.jumlahAnggota}</div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}