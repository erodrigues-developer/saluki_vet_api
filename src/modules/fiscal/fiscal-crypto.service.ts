import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

@Injectable()
export class FiscalCryptoService {
  constructor(private readonly configService: ConfigService) {}

  encryptSecret(value: string): string {
    const normalized = String(value || '').trim();
    if (!normalized) return '';

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(normalized, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return [
      'v1',
      iv.toString('base64'),
      tag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decryptSecret(value?: string | null): string {
    const normalized = String(value || '').trim();
    if (!normalized) return '';

    const [version, ivBase64, tagBase64, encryptedBase64] =
      normalized.split(':');
    if (version !== 'v1' || !ivBase64 || !tagBase64 || !encryptedBase64) {
      return normalized;
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getKey(),
      Buffer.from(ivBase64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedBase64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  maskSecret(value?: string | null) {
    const normalized = String(value || '').trim();
    if (!normalized) return null;
    if (normalized.length <= 4) return '****';
    return `${normalized.slice(0, 2)}****${normalized.slice(-2)}`;
  }

  private getKey() {
    const configured =
      this.configService.get<string>('FISCAL_SECRET_KEY') ||
      this.configService.get<string>('FISCAL_CERT_ENCRYPTION_KEY') ||
      this.configService.get<string>('JWT_SECRET') ||
      'saluki-local-fiscal-development-key';

    return createHash('sha256').update(configured).digest();
  }
}
