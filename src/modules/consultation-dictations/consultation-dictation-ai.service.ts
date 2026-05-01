import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HumanMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { ConsultationDictationStructuredPayload } from './entities/consultation-dictation.entity';

export type StructuredDraft = {
  cleanedTranscript: string;
  payload: ConsultationDictationStructuredPayload;
};

type TranscriptionOptions = {
  fileName?: string | null;
  mimeType?: string | null;
  language?: string | null;
  fallbackTranscript?: string | null;
};

type AiProvider = 'openai' | 'anthropic' | 'gemini';

const consultationDictationSchema = z.object({
  transcriptFinal: z
    .string()
    .describe(
      'Versao final normalizada do ditado, em portugues do Brasil, mantendo apenas informacoes clinicamente relevantes.',
    ),
  summary: z
    .string()
    .describe(
      'Resumo executivo curto da consulta em no maximo 280 caracteres.',
    ),
  subjective: z
    .string()
    .nullable()
    .describe('Resumo do relato do tutor e da anamnese.'),
  objective: z
    .string()
    .nullable()
    .describe('Achados objetivos do exame fisico e observacoes clinicas.'),
  assessment: z
    .string()
    .nullable()
    .describe('Hipotese diagnostica ou avaliacao clinica.'),
  plan: z
    .string()
    .nullable()
    .describe('Conduta clinica, plano terapeutico e retorno.'),
  mainComplaint: z
    .string()
    .nullable()
    .describe('Campo pronto para popular a queixa principal da consulta.'),
  clinicalFindings: z
    .string()
    .nullable()
    .describe('Campo pronto para popular os achados clinicos da consulta.'),
  diagnosis: z
    .string()
    .nullable()
    .describe('Campo pronto para popular o diagnostico da consulta.'),
  treatmentPlan: z
    .string()
    .nullable()
    .describe('Campo pronto para popular o plano terapeutico da consulta.'),
  notes: z
    .string()
    .nullable()
    .describe('Observacoes adicionais que nao cabem nos campos principais.'),
  weightKg: z
    .number()
    .nullable()
    .describe('Peso em kg quando identificado explicitamente.'),
  temperatureC: z
    .number()
    .nullable()
    .describe(
      'Temperatura em graus Celsius quando identificada explicitamente.',
    ),
  keywords: z
    .array(z.string())
    .max(8)
    .describe('Palavras-chave clinicas em minusculo e sem duplicidade.'),
});

type ConsultationDictationSchema = z.infer<typeof consultationDictationSchema>;

@Injectable()
export class ConsultationDictationAiService {
  private readonly logger = new Logger(ConsultationDictationAiService.name);
  private modelInstance?: BaseChatModel;

  constructor(private readonly configService: ConfigService) {}

  isConfigured() {
    const provider = this.getAiProvider();
    if (provider === 'openai') {
      return Boolean(this.configService.get<string>('OPENAI_API_KEY'));
    }

    if (provider === 'anthropic') {
      return Boolean(this.configService.get<string>('ANTHROPIC_API_KEY'));
    }

    if (provider === 'gemini') {
      return Boolean(this.configService.get<string>('GEMINI_API_KEY'));
    }

    return Boolean(this.configService.get<string>('GEMINI_API_KEY'));
  }

