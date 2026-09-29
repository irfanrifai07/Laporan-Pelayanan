import {
  ActivityLog,
  ContraceptiveMethod,
  District,
  FacilityProfile,
  MonthlyF2KBCellData,
  PatientRecord,
  Role,
  User,
  Village,
} from '../types';
import {
  METHOD_LABELS,
  initialDistricts,
  initialFacilityProfile,
  initialSampleRecords,
  sampleAgustus2026Records,
  initialUsers,
  initialVillages,
} from '../data/initialData';
import { FirestoreService } from './firebase';

const STORAGE_KEYS = {
  USERS: 'kb_faskes_users_v1',
  CURRENT_USER: 'kb_faskes_current_user_v1',
  VILLAGES: 'kb_faskes_villages_v1',
  DISTRICTS: 'kb_faskes_districts_v1',
  PROFILE: 'kb_faskes_facility_profile_v1',
  RECORDS: 'kb_faskes_patient_records_v2',
  LOGS: 'kb_faskes_activity_logs_v1',
  INITIALIZED: 'kb_faskes_initialized_flag_v2',
};

// Dispatch custom event to notify all components in the current tab immediately
function notifyChange(key: string) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kb-faskes-data-changed', { detail: { key } }));
    }
  } catch {
    // Ignore in SSR
  }
}

// Safe JSON parse helper
function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Error reading key ${key} from localStorage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyChange(key);
  } catch (err) {
    console.error(`Error saving key ${key} to localStorage:`, err);
  }
}

