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

export const FirestoreService = {
  // Sync Realtime Users (HP & PC otomatis sinkron)
  subscribeUsers(onUpdate: (users: User[]) => void): Unsubscribe {
    const colRef = collection(db, USERS_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: User[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as User;
            list.push({ ...data, id: d.id });
          });
          onUpdate(list);
        }
      },
      (err) => console.error('Error subscribeUsers:', err)
    );
  },

  async saveUser(user: User): Promise<void> {
    try {
      const docRef = doc(db, USERS_COL, user.id);
      await setDoc(docRef, user, { merge: true });
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
      const batch = writeBatch(db);
      for (const u of users) {
        const docRef = doc(db, USERS_COL, u.id);
        batch.set(docRef, u, { merge: true });
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
        if (!snapshot.empty) {
          const list: PatientRecord[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as PatientRecord;
            list.push({ ...data, id: d.id });
          });
          onUpdate(list);
        }
      },
      (err) => console.error('Error subscribeRecords:', err)
    );
  },

  async saveRecord(record: PatientRecord): Promise<void> {
    try {
      const docRef = doc(db, RECORDS_COL, record.id);
      await setDoc(docRef, record, { merge: true });
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

  async syncAllRecords(records: PatientRecord[]): Promise<void> {
    try {
      // Chunk batches by 400
      const chunkSize = 400;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        for (const r of chunk) {
          const docRef = doc(db, RECORDS_COL, r.id);
          batch.set(docRef, r, { merge: true });
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
        if (!snapshot.empty) {
          const list: Village[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as Village);
          });
          onUpdate(list);
        }
      },
      (err) => console.error('Error subscribeVillages:', err)
    );
  },

  async saveVillage(village: Village): Promise<void> {
    try {
      const docRef = doc(db, VILLAGES_COL, village.id);
      await setDoc(docRef, village, { merge: true });
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

  async syncAllVillages(villages: Village[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const v of villages) {
        const docRef = doc(db, VILLAGES_COL, v.id);
        batch.set(docRef, v, { merge: true });
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
        if (!snapshot.empty) {
          const list: District[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as District);
          });
          onUpdate(list);
        }
      },
      (err) => console.error('Error subscribeDistricts:', err)
    );
  },

  async saveDistrict(district: District): Promise<void> {
    try {
      const docRef = doc(db, DISTRICTS_COL, district.id);
      await setDoc(docRef, district, { merge: true });
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
      const batch = writeBatch(db);
      for (const d of districts) {
        const docRef = doc(db, DISTRICTS_COL, d.id);
        batch.set(docRef, d, { merge: true });
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
          onUpdate(snapshot.data() as FacilityProfile);
        }
      },
      (err) => console.error('Error subscribeFacility:', err)
    );
  },

  async saveFacility(facility: FacilityProfile): Promise<void> {
    try {
      const docRef = doc(db, FACILITY_COL, 'current');
      await setDoc(docRef, facility, { merge: true });
    } catch (e) {
      console.error('Failed to save facility:', e);
    }
  },

  // Seed data awal jika Firestore masih kosong
  async initializeCloudDatabase(initialData: {
    users: User[];
    records: PatientRecord[];
    villages: Village[];
    districts?: District[];
    facility: FacilityProfile;
  }): Promise<void> {
    try {
      const userSnap = await getDocs(collection(db, USERS_COL));
      if (userSnap.empty) {
        await this.syncAllUsers(initialData.users);
      }

      const recSnap = await getDocs(collection(db, RECORDS_COL));
      if (recSnap.empty) {
        await this.syncAllRecords(initialData.records);
      }

      const vilSnap = await getDocs(collection(db, VILLAGES_COL));
      if (vilSnap.empty) {
        await this.syncAllVillages(initialData.villages);
      }

      if (initialData.districts) {
        const distSnap = await getDocs(collection(db, DISTRICTS_COL));
        if (distSnap.empty) {
          await this.syncAllDistricts(initialData.districts);
        }
      }

      const facSnap = await getDocs(collection(db, FACILITY_COL));
      if (facSnap.empty) {
        await this.saveFacility(initialData.facility);
      }
    } catch (e) {
      console.error('Initial cloud seed error:', e);
    }
  },
};
