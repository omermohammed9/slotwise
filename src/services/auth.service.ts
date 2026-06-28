import { getOptionalEnv, isLocalOrTestRuntime } from "../config/env";
import {
    SlotwiseOperatorCredential,
    SlotwiseSession,
    SlotwiseSessionWithToken,
} from "../interfaces/auth.interface";
import { AuthSessionRepository, AuthSessionRepositoryContract } from "../repositories/auth-session.repository";
import { CustomerRepository, CustomerRepositoryContract } from "../repositories/customer.repository";
import { NotificationJobRepository, NotificationJobRepositoryContract } from "../repositories/notification-job.repository";
import {
    BootstrapOperatorAccountData,
    OperatorAccountRepository,
    OperatorAccountRepositoryContract,
} from "../repositories/operator-account.repository";
import { VerificationTokenRepository, VerificationTokenRepositoryContract } from "../repositories/verification-token.repository";
import {
    createOpaqueSessionToken,
    createSessionId,
    hashOpaqueToken,
    hashPassword,
    verifyPassword,
} from "../utils/authCrypto";
import { AuditLogService } from "./audit-log.service";

const defaultSessionTtlMinutes = 480;
const defaultMagicLinkTtlMinutes = 15;
const failedLoginLockThreshold = 5;
const failedLoginBaseBackoffMs = 30_000;
const failedLoginMaxBackoffMs = 15 * 60_000;

const toOptionalOperator = (
    role: SlotwiseOperatorCredential["role"],
    defaultActorId: string,
): SlotwiseOperatorCredential | null => {
    const username = getOptionalEnv(`SLOTWISE_${role.toUpperCase()}_USERNAME`);
    const password = getOptionalEnv(`SLOTWISE_${role.toUpperCase()}_PASSWORD`);
    const actorId = getOptionalEnv(`SLOTWISE_${role.toUpperCase()}_ACTOR_ID`) ?? defaultActorId;

    if (!username && !password) {
        return null;
    }

    if (!username || !password) {
        throw new Error(`Incomplete operator configuration for role: ${role}`);
    }

    return {
        actorId,
        username: username.trim().toLowerCase(),
        password,
        role,
    };
};

export class AuthService {
    private static instance: AuthService;
    private readonly operatorAccountRepository: OperatorAccountRepositoryContract;
    private readonly authSessionRepository: AuthSessionRepositoryContract;
    private readonly customerRepository: CustomerRepositoryContract;
    private readonly verificationTokenRepository: VerificationTokenRepositoryContract;
    private readonly notificationJobRepository: NotificationJobRepositoryContract;
    private readonly auditLogService: AuditLogService;
    private bootstrapCompleted = false;

    public constructor(
        operatorAccountRepository: OperatorAccountRepositoryContract = OperatorAccountRepository.getInstance(),
        authSessionRepository: AuthSessionRepositoryContract = AuthSessionRepository.getInstance(),
        customerRepository: CustomerRepositoryContract = CustomerRepository.getInstance(),
        verificationTokenRepository: VerificationTokenRepositoryContract = VerificationTokenRepository.getInstance(),
        notificationJobRepository: NotificationJobRepositoryContract = NotificationJobRepository.getInstance(),
        auditLogService: AuditLogService = AuditLogService.getInstance(),
    ) {
        this.operatorAccountRepository = operatorAccountRepository;
        this.authSessionRepository = authSessionRepository;
        this.customerRepository = customerRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.notificationJobRepository = notificationJobRepository;
        this.auditLogService = auditLogService;
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }

