"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebaseConfig";
import { updateEmail, updatePassword, sendEmailVerification } from "firebase/auth";

export default function EditUKM() {
  const router = useRouter();
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [formData, setFormData] = useState({
    nama: "",
    pembina: "",
    emailPembina: "",
    newPasswordPembina: "",
    ketua: "",
    emailKetua: "",
    newPasswordKetua: "",
    sekretaris: "",
    emailSekretaris: "",
    newPasswordSekretaris: "",
    deskripsi: "",
    status: "Aktif",
    pembinaId: "",
    ketuaId: "",
    sekretarisId: "",
    imageUrl: ""
  });
  const [showPassword, setShowPassword] = useState({
    pembina: false,
    ketua: false,
    sekretaris: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  useEffect(() => {
    const fetchUkm = async () => {
      try {
        const docRef = doc(db, "ukms", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const initial = {
            nama: data.nama || "",
            pembina: data.pembina || "",
            emailPembina: data.pembinaEmail || "",
            newPasswordPembina: "",
            ketua: data.ketua || "",
            emailKetua: data.ketuaEmail || "",
            newPasswordKetua: "",
            sekretaris: data.sekretaris || "",
            emailSekretaris: data.sekretarisEmail || "",
            newPasswordSekretaris: "",
            deskripsi: data.deskripsi || "",
            status: data.status || "Aktif",
            pembinaId: data.pembinaId || "",
            ketuaId: data.ketuaId || "",
            sekretarisId: data.sekretarisId || "",
            imageUrl: data.imageUrl || ""
          };
          
          setInitialData(initial);
          setFormData(initial);

          if (data.imageUrl) {
            setExistingImage(data.imageUrl);
            setImagePreview(data.imageUrl);
          }
        } else {
          alert("UKM tidak ditemukan");
          router.push("/admin/ukm");
        }
      } catch (error) {
        console.error("Error fetching UKM:", error);
        alert("Gagal memuat data UKM");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUkm();
  }, [id, router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar. Maksimal 2MB");
        return;
      }
      
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        alert("Format file tidak didukung. Gunakan JPG/JPEG/PNG");
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!image) return null;
    
    try {
      if (existingImage) {
        try {
          const oldImageRef = ref(storage, existingImage);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.error("Error deleting old image:", error);
        }
      }

      const imageRef = ref(storage, `ukm-images/${id}/${Date.now()}_${image.name}`);
      const snapshot = await uploadBytes(imageRef, image);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      await addDoc(collection(db, "ukmImages"), {
        ukmId: id,
        imageUrl: downloadURL,
        fileName: image.name,
        fileSize: image.size,
        fileType: image.type,
        createdAt: new Date().toISOString()
      });
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validasi password
      if (formData.newPasswordPembina && formData.newPasswordPembina.length < 6) {
        throw new Error("Password pembina harus minimal 6 karakter");
      }
      if (formData.newPasswordKetua && formData.newPasswordKetua.length < 6) {
        throw new Error("Password ketua harus minimal 6 karakter");
      }
      if (formData.newPasswordSekretaris && formData.newPasswordSekretaris.length < 6) {
        throw new Error("Password sekretaris harus minimal 6 karakter");
      }

      // Hanya update data yang berubah
      const updatedFields = {};
      
      // Cek field mana saja yang berubah
      if (formData.nama !== initialData.nama) updatedFields.nama = formData.nama;
      if (formData.pembina !== initialData.pembina) updatedFields.pembina = formData.pembina;
      if (formData.emailPembina !== initialData.emailPembina) updatedFields.pembinaEmail = formData.emailPembina;
      if (formData.ketua !== initialData.ketua) updatedFields.ketua = formData.ketua;
      if (formData.emailKetua !== initialData.emailKetua) updatedFields.ketuaEmail = formData.emailKetua;
      if (formData.sekretaris !== initialData.sekretaris) updatedFields.sekretaris = formData.sekretaris;
      if (formData.emailSekretaris !== initialData.emailSekretaris) updatedFields.sekretarisEmail = formData.emailSekretaris;
      if (formData.deskripsi !== initialData.deskripsi) updatedFields.deskripsi = formData.deskripsi;
      if (formData.status !== initialData.status) updatedFields.status = formData.status;

      // Upload gambar baru jika ada
      if (image) {
        const imageUrl = await uploadImage();
        updatedFields.imageUrl = imageUrl;
      } else if (formData.imageUrl !== initialData.imageUrl && !formData.imageUrl) {
        // Jika gambar dihapus
        updatedFields.imageUrl = "";
      }

      // Update hanya jika ada field yang berubah
      if (Object.keys(updatedFields).length > 0) {
        await updateDoc(doc(db, "ukms", id), updatedFields);
      }

      // Function to update user data hanya jika ada perubahan
      const updateUserData = async (userId, emailField, nameField, passwordField, role) => {
        if (userId) {
          try {
            const user = await auth.getUser(userId);
            
            // Update email jika berubah
            if (formData[emailField] && formData[emailField] !== initialData[emailField]) {
              await updateEmail(user, formData[emailField]);
              await sendEmailVerification(user, {
                handleCodeInApp: true,
                url: `${window.location.origin}/login`,
              });
              
              // Update user document di Firestore
              await updateDoc(doc(db, "users", userId), {
                email: formData[emailField],
                name: formData[nameField],
                role: role
              });
            }

            // Update password jika diisi
            if (formData[passwordField] && formData[passwordField].length >= 6) {
              await updatePassword(user, formData[passwordField]);
            }
          } catch (error) {
            console.error(`Error updating ${role} data:`, error);
            alert(`Gagal memperbarui data ${role}: ${error.message}`);
          }
        }
      };

      // Update pembina data hanya jika ada perubahan
      if (formData.pembina !== initialData.pembina || 
          formData.emailPembina !== initialData.emailPembina || 
          formData.newPasswordPembina) {
        await updateUserData(
          formData.pembinaId,
          "emailPembina",
          "pembina",
          "newPasswordPembina",
          "pembina"
        );
      }

      // Update ketua data hanya jika ada perubahan
      if (formData.ketua !== initialData.ketua || 
          formData.emailKetua !== initialData.emailKetua || 
          formData.newPasswordKetua) {
        await updateUserData(
          formData.ketuaId,
          "emailKetua",
          "ketua",
          "newPasswordKetua",
          "ketua"
        );
      }

      // Update sekretaris data hanya jika ada perubahan
      if (formData.sekretaris !== initialData.sekretaris || 
          formData.emailSekretaris !== initialData.emailSekretaris || 
          formData.newPasswordSekretaris) {
        await updateUserData(
          formData.sekretarisId,
          "emailSekretaris",
          "sekretaris",
          "newPasswordSekretaris",
          "sekretaris"
        );
      }

      alert("UKM dan data pengurus berhasil diperbarui");
      router.push("/admin/ukm");
    } catch (error) {
      console.error("Error updating UKM:", error);
      alert(`Gagal memperbarui UKM: ${error.message}`);
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

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      imageUrl: ""
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Edit UKM</h1>
        <p className="text-gray-500 mt-1">Perbarui data UKM</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto UKM</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border file:border-gray-300
                      file:text-sm file:font-medium
                      file:bg-white file:text-gray-700
                      hover:file:bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Format: JPG, PNG (Maksimal 2MB)</p>
                </div>
                {(imagePreview || existingImage) && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                      <img 
                        src={imagePreview || existingImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
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
                disabled={!formData.pembinaId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru Pembina</label>
              <div className="relative">
                <input
                  type={showPassword.pembina ? "text" : "password"}
                  name="newPasswordPembina"
                  value={formData.newPasswordPembina}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                  disabled={!formData.pembinaId}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword("pembina")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  disabled={!formData.pembinaId}
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
              <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter (kosongkan jika tidak ingin mengubah)</p>
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
                disabled={!formData.ketuaId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru Ketua</label>
              <div className="relative">
                <input
                  type={showPassword.ketua ? "text" : "password"}
                  name="newPasswordKetua"
                  value={formData.newPasswordKetua}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                  disabled={!formData.ketuaId}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword("ketua")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  disabled={!formData.ketuaId}
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
              <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter (kosongkan jika tidak ingin mengubah)</p>
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
                disabled={!formData.sekretarisId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru Sekretaris</label>
              <div className="relative">
                <input
                  type={showPassword.sekretaris ? "text" : "password"}
                  name="newPasswordSekretaris"
                  value={formData.newPasswordSekretaris}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  minLength={6}
                  disabled={!formData.sekretarisId}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword("sekretaris")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  disabled={!formData.sekretarisId}
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
              <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter (kosongkan jika tidak ingin mengubah)</p>
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}