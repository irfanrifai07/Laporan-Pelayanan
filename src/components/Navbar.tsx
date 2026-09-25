import React, { useState } from 'react';
import { FacilityProfile, User } from '../types';
import {
  Home,
  Users,
  FileSpreadsheet,
  Settings,
  LogOut,
  UserCheck,
  Building2,
  Menu,
  X,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'register' | 'rekapitulasi' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'register' | 'rekapitulasi' | 'admin') => void;
  currentUser: User | null;
  facility: FacilityProfile;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  facility,
  onOpenLogin,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleLabel = (user: User | null) => {
    if (!user) return 'Tamu';
    switch (user.role) {
      case 'admin_induk':
        return 'Admin Puskesmas';
      case 'admin_kecamatan':
        return 'Admin Kecamatan';
      case 'bidan_desa':
        return `Bidan Desa ${user.village || ''}`;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Beranda', icon: Home, short: 'Beranda' },
    { id: 'register', label: 'Data Pasien KB', icon: Users, short: 'Pasien KB' },
    { id: 'rekapitulasi', label: 'Laporan Bulanan', icon: FileSpreadsheet, short: 'Laporan F2' },
    { id: 'admin', label: 'Pengaturan', icon: Settings, short: 'Pengaturan' },
  ] as const;

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
        {/* Top institutional mini bar */}
        <div className="bg-emerald-800 text-emerald-50 text-xs py-1.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wide uppercase bg-emerald-700/60 px-2 py-0.5 rounded text-[10px] text-white">
                BKKBN • F/II/KB
              </span>
              <span className="font-medium text-emerald-100">{facility.name}</span>
            </div>
            <div className="flex items-center space-x-2 text-emerald-200 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>Kec. {facility.district}, {facility.regency}</span>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Application Title */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center space-x-3 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-slate-900 leading-tight">
                    SIM Pelayanan KB
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Faskes
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Pencatatan & Pelaporan Kontrasepsi BKKBN
                </p>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Account / Role Switcher */}
            <div className="flex items-center space-x-2">
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onOpenLogin}
                    className="flex items-center space-x-2 py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition text-left"
                    title="Ganti Peran / Akun Pengguna"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        {getRoleLabel(currentUser)}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={onLogout}
                    title="Keluar / Ganti Akun"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-100"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Pilih Akun / Masuk</span>
                </button>
              )}

              {/* Mobile hamburger menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-fade-in shadow-lg">
            {currentUser && (
              <div className="p-3 mb-2 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-[11px] text-emerald-800">{getRoleLabel(currentUser)}</p>
                </div>
                <button
                  onClick={() => {
                    onOpenLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-emerald-800 font-semibold px-2.5 py-1 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50"
                >
                  Ganti Akun
                </button>
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR FOR INSTANT 1-THUMB ACCESS */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1 px-2 flex items-center justify-around md:hidden shadow-lg print:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">{item.short}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
