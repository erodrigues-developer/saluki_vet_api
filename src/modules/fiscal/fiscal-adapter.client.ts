import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FiscalAdapterIssueResponse {
  requestId?: string | number | null;
  status:
    | 'AUTHORIZED'
    | 'CONTINGENCY'
    | 'REJECTED'
    | 'DENIED'
    | 'FAILED'
    | 'FISCAL_ADAPTER_NOT_CONFIGURED';
  message?: string;
  accessKey?: string | null;
  protocolNumber?: string | null;
  authorizedAt?: string | null;
  xml?: string | null;
  danfePdfBase64?: string | null;
  rawResponse?: Record<string, unknown> | string | null;
}

@Injectable()
export class FiscalAdapterClient {
  constructor(private readonly configService: ConfigService) {}

  async issueNfce(payload: Record<string, unknown>) {
    return this.post<FiscalAdapterIssueResponse>('/nfce/issue', payload);
  }

  private async post<T>(path: string, payload: Record<string, unknown>) {
    const baseUrl = this.configService.get<string>('FISCAL_ADAPTER_URL');
    if (!baseUrl) {
      return {
        status: 'FISCAL_ADAPTER_NOT_CONFIGURED',
        message: 'FISCAL_ADAPTER_URL não configurada no backend.',
      } as T;
    }

    const token = this.configService.get<string>('FISCAL_ADAPTER_TOKEN');
    const targetUrl = `${baseUrl.replace(/\/+$/, '')}${path}`;
    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          ...(token ? { 'x-saluki-fiscal-token': token } : {}),
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const cause = error instanceof Error ? (error as Error & { cause?: unknown }).cause : null;
      const code =
        typeof cause === 'object' && cause && 'code' in cause
          ? String((cause as { code?: unknown }).code)
          : null;
      return {
        status: 'FAILED',
        message: `Não foi possível conectar ao adapter fiscal em ${targetUrl}${code ? ` (${code})` : ''}.`,
        rawResponse: {
          error: error instanceof Error ? error.message : 'fetch failed',
          cause,
        },
      } as T;
    }

    const body = await response.json().catch(() => ({}));
    if (!response.ok && !body?.status) {
      return {
        status: 'FAILED',
        message: `Adapter fiscal respondeu HTTP ${response.status}.`,
        rawResponse: body,
      } as T;
    }
    return body as T;
  }
}
