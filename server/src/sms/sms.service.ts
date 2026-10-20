import { Injectable, Logger } from '@nestjs/common';
import { config } from '../config';

export function toMsisdn(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1);
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  return digits;
}

@Injectable()
export class SmsService {
  private readonly log = new Logger(SmsService.name);

  async send(phone: string, message: string): Promise<boolean> {
    const { apiKey, senderId, baseUrl } = config.tiara;

    if (!apiKey) {
      if (config.isProd) {
        this.log.error('TIARA_API_KEY is not set: SMS was not sent');
        return false;
      }
      this.log.warn(`[dev] TIARA_API_KEY not set. SMS to ${toMsisdn(phone)}: ${message}`);
      return true;
    }

    try {
      const res = await fetch(`${baseUrl}/api/messaging/sendsms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ to: toMsisdn(phone), from: senderId, message, refId: crypto.randomUUID() }),
        signal: AbortSignal.timeout(10_000),
      });
      const text = await res.text();
      let body: any;
      try {
        body = text ? JSON.parse(text) : undefined;
      } catch {
        body = undefined;
      }
      // The gateway can answer HTTP 200 and still reject the message (e.g. sender ID not approved)
      const status = String(body?.status ?? body?.statusCode ?? '').toUpperCase();
      const rejected = status === 'FAILED' || status === 'ERROR' || status === 'REJECTED';
      if (!res.ok || rejected) {
        this.log.error(`TiaraConnect rejected the SMS (HTTP ${res.status}): ${text.slice(0, 300)}`);
        return false;
      }
      return true;
    } catch (e) {
      this.log.error(`TiaraConnect request failed: ${(e as Error).message}`);
      return false;
    }
  }
}
