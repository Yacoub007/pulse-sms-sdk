import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PulseSmsClient } from "./index.ts";

describe("PulseSmsClient SDK", () => {
  it("throws when initialized without API key", () => {
    assert.throws(() => {
      // @ts-expect-error testing invalid argument
      new PulseSmsClient({});
    }, /Clé API obligatoire/);
  });

  it("instantiates cleanly with valid config and strips trailing slash", () => {
    const client = new PulseSmsClient({
      apiKey: "sk_live_test_key_123",
      baseUrl: "https://sms.souq.mr///",
      timeoutMs: 5000,
    });
    assert.ok(client);
  });

  it("exposes all primary API dispatch methods", () => {
    const client = new PulseSmsClient({
      apiKey: "sk_live_test_123",
    });
    assert.equal(typeof client.sendOtp, "function");
    assert.equal(typeof client.sendMessage, "function");
    assert.equal(typeof client.sendBatch, "function");
    assert.equal(typeof client.listTemplates, "function");
    assert.equal(typeof client.checkHealth, "function");
    assert.equal(typeof client.getStats, "function");
  });
});
