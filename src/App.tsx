import React, { useState, useEffect } from 'react';
import { FacilityProfile, PatientRecord, User, Village } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { RegisterTable } from './components/RegisterTable';
import { RekapitulasiF2KB } from './components/RekapitulasiF2KB';
import { AdminPanel } from './components/AdminPanel';
import { RegisterFormModal } from './components/RegisterFormModal';
import { PrintRegisterModal } from './components/PrintRegisterModal';
import { LoginModal } from './components/LoginModal';
import { CheckCircle2, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  // Initialize storage
  useEffect(() => {
    StorageService.init();
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    StorageService.init();
    return StorageService.getCurrentUser();
  });

  const [facility, setFacility] = useState<FacilityProfile>(() => {
    StorageService.init();
    return StorageService.getFacilityProfile();
  });

  const [villages, setVillages] = useState<Village[]>(() => {
    StorageService.init();
    return StorageService.getVillages();
  });

  const [users, setUsers] = useState<User[]>(() => {
    StorageService.init();
    return StorageService.getUsers();
  });

  const [records, setRecords] = useState<PatientRecord[]>(() => {
    StorageService.init();
    return StorageService.getRecords();
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'rekapitulasi' | 'admin'>('dashboard');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formEditData, setFormEditData] = useState<PatientRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Add / Edit record
  const handleSaveRecord = (
    record: PatientRecord | Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if ('id' in record) {
      StorageService.updateRecord(record as PatientRecord, currentUser?.username || 'admin');
      showToast(`Data akseptor ${record.wifeName} berhasil diperbarui.`);
    } else {
      StorageService.addRecord(record);
      showToast(`Data akseptor ${record.wifeName} berhasil ditambahkan ke Register.`);
    }
    setRecords(StorageService.getRecords());
    setIsFormModalOpen(false);
    setFormEditData(null);
  };

  // Delete record
  const handleDeleteRecord = (id: string) => {
    StorageService.deleteRecord(id, currentUser?.username || 'admin');
    setRecords(StorageService.getRecords());
    showToast('Data register akseptor berhasil dihapus.');
  };

  // Open Edit Form
  const handleOpenEdit = (rec: PatientRecord) => {
    setFormEditData(rec);
    setIsFormModalOpen(true);
  };

  // Open New Form
  const handleOpenNew = () => {
    setFormEditData(null);
    setIsFormModalOpen(true);
  };

  // Logout / Switch User
  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    showToast(`Selamat datang kembali, ${user.name}!`);
  };

  // Profile update
  const handleUpdateFacility = (newFac: FacilityProfile) => {
    setFacility(newFac);
    showToast('Profil Faskes berhasil diperbarui.');
  };

  // Villages update
  const handleUpdateVillages = (newV: Village[]) => {
    setVillages(newV);
    showToast('Data Desa & Status Izin berhasil diperbarui.');
  };

  // Users update
  const handleUpdateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    showToast('Daftar Akun Pengguna berhasil diperbarui.');
  };

  // Clear all patient records
  const handleClearRecords = () => {
    StorageService.clearAllRecords(currentUser?.username || 'admin');
    setRecords([]);
    showToast('Seluruh data register pelayanan KB berhasil dikosongkan.');
  };

  // Load sample records for August 2026
  const handleLoadSampleAgustus = () => {
    const loaded = StorageService.loadSampleAgustusRecords(currentUser?.username || 'admin');
    setRecords([...loaded]);
    showToast('Contoh data Laporan KB Agustus 2026 berhasil dimuat.');
  };

  // Reset all data
  const handleDataReset = () => {
    StorageService.resetToDefault(currentUser?.username || 'admin');
    setFacility(StorageService.getFacilityProfile());
    setVillages(StorageService.getVillages());
    setUsers(StorageService.getUsers());
    setRecords([]);
    showToast('Data sistem telah direset ke setelan awal (data kosong).');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center space-x-2.5 text-xs animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        facility={facility}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            records={records}
            villages={villages}
            facility={facility}
            onNavigateRegister={() => setActiveTab('register')}
            onNavigateRekap={() => setActiveTab('rekapitulasi')}
            onAddNew={handleOpenNew}
          />
        )}

        {activeTab === 'register' && (
          <RegisterTable
            records={records}
            villages={villages}
            facility={facility}
            currentUser={currentUser}
            onAddNew={handleOpenNew}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteRecord}
            onOpenPrint={() => setIsPrintModalOpen(true)}
            onClearRecords={handleClearRecords}
            onLoadSampleAgustus={handleLoadSampleAgustus}
          />
        )}

        {activeTab === 'rekapitulasi' && (
          <RekapitulasiF2KB facility={facility} villages={villages} />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            facility={facility}
            onUpdateFacility={handleUpdateFacility}
            villages={villages}
            onUpdateVillages={handleUpdateVillages}
            users={users}
            onUpdateUsers={handleUpdateUsers}
            currentUser={currentUser}
            onDataReset={handleDataReset}
            onClearRecords={handleClearRecords}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-slate-500 text-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">SIM-KB Faskes</span>
            <span>•</span>
            <span>Sistem Register & Rekapitulasi Kontrasepsi (Format F/II/KB BKKBN)</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
            <span>Dikelola oleh {facility.name}</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <RegisterFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setFormEditData(null);
        }}
        onSave={handleSaveRecord}
        initialData={formEditData}
        villages={villages}
        currentUser={currentUser}
        existingRecordsCount={records.length}
      />

      <PrintRegisterModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={records}
        facility={facility}
        villages={villages}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          if (currentUser) setIsLoginModalOpen(false);
        }}
        onLoginSuccess={(user) => {
          handleLoginSuccess(user);
          setIsLoginModalOpen(false);
        }}
      />
    </div>
  );
}
