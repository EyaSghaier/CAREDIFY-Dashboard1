import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserStatus } from '../../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  name: string;
  role: string;
  status: UserStatus;
  specialty: string;
  medical_license_number?: string;
  hospital_clinic?: string;
  phone?: string;
}

export interface SignupData {
  full_name: string;
  email: string;
  password: string;
  medical_license_number?: string;
  hospital_clinic?: string;
  specialty?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────
// Stored in localStorage under the key "caredify_users"

const STORAGE_KEY = 'caredify_users';
const SESSION_KEY = 'caredify_session';

interface StoredUser extends User {
  password: string;
}

const getStoredUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

const saveStoredUsers = (users: StoredUser[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

// Pre-seed a demo account so the app is usable out of the box
const seedDemoAccount = () => {
  const users = getStoredUsers();
  if (!users.find(u => u.email === 'demo@caredify.com')) {
    const demo: StoredUser = {
      id: 'demo-001',
      email: 'demo@caredify.com',
      full_name: 'Dr. Jean Dupont',
      name: 'Dr. Jean Dupont',
      role: 'Cardiologue',
      status: 'active',
      specialty: 'Cardiologie interventionnelle',
      medical_license_number: 'MED-123456',
      hospital_clinic: 'CHU de Paris',
      phone: '+33 6 12 34 56 78',
      password: 'demo1234',
    };
    saveStoredUsers([...users, demo]);
  }
};

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  logout: async () => {},
  signup: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  refreshProfile: async () => {},
  isLoading: true,
});

// ── Provider ───────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* Bootstrap */
  useEffect(() => {
    seedDemoAccount();
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const saved: User = JSON.parse(raw);
        setUser(saved);
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  /* ── Login ── */
  const login = async (email: string, password: string): Promise<boolean> => {
    const users = getStoredUsers();
    const found = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!found) return false;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...profile } = found;
    setUser(profile);
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    return true;
  };

  /* ── Logout ── */
  const logout = async (): Promise<void> => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  /* ── Signup ── */
  const signup = async (formData: SignupData): Promise<{ error: string | null }> => {
    const users = getStoredUsers();
    if (users.find(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
      return { error: 'Un compte avec cet email existe déjà.' };
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      email: formData.email,
      full_name: formData.full_name,
      name: formData.full_name,
      role: 'Cardiologue',
      status: 'pending',          // requires manual activation by admin
      specialty: formData.specialty ?? '',
      medical_license_number: formData.medical_license_number,
      hospital_clinic: formData.hospital_clinic,
      phone: formData.phone,
      password: formData.password,
    };

    saveStoredUsers([...users, newUser]);
    return { error: null };
  };

  /* ── Password Reset (mock — just logs) ── */
  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const users = getStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { error: 'Aucun compte trouvé avec cet email.' };
    // In a real app this would send an email; for now we just confirm success.
    console.info('[Caredify] Password reset requested for', email);
    return { error: null };
  };

  /* ── Refresh Profile ── */
  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    const users = getStoredUsers();
    const found = users.find(u => u.id === user.id);
    if (found) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _pw, ...profile } = found;
      setUser(profile);
      localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, resetPassword, refreshProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
