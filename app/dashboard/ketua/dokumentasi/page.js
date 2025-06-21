'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  PhotoIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function DokumentasiPreviewPage() {
  const [ukmId, setUkmId] = useState('');
  const [ukmName, setUkmName] = useState('');
  const [groupedDokumentasi, setGroupedDokumentasi] = useState({});
  const [filteredDokumentasi, setFilteredDokumentasi] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    const fetchDokumentasi = async () => {
      if (!ukmId) return;
      setIsLoading(true);
      try {
        const q = query(collection(db, 'dokumentasi'), where('ukmId', '==', ukmId));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const grouped = docs.reduce((acc, doc) => {
          const date = new Date(doc.tanggal).toISOString().split('T')[0];
          if (!acc[date]) acc[date] = [];
          acc[date].push(doc);
          return acc;
        }, {});
        setGroupedDokumentasi(grouped);
        setFilteredDokumentasi(grouped);
      } catch (error) {
        console.error('Gagal mengambil dokumentasi:', error);
        setError('Gagal memuat dokumentasi. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDokumentasi();
  }, [ukmId]);

  useEffect(() => {
    // Filter dokumentasi based on search term and selected date
    const filtered = Object.entries(groupedDokumentasi).reduce((acc, [date, items]) => {
      const filteredItems = items.filter(item => {
        const matchesSearch = item.judul.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = selectedDate 
          ? new Date(item.tanggal).toDateString() === selectedDate.toDateString()
          : true;
        return matchesSearch && matchesDate;
      });

      if (filteredItems.length > 0) {
        acc[date] = filteredItems;
      }
      return acc;
    }, {});

    setFilteredDokumentasi(filtered);
  }, [searchTerm, selectedDate, groupedDokumentasi]);

  const handleBack = () => router.back();

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const handleDownload = (fileData, fileType, fileName) => {
    const link = document.createElement('a');
    link.href = `data:${fileType};base64,${fileData}`;
    link.download = fileName;
    link.click();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDate(null);
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
        <h2 className="text-xl font-semibold text-gray-800">Akses Ditolak</h2>
        <p className="text-gray-600 mt-2">Anda tidak memiliki UKM yang terdaftar sebagai ketua.</p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-blue-600 text-white py-6 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">📸 Dokumentasi Kegiatan</h1>
          <p className="text-blue-100 mt-1">
            Kumpulan dokumentasi kegiatan dari UKM <span className="font-semibold">{ukmName}</span>
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center flex-wrap gap-2 mb-6">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" /> Kembali
            </button>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
              Dokumentasi {ukmName}
            </h2>
          </div>
          {Object.keys(filteredDokumentasi).length > 0 && (
            <span className="text-sm bg-white border border-blue-200 text-blue-600 px-4 py-1 rounded-full shadow-sm">
              {Object.values(filteredDokumentasi).flat().length} Dokumentasi
            </span>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari berdasarkan judul..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center justify-between w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                  {selectedDate ? selectedDate.toLocaleDateString('id-ID') : 'Filter berdasarkan tanggal'}
                </div>
              </button>

              {showDatePicker && (
                <div className="absolute z-10 mt-1 bg-white shadow-lg rounded-md p-2">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setShowDatePicker(false);
                    }}
                    inline
                    locale="id"
                    dateFormat="dd/MM/yyyy"
                    isClearable
                  />
                </div>
              )}
            </div>

            {(searchTerm || selectedDate) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
              >
                <XMarkIcon className="h-5 w-5 mr-1" />
                Hapus Filter
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-xl shadow-sm bg-white">
                <Skeleton height={200} />
                <div className="p-4">
                  <Skeleton width="80%" />
                  <Skeleton width="60%" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(filteredDokumentasi).length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <PhotoIcon className="h-10 w-10 mx-auto text-gray-400" />
            <h3 className="text-lg font-semibold mt-2">
              {searchTerm || selectedDate ? 'Tidak ditemukan dokumentasi' : 'Belum ada dokumentasi'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedDate 
                ? 'Coba dengan kata kunci atau tanggal yang berbeda' 
                : 'Unggah dokumentasi untuk melihat di sini.'}
            </p>
            {(searchTerm || selectedDate) && (
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Hapus Filter
              </button>
            )}
          </div>
        ) : (
          Object.entries(filteredDokumentasi)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .map(([tanggal, items]) => (
              <div key={tanggal} className="mb-10">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  📅 {formatDate(tanggal)}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-xl shadow-md hover:shadow-lg bg-white transition-shadow duration-200"
                    >
                      <div
                        className="h-48 overflow-hidden rounded-t-xl cursor-pointer"
                        onClick={() => setSelectedImage(item)}
                      >
                        {item.fileData ? (
                          <img
                            src={`data:${item.fileType};base64,${item.fileData}`}
                            alt={item.judul}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <PhotoIcon className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-800">{item.judul}</h3>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(item.tanggal)}
                        </p>
                        <button
                          onClick={() =>
                            handleDownload(item.fileData, item.fileType, `${item.judul}.jpg`)
                          }
                          className="mt-3 inline-flex items-center text-sm text-blue-600 hover:underline"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5 mr-1" /> Unduh
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Modal Preview */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-lg max-w-4xl w-full">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedImage(null)}
            >
              ✖
            </button>
            <img
              src={`data:${selectedImage.fileType};base64,${selectedImage.fileData}`}
              alt={selectedImage.judul}
              className="w-full h-auto object-contain max-h-[80vh] rounded-t-lg"
            />
            <div className="p-4">
              <h2 className="text-xl font-bold text-gray-800">{selectedImage.judul}</h2>
              <p className="text-gray-600 text-sm mt-1">
                📅 {formatDate(selectedImage.tanggal)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}