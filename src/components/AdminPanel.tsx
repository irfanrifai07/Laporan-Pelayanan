import React, { useState } from 'react';
import { ActivityLog, FacilityProfile, User, Village } from '../types';
import { StorageService } from '../services/storage';
import {
  Building2,
  MapPin,
  Users,
  Database,
  History,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Shield,
} from 'lucide-react';

interface AdminPanelProps {
  facility: FacilityProfile;
  onUpdateFacility: (f: FacilityProfile) => void;
  villages: Village[];
  onUpdateVillages: (v: Village[]) => void;
  users: User[];
  onUpdateUsers: (u: User[]) => void;
  currentUser: User | null;
  onDataReset: () => void;
  onClearRecords: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  facility,
  onUpdateFacility,
  villages,
  onUpdateVillages,
  users,
  onUpdateUsers,
  currentUser,
  onDataReset,
  onClearRecords,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'villages' | 'users' | 'backup' | 'logs'>('profile');

  // Facility Profile Form state
  const [profileForm, setProfileForm] = useState<FacilityProfile>({ ...facility });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Village Form states
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [newVillageName, setNewVillageName] = useState('');
  const [newVillageBidan, setNewVillageBidan] = useState('');

  // User Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin_induk' | 'admin_kecamatan' | 'bidan_desa'>('bidan_desa');
  const [newVillageAssign, setNewVillageAssign] = useState(villages[0]?.name || '');

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Logs
  const [logs, setLogs] = useState<ActivityLog[]>(StorageService.getLogs());

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFacility(profileForm);
    StorageService.saveFacilityProfile(profileForm);
    StorageService.logActivity(currentUser?.username || 'admin', 'UPDATE_PROFIL_FASKES', 'Memperbarui profil faskes');
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  // Toggle Village Lock
  const handleToggleVillageLock = (villageId: string) => {
    const updated = villages.map((v) => {
      if (v.id === villageId) {
        const nextState = !v.entryAllowed;
        StorageService.logActivity(
          currentUser?.username || 'admin',
          'UBAH_IZIN_DESA',
          `${nextState ? 'Membuka' : 'Mengunci'} izin entri data untuk Desa ${v.name}`
        );
        return { ...v, entryAllowed: nextState };
      }
      return v;
    });
    onUpdateVillages(updated);
    StorageService.saveVillages(updated);
  };

