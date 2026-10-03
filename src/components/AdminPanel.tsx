import React, { useState } from 'react';
import { ActivityLog, District, FacilityProfile, Role, User, Village } from '../types';
import { StorageService } from '../services/storage';
import { FirestoreService } from '../services/firebase';
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
  LogIn,
  Eye,
  EyeOff,
  Layers,
  ArrowRightLeft,
  Check,
  X,
  UserCheck,
  Compass,
} from 'lucide-react';

interface AdminPanelProps {
  facility: FacilityProfile;
  onUpdateFacility: (f: FacilityProfile) => void;
  villages: Village[];
  onUpdateVillages: (v: Village[]) => void;
  districts: District[];
  onUpdateDistricts: (d: District[]) => void;
  users: User[];
  onUpdateUsers: (u: User[]) => void;
  currentUser: User | null;
  onDataReset: () => void;
  onClearRecords: () => void;
  onSwitchUser?: (user: User) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  facility,
  onUpdateFacility,
  villages,
  onUpdateVillages,
  districts,
  onUpdateDistricts,
  users,
  onUpdateUsers,
  currentUser,
  onDataReset,
  onClearRecords,
  onSwitchUser,
}) => {
  const isKecamatanAdmin = currentUser?.role === 'admin_kecamatan';
  const isSuperAdmin = currentUser?.role === 'admin_induk' || currentUser?.role === 'admin_kabupaten' || !currentUser;

  const [activeSubTab, setActiveSubTab] = useState<'districts' | 'villages' | 'profile' | 'users' | 'backup' | 'logs'>(
    isKecamatanAdmin ? 'users' : 'districts'
  );

  // Sinkronkan data pengguna segar saat subtab akun dibuka
  React.useEffect(() => {
    if (activeSubTab === 'users') {
      const fresh = StorageService.getUsers();
      onUpdateUsers(fresh);
    }
  }, [activeSubTab]);

  // Facility Profile Form state
  const [profileForm, setProfileForm] = useState<FacilityProfile>({ ...facility });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Real-time instant auto-save whenever any profile field changes
  const handleProfileChange = (field: keyof FacilityProfile, value: string) => {
    const updated = { ...profileForm, [field]: value };
    setProfileForm(updated);
    onUpdateFacility(updated);
    StorageService.saveFacilityProfile(updated);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 2000);
  };

  // District Form states
  const [newDistrictName, setNewDistrictName] = useState('');
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [editDistrictName, setEditDistrictName] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string>('SEMUA');
  const [districtAdminModal, setDistrictAdminModal] = useState<District | null>(null);
  const [assignModalTab, setAssignModalTab] = useState<'existing' | 'new'>('existing');
  const [selectedExistingUserId, setSelectedExistingUserId] = useState<string>('');
  const [newKecAdminUsername, setNewKecAdminUsername] = useState('');
  const [newKecAdminPassword, setNewKecAdminPassword] = useState('123');
  const [newKecAdminName, setNewKecAdminName] = useState('');
  const [newKecAdminNip, setNewKecAdminNip] = useState('');
  const [newKecAdminPhone, setNewKecAdminPhone] = useState('');

  // Keep defaults valid when districts list changes
  React.useEffect(() => {
    if (districts.length > 0) {
      if (!newVillageDistrict || !districts.some((d) => d.name === newVillageDistrict)) {
        setNewVillageDistrict(districts[0].name);
      }
      if (!newDistrictAssign || !districts.some((d) => d.name === newDistrictAssign)) {
        setNewDistrictAssign(districts[0].name);
      }
    }
  }, [districts]);

  const openDistrictAdminModal = (d: District) => {
    setDistrictAdminModal(d);
    const currentAssigned = users.find(
      (u) => u.role === 'admin_kecamatan' && (u.district || '').toLowerCase() === d.name.toLowerCase()
    );
    setSelectedExistingUserId(currentAssigned ? currentAssigned.id : '');
    setAssignModalTab('existing');
    setNewKecAdminUsername(`adminkec_${d.name.toLowerCase().replace(/\s+/g, '_')}`);
    setNewKecAdminName(`Admin Kec. ${d.name}`);
    setNewKecAdminPassword('123');
    setNewKecAdminNip('');
    setNewKecAdminPhone('');
  };

  const handleCreateAndAssignDistrictAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtAdminModal) return;
    const cleanUser = newKecAdminUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanPass = newKecAdminPassword.trim() || '123';
    const cleanName = newKecAdminName.trim();
    if (!cleanUser || !cleanName) {
      alert('Harap isi username dan nama lengkap admin kecamatan.');
      return;
    }
    const exists = users.some((u) => u.username.toLowerCase() === cleanUser);
    if (exists) {
      alert(`Username "${cleanUser}" sudah digunakan oleh akun lain.`);
      return;
    }
    const newU: User = {
      id: 'usr-' + Date.now(),
      username: cleanUser,
      password: cleanPass,
      role: 'admin_kecamatan',
      name: cleanName,
      district: districtAdminModal.name,
      nip: newKecAdminNip.trim() || undefined,
      phone: newKecAdminPhone.trim() || undefined,
    };
    const updated = [...users, newU];
    onUpdateUsers(updated);
    StorageService.saveSingleUser(newU);
    StorageService.logActivity(
      currentUser?.username || 'admin',
      'TENTUKAN_ADMIN_KECAMATAN',
      `Membuat akun baru ${newU.name} (@${newU.username}) dan menetapkannya sebagai Admin Kecamatan ${districtAdminModal.name}`
    );
    setDistrictAdminModal(null);
    setStatusMessage({
      text: `Akun Admin Kecamatan ${newU.name} berhasil dibuat dan ditugaskan untuk Kec. ${districtAdminModal.name}!`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Village Form states
  const [editingVillage, setEditingVillage] = useState<Village | null>(null);
  const [newVillageName, setNewVillageName] = useState('');
  const [newVillageDistrict, setNewVillageDistrict] = useState<string>(districts[0]?.name || facility.district);
  const [newVillageBidan, setNewVillageBidan] = useState('');
  const [newVillageNotes, setNewVillageNotes] = useState('');
  const [editVillageName, setEditVillageName] = useState('');
  const [editVillageDistrict, setEditVillageDistrict] = useState('');
  const [editVillageBidan, setEditVillageBidan] = useState('');
  const [editVillageNotes, setEditVillageNotes] = useState('');

  // User Form states & User Edit states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Role>('admin_desa');
  const [newVillageAssign, setNewVillageAssign] = useState(villages[0]?.name || '');
  const [newDistrictAssign, setNewDistrictAssign] = useState(districts[0]?.name || facility.district);
  const [hideUserList, setHideUserList] = useState(false);

  // Editing User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserRole, setEditUserRole] = useState<Role>('admin_desa');
  const [editUserDistrict, setEditUserDistrict] = useState('');
  const [editUserVillage, setEditUserVillage] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserNip, setEditUserNip] = useState('');

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

  // DISTRICT HANDLERS (ADMIN INDUK)
  const handleAddDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newDistrictName.trim();
    if (!cleanName) return;

    if (districts.some((d) => d.name.trim().toLowerCase() === cleanName.toLowerCase())) {
      setStatusMessage({ text: `Kecamatan "${cleanName}" sudah terdaftar.`, type: 'error' });
      return;
    }

    const newD: District = {
      id: 'kec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: cleanName,
    };

    const updated = [...districts, newD];
    // 1. Update React state seketika
    onUpdateDistricts(updated);
    // 2. Simpan ke local storage
    StorageService.saveSingleDistrict(newD);
    // 3. Simpan dan sinkronkan ke Cloud Firestore seketika
    await FirestoreService.saveDistrict(newD);
    FirestoreService.syncAllDistricts(updated);

    StorageService.logActivity(
      currentUser?.username || 'admin',
      'TAMBAH_KECAMATAN',
      `Menambah data Kecamatan ${newD.name}`
    );

    setNewDistrictName('');
    setStatusMessage({
      text: `✓ Kecamatan ${newD.name} berhasil ditambahkan dan langsung tersimpan!`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSaveEditDistrict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDistrict || !editDistrictName.trim()) return;
    const oldName = editingDistrict.name;
    const newName = editDistrictName.trim();

    const updatedDistrict: District = { ...editingDistrict, name: newName };
    const updatedDistricts = districts.map((d) =>
      d.id === editingDistrict.id ? updatedDistrict : d
    );
    onUpdateDistricts(updatedDistricts);
    StorageService.saveSingleDistrict(updatedDistrict);

    // If name changed, update villages and users mapped to this district
    if (oldName.toLowerCase() !== newName.toLowerCase()) {
      const updatedVillages = villages.map((v) =>
        (v.district || '').toLowerCase() === oldName.toLowerCase()
          ? { ...v, district: newName }
          : v
      );
      onUpdateVillages(updatedVillages);
      StorageService.saveVillages(updatedVillages);

      const updatedUsers = users.map((u) =>
        (u.district || '').toLowerCase() === oldName.toLowerCase()
          ? { ...u, district: newName }
          : u
      );
      onUpdateUsers(updatedUsers);
      StorageService.saveUsers(updatedUsers);
    }

    StorageService.logActivity(
      currentUser?.username || 'admin',
      'UPDATE_KECAMATAN',
      `Mengubah nama Kecamatan ${oldName} menjadi ${newName}`
    );

    setEditingDistrict(null);
    setStatusMessage({ text: `✓ Kecamatan berhasil diperbarui menjadi ${newName} dan langsung tersimpan!`, type: 'success' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteDistrict = (d: District) => {
    const villagesInD = villages.filter(
      (v) => (v.district || '').toLowerCase() === d.name.toLowerCase()
    );

    if (villagesInD.length > 0) {
      if (
        !window.confirm(
          `PERINGATAN: Terdapat ${villagesInD.length} desa binaan di Kecamatan ${d.name}.\nJika kecamatan ini dihapus, desa-desa tersebut akan dialihkan ke Kecamatan ${facility.district}.\n\nLanjutkan penghapusan?`
        )
      ) {
        return;
      }
      const remappedVillages = villages.map((v) =>
        (v.district || '').toLowerCase() === d.name.toLowerCase()
          ? { ...v, district: facility.district }
          : v
      );
      onUpdateVillages(remappedVillages);
      StorageService.saveVillages(remappedVillages);
    } else {
      if (!window.confirm(`Yakin ingin menghapus Kecamatan ${d.name}?`)) return;
    }

    const updatedDistricts = districts.filter((item) => item.id !== d.id);
    onUpdateDistricts(updatedDistricts);
    StorageService.deleteDistrict(d.id);

    // Reset user district if assigned
    const updatedUsers = users.map((u) =>
      (u.district || '').toLowerCase() === d.name.toLowerCase()
        ? { ...u, district: undefined }
        : u
    );
    onUpdateUsers(updatedUsers);
    StorageService.saveUsers(updatedUsers);

    StorageService.logActivity(
      currentUser?.username || 'admin',
      'HAPUS_KECAMATAN',
      `Menghapus data Kecamatan ${d.name}`
    );

    if (districtFilter === d.name) {
      setDistrictFilter('SEMUA');
    }
    setStatusMessage({ text: `✓ Kecamatan ${d.name} berhasil dihapus dan langsung tersimpan.`, type: 'success' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // ASSIGN ADMIN KECAMATAN
  const handleAssignDistrictAdmin = (districtName: string, targetUserId: string) => {
    if (!targetUserId) {
      // Unassign
      const updatedUsers = users.map((u) =>
        u.role === 'admin_kecamatan' && (u.district || '').toLowerCase() === districtName.toLowerCase()
          ? { ...u, district: undefined }
          : u
      );
      onUpdateUsers(updatedUsers);
      StorageService.saveUsers(updatedUsers);
      setDistrictAdminModal(null);
      setStatusMessage({
        text: `Admin Kecamatan untuk ${districtName} berhasil dikosongkan.`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) return;

    const updatedUsers = users.map((u) => {
      if (u.id === targetUserId) {
        return {
          ...u,
          role: 'admin_kecamatan' as Role,
          district: districtName,
        };
      }
      if (u.role === 'admin_kecamatan' && (u.district || '').toLowerCase() === districtName.toLowerCase()) {
        return {
          ...u,
          district: undefined,
        };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    StorageService.saveUsers(updatedUsers);
    StorageService.logActivity(
      currentUser?.username || 'admin',
      'TENTUKAN_ADMIN_KECAMATAN',
      `Menetapkan ${targetUser.name} (@${targetUser.username}) sebagai Admin Kecamatan ${districtName}`
    );

    setDistrictAdminModal(null);
    setStatusMessage({
      text: `Berhasil menetapkan ${targetUser.name} (@${targetUser.username}) sebagai Admin Kecamatan ${districtName}!`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // VILLAGE HANDLERS
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

  const handleBulkLockDistrictVillages = (distName: string, allow: boolean) => {
    const updated = villages.map((v) => {
      if ((v.district || '').toLowerCase() === distName.toLowerCase()) {
        return { ...v, entryAllowed: allow };
      }
      return v;
    });
    onUpdateVillages(updated);
    StorageService.saveVillages(updated);
    StorageService.logActivity(
      currentUser?.username || 'admin',
      'UBAH_IZIN_KECAMATAN',
      `${allow ? 'Membuka' : 'Mengunci'} seluruh izin desa di Kecamatan ${distName}`
    );
    setStatusMessage({
      text: `${allow ? 'Membuka izin entri' : 'Mengunci entri'} seluruh desa di Kecamatan ${distName}`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleAddVillage = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newVillageName.trim();
    if (!cleanName) return;

    const exists = villages.some((v) => v.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      alert(`Nama desa "${cleanName}" sudah terdaftar.`);
      return;
    }

    const targetDist = newVillageDistrict || districts[0]?.name || facility.district;

    const newV: Village = {
      id: 'des-' + Date.now(),
      name: cleanName,
      district: targetDist,
      entryAllowed: true,
      assignedBidanName: newVillageBidan.trim(),
      assignedUsername: cleanName.toLowerCase().replace(/\s+/g, '_'),
      notes: newVillageNotes.trim() || undefined,
    };

    const updated = [...villages, newV];
    onUpdateVillages(updated);
    StorageService.saveSingleVillage(newV);
    StorageService.logActivity(
      currentUser?.username || 'admin',
      'TAMBAH_DESA',
      `Menambah data Desa ${newV.name} di Kecamatan ${targetDist}`
    );

    setNewVillageName('');
    setNewVillageBidan('');
    setNewVillageNotes('');
    setStatusMessage({
      text: `Desa ${newV.name} berhasil ditambahkan ke Kecamatan ${targetDist}!`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleStartEditVillage = (v: Village) => {
    setEditingVillage(v);
    setEditVillageName(v.name);
    setEditVillageDistrict(v.district || districts[0]?.name || facility.district);
    setEditVillageBidan(v.assignedBidanName || '');
    setEditVillageNotes(v.notes || '');
  };

  const handleSaveEditVillage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVillage || !editVillageName.trim()) return;

    const updatedV: Village = {
      ...editingVillage,
      name: editVillageName.trim(),
      district: editVillageDistrict || editingVillage.district,
      assignedBidanName: editVillageBidan.trim(),
      notes: editVillageNotes.trim() || undefined,
    };

    const updated = villages.map((v) => (v.id === editingVillage.id ? updatedV : v));
    onUpdateVillages(updated);
    StorageService.saveSingleVillage(updatedV);
    StorageService.logActivity(
      currentUser?.username || 'admin',
      'UPDATE_DESA',
      `Memperbarui Desa ${updatedV.name} (Kecamatan: ${updatedV.district})`
    );

    setEditingVillage(null);
    setStatusMessage({
      text: `✓ Desa ${updatedV.name} berhasil diperbarui dan langsung tersimpan!`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleQuickMoveVillageDistrict = (villageId: string, targetDistrict: string) => {
    const targetV = villages.find((v) => v.id === villageId);
    if (!targetV || targetV.district === targetDistrict) return;

    const movedV: Village = { ...targetV, district: targetDistrict };
    const updated = villages.map((v) => (v.id === villageId ? movedV : v));
    onUpdateVillages(updated);
    StorageService.saveSingleVillage(movedV);
    StorageService.logActivity(
      currentUser?.username || 'admin',
      'PINDAH_KECAMATAN_DESA',
      `Memindahkan Desa ${targetV.name} dari Kec. ${targetV.district} ke Kec. ${targetDistrict}`
    );

    setStatusMessage({
      text: `✓ Desa ${targetV.name} berhasil dipindahkan ke Kecamatan ${targetDistrict} dan langsung tersimpan!`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteVillage = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus Desa ${name}? Data register yang sudah ada tidak akan hilang.`)) {
      const updated = villages.filter((v) => v.id !== id);
      onUpdateVillages(updated);
      StorageService.deleteVillage(id);
      StorageService.logActivity(currentUser?.username || 'admin', 'HAPUS_DESA', `Menghapus data Desa ${name}`);
      setStatusMessage({ text: `✓ Desa ${name} berhasil dihapus dan langsung tersimpan.`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleClearAllVillages = () => {
    if (
      window.confirm(
        'PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh data nama desa? Seluruh desa binaan akan dihapus menjadi 0 desa.'
      )
    ) {
      onUpdateVillages([]);
      StorageService.clearAllVillages();
      StorageService.logActivity(
        currentUser?.username || 'admin',
        'KOSONGKAN_SEMUA_DESA',
        'Mengosongkan seluruh nama desa binaan di kabupaten'
      );
      setStatusMessage({ text: '✓ Seluruh nama desa berhasil dikosongkan.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // USER HANDLERS
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = newUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanPass = newPassword.trim();
    const cleanName = newName.trim();

    if (!cleanUser || !cleanPass || !cleanName) {
      alert('Harap isi username, kata sandi, dan nama lengkap pengguna.');
      return;
    }

    const exists = users.some((u) => u.username.toLowerCase() === cleanUser);
    if (exists) {
      alert(`Username "${cleanUser}" sudah digunakan. Silakan gunakan username lain.`);
      return;
    }

    const newU: User = {
      id: 'usr-' + Date.now(),
      username: cleanUser,
      password: cleanPass,
      role: newRole,
      name: cleanName,
      district: newRole === 'admin_kecamatan' ? newDistrictAssign : undefined,
      village: (newRole === 'admin_desa' || newRole === 'bidan_desa') ? newVillageAssign : undefined,
    };

    const updated = [...users, newU];
    onUpdateUsers(updated);
    StorageService.saveSingleUser(newU);
    StorageService.logActivity(
      currentUser?.username || 'admin',
      'TAMBAH_USER',
      `Menambah pengguna baru: ${newU.name} (@${newU.username}) dengan peran ${newU.role}`
    );

    setNewUsername('');
    setNewPassword('123');
    setNewName('');
    setStatusMessage({
      text: `✓ Pengguna ${newU.name} (@${newU.username}) berhasil ditambahkan dan langsung tersimpan! Kata sandi: "${cleanPass}"`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleStartEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserUsername(u.username);
    setEditUserPassword(u.password);
    setEditUserRole(u.role);
    setEditUserDistrict(u.district || districts[0]?.name || facility.district);
    setEditUserVillage(u.village || villages[0]?.name || '');
    setEditUserPhone(u.phone || '');
    setEditUserNip(u.nip || '');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editUserName.trim() || !editUserUsername.trim()) return;

    const cleanUser = editUserUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const existingOther = users.some(
      (u) => u.id !== editingUser.id && u.username.toLowerCase() === cleanUser
    );
    if (existingOther) {
      alert(`Username "${cleanUser}" sudah digunakan oleh akun lain.`);
      return;
    }

    const updatedUser: User = {
      ...editingUser,
      name: editUserName.trim(),
      username: cleanUser,
      password: editUserPassword.trim() || '123',
      role: editUserRole,
      district: editUserRole === 'admin_kecamatan' ? editUserDistrict : (editUserRole === 'admin_induk' ? undefined : editingUser.district),
      village: (editUserRole === 'admin_desa' || editUserRole === 'bidan_desa') ? editUserVillage : undefined,
      phone: editUserPhone.trim() || undefined,
      nip: editUserNip.trim() || undefined,
    };

    const updated = users.map((u) => (u.id === editingUser.id ? updatedUser : u));
    onUpdateUsers(updated);
    StorageService.saveSingleUser(updatedUser);
    if (currentUser?.id === updatedUser.id) {
      StorageService.setCurrentUser(updatedUser);
    }
    StorageService.logActivity(
      currentUser?.username || 'admin',
      'UPDATE_USER',
      `Memperbarui data akun ${updatedUser.name} (@${updatedUser.username})`
    );

    setEditingUser(null);
    setStatusMessage({ text: `✓ Akun ${updatedUser.name} berhasil diperbarui dan langsung tersimpan!`, type: 'success' });
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
      StorageService.deleteUser(id);
      StorageService.logActivity(currentUser?.username || 'admin', 'HAPUS_USER', `Menghapus pengguna ${name}`);
      setStatusMessage({ text: `✓ Pengguna ${name} berhasil dihapus dan langsung tersimpan.`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
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
            <span>
              {isKecamatanAdmin
                ? '🏢 Panel Pengawasan Wilayah & Manajemen Admin Desa'
                : '👑 Panel Pengaturan Dinas P3AKB & Kendali Admin Induk Kabupaten'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKecamatanAdmin
              ? 'Membawahi seluruh akun Admin Desa (Petugas Entri), status desa binaan, dan riwayat entri pelayanan di kecamatan'
              : 'Mengendalikan seluruh konfigurasi tingkat Kabupaten: profil Dinas P3AKB Bojonegoro, pimpinan, akun Admin Kecamatan & Admin Desa, wilayah kecamatan, pencadangan & pemulihan sistem'}
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
        {(isKecamatanAdmin
          ? [
              { id: 'users', label: `Kelola Akun Admin Desa (${users.filter((u) => u.role === 'admin_desa' || u.role === 'bidan_desa').length})`, icon: Users },
              { id: 'villages', label: `Desa Kec. ${currentUser?.district || facility.district} (${villages.filter((v) => (v.district || '').toLowerCase() === (currentUser?.district || facility.district).toLowerCase()).length})`, icon: MapPin },
              { id: 'logs', label: 'Riwayat Entri Pelayanan', icon: History },
            ]
          : [
              { id: 'districts', label: `Kelola Wilayah Kecamatan (${districts.length})`, icon: Layers },
              { id: 'villages', label: `Kelola Desa Binaan (${villages.length})`, icon: MapPin },
              { id: 'profile', label: 'Profil Dinas & Pimpinan', icon: Building2 },
              { id: 'users', label: `Semua Akun Pengguna (${users.length})`, icon: Users },
              { id: 'backup', label: 'Cadangkan & Pulihkan', icon: Database },
              { id: 'logs', label: 'Log Aktivitas Sistem', icon: History },
            ]
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                isActive
                  ? isKecamatanAdmin
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: PROFIL DINAS P3AKB */}
      {activeSubTab === 'profile' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Profil Dinas P3AKB Kabupaten Bojonegoro & Pimpinan</h3>
              <p className="text-xs text-slate-500">
                Informasi ini akan tercetak otomatis pada Kop Surat dan Lembar Laporan Formulir F/II/KB
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200 flex items-center space-x-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tersimpan Otomatis</span>
              </span>
              {profileSaveSuccess && (
                <span className="text-xs text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full font-bold border border-emerald-300 animate-fade-in flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersimpan!</span>
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Instansi / Dinas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
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
                  onChange={(e) => handleProfileChange('k0kbCode', e.target.value)}
                  required
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Instansi / Balai KB BKKBN
                </label>
                <input
                  type="text"
                  value={profileForm.code}
                  onChange={(e) => handleProfileChange('code', e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kecamatan Kantor
                </label>
                <input
                  type="text"
                  value={profileForm.district}
                  onChange={(e) => handleProfileChange('district', e.target.value)}
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
                  onChange={(e) => handleProfileChange('regency', e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Kantor Dinas
                </label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
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
                  onChange={(e) => handleProfileChange('province', e.target.value)}
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
                  <span className="text-xs font-bold text-emerald-800 block">Kepala Dinas P3AKB Bojonegoro (Pimpinan)</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      value={profileForm.headName}
                      onChange={(e) => handleProfileChange('headName', e.target.value)}
                      required
                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIP Pimpinan</label>
                    <input
                      type="text"
                      value={profileForm.headNip}
                      onChange={(e) => handleProfileChange('headNip', e.target.value)}
                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jabatan Resmi</label>
                    <input
                      type="text"
                      value={profileForm.headTitle}
                      onChange={(e) => handleProfileChange('headTitle', e.target.value)}
                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Bidan Koordinator / Kepala Bidang KB */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-bold text-teal-800 block">Kepala Bidang Pengendalian Penduduk & KB (Dalduk KB)</span>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap & Gelar</label>
                    <input
                      type="text"
                      value={profileForm.kbCoordinatorName}
                      onChange={(e) => handleProfileChange('kbCoordinatorName', e.target.value)}
                      required
                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIP Pengelola</label>
                    <input
                      type="text"
                      value={profileForm.kbCoordinatorNip}
                      onChange={(e) => handleProfileChange('kbCoordinatorNip', e.target.value)}
                      className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-md font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jabatan Resmi</label>
                    <input
                      type="text"
                      value={profileForm.kbCoordinatorTitle}
                      onChange={(e) => handleProfileChange('kbCoordinatorTitle', e.target.value)}
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

      {/* SUBTAB: KELOLA WILAYAH KECAMATAN (HANYA ADMIN INDUK) */}
      {activeSubTab === 'districts' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-100">
              <div>
                <h3 className="text-sm font-bold text-purple-950 flex items-center space-x-2">
                  <span className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                    <Layers className="w-4 h-4" />
                  </span>
                  <span>Manajemen Wilayah Kecamatan se-Kabupaten</span>
                </h3>
                <p className="text-xs text-purple-700/80 mt-0.5">
                  Admin Induk dapat menambah kecamatan baru, mengubah nama, dan menentukan akun Admin Kecamatan yang bertanggung jawab. Data langsung tersimpan seketika di sistem dan cloud Firestore.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full self-start sm:self-auto shadow-2xs">
                {districts.length} Kecamatan Terdaftar
              </span>
            </div>

            {/* Form Tambah Kecamatan Baru */}
            <form onSubmit={handleAddDistrict} className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/70 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                <span className="text-xs font-bold text-purple-900">Tambah Kecamatan Baru</span>
                <span className="text-[11px] text-purple-600 font-medium">(Data Langsung Tersimpan Otomatis ke Cloud)</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kecamatan Baru <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDistrictName}
                    onChange={(e) => setNewDistrictName(e.target.value)}
                    placeholder="Contoh: Gondang, Masaran, Jenar, Ngrampal, Kedawung..."
                    required
                    className="w-full text-xs py-2.5 px-3 bg-white border border-purple-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 shadow-2xs font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto py-2.5 px-5 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah & Simpan Kecamatan</span>
                </button>
              </div>
            </form>

            {/* Grid Kartu Kecamatan & Penentuan Admin */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {districts.map((d) => {
                const villagesInD = villages.filter(
                  (v) => (v.district || '').toLowerCase() === d.name.toLowerCase()
                );
                const assignedAdmin = users.find(
                  (u) =>
                    u.role === 'admin_kecamatan' &&
                    (u.district || '').toLowerCase() === d.name.toLowerCase()
                );

                return (
                  <div
                    key={d.id}
                    className="p-3.5 bg-gradient-to-br from-slate-50 to-purple-50/40 rounded-xl border border-slate-200 hover:border-purple-300 transition space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-1 bg-white border border-purple-200 rounded-md shadow-2xs">
                          <Building2 className="w-4 h-4 text-purple-700" />
                        </span>
                        <span className="font-bold text-slate-900 text-sm">Kec. {d.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-800 bg-white border border-purple-200 px-2 py-0.5 rounded-full">
                        {villagesInD.length} Desa
                      </span>
                    </div>

                    {/* Info Admin Kecamatan */}
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Admin Kecamatan:
                        </span>
                        <button
                          type="button"
                          onClick={() => openDistrictAdminModal(d)}
                          className="text-[10px] font-bold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer flex items-center space-x-1"
                        >
                          <UserCheck className="w-3 h-3 text-purple-600" />
                          <span>{assignedAdmin ? 'Ganti Admin' : 'Tetapkan Admin'}</span>
                        </button>
                      </div>

                      {assignedAdmin ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{assignedAdmin.name}</div>
                            <div className="text-[10px] text-purple-700 font-mono">
                              @{assignedAdmin.username} {assignedAdmin.nip ? `• NIP: ${assignedAdmin.nip}` : ''}
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                            Aktif
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 flex items-center justify-between">
                          <span>⚠️ Belum ada admin ditugaskan</span>
                          <button
                            type="button"
                            onClick={() => openDistrictAdminModal(d)}
                            className="font-bold text-purple-800 underline text-[10px] ml-1 cursor-pointer"
                          >
                            Tentukan
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDistrict(d);
                          setEditDistrictName(d.name);
                        }}
                        className="text-[11px] text-slate-600 hover:text-purple-700 flex items-center space-x-1 cursor-pointer font-medium"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Ubah Nama</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNewVillageDistrict(d.name);
                          setActiveSubTab('villages');
                        }}
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 flex items-center space-x-1 cursor-pointer font-semibold"
                        title="Tambah desa binaan di kecamatan ini"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Desa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDistrict(d)}
                        className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-1 cursor-pointer font-medium"
                        title="Hapus Kecamatan"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: WILAYAH (DESA BINAAN) */}
      {activeSubTab === 'villages' && (
        <div className="space-y-6">
          {/* Quick banner ke Kelola Kecamatan untuk Admin Induk */}
          {isSuperAdmin && (
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 bg-purple-100 text-purple-800 rounded-xl">
                  <Layers className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-purple-950">Ingin menambah atau mengelola Wilayah Kecamatan?</h4>
                  <p className="text-[11px] text-purple-700">Tersedia {districts.length} kecamatan se-kabupaten dengan konfigurasi admin masing-masing.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab('districts')}
                className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer self-end sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buka Kelola Kecamatan</span>
              </button>
            </div>
          )}

          {/* BAGIAN 2: PENGELOMPOKAN & KELOLA DESA SESUAI KECAMATAN */}
          <div className="space-y-4">
            {/* Form Tambah Desa Binaan Baru */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Tambah Desa Binaan Baru</span>
                </h3>
                {isSuperAdmin && villages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllVillages}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                    title="Kosongkan seluruh data nama desa"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Kosongkan Semua Desa</span>
                  </button>
                )}
              </div>
              <form onSubmit={handleAddVillage} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Desa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newVillageName}
                    onChange={(e) => setNewVillageName(e.target.value)}
                    placeholder="Contoh: Duyungan / Sambungmacan"
                    required
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pilih Kecamatan yang Menaungi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newVillageDistrict}
                    onChange={(e) => setNewVillageDistrict(e.target.value)}
                    disabled={isKecamatanAdmin}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.name}>
                        Kecamatan {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bidan Penanggung Jawab</label>
                  <input
                    type="text"
                    value={newVillageBidan}
                    onChange={(e) => setNewVillageBidan(e.target.value)}
                    placeholder="Contoh: Bd. Siti Rahayu, S.Tr.Keb"
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambahkan Desa</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Filter Tabs Pengelompokan Desa per Kecamatan */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 px-2.5 flex items-center space-x-1">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>Kelompokkan:</span>
              </span>
              <button
                type="button"
                onClick={() => setDistrictFilter('SEMUA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  districtFilter === 'SEMUA'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                🌐 Semua Kecamatan ({villages.length} Desa)
              </button>
              {districts.map((d) => {
                const count = villages.filter(
                  (v) => (v.district || '').toLowerCase() === d.name.toLowerCase()
                ).length;
                const isSelected = districtFilter.toLowerCase() === d.name.toLowerCase();
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDistrictFilter(d.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-900 border border-slate-200/80'
                    }`}
                  >
                    <span>🏢 Kec. {d.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isSelected ? 'bg-purple-900/60 text-purple-100' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Daftar Desa Dikelompokkan per Kecamatan */}
            {villages.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Semua Data Nama Desa Telah Kosong (0 Desa)</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Seluruh nama desa binaan telah dikosongkan. Anda dapat menambahkan nama desa baru sesuai kebutuhan per kecamatan menggunakan formulir &ldquo;Tambah Desa Binaan Baru&rdquo; di atas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
              {(districtFilter === 'SEMUA'
                ? districts
                : districts.filter((d) => d.name.toLowerCase() === districtFilter.toLowerCase())
              ).map((districtItem) => {
                const districtVillages = villages.filter(
                  (v) => (v.district || '').toLowerCase() === districtItem.name.toLowerCase()
                );
                const assignedAdmin = users.find(
                  (u) =>
                    u.role === 'admin_kecamatan' &&
                    (u.district || '').toLowerCase() === districtItem.name.toLowerCase()
                );

                return (
                  <div
                    key={districtItem.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                  >
                    {/* Header Kelompok Kecamatan */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 via-purple-50/30 to-indigo-50/20 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                            <Building2 className="w-4 h-4 text-purple-700" />
                            <span>Kecamatan {districtItem.name}</span>
                          </span>
                          <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                            {districtVillages.length} Desa Binaan
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2">
                          <span>
                            Admin Kecamatan:{' '}
                            {assignedAdmin ? (
                              <strong className="text-purple-900">
                                {assignedAdmin.name} (@{assignedAdmin.username})
                              </strong>
                            ) : (
                              <span className="text-amber-700 font-semibold italic">Belum ditentukan</span>
                            )}
                          </span>
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => openDistrictAdminModal(districtItem)}
                              className="text-purple-700 font-bold underline text-[10px] hover:text-purple-900 cursor-pointer"
                            >
                              [Tentukan / Ganti Admin]
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tombol Aksi Cepat per Kelompok Kecamatan */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setNewVillageDistrict(districtItem.name);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                          title={`Tambah desa baru langsung ke Kecamatan ${districtItem.name}`}
                        >
                          <Plus className="w-3 h-3 text-emerald-600" />
                          <span>+ Desa di Kec Ini</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBulkLockDistrictVillages(districtItem.name, true)}
                          className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                          title="Buka seluruh izin entri desa di kecamatan ini"
                        >
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span>Buka Semua</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBulkLockDistrictVillages(districtItem.name, false)}
                          className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-amber-50 text-amber-700 border border-slate-200 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                          title="Kunci seluruh izin entri desa di kecamatan ini"
                        >
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Kunci Semua</span>
                        </button>
                      </div>
                    </div>

                    {/* Daftar Desa di Kecamatan Ini */}
                    {districtVillages.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Belum ada desa yang dikelompokkan ke Kecamatan {districtItem.name}.
                        <button
                          type="button"
                          onClick={() => {
                            setNewVillageDistrict(districtItem.name);
                            window.scrollTo({ top: 400, behavior: 'smooth' });
                          }}
                          className="text-purple-700 font-bold underline ml-1 cursor-pointer"
                        >
                          Tambahkan desa sekarang &rarr;
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {districtVillages.map((v) => (
                          <div
                            key={v.id}
                            className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition text-xs"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
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
                              <div className="text-slate-500 mt-0.5 text-[11px]">
                                Bidan Desa: <span className="text-slate-700 font-medium">{v.assignedBidanName || 'Belum diisi'}</span>
                                {v.notes && <span className="text-slate-400 ml-2">• {v.notes}</span>}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                              {/* Quick Move District Dropdown */}
                              {isSuperAdmin && (
                                <div
                                  className="flex items-center space-x-1.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
                                  title="Pindahkan desa ini ke kecamatan lain"
                                >
                                  <ArrowRightLeft className="w-3 h-3 text-purple-600" />
                                  <span className="text-slate-500 font-semibold">Pindah ke:</span>
                                  <select
                                    value={v.district}
                                    onChange={(e) => handleQuickMoveVillageDistrict(v.id, e.target.value)}
                                    className="bg-transparent font-bold text-purple-900 focus:outline-none cursor-pointer"
                                  >
                                    {districts.map((dOption) => (
                                      <option key={dOption.id} value={dOption.name}>
                                        Kec. {dOption.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <button
                                onClick={() => handleToggleVillageLock(v.id)}
                                title={v.entryAllowed ? 'Kunci Entri Desa Ini' : 'Buka Kunci Entri'}
                                className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                  v.entryAllowed
                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                {v.entryAllowed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                <span>{v.entryAllowed ? 'Kunci' : 'Buka Izin'}</span>
                              </button>

                              <button
                                onClick={() => handleStartEditVillage(v)}
                                title="Ubah Nama & Kecamatan Desa"
                                className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition cursor-pointer border border-slate-200 bg-white"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteVillage(v.id, v.name)}
                                title="Hapus Desa"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer border border-slate-200 bg-white"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
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
            <form onSubmit={handleAddUser} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="Contoh: adminkecamatan / bidan_duyungan"
                    required
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Huruf kecil, tanpa spasi</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kata Sandi (Password)</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    required
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Bawaan: 123</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Petugas</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nama Lengkap / Jabatan"
                    required
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    disabled={isKecamatanAdmin}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                  >
                    <option value="admin_desa">🌿 Admin Desa (Petugas Entri Data)</option>
                    {!isKecamatanAdmin && (
                      <>
                        <option value="admin_kecamatan">🏢 Admin Kecamatan (Membawahi Admin Desa)</option>
                        <option value="admin_induk">👑 Admin Induk Kabupaten (Mengendalikan Semuanya)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {newRole === 'admin_kecamatan' && (
                <div className="w-full sm:w-1/2 lg:w-1/4 text-xs">
                  <label className="block font-semibold text-slate-700 mb-1">Pilih Wilayah Kecamatan</label>
                  <select
                    value={newDistrictAssign}
                    onChange={(e) => setNewDistrictAssign(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.name}>
                        Kecamatan {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(newRole === 'admin_desa' || newRole === 'bidan_desa') && (
                <div className="w-full sm:w-1/2 lg:w-1/4 text-xs">
                  <label className="block font-semibold text-slate-700 mb-1">Pilih Wilayah Desa Binaan</label>
                  <select
                    value={newVillageAssign}
                    onChange={(e) => setNewVillageAssign(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                  >
                    {villages.map((v) => (
                      <option key={v.id} value={v.name}>
                        Desa {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500">
                  {newUsername.trim() ? (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      Data Login: Username <strong className="font-mono">@{newUsername.trim().toLowerCase().replace(/\s+/g, '_')}</strong> | Password: <strong className="font-mono">{newPassword.trim() || '123'}</strong>
                    </span>
                  ) : (
                    <span>Isi form di atas untuk mendaftarkan akun baru</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto py-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan & Daftarkan Akun</span>
                </button>
              </div>
            </form>
          </div>

          {/* User List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Daftar Akun Pengguna Terdaftar</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {users.length} Akun
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Seluruh akun terdaftar yang aktif dan dapat login ke dalam aplikasi
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setHideUserList(!hideUserList)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs active:scale-95"
                  title={hideUserList ? 'Tampilkan daftar akun' : 'Sembunyikan daftar akun'}
                >
                  {hideUserList ? <Eye className="w-3.5 h-3.5 text-slate-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{hideUserList ? 'Tampilkan Daftar Akun' : 'Sembunyikan Daftar Akun'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const fresh = StorageService.getUsers();
                    onUpdateUsers(fresh);
                    setStatusMessage({
                      text: `Berhasil menyinkronkan ${fresh.length} akun pengguna dari sistem basis data.`,
                      type: 'success',
                    });
                    setTimeout(() => setStatusMessage(null), 3000);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Segarkan</span>
                </button>
              </div>
            </div>
            {!hideUserList ? (
              <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition text-xs">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="font-bold text-slate-900">{u.name}</span>
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        @{u.username}
                      </span>
                      {(u.role === 'admin_induk' || u.role === 'admin_kabupaten') && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          👑 Admin Induk Kabupaten
                        </span>
                      )}
                      {u.role === 'admin_kecamatan' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          🏢 Admin Kec. {u.district || facility.district}
                        </span>
                      )}
                      {(u.role === 'admin_desa' || u.role === 'bidan_desa') && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          🌿 Admin Desa: {u.village || 'Entri Pelayanan'}
                        </span>
                      )}
                      {currentUser?.username === u.username && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          (Sedang Aktif)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>Password: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700 font-semibold">{u.password}</code></span>
                      {u.district && u.role === 'admin_kecamatan' && <span>• Wilayah: <strong>Kec. {u.district}</strong></span>}
                      {u.nip && <span>• NIP: {u.nip}</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {onSwitchUser && currentUser?.username !== u.username && (
                      <button
                        type="button"
                        onClick={() => onSwitchUser(u)}
                        className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-medium flex items-center space-x-1 cursor-pointer transition active:scale-95"
                        title={`Masuk langsung sebagai ${u.name}`}
                      >
                        <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Masuk Akun Ini</span>
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleStartEditUser(u)}
                        className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg font-medium flex items-center space-x-1 cursor-pointer transition active:scale-95"
                        title="Edit Akun, Peran, & Penugasan Wilayah"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Edit Akun</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPassword(u)}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center space-x-1 cursor-pointer transition"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Ubah Password</span>
                    </button>
                    {u.username !== 'admin' && (isSuperAdmin || u.role === 'bidan_desa') && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus Pengguna"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/70 text-slate-500 text-xs space-y-2">
                <Shield className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700">Daftar Akun Pengguna Disembunyikan</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Informasi seluruh akun pengguna disembunyikan demi menjaga privasi dan keamanan sistem. Klik tombol &ldquo;Tampilkan Daftar Akun&rdquo; di atas untuk membuka kembali.
                </p>
              </div>
            )}
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
                Mengekspor seluruh data profil dinas P3AKB, kecamatan, desa binaan, akun pengguna, dan seluruh catatan register pelayanan KB ke dalam format file JSON.
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
                Menghapus seluruh catatan rekam pelayanan KB pasien agar sistem bersih menjadi 0 data untuk pencatatan baru. Data profil dinas P3AKB, kecamatan, desa, dan akun pengguna tetap aman tersimpan.
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

      {/* MODAL 1: TENTUKAN ADMIN KECAMATAN */}
      {districtAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-5 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Building2 className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200 block">
                    Penetapan Penanggung Jawab Wilayah
                  </span>
                  <h3 className="text-base font-extrabold">
                    Kecamatan {districtAdminModal.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDistrictAdminModal(null)}
                className="text-white/70 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Status saat ini */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Admin Kecamatan Saat Ini:</span>
                {(() => {
                  const curr = users.find(
                    (u) =>
                      u.role === 'admin_kecamatan' &&
                      (u.district || '').toLowerCase() === districtAdminModal.name.toLowerCase()
                  );
                  return curr ? (
                    <span className="font-bold text-purple-900 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                      {curr.name} (@{curr.username})
                    </span>
                  ) : (
                    <span className="text-amber-700 italic font-medium">Belum ada akun ditugaskan</span>
                  );
                })()}
              </div>

              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAssignModalTab('existing')}
                  className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
                    assignModalTab === 'existing'
                      ? 'bg-white text-purple-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pilih dari Akun Terdaftar
                </button>
                <button
                  type="button"
                  onClick={() => setAssignModalTab('new')}
                  className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
                    assignModalTab === 'new'
                      ? 'bg-white text-purple-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Buat Akun Admin Baru
                </button>
              </div>

              {assignModalTab === 'existing' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pilih Akun untuk Ditugaskan sebagai Admin Kec. {districtAdminModal.name}:
                    </label>
                    <select
                      value={selectedExistingUserId}
                      onChange={(e) => setSelectedExistingUserId(e.target.value)}
                      className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                    >
                      <option value="">-- Kosongkan / Lepas Penugasan --</option>
                      {users
                        .filter((u) => u.username !== 'admin')
                        .map((u) => {
                          const isCurrent =
                            u.role === 'admin_kecamatan' &&
                            (u.district || '').toLowerCase() === districtAdminModal.name.toLowerCase();
                          return (
                            <option key={u.id} value={u.id}>
                              {u.name} (@{u.username}) &bull; [Peran: {u.role === 'admin_kecamatan' ? `Admin Kec. ${u.district || ''}` : u.role === 'admin_desa' ? `Desa ${u.village || ''}` : u.role}] {isCurrent ? '★ (Sedang Bertugas di sini)' : ''}
                            </option>
                          );
                        })}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                      Akun yang dipilih akan otomatis diubah perannya menjadi <strong>Admin Kecamatan</strong> dengan wilayah tanggung jawab <strong>Kecamatan {districtAdminModal.name}</strong>.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setDistrictAdminModal(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAssignDistrictAdmin(districtAdminModal.name, selectedExistingUserId)}
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Simpan Penugasan Admin</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateAndAssignDistrictAdmin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Lengkap Petugas <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newKecAdminName}
                      onChange={(e) => setNewKecAdminName(e.target.value)}
                      placeholder={`Contoh: Admin Kec. ${districtAdminModal.name}`}
                      required
                      className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Username Login <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newKecAdminUsername}
                        onChange={(e) => setNewKecAdminUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        required
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newKecAdminPassword}
                        onChange={(e) => setNewKecAdminPassword(e.target.value)}
                        required
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Petugas</label>
                      <input
                        type="text"
                        value={newKecAdminNip}
                        onChange={(e) => setNewKecAdminNip(e.target.value)}
                        placeholder="Opsional"
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                      <input
                        type="text"
                        value={newKecAdminPhone}
                        onChange={(e) => setNewKecAdminPhone(e.target.value)}
                        placeholder="Opsional"
                        className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-purple-50 text-purple-900 rounded-xl border border-purple-100 text-[11px]">
                    Akun baru ini akan otomatis berkedudukan sebagai <strong>Admin Kecamatan</strong> untuk <strong>Kecamatan {districtAdminModal.name}</strong>.
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setDistrictAdminModal(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Akun & Tetapkan</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UBAH NAMA KECAMATAN */}
      {editingDistrict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-purple-200" />
                <span>Ubah Nama Kecamatan</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingDistrict(null)}
                className="text-white/70 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDistrict} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kecamatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editDistrictName}
                  onChange={(e) => setEditDistrictName(e.target.value)}
                  required
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Perubahan nama kecamatan akan otomatis memperbarui pengelompokan seluruh desa binaan dan akun admin yang dinaungi kecamatan ini.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingDistrict(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Nama Kecamatan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT DATA & PENGELOMPOKAN DESA */}
      {editingVillage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-emerald-200" />
                <span>Edit & Kelompokkan Desa: {editingVillage.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingVillage(null)}
                className="text-white/70 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVillage} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Desa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editVillageName}
                  onChange={(e) => setEditVillageName(e.target.value)}
                  required
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kecamatan yang Menaungi (Pengelompokan Desa) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editVillageDistrict}
                  onChange={(e) => setEditVillageDistrict(e.target.value)}
                  disabled={isKecamatanAdmin}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.name}>
                      Kecamatan {d.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ubah pilihan ini untuk memindahkan desa ke kelompok kecamatan lain.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bidan Penanggung Jawab Desa
                </label>
                <input
                  type="text"
                  value={editVillageBidan}
                  onChange={(e) => setEditVillageBidan(e.target.value)}
                  placeholder="Contoh: Bd. Siti Rahayu, S.Tr.Keb"
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Wilayah
                </label>
                <input
                  type="text"
                  value={editVillageNotes}
                  onChange={(e) => setEditVillageNotes(e.target.value)}
                  placeholder="Contoh: Wilayah Desa RT 01-15"
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingVillage(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Desa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT AKUN PENGGUNA & PENUGASAN WILAYAH */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-indigo-950 text-white p-5 flex items-center justify-between">
              <h3 className="text-base font-extrabold flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-300" />
                <span>Edit Akun Pengguna & Penugasan Wilayah</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-white/70 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Petugas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    required
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editUserUsername}
                    onChange={(e) => setEditUserUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    required
                    disabled={editingUser.username === 'admin'}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi (Password) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    required
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peran Pengguna (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as Role)}
                    disabled={editingUser.username === 'admin' || isKecamatanAdmin}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium disabled:opacity-60"
                  >
                    <option value="admin_desa">🌿 Admin Desa (Petugas Entri Data)</option>
                    {!isKecamatanAdmin && (
                      <>
                        <option value="admin_kecamatan">🏢 Admin Kecamatan (Membawahi Admin Desa)</option>
                        <option value="admin_induk">👑 Admin Induk Kabupaten</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Conditional District / Village Assignment */}
              {editUserRole === 'admin_kecamatan' && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
                  <label className="block text-xs font-bold text-purple-900">
                    🏢 Tentukan Wilayah Kecamatan yang Dibawahi:
                  </label>
                  <select
                    value={editUserDistrict}
                    onChange={(e) => setEditUserDistrict(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-400 font-bold text-purple-950"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.name}>
                        Kecamatan {d.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-purple-700 mt-1">
                    Admin Induk menentukan bahwa akun ini bertindak sebagai Admin Kecamatan untuk wilayah yang dipilih di atas.
                  </p>
                </div>
              )}

              {(editUserRole === 'admin_desa' || editUserRole === 'bidan_desa') && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <label className="block text-xs font-bold text-emerald-900">
                    🌿 Pilih Wilayah Desa Binaan:
                  </label>
                  <select
                    value={editUserVillage}
                    onChange={(e) => setEditUserVillage(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-400 font-bold text-emerald-950"
                  >
                    {villages.map((v) => (
                      <option key={v.id} value={v.name}>
                        Desa {v.name} (Kec. {v.district})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Petugas</label>
                  <input
                    type="text"
                    value={editUserNip}
                    onChange={(e) => setEditUserNip(e.target.value)}
                    placeholder="Contoh: 19850101 201001 1 020"
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
