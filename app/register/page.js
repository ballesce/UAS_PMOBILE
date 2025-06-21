'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function RegisterPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ukm, setUkm] = useState("");
  const [fakultas, setFakultas] = useState("");
  const [jurusan, setJurusan] = useState("");
  const [alasan, setAlasan] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUkm, setIsLoadingUkm] = useState(false);
  const [ukmOptions, setUkmOptions] = useState([]);
  const [ukmDocs, setUkmDocs] = useState([]);
  const router = useRouter();

  const fakultasOptions = [
    "Fakultas Teknik",
    "Fakultas Ekonomi",
    "Fakultas Ilmu Komputer",
    "Fakultas Hukum",
  ];

  const jurusanOptions = {
    "Fakultas Teknik": ["Teknik Sipil", "Teknik Mesin", "Teknik Elektro"],
    "Fakultas Ekonomi": ["Manajemen", "Akuntansi", "Ekonomi Pembangunan"],
    "Fakultas Ilmu Komputer": ["Sistem Informasi", "Teknik Informatika", "Ilmu Komputer"],
    "Fakultas Hukum": ["Ilmu Hukum"],
  };

  useEffect(() => {
    const fetchUkmData = async () => {
      setIsLoadingUkm(true);
      try {
        const querySnapshot = await getDocs(collection(db, "ukms"));
        const ukms = [];
        const docs = [];
        querySnapshot.forEach((doc) => {
          ukms.push(doc.data().nama);
          docs.push({ id: doc.id, ...doc.data() });
        });
        setUkmOptions(ukms);
        setUkmDocs(docs);
      } catch (error) {
        console.error("Error fetching UKM data:", error);
        setError("Gagal memuat data UKM");
      } finally {
        setIsLoadingUkm(false);
      }
    };

    fetchUkmData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!ukm || !fakultas || !jurusan || !alasan) {
      setError("Semua kolom harus diisi.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role: "mahasiswa",
        fakultas,
        jurusan,
        createdAt: new Date().toISOString(),
      });

      const selectedUkm = ukmDocs.find((u) => u.nama === ukm);
      if (!selectedUkm) throw new Error("UKM tidak ditemukan");

      await setDoc(doc(collection(db, "anggota")), {
        userId: user.uid,
        ukmId: selectedUkm.id,
        nama: name,
        email: email,
        fakultas: fakultas,
        jurusan: jurusan,
        alasan: alasan,
        status: "pending",
        createdAt: new Date().toISOString(),
        verifiedAt: null,
      });

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      console.error(err);
      setError(
        err.message.includes("email-already-in-use")
          ? "Email sudah terdaftar"
          : "Registrasi gagal. Silakan coba lagi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return null; // or return a loading skeleton
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="w-full max-w-md">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
          suppressHydrationWarning
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Kembali
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Daftar Anggota UKM</h1>
          <p className="text-gray-600">Pendaftaran khusus untuk mahasiswa Universitas Ma'soem</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm text-center">
              Registrasi berhasil! Silakan login setelah pendaftaran Anda diverifikasi.
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <InputField label="Nama Lengkap" value={name} onChange={setName} />
            <InputField label="Email" type="email" value={email} onChange={setEmail} />
            <InputField 
              label="Password" 
              type="password" 
              value={password} 
              onChange={setPassword} 
              minLength={6} 
              placeholder="Minimal 6 karakter"
            />

            <SelectField 
              label="Pilih Fakultas" 
              value={fakultas} 
              onChange={e => { setFakultas(e.target.value); setJurusan(""); }}
            >
              <option value="">Pilih Fakultas</option>
              {fakultasOptions.map((f, i) => <option key={i} value={f}>{f}</option>)}
            </SelectField>

            <SelectField 
              label="Pilih Jurusan" 
              value={jurusan} 
              onChange={e => setJurusan(e.target.value)} 
              disabled={!fakultas}
            >
              <option value="">{fakultas ? "Pilih Jurusan" : "Pilih fakultas terlebih dahulu"}</option>
              {jurusanOptions[fakultas]?.map((j, i) => <option key={i} value={j}>{j}</option>)}
            </SelectField>

            <SelectField 
              label="Pilih UKM" 
              value={ukm} 
              onChange={e => setUkm(e.target.value)} 
              disabled={isLoadingUkm}
            >
              <option value="">{isLoadingUkm ? "Memuat UKM..." : "Pilih UKM"}</option>
              {ukmOptions.map((u, i) => <option key={i} value={u}>{u}</option>)}
            </SelectField>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Bergabung</label>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ceritakan mengapa Anda tertarik bergabung dengan UKM ini..."
                required
                suppressHydrationWarning
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${
                isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={isLoading}
              suppressHydrationWarning
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </span>
              ) : "Daftar Sekarang"}
            </button>

            <p className="text-sm text-center text-gray-600 mt-4">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">Login di sini</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, minLength, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        required
        minLength={minLength}
        placeholder={placeholder}
        suppressHydrationWarning
      />
    </div>
  );
}

function SelectField({ label, value, onChange, children, disabled = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2.5 rounded-lg border bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? "border-gray-200 text-gray-400" : "border-gray-300"
        }`}
        required
        suppressHydrationWarning
      >
        {children}
      </select>
    </div>
  );
}