  // Add Village
  const handleAddVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVillageName.trim()) return;

    const exists = villages.some((v) => v.name.toLowerCase() === newVillageName.trim().toLowerCase());
    if (exists) {
      alert('Nama desa sudah terdaftar.');
      return;
    }

    const newV: Village = {
      id: 'des-' + Date.now(),
      name: newVillageName.trim(),
      district: facility.district,
      entryAllowed: true,
      assignedBidanName: newVillageBidan.trim(),
      assignedUsername: newVillageName.trim().toLowerCase(),
    };

    const updated = [...villages, newV];
    onUpdateVillages(updated);
    StorageService.saveVillages(updated);
    StorageService.logActivity(currentUser?.username || 'admin', 'TAMBAH_DESA', `Menambah data Desa ${newV.name}`);

    setNewVillageName('');
    setNewVillageBidan('');
  };

  // Delete Village
  const handleDeleteVillage = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus Desa ${name}? Data pasien yang sudah ada tidak akan hilang.`)) {
      const updated = villages.filter((v) => v.id !== id);
      onUpdateVillages(updated);
      StorageService.saveVillages(updated);
      StorageService.logActivity(currentUser?.username || 'admin', 'HAPUS_DESA', `Menghapus data Desa ${name}`);
    }
  };

  // Add User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) {
      alert('Harap isi username, password, dan nama pengguna.');
      return;
    }

    const exists = users.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase());
    if (exists) {
      alert('Username sudah digunakan.');
      return;
    }

    const newU: User = {
      id: 'usr-' + Date.now(),
      username: newUsername.trim().toLowerCase(),
      password: newPassword,
      role: newRole,
      name: newName.trim(),
      village: newRole === 'bidan_desa' ? newVillageAssign : undefined,
    };

    const updated = [...users, newU];
    onUpdateUsers(updated);
    StorageService.saveUsers(updated);
    StorageService.logActivity(currentUser?.username || 'admin', 'TAMBAH_USER', `Menambah pengguna baru: ${newU.name} (${newU.username})`);

    setNewUsername('');
    setNewPassword('123');
    setNewName('');
    setStatusMessage({ text: `Pengguna ${newU.name} berhasil ditambahkan!`, type: 'success' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Delete User
  const handleDeleteUser = (id: string, name: string) => {
    if (users.length <= 1) {
      alert('Minimal harus ada 1 pengguna di sistem.');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus pengguna ${name}?`)) {
      const updated = users.filter((u) => u.id !== id);
      onUpdateUsers(updated);
      StorageService.saveUsers(updated);
      StorageService.logActivity(currentUser?.username || 'admin', 'HAPUS_USER', `Menghapus pengguna ${name}`);
    }
  };

  // Reset Password
  const handleResetPassword = (u: User) => {
    const newPwd = prompt(`Masukkan kata sandi baru untuk ${u.name}:`, '123');
    if (newPwd !== null && newPwd.trim()) {
      const updated = users.map((usr) => (usr.id === u.id ? { ...usr, password: newPwd.trim() } : usr));
      onUpdateUsers(updated);
      StorageService.saveUsers(updated);
      alert(`Password untuk ${u.name} berhasil diubah.`);
    }
  };

  // Backup Download
  const handleDownloadBackup = () => {
    const jsonStr = StorageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_SIM_KB_Faskes_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Restore Upload
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = StorageService.importBackup(content, currentUser?.username || 'admin');
        if (result.success) {
          setStatusMessage({ text: result.message, type: 'success' });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setStatusMessage({ text: result.message, type: 'error' });
        }
      }
    };
    reader.readAsText(file);
  };

  // Reset Data to Default
  const handleResetDefault = () => {
    if (
      window.confirm(
        'PERINGATAN: Seluruh data register pasien, desa, dan akun akan dikembalikan ke data sampel bawaan. Anda yakin?'
      )
    ) {
      onDataReset();
      setStatusMessage({ text: 'Data sistem berhasil direset ke standar bawaan.', type: 'success' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span>Panel Pengaturan Faskes & Wilayah</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi profil faskes, pengelolaan desa kerja, hak akses bidan, dan pencadangan data
          </p>
        </div>

        {statusMessage && (
          <div
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'profile', label: 'Profil Faskes & Pimpinan', icon: Building2 },
          { id: 'villages', label: `Desa Binaan (${villages.length})`, icon: MapPin },
          { id: 'users', label: `Akun Pengguna (${users.length})`, icon: Users },
          { id: 'backup', label: 'Cadangkan & Pulihkan', icon: Database },
          { id: 'logs', label: 'Log Aktivitas', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: PROFIL FASKES */}
      {activeSubTab === 'profile' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Profil Fasilitas Kesehatan (Faskes KB)</h3>
              <p className="text-xs text-slate-500">
                Informasi ini akan tercetak otomatis pada Kop Surat dan Lembar Laporan Formulir F/II/KB
              </p>
            </div>
            {profileSaveSuccess && (
              <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold border border-emerald-200 animate-fade-in flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Profil Berhasil Disimpan!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Fasilitas Kesehatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Register K/0/KB <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileForm.k0kbCode}
                  onChange={(e) => setProfileForm({ ...profileForm, k0kbCode: e.target.value })}
                  required
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Faskes KB BKKBN
                </label>
                <input
                  type="text"
                  value={profileForm.code}
                  onChange={(e) => setProfileForm({ ...profileForm, code: e.target.value })}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={profileForm.district}
                  onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  value={profileForm.regency}
                  onChange={(e) => setProfileForm({ ...profileForm, regency: e.target.value })}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Faskes
                </label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={profileForm.province}
                  onChange={(e) => setProfileForm({ ...profileForm, province: e.target.value })}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            {/* Pimpinan & Bidan Koordinator */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Penandatangan Dokumen Laporan (TTD)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pimpinan */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-emerald-800 block">Pimpinan Faskes / Kepala Puskesmas</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      value={profileForm.headName}
                      onChange={(e) => setProfileForm({ ...profileForm, headName: e.target.value })}
                      required
                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIP Pimpinan</label>
                    <input
                      type="text"
                      value={profileForm.headNip}
                      onChange={(e) => setProfileForm({ ...profileForm, headNip: e.target.value })}
                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jabatan Resmi</label>
                    <input
                      type="text"
                      value={profileForm.headTitle}
                      onChange={(e) => setProfileForm({ ...profileForm, headTitle: e.target.value })}
                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Bidan Koordinator */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-teal-800 block">Pengelola KB / Bidan Koordinator</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      value={profileForm.kbCoordinatorName}
                      onChange={(e) => setProfileForm({ ...profileForm, kbCoordinatorName: e.target.value })}
                      required
                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIP Pengelola</label>
                    <input
                      type="text"
                      value={profileForm.kbCoordinatorNip}
                      onChange={(e) => setProfileForm({ ...profileForm, kbCoordinatorNip: e.target.value })}
                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jabatan Resmi</label>
                    <input
                      type="text"
                      value={profileForm.kbCoordinatorTitle}
                      onChange={(e) => setProfileForm({ ...profileForm, kbCoordinatorTitle: e.target.value })}
                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 2: DESA BINAAN & STATUS IZIN */}
      {activeSubTab === 'villages' && (
        <div className="space-y-5">
          {/* Add Village Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Tambah Desa Binaan Baru</span>
            </h3>
            <form onSubmit={handleAddVillage} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Desa</label>
                <input
                  type="text"
                  value={newVillageName}
                  onChange={(e) => setNewVillageName(e.target.value)}
                  placeholder="Contoh: Sambungmacan"
                  required
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bidan Penanggung Jawab</label>
                <input
                  type="text"
                  value={newVillageBidan}
                  onChange={(e) => setNewVillageBidan(e.target.value)}
                  placeholder="Nama Bidan Desa..."
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan Desa</span>
                </button>
              </div>
            </form>
          </div>

          {/* Villages List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daftar Desa & Status Izin Entri</h3>
                <p className="text-xs text-slate-500">
                  Klik tombol gembok untuk membuka atau mengunci entri data bagi bidan desa terkait
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                {villages.length} Desa Terdaftar
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {villages.map((v) => (
                <div key={v.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">Desa {v.name}</span>
                      {v.entryAllowed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Boleh Entri (Aktif)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                          Entri Dikunci
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Bidan Desa: <span className="text-slate-700 font-medium">{v.assignedBidanName || 'Belum diisi'}</span>
                      {v.notes && <span className="text-slate-400 ml-2">• {v.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleVillageLock(v.id)}
                      title={v.entryAllowed ? 'Kunci Entri Desa Ini' : 'Buka Kunci Entri'}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        v.entryAllowed
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {v.entryAllowed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{v.entryAllowed ? 'Kunci Entri' : 'Buka Izin'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteVillage(v.id, v.name)}
                      title="Hapus Desa"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: AKUN PENGGUNA (RBAC) */}
      {activeSubTab === 'users' && (
        <div className="space-y-5">
          {/* Add User */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Tambah Akun Pengguna Baru</span>
            </h3>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Contoh: bedoro"
                  required
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nama Bidan / Petugas"
                  required
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran (Role)</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                >
                  <option value="bidan_desa">Bidan Desa</option>
                  <option value="admin_induk">Admin Induk</option>
                  <option value="admin_kecamatan">Admin Kecamatan</option>
                </select>
              </div>

              {newRole === 'bidan_desa' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wilayah Desa</label>
                  <select
                    value={newVillageAssign}
                    onChange={(e) => setNewVillageAssign(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  >
                    {villages.map((v) => (
                      <option key={v.id} value={v.name}>
                        Desa {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Simpan Akun</span>
                  </button>
                </div>
              )}

              {newRole === 'bidan_desa' && (
                <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
                  <button
                    type="submit"
                    className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambahkan Akun Bidan</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* User List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Daftar Akun Pengguna Terdaftar</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{u.name}</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        @{u.username}
                      </span>
                      {u.role === 'admin_induk' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Admin Induk
                        </span>
                      )}
                      {u.role === 'admin_kecamatan' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                          Admin Kecamatan
                        </span>
                      )}
                      {u.role === 'bidan_desa' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800">
                          Bidan Desa: {u.village}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Password saat ini: <code className="bg-slate-100 px-1 rounded font-mono text-slate-600">{u.password}</code>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleResetPassword(u)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center space-x-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Ubah Password</span>
                    </button>
                    {u.username !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: BACKUP & RESTORE */}
      {activeSubTab === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cadangkan & Pulihkan Basis Data (JSON)</h3>
            <p className="text-xs text-slate-500">
              Simpan berkas cadangan data lokal ke komputer Anda atau pulihkan dari file yang sudah ada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backup */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Unduh Cadangan Data</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mengekspor seluruh data profil faskes, desa binaan, akun pengguna, dan seluruh catatan register pelayanan KB ke dalam format file JSON.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan (JSON)</span>
              </button>
            </div>

            {/* Restore */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Pulihkan dari File Cadangan</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unggah file JSON cadangan yang pernah diunduh sebelumnya untuk mengembalikan seluruh catatan register dan pengaturan.
              </p>
              <label className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Pilih File Cadangan JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Kosongkan Data Register */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200">
            <div>
              <h4 className="text-xs font-bold text-rose-800 flex items-center space-x-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Kosongkan Seluruh Data Register Pasien</span>
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Menghapus seluruh catatan rekam pelayanan KB pasien agar sistem bersih menjadi 0 data untuk pencatatan baru. Data profil faskes, desa, dan akun pengguna tetap aman tersimpan.
              </p>
            </div>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh data register pelayanan KB? Seluruh data pasien akan dihapus menjadi 0 data.'
                  )
                ) {
                  onClearRecords();
                  setStatusMessage({ text: 'Seluruh data register pasien berhasil dikosongkan.', type: 'success' });
                  setTimeout(() => setStatusMessage(null), 3000);
                }
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              <span>Kosongkan Data Register</span>
            </button>
          </div>

          {/* Reset to Default */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-700">Setel Ulang ke Pengaturan Awal</h4>
              <p className="text-[11px] text-slate-500">
                Mereset database lokal ke data bawaan bersih
              </p>
            </div>
            <button
              onClick={handleResetDefault}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Sistem</span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 5: LOG AKTIVITAS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Catatan Aktivitas Sistem (Audit Trail)</h3>
            <span className="text-xs text-slate-500">{logs.length} riwayat</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto font-mono text-xs">
            {logs.map((l) => (
              <div key={l.id} className="p-3.5 hover:bg-slate-50 transition flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-800">
                    <span className="text-emerald-700">[{l.action}]</span> {l.details}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Pengguna: <span className="text-slate-600 font-bold">{l.username}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 whitespace-nowrap ml-4">
                  {new Date(l.timestamp).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
