export type FarmUnit = 'hectares' | 'acres' | 'bigha';

export interface FarmRecord {
  id: string;
  userId: string;
  name: string;
  size: number;
  unit: FarmUnit;
  cropType: string; // label string
  soilType: string; // label string
  createdAt: string;
}

const STORAGE_KEY = 'agricure:farms';

const readAll = (): FarmRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FarmRecord[]) : [];
  } catch {
    return [];
  }
};

const writeAll = (farms: FarmRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(farms));
};

export const farmService = {
  getFarmsByUser(userId: string): FarmRecord[] {
    return readAll().filter(f => f.userId === userId);
  },

  addFarm(farm: Omit<FarmRecord, 'id' | 'createdAt'>): FarmRecord {
    const all = readAll();
    const record: FarmRecord = {
      ...farm,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    all.push(record);
    writeAll(all);
    return record;
  },

  updateFarm(id: string, updates: Partial<Omit<FarmRecord, 'id' | 'userId' | 'createdAt'>>): FarmRecord | null {
    const all = readAll();
    const idx = all.findIndex(f => f.id === id);
    if (idx === -1) return null;
    const updated: FarmRecord = { ...all[idx], ...updates };
    all[idx] = updated;
    writeAll(all);
    return updated;
  },

  deleteFarm(id: string) {
    const all = readAll().filter(f => f.id !== id);
    writeAll(all);
  }
};


