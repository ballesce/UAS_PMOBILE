import Navbar from "../components/Navbar";

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="text-center mb-16">
           <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg relative group">
                <img 
                  src="/img.webp"  // Changed path (removed ./public)
                  alt="Reval Rafifasyajr" 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"  // Added lazy loading
                />
                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
              </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Reval Rafifasya JR
            </h1>
            <p className="text-2xl text-blue-600 font-medium mb-5">
              Mahasiswa Informatika
            </p>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Seorang mahasiswa dengan ketertarikan dalam pengembangan aplikasi web, 
              desain UI/UX, dan manajemen proyek digital.
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-3xl shadow-xl p-10 mb-12 backdrop-blur-sm bg-opacity-90">
            <div className="grid md:grid-cols-3 gap-10">
              {/* Personal Info Section */}
              <div className="md:col-span-1">
                <div className="bg-blue-50 rounded-xl p-6 h-full">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b border-blue-200">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded-md">Informasi</span> Pribadi
                  </h2>
                  <div className="space-y-5">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg mr-4">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p className="text-gray-800 font-medium">revalrafifasyajr@gmail.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg mr-4">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Telepon</h3>
                        <p className="text-gray-800 font-medium">0858 7186 6643</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg mr-4">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Alamat</h3>
                        <p className="text-gray-800 font-medium">Cibogo, Cikahuripan, Cimanggung</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg mr-4">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 mt-10 mb-6 pb-3 border-b border-blue-200">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded-md">Keahlian</span> Saya
                  </h2>
                  <div className="space-y-4">
                    {[
                      { name: 'Web Development', level: 90, color: 'bg-blue-600' },
                      { name: 'UI/UX Design', level: 85, color: 'bg-indigo-600' },
                      { name: 'Project Management', level: 80, color: 'bg-purple-600' },
                      { name: 'Public Speaking', level: 75, color: 'bg-pink-600' }
                    ].map((skill, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-800 font-medium">{skill.name}</span>
                          <span className="text-gray-500 font-medium">{skill.level}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`${skill.color} h-2.5 rounded-full`} 
                            style={{ width: `${skill.level}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pendidikan Section */}
              <div className="md:col-span-2">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-md">Riwayat</span> Pendidikan
                </h2>
                
                <div className="space-y-8">
                  
                  <div className="relative pl-12 pb-8 border-l-2 border-blue-200 group">
                    <div className="absolute -left-2.5 top-0 w-5 h-5 bg-blue-600 rounded-full border-4 border-white group-hover:bg-indigo-600 transition-colors"></div>
                    <div className="bg-blue-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">SMA Jurusan IPA</h3>
                      <div className="flex items-center text-gray-600 mb-3">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="font-medium">SMA Negeri Contoh</span>
                        <span className="mx-2 text-blue-400">•</span>
                        <span>2011 - 2014</span>
                      </div>
                      <p className="text-gray-700">
                        Lulus dengan nilai tinggi. Ketua OSIS periode 2013-2014 dan peraih medali emas Olimpiade Sains Nasional bidang Matematika.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-12">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-md">Proyek</span> Portfolio
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Aplikasi Web E-commerce",
                  category: "Web Development",
                  image: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
                  description: "Platform e-commerce dengan fitur pembayaran digital dan manajemen produk"
                },
                {
                  title: "Mobile App Design",
                  category: "UI/UX Design",
                  image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
                  description: "Desain aplikasi mobile untuk layanan kesehatan dengan user flow yang intuitif"
                },
                {
                  title: "Dashboard Analytics",
                  category: "Web Development",
                  image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
                  description: "Dashboard visualisasi data real-time dengan berbagai chart interaktif"
                }
              ].map((project, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group"
                >
                  <div className="relative overflow-hidden h-56">
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <p className="text-white text-sm">{project.description}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{project.title}</h3>
                    <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                      {project.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}