'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function AgendaPreviewPage() {
  const [ukmId, setUkmId] = useState('');
  const [ukmName, setUkmName] = useState('');
  const [agendaList, setAgendaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();

            if (userData.role === 'ketua') {
              const ukmQuery = query(collection(db, 'ukms'), where('ketuaId', '==', user.uid));
              const ukmSnapshot = await getDocs(ukmQuery);

              if (!ukmSnapshot.empty) {
                const ukmDoc = ukmSnapshot.docs[0];
                setUkmId(ukmDoc.id);
                setUkmName(ukmDoc.data().nama);
              }
            } else if (userData.role === 'mahasiswa') {
              const anggotaQuery = query(
                collection(db, 'anggota'),
                where('userId', '==', user.uid),
                where('status', '==', 'verified')
              );
              const anggotaSnapshot = await getDocs(anggotaQuery);

              if (!anggotaSnapshot.empty) {
                const anggotaDoc = anggotaSnapshot.docs[0];
                const ukmId = anggotaDoc.data().ukmId;

                const ukmRef = doc(db, 'ukms', ukmId);
                const ukmSnap = await getDoc(ukmRef);

                if (ukmSnap.exists()) {
                  setUkmId(ukmId);
                  setUkmName(ukmSnap.data().nama);
                }
              }
            }
          }
        } catch (error) {
          console.error('Gagal mengambil data user atau UKM:', error);
          setError('Gagal memuat data. Silakan coba lagi.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAgenda = async () => {
      if (!ukmId) return;
      setIsLoading(true);
      try {
        const q = query(collection(db, 'agenda'), where('ukmId', '==', ukmId));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const sortedDocs = docs.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        setAgendaList(sortedDocs);
      } catch (error) {
        console.error('Gagal mengambil agenda:', error);
        setError('Gagal memuat agenda. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgenda();
  }, [ukmId]);

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString) => {
    const options = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (isLoading && !ukmId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!ukmId && !isLoading) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mt-3">Akses Ditolak</h2>
        <p className="text-gray-600 mt-2">Anda belum tergabung dalam UKM apa pun.</p>
        <button
          onClick={handleBack}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 mb-6 px-4 py-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-2 sm:mb-0"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>Kembali</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Agenda <span className="text-blue-600">{ukmName}</span>
          </h1>
        </div>
        {agendaList.length > 0 && (
          <div className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-medium">
            {agendaList.length} Agenda
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <Skeleton height={200} />
              <Skeleton className="mt-2" width="80%" />
              <Skeleton width="60%" />
              <Skeleton width="40%" />
            </div>
          ))}
        </div>
      ) : agendaList.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <CalendarIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada agenda</h3>
          <p className="text-gray-500">Agenda yang dibuat akan muncul di sini. Mulai buat agenda kegiatan UKM Anda.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agendaList.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{item.judul || 'Agenda tanpa judul'}</h3>
              <p className="text-gray-600 mb-3 line-clamp-3">{item.deskripsi || 'Tidak ada deskripsi'}</p>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <MapPinIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>{item.lokasi || 'Tidak ada lokasi'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>{formatDate(item.tanggal)}</span>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
