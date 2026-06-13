export type SlotwiseRole = 'owner' | 'admin' | 'staff' | 'customer' | 'system';
export type SlotwiseActorType = 'operator' | 'customer';

export interface SlotwiseOperatorCredential {
    actorId: string;
    username: string;
    password: string;
    role: Extract<SlotwiseRole, 'owner' | 'admin' | 'staff'>;
}

export interface SlotwiseSession {
    sessionId?: string;
    actorType: SlotwiseActorType;
    actorId: string;
    username?: string;
    email?: string;
    role: Extract<SlotwiseRole, 'owner' | 'admin' | 'staff' | 'customer'>;
    businessId?: string;
    expiresAt: Date;
    lastSeenAt?: Date;
}

export interface SlotwiseSessionWithToken extends SlotwiseSession {
    token: string;
}
