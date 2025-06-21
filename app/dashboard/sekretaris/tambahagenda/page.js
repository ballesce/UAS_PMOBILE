"use client";

import { useState, useEffect } from "react";
import { tambahAgenda } from "@/lib/tambahAgenda";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function TambahAgendaPage() {
  const [form, setForm] = useState({
    judul: "",
    deskripsi: "",
    tanggal: "",
    lokasi: "",
  });
  const [userId, setUserId] = useState(null);
  const [ukmData, setUkmData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        try {
          const ukmQuery = query(
            collection(db, "ukms"),
            where("sekretarisId", "==", user.uid)
          );
          const ukmSnapshot = await getDocs(ukmQuery);

          if (!ukmSnapshot.empty) {
            const ukmDoc = ukmSnapshot.docs[0];
            setUkmData({
              id: ukmDoc.id,
              nama: ukmDoc.data().nama,
              sekretarisId: ukmDoc.data().sekretarisId,
            });
          } else {
            setMessage({
              text: "Anda tidak terdaftar sebagai sekretaris UKM manapun",
              type: "error",
            });
          }
        } catch (error) {
          console.error("Gagal mengambil data UKM:", error);
          setMessage({
            text: "Gagal memuat data UKM. Silakan coba lagi.",
            type: "error",
          });
        }
      } else {
        setMessage({
          text: "Anda harus login untuk menambahkan agenda",
          type: "error",
        });
        setTimeout(() => router.push("/login"), 2000);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !ukmData) return;

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await tambahAgenda({
        ...form,
        createdBy: userId,
        ukmId: ukmData.id,
        ukm: {
          id: ukmData.id,
          nama: ukmData.nama,
        },
      });

      if (res.success) {
        setMessage({
          text: "Agenda berhasil ditambahkan!",
          type: "success",
        });
        setForm({ judul: "", deskripsi: "", tanggal: "", lokasi: "" });
        setTimeout(() => router.push("/dashboard/sekretaris/agenda"), 1500);
      } else {
        setMessage({
          text: `Gagal: ${res.error}`,
          type: "error",
        });
      }
    } catch (error) {
      setMessage({
        text: `Terjadi kesalahan: ${error.message}`,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const messageClass = {
    success: "bg-green-100 border-green-400 text-green-700",
    error: "bg-red-100 border-red-400 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 py-4 px-6 flex items-center">
          <button
            onClick={handleBack}
            className="text-white hover:text-gray-200 mr-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold text-white ml-2">Tambah Agenda Baru</h2>
        </div>

        <div className="p-6">
          {message.text && (
            <div
              className={`mb-4 border-l-4 p-4 ${messageClass[message.type]}`}
              role="alert"
            >
              <p>{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="judul" className="block text-sm font-medium text-gray-700 mb-1">
                Judul Agenda *
              </label>
              <input
                type="text"
                id="judul"
                name="judul"
                placeholder="Masukkan judul agenda"
                value={form.judul}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                id="deskripsi"
                name="deskripsi"
                placeholder="Masukkan deskripsi agenda"
                value={form.deskripsi}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="tanggal" className="block text-sm font-medium text-gray-700 mb-1">
                Tanggal dan Waktu *
              </label>
              <input
                type="datetime-local"
                id="tanggal"
                name="tanggal"
                value={form.tanggal}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="lokasi" className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi *
              </label>
              <input
                type="text"
                id="lokasi"
                name="lokasi"
                placeholder="Masukkan lokasi agenda"
                value={form.lokasi}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {ukmData && (
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  Agenda ini akan ditambahkan ke UKM: <span className="font-medium">{ukmData.nama}</span>
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !ukmData}
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  isLoading || !ukmData
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                {isLoading ? "Menyimpan..." : "Simpan Agenda"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
