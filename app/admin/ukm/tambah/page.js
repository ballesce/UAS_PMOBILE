"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { createUserWithEmailAndPassword, getAuth, sendEmailVerification } from "firebase/auth";

export default function TambahUKM() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama: "",
    pembina: "",
    emailPembina: "",
    passwordPembina: "",
    ketua: "",
    emailKetua: "",
    passwordKetua: "",
    sekretaris: "",
    emailSekretaris: "",
    passwordSekretaris: "",
    deskripsi: "",
    status: "Aktif"
  });
  const [showPassword, setShowPassword] = useState({
    pembina: false,
    ketua: false,
    sekretaris: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createUserAccount = async (email, password, name, role, ukmId) => {
    const auth = getAuth();
    try {
      // Buat akun autentikasi
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      // Kirim email verifikasi
      await sendEmailVerification(userCredential.user, {
        handleCodeInApp: true,
        url: `${window.location.origin}/login`,
      });
      
      // Tambahkan data user ke Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: name,
        email: email,
        role: role,
        ukm: ukmId,
        createdAt: new Date().toISOString(),
        emailVerified: false
      });
      
      return {
        uid: userCredential.user.uid,
        email: email
      };
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validasi dasar
      if (!formData.nama) {
        throw new Error("Nama UKM harus diisi");
      }

      // Validasi password minimal 6 karakter
      if (formData.passwordPembina && formData.passwordPembina.length < 6) {
        throw new Error("Password pembina harus minimal 6 karakter");
      }
      if (formData.passwordKetua && formData.passwordKetua.length < 6) {
        throw new Error("Password ketua harus minimal 6 karakter");
      }
      if (formData.passwordSekretaris && formData.passwordSekretaris.length < 6) {
        throw new Error("Password sekretaris harus minimal 6 karakter");
      }

      // 1. Tambahkan UKM ke koleksi ukms
      const ukmRef = await addDoc(collection(db, "ukms"), {
        nama: formData.nama,
        deskripsi: formData.deskripsi,
        status: formData.status,
        jumlahAnggota: 0,
        createdAt: new Date().toISOString()
      });
      const ukmId = ukmRef.id;

      const updateData = {};

      // 2. Jika ada pembina, tambahkan ke koleksi users
      if (formData.pembina && formData.emailPembina && formData.passwordPembina) {
        const pembinaData = await createUserAccount(
          formData.emailPembina,
          formData.passwordPembina,
          formData.pembina,
          "pembina",
          ukmId
        );
        
        updateData.pembina = formData.pembina;
        updateData.pembinaId = pembinaData.uid;
        updateData.pembinaEmail = pembinaData.email;
      }

      // 3. Jika ada ketua, tambahkan ke koleksi users
      if (formData.ketua && formData.emailKetua && formData.passwordKetua) {
        const ketuaData = await createUserAccount(
          formData.emailKetua,
          formData.passwordKetua,
          formData.ketua,
          "ketua",
          ukmId
        );
        
        updateData.ketua = formData.ketua;
        updateData.ketuaId = ketuaData.uid;
        updateData.ketuaEmail = ketuaData.email;
      }

      // 4. Jika ada sekretaris, tambahkan ke koleksi users
      if (formData.sekretaris && formData.emailSekretaris && formData.passwordSekretaris) {
        const sekretarisData = await createUserAccount(
          formData.emailSekretaris,
          formData.passwordSekretaris,
          formData.sekretaris,
          "sekretaris",
          ukmId
        );
        
        updateData.sekretaris = formData.sekretaris;
        updateData.sekretarisId = sekretarisData.uid;
        updateData.sekretarisEmail = sekretarisData.email;
      }

      // Update data UKM dengan semua informasi yang diperlukan
      await setDoc(ukmRef, updateData, { merge: true });

      alert(`UKM "${formData.nama}" dan akun terkait berhasil dibuat!`);
      router.push("/admin/ukm");
    } catch (error) {
      console.error("Error adding UKM:", error);
      alert(`Gagal menambahkan UKM: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleShowPassword = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tambah UKM Baru</h1>
        <p className="text-gray-500 mt-1">Isi form berikut untuk menambahkan UKM baru</p>
      </header>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama UKM*</label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Data Pembina</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pembina</label>
              <input
                type="text"
                name="pembina"
                value={formData.pembina}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Pembina</label>
              <input
                type="email"
                name="emailPembina"
                value={formData.emailPembina}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Pembina</label>
              <div className="relative">
                <input
                  type={showPassword.pembina ? "text" : "password"}
                  name="passwordPembina"
                  value={formData.passwordPembina}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword("pembina")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword.pembina ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Data Ketua</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ketua</label>
              <input
                type="text"
                name="ketua"
                value={formData.ketua}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Ketua</label>
              <input
                type="email"
                name="emailKetua"
                value={formData.emailKetua}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Ketua</label>
              <div className="relative">
                <input
                  type={showPassword.ketua ? "text" : "password"}
                  name="passwordKetua"
                  value={formData.passwordKetua}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword("ketua")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword.ketua ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Data Sekretaris</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sekretaris</label>
              <input
                type="text"
                name="sekretaris"
                value={formData.sekretaris}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Sekretaris</label>
              <input
                type="email"
                name="emailSekretaris"
                value={formData.emailSekretaris}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Sekretaris</label>
              <div className="relative">
                <input
                  type={showPassword.sekretaris ? "text" : "password"}
                  name="passwordSekretaris"
                  value={formData.passwordSekretaris}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword("sekretaris")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword.sekretaris ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status*</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/ukm")}
              className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan UKM'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}