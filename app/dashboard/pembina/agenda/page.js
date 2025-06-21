'use client'
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function AgendaPreviewPage() {
  const [ukmId, setUkmId] = useState('');
  const [ukmName, setUkmName] = useState('');
  const [agendaList, setAgendaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.role === 'pembina') {
              const ukmQuery = query(collection(db, 'ukms'), where('pembinaId', '==', user.uid));
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
      try {
        const q = query(collection(db, 'agenda'), where('ukmId', '==', ukmId));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAgendaList(data);
      } catch (error) {
        console.error('Gagal mengambil agenda:', error);
      }
    };

    fetchAgenda();
  }, [ukmId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!ukmId) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 text-center">Akses Ditolak</h2>
        <p className="text-center text-gray-600 mt-2">Anda tidak memiliki UKM yang terdaftar sebagai sekretaris.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Agenda {ukmName}</h2>

      {agendaList.length === 0 ? (
        <p className="text-center text-gray-600">Belum ada agenda yang tersedia.</p>
      ) : (
        <div className="space-y-4">
          {agendaList.map((agenda) => (
            <div key={agenda.id} className="p-4 bg-gray-50 border rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700">{agenda.namaKegiatan}</h3>
              <p className="text-sm text-gray-600"><strong>Tanggal:</strong> {new Date(agenda.tanggal).toLocaleString()}</p>
              <p className="text-sm text-gray-600"><strong>Lokasi:</strong> {agenda.lokasi}</p>
              {agenda.deskripsi && <p className="text-sm text-gray-600 mt-2">{agenda.deskripsi}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
