/**
 * Pulse-SMS & Messaging Suite — Official Client SDK
 *
 * Provides a robust, lightweight, and fully-typed interface to dispatch
 * SMS and WhatsApp messages, OTP verification, templated alerts, and system health queries.
 */
export class PulseSmsClient {
    apiKey;
    baseUrl;
    timeoutMs;
    constructor(options) {
        if (!options?.apiKey) {
            throw new Error("[PulseSmsClient] Clé API obligatoire pour instancier le client.");
        }
        this.apiKey = options.apiKey;
        this.baseUrl = (options.baseUrl || "http://localhost:4010").replace(/\/+$/, "");
        this.timeoutMs = options.timeoutMs || 8000;
    }
    /**
     * 1. Send an authentication OTP verification code
     */
    async sendOtp(opts) {
        const url = `${this.baseUrl}/v1/sms/send`;
        return this.postRequest(url, {
            to: opts.to,
            code: opts.code,
            channel: opts.channel || "sms",
            mode: opts.mode || "sync",
        });
    }
    /**
     * 2. Send a templated notification or custom alert (e.g. outbid alert, confirmation)
     */
    async sendMessage(opts) {
        const url = `${this.baseUrl}/v1/messages/send`;
        return this.postRequest(url, {
            to: opts.to,
            templateId: opts.templateId,
            variables: opts.variables,
            text: opts.text,
            lang: opts.lang || "fr",
            channel: opts.channel || "sms",
            mode: opts.mode || "sync",
        });
    }
    /**
     * 3. Batch dispatch for high-volume campaigns
     */
    async sendBatch(messages) {
        const url = `${this.baseUrl}/v1/sms/batch`;
        return this.postRequest(url, { messages });
    }
    /**
     * 4. List all available templates
     */
    async listTemplates() {
        const url = `${this.baseUrl}/v1/templates`;
        const res = await this.getRequest(url);
        return res.templates || [];
    }
    /**
     * 5. Check Gateway service health (public probe)
     */
    async checkHealth() {
        const url = `${this.baseUrl}/health`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const res = await fetch(url, { method: "GET", signal: controller.signal });
            const data = await res.json();
            if (!res.ok)
                throw new Error(`Health check failed (${res.status})`);
            return data;
        }
        finally {
            clearTimeout(timer);
        }
    }
    /**
     * 6. Retrieve live Gateway statistics (Requires valid API Key)
     */
    async getStats() {
        const url = `${this.baseUrl}/v1/stats`;
        return this.getRequest(url);
    }
    /**
     * Helper GET request with auth and timeout
     */
    async getRequest(url) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                },
                signal: controller.signal,
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || data.error || `Pulse-SMS API Error (${res.status})`);
            }
            return data;
        }
        finally {
            clearTimeout(timer);
        }
    }
    /**
     * Helper POST request with auth and timeout
     */
    async postRequest(url, body) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || data.error || `Pulse-SMS API Error (${res.status})`);
            }
            return data;
        }
        finally {
            clearTimeout(timer);
        }
    }
}
