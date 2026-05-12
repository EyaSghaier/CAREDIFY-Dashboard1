// ── Supabase stub ────────────────────────────────────────────────────────────
// DB integration has been temporarily removed.
// All types are kept so the rest of the codebase compiles without changes.

export type UserStatus = 'pending' | 'verified' | 'active' | 'suspended' | 'rejected';
export type UserRole   = 'carediologue' | 'nurse' | 'admin' | 'patient';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  medical_license_number?: string;
  hospital_clinic?: string;
  specialty?: string;
  phone?: string;
  status: UserStatus;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
