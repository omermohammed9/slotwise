import { getOptionalEnv } from "../config/env";
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

const defaultSessionTtlMinutes = 480;
const defaultMagicLinkTtlMinutes = 15;

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
    private bootstrapCompleted = false;

    public constructor(
        operatorAccountRepository: OperatorAccountRepositoryContract = OperatorAccountRepository.getInstance(),
        authSessionRepository: AuthSessionRepositoryContract = AuthSessionRepository.getInstance(),
        customerRepository: CustomerRepositoryContract = CustomerRepository.getInstance(),
        verificationTokenRepository: VerificationTokenRepositoryContract = VerificationTokenRepository.getInstance(),
        notificationJobRepository: NotificationJobRepositoryContract = NotificationJobRepository.getInstance(),
    ) {
        this.operatorAccountRepository = operatorAccountRepository;
        this.authSessionRepository = authSessionRepository;
        this.customerRepository = customerRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.notificationJobRepository = notificationJobRepository;
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }

        return AuthService.instance;
    }

    public async bootstrapOperatorAccountsFromEnv(): Promise<void> {
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
        await this.bootstrapOperatorAccountsFromEnv();

        const operator = await this.operatorAccountRepository.findByUsername(username);
        if (!operator || !(await verifyPassword(password, operator.passwordHash))) {
            throw new Error("Invalid operator credentials");
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
