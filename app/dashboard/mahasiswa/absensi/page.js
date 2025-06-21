'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';

// Navbar langsung di dalam file
function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Sistem Absensi UKM</h1>
      </div>
    </nav>
  );
}

export default function AbsensiPage() {
  const [ukmId, setUkmId] = useState('');
  const [userId, setUserId] = useState('');
  const [status, setStatus] = useState('hadir');
  const [alasan, setAlasan] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [ukmName, setUkmName] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sudahAbsen, setSudahAbsen] = useState(false);
  const [absenHariIni, setAbsenHariIni] = useState(null);
  const router = useRouter();

  const today = new Date();
  const tanggalFormatted = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const tanggalOnly = today.toISOString().split('T')[0];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        setUserName(userData.name || '');

        let ukmIdTemp = '';

        if (userData.role === 'ketua') {
          const q = query(collection(db, 'ukms'), where('ketuaId', '==', user.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const ukmData = snap.docs[0].data();
            ukmIdTemp = snap.docs[0].id;
            setUkmId(ukmIdTemp);
            setUkmName(ukmData.nama || '');
          }
        } else if (userData.role === 'mahasiswa') {
          const q = query(
            collection(db, 'anggota'),
            where('userId', '==', user.uid),
            where('status', '==', 'verified')
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const anggotaData = snap.docs[0].data();
            ukmIdTemp = anggotaData.ukmId;
            setUkmId(ukmIdTemp);

            const ukmDoc = await getDoc(doc(db, 'ukms', anggotaData.ukmId));
            if (ukmDoc.exists()) {
              setUkmName(ukmDoc.data().nama || '');
            }
          }
        }

        if (ukmIdTemp) {
          const absensiQuery = query(
            collection(db, 'absensi'),
            where('userId', '==', user.uid),
            where('ukmId', '==', ukmIdTemp),
            where('tanggal', '==', tanggalOnly)
          );
          const absensiSnap = await getDocs(absensiQuery);
          if (!absensiSnap.empty) {
            setSudahAbsen(true);
            setAbsenHariIni(absensiSnap.docs[0].data());
          }
        }

        setIsLoading(false);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ukmId) {
      alert('Anda belum terdaftar di UKM manapun');
      return;
    }

    if ((status === 'tidak_hadir' || status === 'izin') && alasan.trim() === '') {
      alert('Harap isi alasan ketidakhadiran.');
      return;
    }

    setIsSubmitting(true);
    try {
      const q = query(
        collection(db, 'absensi'),
        where('userId', '==', userId),
        where('ukmId', '==', ukmId),
        where('tanggal', '==', tanggalOnly)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        alert('Kamu sudah mengisi absensi hari ini.');
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'absensi'), {
        userId,
        ukmId,
        userName,
        ukmName,
        status,
        tanggal: tanggalOnly,
        alasan: status !== 'hadir' ? alasan : '',
        timestamp: Timestamp.now(),
      });

      alert('Absensi berhasil disimpan!');
      setSudahAbsen(true);
      setAbsenHariIni({
        userId,
        ukmId,
        userName,
        ukmName,
        status,
        tanggal: tanggalOnly,
        alasan,
      });
    } catch (err) {
      console.error('Gagal menyimpan absensi:', err);
      alert('Gagal menyimpan absensi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6 text-center">
          <p className="text-gray-700">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Kembali
        </motion.button>

        <h1 className="text-3xl font-bold mb-2 text-gray-900">Absensi Harian</h1>
        <p className="text-gray-700 mb-6">📅 {tanggalFormatted}</p>

        <div className="bg-white shadow-md rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nama</p>
              <p className="text-lg font-medium text-gray-900">{userName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">UKM</p>
              <p className="text-lg font-medium text-gray-900">{ukmName}</p>
            </div>
          </div>
        </div>

        {sudahAbsen ? (
          <div className="bg-green-100 text-green-900 border border-green-300 p-5 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">✅ Kamu sudah absen hari ini.</h2>
            <p>Status: <span className="capitalize">{absenHariIni?.status}</span></p>
            {absenHariIni?.alasan && <p>Alasan: {absenHariIni.alasan}</p>}
            <p>Tanggal: {tanggalOnly}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Pilih Status Kehadiran</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['hadir', 'tidak_hadir', 'izin'].map((option) => (
                <motion.div
                  key={option}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => setStatus(option)}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                    status === option
                      ? option === 'hadir'
                        ? 'border-green-500 bg-green-50'
                        : option === 'tidak_hadir'
                        ? 'border-red-500 bg-red-50'
                        : 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-medium capitalize text-gray-900">{option.replace('_', ' ')}</p>
                </motion.div>
              ))}
            </div>

            {(status === 'tidak_hadir' || status === 'izin') && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900">Alasan</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Sakit, izin keluarga, dll..."
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !ukmId}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                isSubmitting || !ukmId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Absensi'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
