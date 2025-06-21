'use client'
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PhotoIcon, MapPinIcon, CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function DokumentasiPreviewPage() {
  const [ukmId, setUkmId] = useState('');
  const [ukmName, setUkmName] = useState('');
  const [dokumentasiList, setDokumentasiList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const [userDoc, ukmQuery] = await Promise.all([
            getDoc(doc(db, 'users', user.uid)),
            getDocs(query(collection(db, 'ukms'), where('sekretarisId', '==', user.uid)))
          ]);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'sekretaris' && !ukmQuery.empty) {
              const ukmDoc = ukmQuery.docs[0];
              setUkmId(ukmDoc.id);
              setUkmName(ukmDoc.data().nama);
              
              const dokumentasiQuery = await getDocs(
                query(collection(db, 'dokumentasi'), where('ukmId', '==', ukmDoc.id))
              );
              const docs = dokumentasiQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setDokumentasiList(docs);
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
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

  const handleBack = () => {
    router.back();
  };

  const handleAddNew = () => {
    router.push('/dokumentasi/tambah');
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Skeleton width={150} height={32} />
            <Skeleton width={100} height={40} />
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <Skeleton width={100} height={24} />
            <Skeleton width={200} height={32} className="ml-4" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="border rounded-lg overflow-hidden shadow-sm bg-white">
                <Skeleton height={200} className="w-full" />
                <div className="p-4">
                  <Skeleton count={1} width="80%" height={24} />
                  <div className="flex items-center mt-2">
                    <Skeleton circle width={16} height={16} />
                    <Skeleton width={120} height={16} className="ml-2" />
                  </div>
                  <div className="flex items-center mt-2">
                    <Skeleton circle width={16} height={16} />
                    <Skeleton width={100} height={16} className="ml-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!ukmId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-xl font-bold text-gray-900">Dokumentasi UKM</h1>
          </div>
        </header>
        
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mt-3">Akses Ditolak</h2>
            <p className="text-gray-600 mt-2">Anda tidak memiliki UKM yang terdaftar sebagai sekretaris.</p>
            <div className="mt-6">
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Dokumentasi {ukmName}</h1>
         
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800 mr-4 transition-colors duration-200 focus:outline-none"
              aria-label="Kembali"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Kembali</span>
            </button>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
              Daftar Dokumentasi Kegiatan
            </h2>
          </div>
          
          {dokumentasiList.length > 0 && (
            <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
              {dokumentasiList.length} {dokumentasiList.length > 1 ? 'Dokumentasi' : 'Dokumentasi'}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {dokumentasiList.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center animate-fade-in">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada dokumentasi</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Dokumentasi yang diunggah akan muncul di sini. Mulai unggah dokumentasi kegiatan UKM Anda.
            </p>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Tambah Dokumentasi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {dokumentasiList.map((item) => (
              <div 
                key={item.id} 
                className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white hover:shadow-md transition-all duration-300 group cursor-pointer"
                onClick={() => router.push(`/dokumentasi/${item.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  {item.fileData ? (
                    <img
                      src={`data:${item.fileType};base64,${item.fileData}`}
                      alt={item.judul}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {item.judul}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPinIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="line-clamp-1">{item.lokasi || 'Tidak ada lokasi'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span>{formatDate(item.tanggal)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}