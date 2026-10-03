import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { District, FacilityProfile, PatientRecord, User, Village } from '../types';

// Inisialisasi Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firestore dengan Database ID khusus
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Validasi koneksi awal ke Firestore sesuai standar
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
    }
    return false;
  }
}

// Koleksi Firestore
const USERS_COL = 'users';
const RECORDS_COL = 'records';
const VILLAGES_COL = 'villages';
const DISTRICTS_COL = 'districts';
const FACILITY_COL = 'facility';
const LOGS_COL = 'activity_logs';
const SYSTEM_COL = 'system';

// Membersihkan nilai undefined dari objek agar Firestore tidak melempar error
// "Unsupported field value: undefined"
function cleanPayload<T>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanPayload(item));
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = typeof value === 'object' && value !== null ? cleanPayload(value) : value;
    }
  }
  return result;
}

export const FirestoreService = {
  // Sync Realtime Users (HP & PC otomatis sinkron)
  subscribeUsers(onUpdate: (users: User[]) => void): Unsubscribe {
    const colRef = collection(db, USERS_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: User[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as User;
          list.push({ ...data, id: d.id });
        });
        onUpdate(list);
      },
      (err) => console.error('Error subscribeUsers:', err)
    );
  },

  async saveUser(user: User): Promise<void> {
    try {
      const docRef = doc(db, USERS_COL, user.id);
      await setDoc(docRef, cleanPayload(user), { merge: true });
    } catch (e) {
      console.error('Failed to save user to Firestore:', e);
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, USERS_COL, userId));
    } catch (e) {
      console.error('Failed to delete user in Firestore:', e);
    }
  },

  async syncAllUsers(users: User[]): Promise<void> {
    try {
      const snap = await getDocs(collection(db, USERS_COL));
      const activeIds = new Set(users.map((u) => u.id));
      const batch = writeBatch(db);

      // Hapus data pengguna di cloud yang telah dihapus lokal
      snap.forEach((d) => {
        if (!activeIds.has(d.id)) {
          batch.delete(d.ref);
        }
      });

      // Simpan dan perbarui pengguna yang aktif
      for (const u of users) {
        const docRef = doc(db, USERS_COL, u.id);
        batch.set(docRef, cleanPayload(u), { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.error('Failed syncAllUsers:', e);
    }
  },

  // Sync Realtime Records Pelayanan KB
  subscribeRecords(onUpdate: (records: PatientRecord[]) => void): Unsubscribe {
    const colRef = collection(db, RECORDS_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: PatientRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as PatientRecord;
          list.push({ ...data, id: d.id });
        });
        onUpdate(list);
      },
      (err) => console.error('Error subscribeRecords:', err)
    );
  },

  async saveRecord(record: PatientRecord): Promise<void> {
    try {
      const docRef = doc(db, RECORDS_COL, record.id);
      await setDoc(docRef, cleanPayload(record), { merge: true });
    } catch (e) {
      console.error('Failed to save record to Firestore:', e);
    }
  },

  async deleteRecord(recordId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, RECORDS_COL, recordId));
    } catch (e) {
      console.error('Failed to delete record in Firestore:', e);
    }
  },

  async clearAllRecords(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, RECORDS_COL));
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed clearAllRecords in Firestore:', e);
    }
  },

  async syncAllRecords(records: PatientRecord[]): Promise<void> {
    try {
      const snap = await getDocs(collection(db, RECORDS_COL));
      const activeIds = new Set(records.map((r) => r.id));

      // Hapus dokumen yang sudah dihapus oleh pengguna
      const deleteBatch = writeBatch(db);
      let deleteCount = 0;
      snap.forEach((d) => {
        if (!activeIds.has(d.id)) {
          deleteBatch.delete(d.ref);
          deleteCount++;
        }
      });
      if (deleteCount > 0) {
        await deleteBatch.commit();
      }

      // Chunk batches by 400 untuk simpan dan update
      const chunkSize = 400;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        for (const r of chunk) {
          const docRef = doc(db, RECORDS_COL, r.id);
          batch.set(docRef, cleanPayload(r), { merge: true });
        }
        await batch.commit();
      }
    } catch (e) {
      console.error('Failed syncAllRecords:', e);
    }
  },

  // Sync Realtime Villages
  subscribeVillages(onUpdate: (villages: Village[]) => void): Unsubscribe {
    const colRef = collection(db, VILLAGES_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Village[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as Village), id: d.id });
        });
        onUpdate(list);
      },
      (err) => console.error('Error subscribeVillages:', err)
    );
  },

  async saveVillage(village: Village): Promise<void> {
    try {
      const docRef = doc(db, VILLAGES_COL, village.id);
      await setDoc(docRef, cleanPayload(village), { merge: true });
    } catch (e) {
      console.error('Failed to save village to Firestore:', e);
    }
  },

  async deleteVillage(villageId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, VILLAGES_COL, villageId));
    } catch (e) {
      console.error('Failed to delete village in Firestore:', e);
    }
  },

  async clearAllVillages(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, VILLAGES_COL));
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed clearAllVillages in Firestore:', e);
    }
  },

  async syncAllVillages(villages: Village[]): Promise<void> {
    try {
      const snap = await getDocs(collection(db, VILLAGES_COL));
      const activeIds = new Set(villages.map((v) => v.id));
      const batch = writeBatch(db);

      // Hapus desa yang telah dihapus
      snap.forEach((d) => {
        if (!activeIds.has(d.id)) {
          batch.delete(d.ref);
        }
      });

      // Simpan atau perbarui desa aktif
      for (const v of villages) {
        const docRef = doc(db, VILLAGES_COL, v.id);
        batch.set(docRef, cleanPayload(v), { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.error('Failed syncAllVillages:', e);
    }
  },

  // Sync Realtime Districts (Kecamatan)
  subscribeDistricts(onUpdate: (districts: District[]) => void): Unsubscribe {
    const colRef = collection(db, DISTRICTS_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: District[] = [];
        snapshot.forEach((d) => {
          list.push({ ...(d.data() as District), id: d.id });
        });
        onUpdate(list);
      },
      (err) => console.error('Error subscribeDistricts:', err)
    );
  },

  async saveDistrict(district: District): Promise<void> {
    try {
      const docRef = doc(db, DISTRICTS_COL, district.id);
      await setDoc(docRef, cleanPayload(district), { merge: true });
    } catch (e) {
      console.error('Failed to save district to Firestore:', e);
    }
  },

  async deleteDistrict(districtId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, DISTRICTS_COL, districtId));
    } catch (e) {
      console.error('Failed to delete district in Firestore:', e);
    }
  },

  async syncAllDistricts(districts: District[]): Promise<void> {
    try {
      const snap = await getDocs(collection(db, DISTRICTS_COL));
      const activeIds = new Set(districts.map((d) => d.id));
      const batch = writeBatch(db);

      // Hapus kecamatan yang telah dihapus
      snap.forEach((d) => {
        if (!activeIds.has(d.id)) {
          batch.delete(d.ref);
        }
      });

      // Simpan atau perbarui kecamatan aktif
      for (const d of districts) {
        const docRef = doc(db, DISTRICTS_COL, d.id);
        batch.set(docRef, cleanPayload(d), { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.error('Failed syncAllDistricts:', e);
    }
  },

  // Sync Realtime Facility Profile
  subscribeFacility(onUpdate: (facility: FacilityProfile) => void): Unsubscribe {
    const docRef = doc(db, FACILITY_COL, 'current');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as FacilityProfile;
          if (data && data.name && !data.name.includes('PUSKESMAS') && !data.name.includes('Sambungmacan') && data.name.includes('P3AKB')) {
            onUpdate(data);
          }
        }
      },
      (err) => console.error('Error subscribeFacility:', err)
    );
  },

  async saveFacility(facility: FacilityProfile): Promise<void> {
    try {
      const docRef = doc(db, FACILITY_COL, 'current');
      await setDoc(docRef, cleanPayload(facility), { merge: true });
    } catch (e) {
      console.error('Failed to save facility:', e);
    }
  },

  // Inisialisasi awal ke Firestore (memastikan koleksi awal seperti kecamatan & profil dinas terisi)
  async initializeCloudDatabase(initialData: {
    users: User[];
    records: PatientRecord[];
    villages: Village[];
    districts?: District[];
    facility: FacilityProfile;
  }): Promise<void> {
    try {
      // 0. Bersihkan seluruh desa di Firestore sesuai permintaan pengguna ("Kosongkan semua nama desa")
      try {
        const villageCleanRef = doc(db, SYSTEM_COL, 'villages_cleared_v4');
        const cleanSnap = await getDocFromServer(villageCleanRef);
        if (!cleanSnap.exists()) {
          await this.clearAllVillages();
          await setDoc(villageCleanRef, { clearedAt: new Date().toISOString() });
        }
      } catch {
        try {
          await this.clearAllVillages();
        } catch (clearErr) {
          console.warn('Pembersihan desa cloud:', clearErr);
        }
      }

      // 1. Cek dan pastikan koleksi kecamatan terisi jika masih kosong di cloud
      if (initialData.districts && initialData.districts.length > 0) {
        try {
          const distSnap = await getDocs(collection(db, DISTRICTS_COL));
          if (distSnap.empty) {
            await this.syncAllDistricts(initialData.districts);
          }
        } catch (err) {
          console.warn('Gagal cek awal kecamatan cloud:', err);
        }
      }

      // 2. Cek dan pastikan profil Dinas P3AKB Bojonegoro terisi & mutakhirkan jika masih data puskesmas lama
      try {
        const facSnap = await getDocs(collection(db, FACILITY_COL));
        if (facSnap.empty) {
          await this.saveFacility(initialData.facility);
        } else {
          const curDoc = facSnap.docs[0];
          const data = curDoc.data() as FacilityProfile;
          if (
            !data.name ||
            data.name.includes('PUSKESMAS') ||
            data.name.includes('Sambungmacan') ||
            !data.name.includes('P3AKB')
          ) {
            await this.saveFacility(initialData.facility);
          }
        }
      } catch (err) {
        console.warn('Gagal cek profil dinas cloud:', err);
      }

      // 3. Cek users dan inisialisasi cloud
      try {
        const initDocRef = doc(db, SYSTEM_COL, 'cloud_init');
        let isAlreadyInitialized = false;
        try {
          const initSnap = await getDocFromServer(initDocRef);
          if (initSnap.exists()) {
            isAlreadyInitialized = true;
          }
        } catch {
          // Abaikan jika dokumen belum ada
        }

        if (!isAlreadyInitialized) {
          const userSnap = await getDocs(collection(db, USERS_COL));
          if (userSnap.empty && initialData.users && initialData.users.length > 0) {
            await this.syncAllUsers(initialData.users);
          }

          if (initialData.villages && initialData.villages.length > 0) {
            const vilSnap = await getDocs(collection(db, VILLAGES_COL));
            if (vilSnap.empty) {
              await this.syncAllVillages(initialData.villages);
            }
          }

          // Tandai bahwa basis data sudah diinisialisasi
          await setDoc(initDocRef, { initializedAt: new Date().toISOString() });
        }
      } catch (err) {
        console.warn('Inisialisasi sistem cloud:', err);
      }
    } catch (e) {
      console.warn('Initial cloud seed notice:', e);
    }
  },
};
