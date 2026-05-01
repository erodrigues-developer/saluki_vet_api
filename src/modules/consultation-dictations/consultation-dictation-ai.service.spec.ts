import { ConfigService } from '@nestjs/config';
import { ConsultationDictationAiService } from './consultation-dictation-ai.service';

describe('ConsultationDictationAiService', () => {
  const createService = (
    overrides: Record<string, string | undefined> = {},
  ) => {
    const configService = {
      get: jest.fn((key: string) => overrides[key]),
    } as unknown as ConfigService;

    return new ConsultationDictationAiService(configService);
  };

  it('should fallback to local parsing when selected provider key is not configured', async () => {
    const service = createService();

    const draft = await service.buildStructuredDraft(
      'Tutor relata prurido intenso ha 5 dias. Ao exame, temperatura 38.9 e pele hiperemiada. Suspeita de dermatite alergica. Conduta: iniciar anti-histaminico e retorno em 7 dias.',
    );

    expect(draft.cleanedTranscript).toContain('Tutor relata prurido intenso');
    expect(draft.payload.summary).toBeTruthy();
    expect(draft.payload.mainComplaint).toContain('prurido intenso');
    expect(draft.payload.clinicalFindings).toContain('temperatura 38.9');
    expect(draft.payload.diagnosis).toContain('dermatite alergica');
    expect(draft.payload.treatmentPlan).toContain('anti-histaminico');
    expect(draft.payload.temperatureC).toBe(38.9);
    expect(draft.payload.keywords).toEqual(
      expect.arrayContaining(['prurido', 'temperatura', 'pele']),
    );
  });

  it('should fallback to browser transcript when audio transcription is unavailable', async () => {
    const service = createService();

    const transcript = await service.transcribeAudio(Buffer.from('audio'), {
      fileName: 'consulta.webm',
      mimeType: 'audio/webm',
      language: 'pt-BR',
      fallbackTranscript:
        'Tutor relata tosse seca. Ao exame, temperatura 38.4. Conduta: observacao clinica.',
    });

    expect(transcript).toContain('Tutor relata tosse seca');
    expect(transcript).toContain('temperatura 38.4');
  });
});
