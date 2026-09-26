/**
 * Pulse-SMS & Messaging Suite — Official Client SDK
 *
 * Provides a robust, lightweight, and fully-typed interface to dispatch
 * SMS and WhatsApp messages, OTP verification, templated alerts, and system health queries.
 */
export interface PulseSmsClientOptions {
    /**
     * API Key issued by Pulse Studio (Format: sk_live_... or sk_test_...)
     */
    apiKey: string;
    /**
     * Gateway Base URL (Defaults to http://localhost:4010)
     */
    baseUrl?: string;
    /**
     * HTTP request timeout in milliseconds (Defaults to 8000ms)
     */
    timeoutMs?: number;
}
export interface SendOtpOptions {
    /**
     * Recipient phone number in E.164 format (e.g. "+22246123456")
     */
    to: string;
    /**
     * Verification code (e.g. "849201")
     */
    code: string;
    /**
     * Delivery channel: "sms" (default) or "whatsapp"
     */
    channel?: "sms" | "whatsapp";
    /**
     * Execution mode: "sync" (immediate) or "async" (enqueued into Redis Stream)
     */
    mode?: "sync" | "async";
}
export interface SendCustomMessageOptions {
    /**
     * Recipient phone number in E.164 format (e.g. "+22236112233")
     */
    to: string;
    /**
     * Registered template ID (e.g. "tpl_outbid_alert", "tpl_auction_win")
     */
    templateId?: string;
    /**
     * Interpolation variables for the template
     */
    variables?: Record<string, string>;
    /**
     * Freeform message text (used when templateId is omitted)
     */
    text?: string;
    /**
     * Language code: "fr" (French, default) or "ar" (Arabic)
     */
    lang?: "fr" | "ar";
    /**
     * Delivery channel: "sms" (default) or "whatsapp"
     */
    channel?: "sms" | "whatsapp";
    /**
     * Execution mode: "sync" (immediate) or "async" (enqueued into Redis Stream)
     */
    mode?: "sync" | "async";
}
export interface MessageResult {
    status: "SENT" | "QUEUED";
    channel: "sms" | "whatsapp";
    phone: string;
    renderedContent?: string;
    jobId?: string;
    dispatchedVia?: {
        accountId: string;
        projectId: string;
        accountRemainingQuota?: number;
    };
}
export interface BatchMessageResult {
    status: string;
    totalQueued: number;
    jobIds: string[];
}
export interface TemplateItem {
    id: string;
    name: string;
    variables: string[];
}
export interface GatewayHealthResult {
    status: string;
    service: string;
    version: string;
    timestamp: string;
    fleet: {
        totalAccounts: number;
    };
}
export interface GatewayStatsResult {
    fleet: {
        totalAccounts: number;
        activeAccounts: number;
        totalCapacity: number;
        totalDispatched: number;
    };
    queue: {
        queued: number;
        processing: number;
    };
    proxies: {
        totalProxies: number;
        activeProxies: number;
    };
    system: {
        uptime: number;
        timestamp: string;
    };
}
export declare class PulseSmsClient {
    private apiKey;
    private baseUrl;
    private timeoutMs;
    constructor(options: PulseSmsClientOptions);
    /**
     * 1. Send an authentication OTP verification code
     */
    sendOtp(opts: SendOtpOptions): Promise<MessageResult>;
    /**
     * 2. Send a templated notification or custom alert (e.g. outbid alert, confirmation)
     */
    sendMessage(opts: SendCustomMessageOptions): Promise<MessageResult>;
    /**
     * 3. Batch dispatch for high-volume campaigns
     */
    sendBatch(messages: (SendOtpOptions | SendCustomMessageOptions)[]): Promise<BatchMessageResult>;
    /**
     * 4. List all available templates
     */
    listTemplates(): Promise<TemplateItem[]>;
    /**
     * 5. Check Gateway service health (public probe)
     */
    checkHealth(): Promise<GatewayHealthResult>;
    /**
     * 6. Retrieve live Gateway statistics (Requires valid API Key)
     */
    getStats(): Promise<GatewayStatsResult>;
    /**
     * Helper GET request with auth and timeout
     */
    private getRequest;
    /**
     * Helper POST request with auth and timeout
     */
    private postRequest;
}