        return AuthService.instance;
    }

    public async bootstrapOperatorAccountsFromEnv(): Promise<void> {
        if (!isLocalOrTestRuntime()) {
            throw new Error("Environment operator bootstrap is only available in local/test runtimes");
        }

        if (this.bootstrapCompleted) {
            return;
        }

        const bootstrapOperators = this.getBootstrapOperators();

        for (const operator of bootstrapOperators) {
            const passwordHash = await hashPassword(operator.password);
            const bootstrapAccount: BootstrapOperatorAccountData = {
                actorId: operator.actorId,
                username: operator.username,
                passwordHash,
                role: operator.role,
            };

            await this.operatorAccountRepository.upsertBootstrapAccount(bootstrapAccount);
        }

        this.bootstrapCompleted = true;
    }

    public async createSession(username: string, password: string): Promise<SlotwiseSessionWithToken> {
        const operator = await this.operatorAccountRepository.findByUsername(username);
        if (!operator) {
            throw new Error("Invalid operator credentials");
        }

        if (operator.lockedUntil && operator.lockedUntil.getTime() > Date.now()) {
            throw new Error("Operator account is temporarily locked");
        }

        if (!(await verifyPassword(password, operator.passwordHash))) {
            const failedLoginAttempts = (operator.failedLoginAttempts ?? 0) + 1;
            const lockMultiplier = Math.max(0, failedLoginAttempts - failedLoginLockThreshold + 1);
            const lockedUntil = failedLoginAttempts >= failedLoginLockThreshold
                ? new Date(Date.now() + Math.min(failedLoginMaxBackoffMs, failedLoginBaseBackoffMs * (2 ** lockMultiplier)))
                : undefined;

            await this.operatorAccountRepository.recordFailedLogin(String(operator._id), failedLoginAttempts, lockedUntil);
            throw new Error(lockedUntil ? "Operator account is temporarily locked" : "Invalid operator credentials");
        }

        if ((operator.failedLoginAttempts ?? 0) > 0 || operator.lockedUntil) {
            await this.operatorAccountRepository.resetFailedLogins(String(operator._id));
        }

        const token = createOpaqueSessionToken();
        const session = await this.authSessionRepository.create({
            sessionId: createSessionId(),
            tokenHash: hashOpaqueToken(token),
            actorType: "operator",
            actorId: operator.actorId,
            username: operator.username,
            role: operator.role,
            expiresAt: new Date(Date.now() + this.getSessionTtlMinutes() * 60_000),
        });

        await this.operatorAccountRepository.updateLastLogin(String(operator._id));

        return {
            token,
            ...this.toSlotwiseSession(session),
        };
    }

    public async getSession(token: string): Promise<SlotwiseSession | null> {
        const session = await this.authSessionRepository.findActiveByTokenHash(hashOpaqueToken(token));
        if (!session) {
            return null;
        }

        await this.authSessionRepository.touch(session.sessionId);
        return this.toSlotwiseSession(session);
    }

    public async revokeSession(token: string): Promise<boolean> {
        return this.authSessionRepository.revokeByTokenHash(hashOpaqueToken(token));
    }

    public async getConfiguredRoles(): Promise<SlotwiseOperatorCredential["role"][]> {
        await this.bootstrapOperatorAccountsFromEnv();
        return this.operatorAccountRepository.getActiveRoles();
    }

    public async listOperatorAccounts(actor: SlotwiseSession): Promise<Array<Pick<SlotwiseOperatorCredential, "actorId" | "username" | "role"> & { id: string; active: boolean; invitationAcceptedAt?: Date }>> {
        this.assertOwner(actor);
        const accounts = await this.operatorAccountRepository.list();
        return accounts.map((account) => ({
            id: String(account._id),
            actorId: account.actorId,
            username: account.username,
            role: account.role,
            active: account.active,
            invitationAcceptedAt: account.invitationAcceptedAt,
        }));
    }

    public async inviteOperator(actor: SlotwiseSession, username: string, role: SlotwiseOperatorCredential["role"]): Promise<{ invited: true; token?: string; operatorId: string }> {
        this.assertOwner(actor);
        const normalizedUsername = username.trim().toLowerCase();

        if (!["owner", "admin", "staff"].includes(role) || normalizedUsername.length < 3) {
            throw new Error("Invalid operator invitation");
        }

        if (await this.operatorAccountRepository.findAnyByUsername(normalizedUsername)) {
            throw new Error("Operator username already exists");
        }

        const operator = await this.operatorAccountRepository.create({
            actorId: `operator-${createSessionId()}`,
            username: normalizedUsername,
            passwordHash: await hashPassword(createOpaqueSessionToken()),
            role,
            active: false,
            invitedByActorId: actor.actorId,
        });
        const rawToken = createOpaqueSessionToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000);

        await this.verificationTokenRepository.invalidateActiveEmailTokens(normalizedUsername, "operator_invitation");
        await this.verificationTokenRepository.create({
            tokenHash: hashOpaqueToken(rawToken),
            purpose: "operator_invitation",
            operatorId: String(operator._id),
            email: normalizedUsername,
            targetRole: role,
            invitedByActorId: actor.actorId,
            expiresAt,
        });
        await this.notificationJobRepository.create({
            jobId: createSessionId(),
            channel: "email",
            provider: this.getNotificationProvider(),
            template: "operator_invitation",
            recipient: normalizedUsername,
            subject: "Your Slotwise operator invitation",
            payload: {
                operatorId: String(operator._id),
                username: normalizedUsername,
                role,
                token: rawToken,
                invitationUrl: this.buildOperatorInvitationUrl(rawToken),
                expiresAt: expiresAt.toISOString(),
            },
            dedupeKey: `operator_invitation:${String(operator._id)}`,
            availableAt: new Date(),
        });
        await this.auditLogService.record({
            actor,
            action: "operator.invited",
            targetEntity: "operator",
            targetId: String(operator._id),
            metadata: { username: normalizedUsername, role },
        });

        return {
            invited: true,
            ...(isLocalOrTestRuntime() ? { token: rawToken } : {}),
            operatorId: String(operator._id),
        };
    }

    public async acceptOperatorInvitation(token: string, password: string): Promise<{ accepted: true }> {
        if (password.length < 8) {
            throw new Error("Password must be at least 8 characters");
        }

        const verificationToken = await this.verificationTokenRepository.consumeActiveToken(hashOpaqueToken(token), "operator_invitation");
        if (!verificationToken?.operatorId) {
            throw new Error("Invalid or expired operator invitation");
        }

        const operator = await this.operatorAccountRepository.acceptInvitation(String(verificationToken.operatorId), await hashPassword(password));
        if (!operator) {
            throw new Error("Operator account not found");
        }

        await this.auditLogService.record({
            actorId: operator.actorId,
            actorRole: operator.role,
            action: "operator.invitation_accepted",
            targetEntity: "operator",
            targetId: String(operator._id),
            metadata: { username: operator.username },
        });

        return { accepted: true };
    }

    public async requestOperatorPasswordReset(username: string): Promise<{ requested: true; token?: string }> {
        const operator = await this.operatorAccountRepository.findAnyByUsername(username);
        if (!operator || !operator.active) {
            return { requested: true };
        }

        const rawToken = createOpaqueSessionToken();
        const expiresAt = new Date(Date.now() + 60 * 60_000);
        await this.verificationTokenRepository.invalidateActiveOperatorTokens(String(operator._id), "operator_password_reset");
        await this.verificationTokenRepository.create({
            tokenHash: hashOpaqueToken(rawToken),
            purpose: "operator_password_reset",
            operatorId: String(operator._id),
            email: operator.username,
            expiresAt,
        });
        await this.notificationJobRepository.create({
            jobId: createSessionId(),
            channel: "email",
            provider: this.getNotificationProvider(),
            template: "operator_password_reset",
            recipient: operator.username,
            subject: "Reset your Slotwise operator password",
            payload: {
                operatorId: String(operator._id),
                username: operator.username,
                token: rawToken,
                resetUrl: this.buildOperatorPasswordResetUrl(rawToken),
                expiresAt: expiresAt.toISOString(),
            },
            dedupeKey: `operator_password_reset:${String(operator._id)}`,
            availableAt: new Date(),
        });
        await this.auditLogService.record({
            actorId: operator.actorId,
            actorRole: operator.role,
            action: "operator.password_reset_requested",
            targetEntity: "operator",
            targetId: String(operator._id),
        });

        return {
            requested: true,
            ...(isLocalOrTestRuntime() ? { token: rawToken } : {}),
        };
    }

    public async completeOperatorPasswordReset(token: string, password: string): Promise<{ reset: true }> {
        if (password.length < 8) {
            throw new Error("Password must be at least 8 characters");
        }

        const verificationToken = await this.verificationTokenRepository.consumeActiveToken(hashOpaqueToken(token), "operator_password_reset");
        if (!verificationToken?.operatorId) {
            throw new Error("Invalid or expired password reset token");
        }

        const operator = await this.operatorAccountRepository.acceptInvitation(String(verificationToken.operatorId), await hashPassword(password));
        if (!operator) {
            throw new Error("Operator account not found");
        }

        await this.auditLogService.record({
            actorId: operator.actorId,
            actorRole: operator.role,
            action: "operator.password_reset_completed",
            targetEntity: "operator",
            targetId: String(operator._id),
        });

        return { reset: true };
    }

    public async updateOperatorRole(actor: SlotwiseSession, operatorId: string, role: SlotwiseOperatorCredential["role"]): Promise<{ updated: true }> {
        this.assertOwner(actor);
        const operator = await this.operatorAccountRepository.findById(operatorId);
        if (!operator) throw new Error("Operator account not found");
        if (operator.actorId === actor.actorId && operator.role === "owner" && role !== "owner") {
            throw new Error("Owners cannot demote themselves");
        }
        if (operator.role === "owner" && role !== "owner" && await this.operatorAccountRepository.countActiveOwners() <= 1) {
            throw new Error("At least one active owner is required");
        }

        await this.operatorAccountRepository.updateRole(operatorId, role);
        await this.auditLogService.record({ actor, action: "operator.role_changed", targetEntity: "operator", targetId: operatorId, metadata: { from: operator.role, to: role } });
        return { updated: true };
    }

    public async updateOperatorStatus(actor: SlotwiseSession, operatorId: string, active: boolean): Promise<{ updated: true }> {
        this.assertOwner(actor);
        const operator = await this.operatorAccountRepository.findById(operatorId);
        if (!operator) throw new Error("Operator account not found");
        if (!active && operator.actorId === actor.actorId) throw new Error("Operators cannot deactivate themselves");
        if (!active && operator.role === "owner" && await this.operatorAccountRepository.countActiveOwners() <= 1) {
            throw new Error("At least one active owner is required");
        }

        await this.operatorAccountRepository.updateActive(operatorId, active);
        await this.auditLogService.record({ actor, action: active ? "operator.activated" : "operator.deactivated", targetEntity: "operator", targetId: operatorId });
        return { updated: true };
    }

    public async requestCustomerMagicLink(businessId: string, email: string): Promise<{ requested: true }> {
        const customer = await this.customerRepository.findByBusinessAndEmail(businessId, email);
        if (!customer) {
            return { requested: true };
        }

        const rawToken = createOpaqueSessionToken();
        const expiresAt = new Date(Date.now() + this.getMagicLinkTtlMinutes() * 60_000);
        const normalizedEmail = email.trim().toLowerCase();

        await this.verificationTokenRepository.invalidateActiveTokens(String(customer._id), "customer_magic_link");
        await this.verificationTokenRepository.create({
            tokenHash: hashOpaqueToken(rawToken),
            purpose: "customer_magic_link",
            customerId: String(customer._id),
            businessId,
            email: normalizedEmail,
            expiresAt,
        });

        await this.notificationJobRepository.create({
            jobId: createSessionId(),
            channel: "email",
            provider: this.getNotificationProvider(),
            template: "customer_magic_link",
            recipient: normalizedEmail,
            subject: "Your Slotwise sign-in link",
            payload: {
                businessId,
                customerId: String(customer._id),
                customerName: `${customer.firstName} ${customer.lastName}`.trim(),
                token: rawToken,
                expiresAt: expiresAt.toISOString(),
                magicLinkUrl: this.buildCustomerMagicLinkUrl(rawToken, businessId),
            },
            dedupeKey: `customer_magic_link:${businessId}:${String(customer._id)}`,
            availableAt: new Date(),
        });

        return { requested: true };
    }

    public async verifyCustomerMagicLink(token: string): Promise<SlotwiseSessionWithToken> {
        const verificationToken = await this.verificationTokenRepository.consumeActiveToken(
            hashOpaqueToken(token),
            "customer_magic_link",
        );

        if (!verificationToken) {
            throw new Error("Invalid or expired customer verification token");
        }

        const customer = await this.customerRepository.findById(String(verificationToken.customerId));
        if (!customer) {
            throw new Error("Customer account not found");
        }

        const sessionToken = createOpaqueSessionToken();
        const session = await this.authSessionRepository.create({
            sessionId: createSessionId(),
            tokenHash: hashOpaqueToken(sessionToken),
            actorType: "customer",
            actorId: String(customer._id),
            email: customer.email,
            role: "customer",
            businessId: String(customer.businessId),
            expiresAt: new Date(Date.now() + this.getSessionTtlMinutes() * 60_000),
        });

        return {
            token: sessionToken,
            ...this.toSlotwiseSession(session),
        };
    }

    private getBootstrapOperators(): SlotwiseOperatorCredential[] {
        const operators = [
            toOptionalOperator("owner", "owner-1"),
            toOptionalOperator("admin", "admin-1"),
            toOptionalOperator("staff", "staff-1"),
        ].filter((operator): operator is SlotwiseOperatorCredential => operator !== null);

        return operators;
    }

    private assertOwner(actor: SlotwiseSession): void {
        if (actor.role !== "owner") {
            throw new Error("Owner role is required");
        }
    }

    private getSessionTtlMinutes(): number {
        const configuredTtl = getOptionalEnv("SLOTWISE_SESSION_TTL_MINUTES");

        if (!configuredTtl) {
            return defaultSessionTtlMinutes;
        }

        const ttlMinutes = Number(configuredTtl);

        if (!Number.isInteger(ttlMinutes) || ttlMinutes < 1) {
            throw new Error("Invalid SLOTWISE_SESSION_TTL_MINUTES value");
        }

        return ttlMinutes;
    }

    private getMagicLinkTtlMinutes(): number {
        const configuredTtl = getOptionalEnv("SLOTWISE_MAGIC_LINK_TTL_MINUTES");

        if (!configuredTtl) {
            return defaultMagicLinkTtlMinutes;
        }

        const ttlMinutes = Number(configuredTtl);

        if (!Number.isInteger(ttlMinutes) || ttlMinutes < 1) {
            throw new Error("Invalid SLOTWISE_MAGIC_LINK_TTL_MINUTES value");
        }

        return ttlMinutes;
    }

    private getNotificationProvider(): "resend" | "noop" {
        return getOptionalEnv("SLOTWISE_EMAIL_PROVIDER") === "resend" ? "resend" : "noop";
    }

    private buildCustomerMagicLinkUrl(token: string, businessId: string): string {
        const baseUrl = getOptionalEnv("SLOTWISE_CUSTOMER_MAGIC_LINK_BASE_URL");

        if (!baseUrl) {
            return token;
        }

        const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
        const query = new URLSearchParams({
            token,
            businessId,
        });

        return `${normalizedBaseUrl}?${query.toString()}`;
    }

    private buildOperatorInvitationUrl(token: string): string {
        return this.buildTokenUrl("SLOTWISE_OPERATOR_INVITATION_BASE_URL", token);
    }

    private buildOperatorPasswordResetUrl(token: string): string {
        return this.buildTokenUrl("SLOTWISE_OPERATOR_PASSWORD_RESET_BASE_URL", token);
    }

    private buildTokenUrl(envName: string, token: string): string {
        const baseUrl = getOptionalEnv(envName);

        if (!baseUrl) {
            return token;
        }

        const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
        const query = new URLSearchParams({ token });
        return `${normalizedBaseUrl}?${query.toString()}`;
    }

    private toSlotwiseSession(session: {
        sessionId: string;
        actorType: SlotwiseSession["actorType"];
        actorId: string;
        username?: string;
        email?: string;
        role: SlotwiseSession["role"];
        businessId?: { toString(): string } | string;
        expiresAt: Date;
        lastSeenAt?: Date;
    }): SlotwiseSession {
        return {
            sessionId: session.sessionId,
            actorType: session.actorType,
            actorId: session.actorId,
            ...(session.username ? { username: session.username } : {}),
            ...(session.email ? { email: session.email } : {}),
            role: session.role,
            ...(session.businessId ? { businessId: String(session.businessId) } : {}),
            expiresAt: session.expiresAt,
            ...(session.lastSeenAt ? { lastSeenAt: session.lastSeenAt } : {}),
        };
    }
}
