'use client'
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              SI-UKM
            </span>
            <span className="text-sm font-medium text-blue-800 hidden sm:block">
              Universitas Ma'soem
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              Beranda
            </Link>
            <Link 
              href="/about" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/about' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              Tentang
            </Link>
            <Link 
              href="/ukm" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/ukm' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              Daftar UKM
            </Link>
            <Link 
              href="/events" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/events' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              Ranking
            </Link>
            <Link 
              href="/profile" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
            >
              Profil Saya
            </Link>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition duration-300"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow hover:from-blue-700 hover:to-indigo-700 transition duration-300"
            >
              Daftar
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              {isOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2">
            <Link 
              href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
              onClick={() => setIsOpen(false)}
            >
              Beranda
            </Link>
            <Link 
              href="/about" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/about' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
              onClick={() => setIsOpen(false)}
            >
              Tentang
            </Link>
            <Link 
              href="/ukm" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/ukm' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
              onClick={() => setIsOpen(false)}
            >
              Daftar UKM
            </Link>
            <Link 
              href="/events" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/events' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
              onClick={() => setIsOpen(false)}
            >
              Kegiatan
            </Link>

            <div className="pt-4 border-t border-gray-200 mt-4 space-y-3">
              <Link
                href="/login"
                className="block w-full px-4 py-2 text-center text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition duration-300"
                onClick={() => setIsOpen(false)}
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow hover:from-blue-700 hover:to-indigo-700 transition duration-300"
                onClick={() => setIsOpen(false)}
              >
                Daftar
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}