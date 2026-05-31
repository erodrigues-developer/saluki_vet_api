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

type ConsultiveSupportInput = {
  anamnesis: string;
  weightKg?: number | null;
  temperatureC?: number | null;
  heartRateBpm?: number | null;
  respiratoryRateIpm?: number | null;
  mucosaStatus?: string | null;
  hydrationStatus?: string | null;
  painStatus?: string | null;
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
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'human',
          [
            'Você é um assistente de prontuário veterinário especializado em transformar transcrições de consultas em anamnese clínica.',
            '',
            'Sua tarefa é converter uma conversa bruta entre médico-veterinário e tutor em uma ANAMNESE VETERINÁRIA TÉCNICA, SINTÉTICA E ORGANIZADA.',
            '',
            'A saída NÃO deve parecer uma conversa.',
            'A saída NÃO deve manter perguntas e respostas.',
            'A saída NÃO deve reproduzir falas literalmente, exceto quando uma informação específica precisar ser preservada com fidelidade.',
            'A saída deve ser uma síntese clínica adequada para prontuário veterinário.',
            '',
            'CONCEITO:',
            'Anamnese é o registro organizado da história clínica relatada pelo tutor e conduzida pelo médico-veterinário. Ela deve reunir, em linguagem técnica e objetiva, as informações relevantes sobre o motivo da consulta, início, evolução, sinais clínicos, hábitos, exposições, histórico preventivo e demais dados pertinentes.',
            '',
            'REGRAS PRINCIPAIS:',
            '- Transforme a conversa em síntese clínica.',
            '- Não escreva em formato de diálogo.',
            '- Não use “perguntou”, “respondeu”, “o veterinário disse” ou “o tutor falou” repetidamente.',
            '- Use preferencialmente expressões como “Tutor relata”, “Tutor refere”, “Segundo tutor”, “Tutor nega”, “Foi relatado”.',
            '- Não invente informações.',
            '- Não complete lacunas com suposições.',
            '- Não diagnostique.',
            '- Não sugira tratamento.',
            '- Não recomende exames, exceto se isso tiver sido mencionado explicitamente na conversa.',
            '- Não cite doenças, hipóteses ou suspeitas se elas não foram mencionadas na transcrição.',
            '- Não obrigue o preenchimento de todos os tópicos.',
            '- Organize somente as informações disponíveis.',
            '- Se uma informação não foi mencionada, omita do texto final.',
            '- Use “não informado” somente quando a ausência da informação for importante para o contexto clínico.',
            '- Preserve negações relevantes.',
            '- Preserve incertezas usando termos como “aproximadamente”, “sem precisão”, “tutor não soube precisar”, “aparentemente” ou “não foi possível confirmar pela transcrição”.',
            '- Remova cumprimentos, hesitações, repetições, interrupções e trechos sem valor clínico.',
            '- Corrija a linguagem para padrão técnico, sem alterar o sentido original.',
            '- A anamnese deve ser útil mesmo quando a transcrição for parcial.',
            '',
            'ESTILO DA ANAMNESE:',
            '- Texto em português do Brasil.',
            '- Linguagem clínica veterinária.',
            '- Tom objetivo, técnico e profissional.',
            '- Frases claras e bem organizadas.',
            '- Sem excesso de detalhes irrelevantes.',
            '- Sem linguagem informal.',
            '- Sem perguntas.',
            '- Sem estrutura de entrevista.',
            '- Sem diagnóstico final.',
            '',
            'FORMATO DE SAÍDA:',
            'Retorne uma anamnese organizada em texto puro, com os blocos abaixo.',
            'Não use JSON.',
            'Não use tabela.',
            'Não use markdown complexo.',
            'Não mantenha blocos vazios.',
            'Omitir qualquer bloco sem informação relevante.',
            '',
            '1. Queixa principal:',
            'Uma frase curta sintetizando o motivo da consulta.',
            '',
            '2. História do problema atual:',
            'Texto clínico corrido descrevendo início, duração, evolução, intensidade, frequência, progressão, melhora/piora e sinais associados, apenas se mencionados.',
            '',
            '3. Alimentação e ingestão hídrica:',
            'Síntese do que foi relatado sobre apetite, aceitação alimentar, mudança de alimento e ingestão de água.',
            '',
            '4. Urina e fezes:',
            'Síntese do que foi relatado sobre micção e evacuação.',
            '',
            '5. Sinais associados:',
            'Síntese ou lista objetiva dos sinais clínicos relevantes mencionados, evitando repetir o que já foi bem descrito na história do problema atual.',
            '',
            '6. Exposições e fatores de risco:',
            'Síntese sobre ambiente, acesso à rua, quintal, contato com outros animais, produtos químicos, venenos, lixo, plantas, alimento diferente, medicamentos administrados em casa, pulgas, carrapatos, mosquitos ou outros fatores mencionados.',
            '',
            '7. Histórico preventivo e médico:',
            'Síntese sobre vacinação, vermifugação, antiparasitários, repelentes, castração, doenças anteriores, medicações contínuas, alergias, cirurgias ou internações, quando mencionados.',
            '',
            '8. Informações negadas relevantes:',
            'Liste apenas negativas clinicamente úteis.',
            'Exemplo:',
            '- Tutor nega vômitos.',
            '- Tutor nega contato conhecido com produtos químicos ou venenos.',
            '- Tutor nega mudança alimentar recente.',
            '',
            '9. Informações incertas ou pouco precisas:',
            'Liste apenas informações importantes que foram relatadas de forma imprecisa.',
            'Exemplo:',
            '- Tutor não soube precisar a data da última vermifugação.',
            '- Duração dos sinais relatada de forma aproximada.',
            '',
            '10. Anamnese consolidada para prontuário:',
            'Escreva um parágrafo único, técnico e natural, pronto para ser salvo no prontuário.',
            'Esse parágrafo deve sintetizar os principais achados da anamnese sem parecer transcrição e sem repetir “não informado” desnecessariamente.',
            '',
            'CRITÉRIO MAIS IMPORTANTE:',
            'A entrada é uma conversa. A saída deve ser uma anamnese clínica. Portanto, reestruture, sintetize e normalize a linguagem, mantendo fidelidade ao conteúdo original.',
            '',
            'TRANSCRIÇÃO DA CONSULTA:',
            '"""',
            '{transcriptDraft}',
            '"""',
          ].join('\n'),
        ],
      ]);

      const chain = prompt.pipe(await this.getModel());
      const response = await chain.invoke({ transcriptDraft: cleanedTranscript });
      const organizedText = this.normalizeClinicalTranscript(
        this.extractTextFromMessageContent((response as any)?.content),
      );
      if (!organizedText) {
        return this.buildStructuredDraftFallback(cleanedTranscript);
      }

      return {
        cleanedTranscript: organizedText,
        payload: {
          summary: organizedText.slice(0, 280),
          subjective: organizedText,
          objective: null,
          assessment: null,
          plan: null,
          mainComplaint: organizedText,
          clinicalFindings: organizedText,
          diagnosis: null,
          treatmentPlan: null,
          notes: null,
          weightKg: null,
          temperatureC: null,
          keywords: [],
        },
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
        return this.normalizeClinicalTranscript(
          transcript || fallbackTranscript,
        );
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

  async buildConsultiveSupport(input: ConsultiveSupportInput) {
    const anamnesis = this.normalizeClinicalTranscript(input.anamnesis || '');
    if (!anamnesis) {
      return [
        'Apoio clínico da IA',
        '',
        'Sugestões consultivas geradas a partir da anamnese, triagem e sinais registrados. Não representam diagnóstico e devem ser revisadas pelo médico-veterinário antes de serem usadas no prontuário.',
        '',
        'Não há dados clínicos suficientes para sugerir possibilidades específicas com segurança. Recomenda-se revisar a anamnese, exame físico e sinais vitais antes de formular hipóteses diferenciais.',
      ].join('\n');
    }

    if (!this.isConfigured()) {
      return [
        'Apoio clínico da IA',
        '',
        'Sugestões consultivas geradas a partir da anamnese, triagem e sinais registrados. Não representam diagnóstico e devem ser revisadas pelo médico-veterinário antes de serem usadas no prontuário.',
        '',
        'Não há dados clínicos suficientes para sugerir possibilidades específicas com segurança. Recomenda-se revisar a anamnese, exame físico e sinais vitais antes de formular hipóteses diferenciais.',
      ].join('\n');
    }

    const vitals = [
      input.weightKg != null ? `Peso: ${input.weightKg} kg` : null,
      input.temperatureC != null ? `Temperatura: ${input.temperatureC} °C` : null,
      input.heartRateBpm != null ? `FC: ${input.heartRateBpm} bpm` : null,
      input.respiratoryRateIpm != null ? `FR: ${input.respiratoryRateIpm} irpm` : null,
      input.mucosaStatus ? `Mucosas: ${input.mucosaStatus}` : null,
      input.hydrationStatus ? `Hidratação: ${input.hydrationStatus}` : null,
      input.painStatus ? `Dor: ${input.painStatus}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      const response = await (await this.getModel()).invoke([
        new HumanMessage(
          [
            'Você é um assistente clínico veterinário de apoio à decisão.',
            '',
            'Sua tarefa é analisar os dados já registrados em uma consulta veterinária e gerar uma lista consultiva com possíveis hipóteses diferenciais ou possibilidades clínicas a considerar pelo médico-veterinário.',
            '',
            'IMPORTANTE:',
            '- Não dê diagnóstico definitivo.',
            '- Não afirme que o animal “tem” determinada doença.',
            '- Não use linguagem conclusiva.',
            '- Não substitua a avaliação do médico-veterinário.',
            '- Não invente sinais clínicos, exames, histórico ou achados físicos.',
            '- Use somente as informações fornecidas.',
            '- Se houver poucos dados, gere menos sugestões.',
            '- Se os dados forem insuficientes, informe que não há elementos suficientes para sugerir possibilidades clínicas relevantes.',
            '- O número máximo de possibilidades é 4.',
            '- Não é obrigatório gerar 4 opções. Gere apenas as opções coerentes com o contexto.',
            '- Priorize hipóteses clinicamente relevantes, seguras e úteis para orientar o raciocínio.',
            '- Evite sugestões muito genéricas quando houver informações suficientes para algo mais direcionado.',
            '- Sempre apresente como possibilidades clínicas ou diagnósticos diferenciais, nunca como diagnóstico confirmado.',
            '- Não recomende tratamento.',
            '- Não prescreva medicamentos.',
            '- Não use termos como “diagnóstico confirmado”, “diagnóstico provável”, “IA detectou” ou “o animal apresenta”.',
            '- Use termos como “possibilidade”, “compatível com”, “pode ser considerado”, “dados sugerem considerar” e “pontos que sustentam”.',
            '- A porcentagem deve representar apenas uma estimativa heurística de compatibilidade com os dados disponíveis, e não uma probabilidade diagnóstica real.',
            '- A soma das porcentagens não precisa obrigatoriamente ser 100%, pois as possibilidades podem coexistir ou exigir investigação complementar.',
            '- Se os dados forem limitados, use porcentagens mais conservadoras.',
            '- Não inclua exames complementares como recomendação direta. Se necessário, mencione apenas de forma descritiva na frase: “dependeria de correlação com exame físico e exames complementares”.',
            '',
            'FORMATO DA RESPOSTA:',
            '- Responda somente em markdown.',
            '- Não escreva título como “Apoio clínico da IA”.',
            '- Não escreva introdução longa.',
            '- Não use tabela.',
            '- Gere apenas uma lista numerada.',
            '- Cada item deve conter:',
            '  - nome da possibilidade clínica;',
            '  - porcentagem estimada;',
            '  - pequena descrição em 1 ou 2 frases.',
            '- Seja objetivo e adequado para exibição em um card de interface.',
            '',
            'FORMATO OBRIGATÓRIO:',
            '',
            '1. **[Nome da possibilidade clínica] — [porcentagem]%**  ',
            '   [Descrição curta explicando por que essa possibilidade pode ser considerada com base nos dados registrados.]',
            '',
            '2. **[Nome da possibilidade clínica] — [porcentagem]%**  ',
            '   [Descrição curta explicando por que essa possibilidade pode ser considerada com base nos dados registrados.]',
            '',
            'Se não houver dados suficientes, responda exatamente neste formato:',
            '',
            '- Não há dados clínicos suficientes para sugerir possibilidades específicas com segurança. É necessário revisar a anamnese, sinais vitais e exame físico antes de formular hipóteses diferenciais.',
            '',
            'DADOS DA CONSULTA:',
            '"""',
            `Anamnese:\n${anamnesis}`,
            vitals ? `\nSinais vitais e triagem:\n${vitals}` : '',
            '"""',
          ].join('\n'),
        ),
      ]);

      return this.normalizeClinicalTranscript(
        this.extractTextFromMessageContent((response as any)?.content),
      );
    } catch (_error) {
      return [
        'Apoio clínico da IA',
        '',
        'Sugestões consultivas geradas a partir da anamnese, triagem e sinais registrados. Não representam diagnóstico e devem ser revisadas pelo médico-veterinário antes de serem usadas no prontuário.',
        '',
        'Não há dados clínicos suficientes para sugerir possibilidades específicas com segurança. Recomenda-se revisar a anamnese, exame físico e sinais vitais antes de formular hipóteses diferenciais.',
      ].join('\n');
    }
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
          this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash',
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
    const rawValue = this.configService.get<string>('AI_TIMEOUT_MS') || '20000';
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
