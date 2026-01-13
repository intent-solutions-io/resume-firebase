// Operation Hired - Multi-Tenancy Agency Types
// Phase 2: Agency-Based Multi-Tenancy

import { Timestamp } from '@google-cloud/firestore';

// ============================================
// Agency Types
// ============================================

export type AgencyStatus = 'active' | 'suspended' | 'trial';

export type ATSProvider = 'polaris' | 'bullhorn' | 'greenhouse' | 'none';

export interface ATSIntegration {
  provider: ATSProvider;
  apiKey?: string;
  webhookUrl?: string;
  enabled: boolean;
}

export interface AgencySettings {
  retentionDays: number;           // Document retention policy (default: 90)
  maxCandidatesPerMonth?: number;  // Usage limit (null = unlimited)
  atsIntegration?: ATSIntegration;
  brandColor?: string;             // Primary brand color (hex)
  customDomain?: string;           // agency.operationhired.com
}

export interface Agency {
  id: string;
  name: string;                    // "Operation Hired", "Hire Heroes USA"
  slug: string;                    // "operation-hired" (for URLs)
  contactEmail: string;
  logoUrl?: string;
  status: AgencyStatus;
  settings: AgencySettings;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

// ============================================
// Agency User Types
// ============================================

export type AgencyUserRole = 'owner' | 'admin' | 'recruiter' | 'viewer';

export interface AgencyUser {
  id: string;                      // Firebase Auth UID
  agencyId: string;
  email: string;
  displayName?: string;
  role: AgencyUserRole;
  invitedBy?: string;              // UID of user who sent invite
  lastLoginAt?: Timestamp | string;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

// ============================================
// Invitation Types
// ============================================

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface AgencyInvitation {
  id: string;
  agencyId: string;
  email: string;
  role: AgencyUserRole;
  invitedBy: string;               // UID of inviting user
  status: InvitationStatus;
  expiresAt: Timestamp | string;
  acceptedAt?: Timestamp | string;
  createdAt: Timestamp | string;
}

// ============================================
// Agency-Scoped Request Types
// ============================================

export interface CreateAgencyRequest {
  name: string;
  slug: string;
  contactEmail: string;
  ownerEmail: string;              // First user becomes owner
}

export interface InviteUserRequest {
  agencyId: string;
  email: string;
  role: AgencyUserRole;
}

export interface AgencyContext {
  agencyId: string;
  userId: string;
  role: AgencyUserRole;
}
