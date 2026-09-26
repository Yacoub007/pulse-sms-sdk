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

export class PulseSmsClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(options: PulseSmsClientOptions) {
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
  public async sendOtp(opts: SendOtpOptions): Promise<MessageResult> {
    const url = `${this.baseUrl}/v1/sms/send`;
    return this.postRequest<MessageResult>(url, {
      to: opts.to,
      code: opts.code,
      channel: opts.channel || "sms",
      mode: opts.mode || "sync",
    });
  }

  /**
   * 2. Send a templated notification or custom alert (e.g. outbid alert, confirmation)
   */
  public async sendMessage(opts: SendCustomMessageOptions): Promise<MessageResult> {
    const url = `${this.baseUrl}/v1/messages/send`;
    return this.postRequest<MessageResult>(url, {
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
  public async sendBatch(messages: (SendOtpOptions | SendCustomMessageOptions)[]): Promise<BatchMessageResult> {
    const url = `${this.baseUrl}/v1/sms/batch`;
    return this.postRequest<BatchMessageResult>(url, { messages });
  }

  /**
   * 4. List all available templates
   */
  public async listTemplates(): Promise<TemplateItem[]> {
    const url = `${this.baseUrl}/v1/templates`;
    const res = await this.getRequest<{ templates: TemplateItem[] }>(url);
    return res.templates || [];
  }

  /**
   * 5. Check Gateway service health (public probe)
   */
  public async checkHealth(): Promise<GatewayHealthResult> {
    const url = `${this.baseUrl}/health`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { method: "GET", signal: controller.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(`Health check failed (${res.status})`);
      return data as GatewayHealthResult;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 6. Retrieve live Gateway statistics (Requires valid API Key)
   */
  public async getStats(): Promise<GatewayStatsResult> {
    const url = `${this.baseUrl}/v1/stats`;
    return this.getRequest<GatewayStatsResult>(url);
  }

  /**
   * Helper GET request with auth and timeout
   */
  private async getRequest<T>(url: string): Promise<T> {
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

      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Helper POST request with auth and timeout
   */
  private async postRequest<T>(url: string, body: unknown): Promise<T> {
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

      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