export const StorageService = {
  init() {
    // Bersihkan data contoh lawas jika ada
    localStorage.removeItem('kb_faskes_patient_records_v1');

    const isFirstTime = !localStorage.getItem(STORAGE_KEYS.INITIALIZED);

    if (isFirstTime) {
      if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        safeSet(STORAGE_KEYS.USERS, initialUsers);
      }
      if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        safeSet(STORAGE_KEYS.CURRENT_USER, initialUsers[0]); // default admin
      }
      if (!localStorage.getItem(STORAGE_KEYS.VILLAGES)) {
        safeSet(STORAGE_KEYS.VILLAGES, initialVillages);
      }
      if (!localStorage.getItem(STORAGE_KEYS.DISTRICTS)) {
        safeSet(STORAGE_KEYS.DISTRICTS, initialDistricts);
      }
      if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
        safeSet(STORAGE_KEYS.PROFILE, initialFacilityProfile);
      }
      if (!localStorage.getItem(STORAGE_KEYS.RECORDS)) {
        safeSet(STORAGE_KEYS.RECORDS, []);
      }
      if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
        safeSet(STORAGE_KEYS.LOGS, [
          {
            id: 'log-init',
            timestamp: new Date().toISOString(),
            username: 'system',
            action: 'INISIALISASI_SISTEM',
            details: 'Sistem Register Pelayanan KB Faskes diinisialisasi dengan data bersih',
          },
        ]);
      }
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } else {
      // Pastikan struktur dasar tetap valid tanpa mengembalikan data yang sudah dihapus pengguna
      if (!localStorage.getItem(STORAGE_KEYS.RECORDS)) {
        safeSet(STORAGE_KEYS.RECORDS, []);
      }
      if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
        safeSet(STORAGE_KEYS.PROFILE, initialFacilityProfile);
      }
      if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        const users = safeGet<User[]>(STORAGE_KEYS.USERS, []);
        if (users.length > 0) {
          safeSet(STORAGE_KEYS.CURRENT_USER, users[0]);
        }
      }
    }
  },

  // USERS
  getUsers(): User[] {
    const list = safeGet<User[]>(STORAGE_KEYS.USERS, initialUsers);
    return list;
  },
  saveUsersLocallyOnly(users: User[]): void {
    safeSet(STORAGE_KEYS.USERS, users);
  },
  saveUsers(users: User[]): void {
    safeSet(STORAGE_KEYS.USERS, users);
    FirestoreService.syncAllUsers(users);
  },
  saveSingleUser(user: User): void {
    const users = this.getUsers();
    const updated = [...users.filter((u) => u.id !== user.id), user];
    this.saveUsersLocallyOnly(updated);
    FirestoreService.saveUser(user);
    const cur = this.getCurrentUser();
    if (cur && cur.id === user.id) {
      this.setCurrentUser(user);
    }
  },
  deleteUser(userId: string): void {
    const users = this.getUsers();
    const filtered = users.filter((u) => u.id !== userId);
    this.saveUsersLocallyOnly(filtered);
    FirestoreService.deleteUser(userId);
  },
  getCurrentUser(): User | null {
    return safeGet<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },
  setCurrentUser(user: User | null): void {
    if (user) {
      safeSet(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      notifyChange(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // FACILITY PROFILE
  getFacilityProfile(): FacilityProfile {
    return safeGet<FacilityProfile>(STORAGE_KEYS.PROFILE, initialFacilityProfile);
  },
  saveFacilityProfileLocallyOnly(profile: FacilityProfile): void {
    safeSet(STORAGE_KEYS.PROFILE, profile);
  },
  saveFacilityProfile(profile: FacilityProfile): void {
    safeSet(STORAGE_KEYS.PROFILE, profile);
    FirestoreService.saveFacility(profile);
  },

  // VILLAGES
  getVillages(): Village[] {
    return safeGet<Village[]>(STORAGE_KEYS.VILLAGES, initialVillages);
  },
  saveVillagesLocallyOnly(villages: Village[]): void {
    safeSet(STORAGE_KEYS.VILLAGES, villages);
  },
  saveVillages(villages: Village[]): void {
    safeSet(STORAGE_KEYS.VILLAGES, villages);
    FirestoreService.syncAllVillages(villages);
  },
  saveSingleVillage(village: Village): void {
    const list = this.getVillages();
    const updated = [...list.filter((v) => v.id !== village.id), village];
    this.saveVillagesLocallyOnly(updated);
    FirestoreService.saveVillage(village);
  },
  deleteVillage(villageId: string): void {
    const list = this.getVillages();
    const filtered = list.filter((v) => v.id !== villageId);
    this.saveVillagesLocallyOnly(filtered);
    FirestoreService.deleteVillage(villageId);
  },

  // DISTRICTS
  getDistricts(): District[] {
    return safeGet<District[]>(STORAGE_KEYS.DISTRICTS, initialDistricts);
  },
  saveDistrictsLocallyOnly(districts: District[]): void {
    safeSet(STORAGE_KEYS.DISTRICTS, districts);
  },
  saveDistricts(districts: District[]): void {
    safeSet(STORAGE_KEYS.DISTRICTS, districts);
    FirestoreService.syncAllDistricts(districts);
  },
  saveSingleDistrict(district: District): void {
    const list = this.getDistricts();
    const updated = [...list.filter((d) => d.id !== district.id), district];
    this.saveDistrictsLocallyOnly(updated);
    FirestoreService.saveDistrict(district);
  },
  deleteDistrict(districtId: string): void {
    const list = this.getDistricts();
    const filtered = list.filter((d) => d.id !== districtId);
    this.saveDistrictsLocallyOnly(filtered);
    FirestoreService.deleteDistrict(districtId);
  },

  // PATIENT RECORDS
  getRecords(): PatientRecord[] {
    return safeGet<PatientRecord[]>(STORAGE_KEYS.RECORDS, []);
  },
  saveRecordsLocallyOnly(records: PatientRecord[]): void {
    safeSet(STORAGE_KEYS.RECORDS, records);
  },
  saveRecords(records: PatientRecord[]): void {
    safeSet(STORAGE_KEYS.RECORDS, records);
    FirestoreService.syncAllRecords(records);
  },

  addRecord(record: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt'>): PatientRecord {
    const records = this.getRecords();
    const newRecord: PatientRecord = {
      ...record,
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    records.unshift(newRecord);
    this.saveRecordsLocallyOnly(records);
    FirestoreService.saveRecord(newRecord);
    this.logActivity(record.createdByUsername, 'TAMBAH_REGISTER', `Menambah data akseptor ${newRecord.wifeName} (${newRecord.registerNumber})`);
    return newRecord;
  },

  updateRecord(updated: PatientRecord, currentUsername: string): void {
    const records = this.getRecords();
    const idx = records.findIndex((r) => r.id === updated.id);
    const updatedWithTimestamp: PatientRecord = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    if (idx !== -1) {
      records[idx] = updatedWithTimestamp;
    } else {
      records.unshift(updatedWithTimestamp);
    }
    this.saveRecordsLocallyOnly(records);
    FirestoreService.saveRecord(updatedWithTimestamp);
    this.logActivity(currentUsername, 'EDIT_REGISTER', `Mengubah data akseptor ${updated.wifeName} (${updated.registerNumber})`);
  },

  deleteRecord(id: string, currentUsername: string): void {
    const records = this.getRecords();
    const target = records.find((r) => r.id === id);
    const filtered = records.filter((r) => r.id !== id);
    this.saveRecordsLocallyOnly(filtered);
    FirestoreService.deleteRecord(id);
    if (target) {
      this.logActivity(currentUsername, 'HAPUS_REGISTER', `Menghapus data akseptor ${target.wifeName} (${target.registerNumber})`);
    }
  },

  clearAllRecords(currentUsername: string): void {
    this.saveRecordsLocallyOnly([]);
    FirestoreService.clearAllRecords();
    this.logActivity(currentUsername, 'KOSONGKAN_DATA', 'Mengosongkan seluruh data register pelayanan KB');
  },

  loadSampleAgustusRecords(currentUsername: string): PatientRecord[] {
    this.saveRecords(sampleAgustus2026Records);
    this.logActivity(currentUsername, 'MUAT_CONTOH_AGUSTUS', 'Memuat contoh data register Laporan KB Agustus 2026');
    return sampleAgustus2026Records;
  },

  // ACTIVITY LOGS
  getLogs(): ActivityLog[] {
    return safeGet<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
  },
  logActivity(username: string, action: string, details: string): void {
    const logs = this.getLogs();
    logs.unshift({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      username,
      action,
      details,
    });
    // keep max 200 logs
    if (logs.length > 200) {
      logs.length = 200;
    }
    safeSet(STORAGE_KEYS.LOGS, logs);
  },

  // BACKUP & RESTORE
  exportFullBackup(): string {
    const data = {
      version: 1,
      backupDate: new Date().toISOString(),
      facilityProfile: this.getFacilityProfile(),
      villages: this.getVillages(),
      districts: this.getDistricts(),
      users: this.getUsers(),
      records: this.getRecords(),
      logs: this.getLogs(),
    };
    return JSON.stringify(data, null, 2);
  },

  importBackup(jsonString: string, currentUsername: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.records || !Array.isArray(data.records)) {
        return { success: false, message: 'Format file cadangan tidak valid (field records tidak ditemukan).' };
      }
      if (data.facilityProfile) this.saveFacilityProfile(data.facilityProfile);
      if (data.villages) this.saveVillages(data.villages);
      if (data.districts) this.saveDistricts(data.districts);
      if (data.users) this.saveUsers(data.users);
      if (data.records) this.saveRecords(data.records);

      this.logActivity(currentUsername, 'RESTORE_DATA', `Memulihkan data sistem dari file cadangan (${data.records.length} rekam data)`);
      return { success: true, message: `Berhasil memulihkan ${data.records.length} data pelayanan KB!` };
    } catch (err: unknown) {
      return {
        success: false,
        message: 'Gagal memproses file cadangan JSON: ' + (err instanceof Error ? err.message : String(err)),
      };
    }
  },

  resetToDefault(currentUsername: string): void {
    this.saveFacilityProfile(initialFacilityProfile);
    this.saveVillages(initialVillages);
    this.saveDistricts(initialDistricts);
    this.saveUsers(initialUsers);
    this.saveRecords(initialSampleRecords);
    this.logActivity(currentUsername, 'RESET_DATA', 'Mereset data sistem ke data standar bawaan');
  },

  // REKAPITULASI F/II/KB CALCULATION
  calculateMonthlyF2KB(month: number, year: number, villageFilter?: string): MonthlyF2KBCellData[] {
    const records = this.getRecords();

    // Filter records by month & year (serviceDate format YYYY-MM-DD)
    const filtered = records.filter((r) => {
      const [rYear, rMonth] = r.serviceDate.split('-').map(Number);
      if (rYear !== year || rMonth !== month) return false;
      if (villageFilter && villageFilter !== 'SEMUA') {
        if (r.village.toLowerCase() !== villageFilter.toLowerCase()) return false;
      }
      return true;
    });

    const methodOrder: ContraceptiveMethod[] = [
      'SUNTIK_1_BLN',
      'SUNTIK_3_BLN',
      'PIL',
      'KONDOM',
      'IUD',
      'IMPLAN_1_BATANG',
      'IMPLAN_2_BATANG',
      'MOW',
      'MOP',
    ];

    const result: MonthlyF2KBCellData[] = methodOrder.map((methodKey) => {
      const methodRecords = filtered.filter((r) => r.method === methodKey);

      let baruBukanPasca = 0;
      let baruPascaSalin = 0;
      let baruPascaGugur = 0;
      let gantiCara = 0;
      let ulangan = 0;
      let apbn = 0;
      let nonApbn = 0;
      let komplikasi = 0;
      let kegagalan = 0;
      let cabutAlokon = 0;

      for (const rec of methodRecords) {
        // Participant status
        if (rec.participantStatus === 'BARU_BUKAN_PASCA') baruBukanPasca++;
        else if (rec.participantStatus === 'BARU_PASCA_SALIN') baruPascaSalin++;
        else if (rec.participantStatus === 'BARU_PASCA_GUGUR') baruPascaGugur++;
        else if (rec.participantStatus === 'GANTI_CARA') gantiCara++;
        else if (rec.participantStatus === 'ULANGAN') ulangan++;

        // Alokon source
        if (rec.alokonSource === 'APBN') apbn++;
        else nonApbn++;

        // Complications
        if (rec.complications && rec.complications !== 'Tidak Ada' && rec.complications.trim() !== '') {
          komplikasi++;
        }

        // Cabut alokon
        if (rec.actionType === 'PENCABUTAN' || rec.actionType === 'CABUT_PASANG') {
          cabutAlokon++;
        }
      }

      const totalBaru = baruBukanPasca + baruPascaSalin + baruPascaGugur;
      const totalPelayanan = totalBaru + gantiCara + ulangan;

      return {
        methodKey,
        methodLabel: METHOD_LABELS[methodKey],
        baruBukanPasca,
        baruPascaSalin,
        baruPascaGugur,
        totalBaru,
        gantiCara,
        ulangan,
        totalPelayanan,
        apbn,
        nonApbn,
        komplikasi,
        kegagalan,
        cabutAlokon,
      };
    });

    return result;
  },
};
