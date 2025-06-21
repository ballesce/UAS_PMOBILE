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
      setIsLoading(true);
      try {
        if (!user) {
          router.push('/login');
          return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          throw new Error('User data not found');
        }

        const userData = userDocSnap.data();
        if (userData.role !== 'ketua') {
          setError('Hanya ketua UKM yang dapat mengakses');
          setIsLoading(false);
          return;
        }

        const ukmQuery = query(collection(db, 'ukms'), where('ketuaId', '==', user.uid));
        const ukmSnapshot = await getDocs(ukmQuery);

        if (ukmSnapshot.empty) {
          setError('Anda belum terdaftar sebagai ketua UKM');
          setIsLoading(false);
          return;
        }

        const ukmDoc = ukmSnapshot.docs[0];
        setUkmId(ukmDoc.id);
        setUkmName(ukmDoc.data().nama);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchAgenda = async () => {
      if (!ukmId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const q = query(collection(db, 'agenda'), where('ukmId', '==', ukmId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setAgendaList([]);
          return;
        }

        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sortedDocs = docs.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        setAgendaList(sortedDocs);
      } catch (error) {
        console.error('Error:', error);
        setError('Gagal memuat agenda');
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchAgenda();
    }, 500); // Small delay to prevent flickering

    return () => clearTimeout(timer);
  }, [ukmId]);

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('id-ID', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    
    return `${day} ${month} ${year} • ${time}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-sm max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
            <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Terjadi Kesalahan</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
            }}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !ukmId) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Kembali"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-800 truncate">Agenda UKM</h1>
            <p className="text-xs text-blue-500 truncate">{ukmName}</p>
          </div>
          {agendaList.length > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {agendaList.length}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <Skeleton height={20} width="70%" className="mb-3" />
                <Skeleton height={16} width="90%" className="mb-2" />
                <Skeleton height={16} width="60%" />
              </div>
            ))}
          </div>
        ) : agendaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm">
            <div className="bg-gray-100 p-4 rounded-full mb-3">
              <CalendarIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-gray-800 font-medium mb-1">Belum ada agenda</h3>
            <p className="text-gray-500 text-sm text-center max-w-xs">
              Tambahkan agenda baru untuk memulai kegiatan UKM Anda
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {agendaList.map((item) => (
              <article 
                key={item.id} 
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-gray-800 mb-2 line-clamp-2">
                  {item.judul || 'Agenda tanpa judul'}
                </h3>
                {item.deskripsi && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {item.deskripsi}
                  </p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">
                      {formatDate(item.tanggal)}
                    </span>
                  </div>
                  
                  {item.lokasi && (
                    <div className="flex items-start space-x-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm line-clamp-1">
                        {item.lokasi}
                      </span>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}