  async buildStructuredDraft(
    transcriptDraft: string,
  ): Promise<StructuredDraft> {
    const cleanedTranscript = this.normalizeClinicalTranscript(transcriptDraft);

    if (!this.isConfigured()) {
      this.logger.warn(
        `${this.getAiProvider().toUpperCase()} API key not configured. Falling back to local dictation parser.`,
      );
      return this.buildStructuredDraftFallback(cleanedTranscript);
    }

    try {
      const structuredLlm = (await this.getModel()).withStructuredOutput(
        consultationDictationSchema,
        {
          name: 'consultation_dictation_extraction',
          strict: true,
        },
      );

      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          [
            'Voce e um veterinario clinico senior e redator tecnico de prontuario.',
            'Transforme relato bruto em texto clinico profissional, objetivo e acionavel.',
            'Retorne somente JSON valido no schema solicitado.',
            'Nao invente dados: se a informacao nao estiver explicita ou nao puder ser inferida com seguranca, use null.',
            'Evite repeticao literal da fala do tutor; sintetize em linguagem tecnica veterinaria.',
            'Nao repetir "tutor relata" em todos os campos; prefira sintese clinica direta.',
            'Cada campo deve agregar informacao nova e coerente com os demais, sem contradicoes temporais ou clinicas.',
            'Priorize especificidade: inicio, duracao, progressao, frequencia, intensidade, fatores associados e impacto funcional quando disponiveis.',
            'Nao emitir diagnostico definitivo na anamnese; em assessment, usar hipotese ou impressao clinica com cautela.',
            'Quando houver incerteza, explicite como "a esclarecer" ou retorne null conforme o caso.',
            'Escreva frases curtas, tecnicas e prontas para prontuario; evite generalidades vagas.',
            'subjective: historia clinica organizada da queixa e anamnese, sem redundancia.',
            'objective: apenas achados objetivos de exame fisico/observacao; se ausentes, null.',
            'assessment: interpretacao clinica e hipoteses diferenciais sem conclusao absoluta.',
            'plan: conduta proposta, exames complementares, monitorizacao e retorno quando citados; sem extrapolar dados ausentes.',
            'mainComplaint: problema principal em 1 frase clinica com tempo/evolucao quando houver.',
            'clinicalFindings: sintese dos achados relevantes que sustentam a avaliacao.',
            'diagnosis: diagnostico ou suspeita principal somente se houver base suficiente; caso contrario, null.',
            'treatmentPlan: plano terapeutico objetivo e verificavel apenas com dados presentes.',
            'notes: lacunas, riscos, pendencias e observacoes adicionais uteis.',
            'summary: resumo executivo em ate 280 caracteres, tecnico e informativo.',
            'transcriptFinal: normalize ruido, repeticoes e pontuacao preservando o sentido clinico.',
            'keywords: 4 a 8 termos clinicos curtos, em minusculo, sem duplicidade e sem acentos desnecessarios.',
          ].join(' '),
        ],
        [
          'human',
          [
            'Estruture o ditado clinico abaixo para os campos da consulta.',
            'A saida deve ser profissional e diferenciada por campo, sem repetir o mesmo texto.',
            'Se faltar dado para algum campo, use null.',
            '',
            '{transcriptDraft}',
          ].join('\n'),
        ],
      ]);

      const chain = prompt.pipe(structuredLlm);
      const response = await chain.invoke({
        transcriptDraft: cleanedTranscript,
      });

      return {
        cleanedTranscript: this.normalizeClinicalTranscript(
          response.transcriptFinal || cleanedTranscript,
        ),
        payload: this.mapResponseToPayload(response),
      };
    } catch (error: any) {
      this.logger.error(
        `${this.getAiProvider().toUpperCase()} structured extraction failed. Falling back to local parser.`,
        error?.stack,
      );
      return this.buildStructuredDraftFallback(cleanedTranscript);
    }
  }

  async transcribeAudio(
    audioBuffer: Buffer,
    options: TranscriptionOptions = {},
  ) {
    const fallbackTranscript = this.normalizeClinicalTranscript(
      options.fallbackTranscript || '',
    );

    if (!audioBuffer?.length) {
      return fallbackTranscript;
    }

    if (!this.isConfigured()) {
      this.logger.warn(
        `${this.getAiProvider().toUpperCase()} API key not configured. Falling back to local transcript draft for uploaded audio.`,
      );
      return fallbackTranscript;
    }

    const provider = this.getAiProvider();
    if (provider === 'gemini') {
      try {
        const transcript = await this.transcribeAudioWithGemini(
          audioBuffer,
          options,
          fallbackTranscript,
        );
        return this.normalizeClinicalTranscript(transcript || fallbackTranscript);
      } catch (error: any) {
        if (fallbackTranscript.length >= 10) {
          this.logger.error(
            'Gemini audio transcription failed. Falling back to browser transcript draft.',
            error?.stack,
          );
          return fallbackTranscript;
        }

        throw error;
      }
    }

    this.logger.warn(
      `Audio transcription via LangChain ainda nao esta habilitada para provider ${provider.toUpperCase()}. Falling back to local transcript draft.`,
    );
    return fallbackTranscript;
  }

  private async transcribeAudioWithGemini(
    audioBuffer: Buffer,
    options: TranscriptionOptions,
    fallbackTranscript: string,
  ) {
    const modelName =
      this.configService.get<string>('GEMINI_TRANSCRIPTION_MODEL') ||
      this.configService.get<string>('GEMINI_MODEL') ||
      'gemini-2.5-flash';
    const mimeType = options.mimeType?.trim() || 'audio/webm';
    const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
    const model = new ChatGoogleGenerativeAI({
      model: modelName,
      temperature: 0,
      maxRetries: 2,
      apiKey: this.configService.get<string>('GEMINI_API_KEY'),
    });

    const contextLine =
      fallbackTranscript.length >= 10
        ? `Contexto parcial ja capturado no navegador: ${fallbackTranscript}`
        : 'Nao ha rascunho previo.';

    const response = await model.invoke([
      new HumanMessage({
        content: [
          {
            type: 'text',
            text: [
              'Transcreva este audio de consulta veterinaria em portugues do Brasil.',
              'Retorne somente o texto transcrito limpo, sem markdown.',
              contextLine,
            ].join(' '),
          },
          {
            type: mimeType,
            data: audioBuffer.toString('base64'),
          },
        ],
      }),
    ]);

    return this.extractTextFromMessageContent(response.content);
  }

  private async getModel() {
    if (this.modelInstance) {
      return this.modelInstance;
    }

    const provider = this.getAiProvider();
    this.modelInstance = this.buildProviderModel(provider);

    return this.modelInstance;
  }

  private buildProviderModel(provider: AiProvider): BaseChatModel {
    const timeoutMs = this.getTimeoutMs();

    if (provider === 'anthropic') {
      const { ChatAnthropic } = require('@langchain/anthropic');
      return new ChatAnthropic({
        model:
          this.configService.get<string>('ANTHROPIC_MODEL') ||
          'claude-3-5-sonnet-latest',
        temperature: 0,
        maxRetries: 2,
        anthropicApiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
        timeout: timeoutMs,
      });
    }

    if (provider === 'gemini') {
      const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
      return new ChatGoogleGenerativeAI({
        model:
          this.configService.get<string>('GEMINI_MODEL') ||
          'gemini-2.5-flash',
        temperature: 0,
        maxRetries: 2,
        apiKey: this.configService.get<string>('GEMINI_API_KEY'),
      });
    }

    return new ChatOpenAI({
      model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-5-mini',
      temperature: 0,
      maxRetries: 2,
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      configuration: {
        timeout: timeoutMs,
      },
    });
  }

  private getAiProvider(): AiProvider {
    const configured = (
      this.configService.get<string>('AI_PROVIDER') || 'gemini'
    )
      .toLowerCase()
      .trim();

    if (
      configured === 'openai' ||
      configured === 'anthropic' ||
      configured === 'gemini'
    ) {
      return configured;
    }

    return 'gemini';
  }

  private getTimeoutMs() {
    const rawValue =
      this.configService.get<string>('AI_TIMEOUT_MS') || '20000';
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 20000;
  }

  private extractTextFromMessageContent(content: unknown) {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((item: any) => {
          if (typeof item === 'string') {
            return item;
          }
          if (typeof item?.text === 'string') {
            return item.text;
          }
          return '';
        })
        .join(' ')
        .trim();
    }

    return '';
  }

  private mapResponseToPayload(
    response: ConsultationDictationSchema,
  ): ConsultationDictationStructuredPayload {
    return {
      summary: this.normalizeNullableString(response.summary) || '',
      subjective: this.normalizeNullableString(response.subjective),
      objective: this.normalizeNullableString(response.objective),
      assessment: this.normalizeNullableString(response.assessment),
      plan: this.normalizeNullableString(response.plan),
      mainComplaint: this.normalizeNullableString(response.mainComplaint),
      clinicalFindings: this.normalizeNullableString(response.clinicalFindings),
      diagnosis: this.normalizeNullableString(response.diagnosis),
      treatmentPlan: this.normalizeNullableString(response.treatmentPlan),
      notes: this.normalizeNullableString(response.notes),
      weightKg: this.normalizeNullableNumber(response.weightKg),
      temperatureC: this.normalizeNullableNumber(response.temperatureC),
      keywords: Array.from(
        new Set(
          (response.keywords || [])
            .map((item) =>
              item
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim(),
            )
            .filter(Boolean)
            .slice(0, 8),
        ),
      ),
    };
  }

  private normalizeNullableString(value?: string | null) {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    const lowered = normalized.toLowerCase();
    if (
      lowered === 'null' ||
      lowered === 'n/a' ||
      lowered === 'na' ||
      lowered === 'nenhum' ||
      lowered === 'nenhuma' ||
      lowered === 'sem dados'
    ) {
      return null;
    }

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeNullableNumber(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return null;
    }

    return Number(value);
  }

  private buildStructuredDraftFallback(
    cleanedTranscript: string,
  ): StructuredDraft {
    const sentences = this.extractSentences(cleanedTranscript);
    const lowercaseTranscript = cleanedTranscript.toLowerCase();

    const mainComplaint =
      this.extractSegment(
        cleanedTranscript,
        ['queixa principal', 'queixa', 'tutor relata', 'anamnese', 'historico'],
        [
          'achados',
          'exame fisico',
          'diagnostico',
          'suspeita',
          'conduta',
          'tratamento',
          'plano',
        ],
      ) ||
      sentences[0] ||
      null;

    const clinicalFindings =
      this.extractSegment(
        cleanedTranscript,
        [
          'achados',
          'exame fisico',
          'ao exame',
          'clinicamente',
          'mucosas',
          'ausculta',
        ],
        [
          'diagnostico',
          'suspeita',
          'conduta',
          'tratamento',
          'plano',
          'observacoes',
        ],
      ) ||
      this.findFirstMatchingSentence(sentences, [
        'temperatura',
        'mucosa',
        'ausculta',
        'abdome',
        'desidrat',
        'dor',
        'linfonodo',
        'pele',
      ]);

    const diagnosis =
      this.extractSegment(
        cleanedTranscript,
        ['diagnostico', 'suspeita', 'avaliacao', 'impressao clinica'],
        ['conduta', 'tratamento', 'plano', 'observacoes'],
      ) ||
      this.findFirstMatchingSentence(sentences, [
        'suspeita',
        'diagnostico',
        'compativel',
      ]);

    const treatmentPlan =
      this.extractSegment(
        cleanedTranscript,
        [
          'conduta',
          'tratamento',
          'plano',
          'prescricao',
          'orientacao',
          'retorno',
        ],
        ['observacoes', 'notas'],
      ) ||
      this.findFirstMatchingSentence(sentences, [
        'prescrev',
        'tratamento',
        'retorno',
        'orient',
        'solicit',
      ]);

    const notes = this.extractSupplementalNotes(
      cleanedTranscript,
      mainComplaint,
      clinicalFindings,
      diagnosis,
      treatmentPlan,
    );

    const weightKg = this.extractDecimal(
      lowercaseTranscript,
      /peso(?:\s+atual)?(?:\s+de)?\s+(\d+(?:[.,]\d+)?)\s*(?:kg|quilo|quilos)/i,
    );

    const temperatureC = this.extractDecimal(
      lowercaseTranscript,
      /temperatura(?:\s+de)?\s+(\d+(?:[.,]\d+)?)/i,
    );

    return {
      cleanedTranscript,
      payload: {
        summary: this.buildSummary(mainComplaint, diagnosis, treatmentPlan),
        subjective: mainComplaint,
        objective: clinicalFindings,
        assessment: diagnosis,
        plan: treatmentPlan,
        mainComplaint,
        clinicalFindings,
        diagnosis,
        treatmentPlan,
        notes,
        weightKg,
        temperatureC,
        keywords: this.extractKeywords(cleanedTranscript),
      },
    };
  }

  private normalizeClinicalTranscript(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }

  private extractSentences(value: string) {
    return value
      .split(/(?<=[.!?])\s+|\n+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private extractSegment(
    transcript: string,
    startMarkers: string[],
    endMarkers: string[],
  ) {
    const normalized = transcript.toLowerCase();

    for (const marker of startMarkers) {
      const startIndex = normalized.indexOf(marker);
      if (startIndex < 0) {
        continue;
      }

      const afterMarker = transcript.slice(startIndex + marker.length);
      const cleanedAfterMarker = afterMarker.replace(/^[:\s-]+/, '');
      let endIndex = cleanedAfterMarker.length;

      for (const endMarker of endMarkers) {
        const markerIndex = cleanedAfterMarker.toLowerCase().indexOf(endMarker);
        if (markerIndex >= 0 && markerIndex < endIndex) {
          endIndex = markerIndex;
        }
      }

      const extracted = cleanedAfterMarker.slice(0, endIndex).trim();
      if (extracted.length > 0) {
        return extracted;
      }
    }

    return null;
  }

  private findFirstMatchingSentence(sentences: string[], terms: string[]) {
    return (
      sentences.find((sentence) =>
        terms.some((term) => sentence.toLowerCase().includes(term)),
      ) || null
    );
  }

  private extractSupplementalNotes(
    transcript: string,
    ...sections: Array<string | null>
  ) {
    const consumed = sections
      .filter((item): item is string => Boolean(item))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    let residual = transcript;
    for (const item of consumed) {
      residual = residual.replace(item, '').trim();
    }

    residual = residual
      .replace(
        /\b(queixa principal|queixa|tutor relata|anamnese|historico|achados|exame fisico|ao exame|clinicamente|mucosas|ausculta|diagnostico|suspeita|avaliacao|impressao clinica|conduta|tratamento|plano|prescricao|orientacao|retorno|observacoes|notas)\b[:\s-]*/gi,
        '',
      )
      .replace(/\s{2,}/g, ' ')
      .trim();

    return residual.length > 0 ? residual : null;
  }

  private extractDecimal(value: string, pattern: RegExp) {
    const match = value.match(pattern);
    if (!match?.[1]) {
      return null;
    }

    return Number(match[1].replace(',', '.'));
  }

  private buildSummary(
    mainComplaint: string | null,
    diagnosis: string | null,
    treatmentPlan: string | null,
  ) {
    const parts = [mainComplaint, diagnosis, treatmentPlan]
      .filter((item): item is string => Boolean(item))
      .map((item) => item.trim());

    return parts.slice(0, 3).join(' ').trim().slice(0, 280);
  }

  private extractKeywords(transcript: string) {
    const stopWords = new Set([
      'para',
      'com',
      'sem',
      'uma',
      'que',
      'por',
      'dos',
      'das',
      'nos',
      'nas',
      'sobre',
      'desde',
      'ontem',
      'hoje',
      'tutor',
      'relata',
      'animal',
      'paciente',
      'consulta',
      'retorno',
      'clinico',
      'clinica',
      'leve',
      'moderada',
      'moderado',
    ]);

    return Array.from(
      new Set(
        transcript
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .match(/[a-z]{4,}/g)
          ?.filter((word) => !stopWords.has(word))
          .slice(0, 8) || [],
      ),
    );
  }
}
