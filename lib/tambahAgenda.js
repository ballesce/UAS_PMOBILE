import { db } from "./firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Fungsi untuk menambahkan agenda ke koleksi "agenda"
export async function tambahAgenda(data) {
  try {
    const docRef = await addDoc(collection(db, "agenda"), {
      judul: data.judul,
      deskripsi: data.deskripsi,
      tanggal: data.tanggal,
      lokasi: data.lokasi,
      createdBy: data.createdBy,
      ukmId: data.ukmId,
      ukm: data.ukm, // objek { id, nama }
      createdAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
