import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  FiArrowRight, 
  FiUsers, 
  FiCalendar, 
  FiAward, 
  FiBook, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiClock 
} from "react-icons/fi";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-12">
          {/* Teks Hero */}
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Sistem Informasi UKM
              </span>
              <br />
              Universitas Ma'soem
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-700 leading-relaxed">
              Platform digital terintegrasi untuk memudahkan pengelolaan, kolaborasi, 
              dan pengembangan Unit Kegiatan Mahasiswa di lingkungan kampus.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Masuk ke Sistem <FiArrowRight className="ml-1" />
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                Daftar Sekarang
              </Link>
            </div>
            
            <div className="mt-10 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <FiUsers className="text-blue-600" />
                <span className="text-sm font-medium"> UKM Terdaftar</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                <FiCalendar className="text-blue-600" />
                <span className="text-sm font-medium"> Kegiatan/Tahun</span>
              </div>
            </div>
          </div>

          {/* Gambar Hero */}
          <div className="relative w-full max-w-xl">
              <img
              src="https://picsum.photos/800/600?random=1"
              alt="Ilustrasi UKM Mahasiswa"
              className="w-full rounded-xl shadow-xl animate-float"
            />


            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-200 rounded-full opacity-30 animate-pulse"></div>
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-indigo-200 rounded-full opacity-30 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Fitur Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-16">
            Fitur Unggulan Sistem Kami
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FiUsers className="text-4xl text-blue-600" />,
                title: "Manajemen Anggota",
                desc: "Kelola data anggota UKM dengan sistem terpusat dan terstruktur."
              },
              {
                icon: <FiCalendar className="text-4xl text-blue-600" />,
                title: "Kalender Kegiatan",
                desc: "Jadwalkan dan pantau semua kegiatan UKM dalam satu platform."
              },
              {
                icon: <FiAward className="text-4xl text-blue-600" />,
                title: "Pencapaian & Sertifikat",
                desc: "Catat prestasi anggota dan kelola sertifikat digital."
              },
              {
                icon: <FiBook className="text-4xl text-blue-600" />,
                title: "Laporan & Evaluasi",
                desc: "Buat laporan kegiatan dan evaluasi perkembangan UKM."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-blue-50 p-8 rounded-xl hover:shadow-lg transition-all duration-300">
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold text-blue-900 mb-3">{feature.title}</h3>
                <p className="text-gray-700">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Terdekat Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-12">
            Event Terdekat
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Turnamen Futsal Antar UKM",
                date: "15 Juni 2023",
                time: "08.00 - 17.00 WIB",
                location: "Lapangan Futsal Kampus"
              },
              {
                title: "Pentas Seni Budaya", 
                date: "22 Juni 2023",
                time: "19.00 - 22.00 WIB",
                location: "Auditorium Utama"
              },
              {
                title: "Workshop Kewirausahaan",
                date: "29 Juni 2023",
                time: "13.00 - 16.00 WIB",
                location: "Ruang Seminar Gedung B"
              }
            ].map((event, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-blue-800 mb-2">{event.title}</h3>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FiCalendar className="text-blue-500" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FiClock className="text-blue-500" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FiMapPin className="text-blue-500" />
                  <span>{event.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimoni Section */}
      <section className="bg-gradient-to-r from-blue-100 to-indigo-100 py-16 md:py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-16">
            Apa Kata Mereka?
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Ahmad Fauzi",
                role: "Ketua UKM Basket",
                quote: "Sistem ini sangat membantu administrasi UKM kami. Sekarang semua data terorganisir dengan rapi."
              },
              {
                name: "Siti Rahma",
                role: "Bendahara UKM Teater",
                quote: "Pengelolaan keuangan menjadi lebih transparan dan mudah dilaporkan kepada anggota."
              },
              {
                name: "Dika Pratama",
                role: "Anggota UKM Robotika",
                quote: "Fitur kalender kegiatan memudahkan kami mengkoordinasikan jadwal latihan dan kompetisi."
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-blue-900">{testimonial.name}</h4>
                    <p className="text-sm text-blue-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prestasi Terbaru Section */}
      <section className="py-16 bg-gradient-to-r from-blue-100 to-indigo-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-12">
            Prestasi Terbaru
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Juara 1 Lomba Robotika Nasional",
                ukm: "UKM Robotika",
                date: "Mei 2023",
                description: "Tim robotika berhasil meraih juara 1 dalam kompetisi nasional"
              },
              {
                title: "Penghargaan Karya Seni Terbaik",
                ukm: "UKM Seni Rupa", 
                date: "April 2023",
                description: "Karya lukis anggota UKM Seni Rupa mendapatkan penghargaan tingkat regional"
              }
            ].map((achievement, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FiAward className="text-blue-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-800">{achievement.title}</h3>
                    <p className="text-blue-600">{achievement.ukm} • {achievement.date}</p>
                  </div>
                </div>
                <p className="text-gray-700">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

     {/* Footer */}
<footer className="bg-blue-950 text-blue-200 py-12">
  <div className="container mx-auto px-6">
    <div className="flex flex-col md:flex-row justify-between items-center">
      <div className="mb-6 md:mb-0">
        <h3 className="text-2xl font-bold text-white mb-4">SI-UKM Ma'soem</h3>
        <p className="max-w-xs">Platform pengelolaan Unit Kegiatan Mahasiswa Universitas Ma'soem.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
        <div>
          <h4 className="text-white font-bold mb-4">Tautan</h4>
          <ul className="space-y-2">
            <li><span className="hover:text-white transition">Tentang</span></li>
            <li><span className="hover:text-white transition">Fitur</span></li>
            <li><span className="hover:text-white transition">Kontak</span></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Legal</h4>
          <ul className="space-y-2">
            <li><span className="hover:text-white transition">Kebijakan Privasi</span></li>
            <li><span className="hover:text-white transition">Syarat & Ketentuan</span></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Kontak</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <FiMail className="text-blue-400" />
              revalrafifasyajr@gmail.com
            </li>
            <li className="flex items-center gap-2">
              <FiPhone className="text-blue-400" />
              085871866643
            </li>
            <li className="flex items-center gap-2">
              <FiMapPin className="text-blue-400" />
              Cibogo, Cikahuripan, Cimanggung
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div className="border-t border-blue-800 mt-12 pt-8 text-center">
      <p>© {new Date().getFullYear()} Sistem Informasi UKM Universitas Ma'soem. All rights reserved.</p>
    </div>
  </div>
</footer>
    </div>
  );
}