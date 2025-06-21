'use client'
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [judul, setJudul] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [ukmId, setUkmId] = useState('');
  const [ukmOptions, setUkmOptions] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            
            if (userData.role === 'sekretaris') {
              const q = query(collection(db, 'ukms'), where('sekretarisId', '==', user.uid));
              const querySnapshot = await getDocs(q);
              
              const ukmList = [];
              querySnapshot.forEach((doc) => {
                ukmList.push({
                  id: doc.id,
                  nama: doc.data().nama,
                  ...doc.data()
                });
              });
              
              setUkmOptions(ukmList);
              if (ukmList.length > 0) {
                setUkmId(ukmList[0].id);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          setStatus('❌ Gagal memuat data UKM');
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isMounted]);

  const handleBack = () => {
    router.back();
  };

  const handleFileChange = (e) => {
    if (!isMounted) return;
    
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setStatus('❌ Ukuran file terlalu besar. Maksimal 10MB');
        return;
      }
      
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!isMounted) return;
    if (!file || !ukmId) return alert("Lengkapi semua field dan pilih gambar!");

    try {
      setIsUploading(true);
      setStatus('Menyimpan data...');
      
      const selectedUkm = ukmOptions.find(u => u.id === ukmId);
      const ukmName = selectedUkm?.nama || 'unknown';
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64String = reader.result.split(',')[1];
        
        try {
          await addDoc(collection(db, 'dokumentasi'), {
            judul,
            lokasi,
            tanggal,
            ukmId,
            ukmName,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileData: base64String,
            createdAt: serverTimestamp(),
          });

          setStatus(`✅ Berhasil menyimpan dokumentasi untuk ${ukmName}`);
          
          setJudul('');
          setLokasi('');
          setTanggal('');
          setFile(null);
          setImagePreview('');
        } catch (error) {
          console.error('Save error:', error);
          setStatus(`❌ Gagal menyimpan: ${error.message}`);
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        setStatus('❌ Gagal membaca file');
        setIsUploading(false);
      };
    } catch (error) {
      console.error('Error:', error);
      setStatus(`❌ Gagal: ${error.message}`);
      setIsUploading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (ukmOptions.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
        <div className="flex items-center mb-4">
          <button
            onClick={handleBack}
            className="mr-2 p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Akses Ditolak</h2>
        </div>
        <p className="text-gray-600">
          Anda tidak memiliki izin untuk mengupload dokumentasi atau data UKM tidak ditemukan.
        </p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center">
          <button
            onClick={handleBack}
            className="p-2 mr-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Upload Dokumentasi</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Form Upload Dokumentasi</h2>
            
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UKM</label>
                  <select
                    value={ukmId}
                    onChange={(e) => setUkmId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {ukmOptions.map((ukm) => (
                      <option key={ukm.id} value={ukm.id}>{ukm.nama}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="datetime-local"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Kegiatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Konser Amal 2023"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Kegiatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Auditorium Kampus"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Dokumentasi (Maks. 10MB)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    {file ? (
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 mb-2 overflow-hidden rounded-md">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-sm text-gray-600 truncate max-w-xs">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button 
                          type="button" 
                          onClick={() => {
                            setFile(null);
                            setImagePreview('');
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <>
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex flex-col sm:flex-row items-center justify-center text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                          >
                            <span>Upload file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="sr-only"
                              required
                            />
                          </label>
                          <p className="pl-1">atau drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {status && (
                <div className={`p-3 rounded-md ${status.includes('✅') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                  {status}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading || !file || !ukmId || !judul || !lokasi || !tanggal}
                  className={`px-6 py-2 rounded-lg text-white font-medium ${
                    isUploading || !file || !ukmId || !judul || !lokasi || !tanggal 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 transition-colors'
                  }`}
                >
                  {isUploading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menyimpan...
                    </span>
                  ) : 'Simpan Dokumentasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}