import { Injectable } from '@nestjs/common';
import { AiConversation } from './entities/ai-conversation.entity';

export type AiGuardrailDecision = 'ALLOW' | 'BLOCK' | 'CLARIFY';
export type AiGuardrailScope = 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'ABUSE' | 'AMBIGUOUS';

export interface AiGuardrailResult {
  decision: AiGuardrailDecision;
  scope: AiGuardrailScope;
  reason: string;
  response?: string;
  matchedRule?: string;
}

@Injectable()
export class AiConversationGuardrailsService {
  private readonly refusalResponse = [
    'Este assistente está disponível apenas para apoiar tarefas relacionadas ao Saluki Vet, à operação da clínica e aos dados da tela atual.',
    'Posso ajudar com dashboard, consultas, anamnese, prontuário, estoque, vacinas, agenda, financeiro da clínica e uso do próprio sistema.',
  ].join(' ');

  private readonly clarifyResponse = [
    'Posso ajudar se a pergunta estiver relacionada ao contexto atual do Saluki Vet.',
    'Reformule conectando sua dúvida à clínica, à consulta, ao dashboard ou aos dados desta tela.',
  ].join(' ');

  evaluateInput(input: {
    conversation: AiConversation;
    userText: string;
    contextSnapshot?: Record<string, any>;
  }): AiGuardrailResult {
    const normalized = this.normalize(input.userText);
    const contextType = this.normalize(input.conversation.contextType || '');

    const abuseRule = this.matchAbuseRule(normalized);
    if (abuseRule) {
      return {
        decision: 'BLOCK',
        scope: 'ABUSE',
        reason: 'prompt_injection_or_policy_bypass',
        matchedRule: abuseRule,
        response: this.refusalResponse,
      };
    }

    const outOfScopeRule = this.matchOutOfScopeRule(normalized);
    if (outOfScopeRule && !this.hasDomainSignal(normalized)) {
      return {
        decision: 'BLOCK',
        scope: 'OUT_OF_SCOPE',
        reason: 'generic_ai_usage_not_related_to_system',
        matchedRule: outOfScopeRule,
        response: this.refusalResponse,
      };
    }

    if (this.hasDomainSignal(normalized) || this.contextIsDomain(contextType)) {
      return {
        decision: 'ALLOW',
        scope: 'IN_SCOPE',
        reason: 'system_or_clinic_related_request',
      };
    }

    if (normalized.length <= 80) {
      return {
        decision: 'CLARIFY',
        scope: 'AMBIGUOUS',
        reason: 'short_message_without_domain_signal',
        response: this.clarifyResponse,
      };
    }

    return {
      decision: 'BLOCK',
      scope: 'OUT_OF_SCOPE',
      reason: 'no_system_domain_signal',
      response: this.refusalResponse,
    };
  }

  validateOutput(input: {
    conversation: AiConversation;
    assistantText: string;
  }): AiGuardrailResult {
    const normalized = this.normalize(input.assistantText);

    if (this.matchPromptLeakRule(normalized)) {
      return {
        decision: 'BLOCK',
        scope: 'ABUSE',
        reason: 'assistant_attempted_to_reveal_internal_instructions',
        response: this.refusalResponse,
      };
    }

    if (this.matchStrongOutOfDomainOutput(normalized)) {
      return {
        decision: 'BLOCK',
        scope: 'OUT_OF_SCOPE',
        reason: 'assistant_response_left_system_scope',
        response: this.refusalResponse,
      };
    }

    return {
      decision: 'ALLOW',
      scope: 'IN_SCOPE',
      reason: 'assistant_response_allowed',
    };
  }

  private contextIsDomain(contextType: string) {
    return [
      'dashboard',
      'consultation',
      'anamnesis',
      'clinical',
      'stock',
      'finance',
      'vaccine',
      'appointment',
    ].some((term) => contextType.includes(term));
  }

  private hasDomainSignal(text: string) {
    return [
      'saluki',
      'clinica',
      'clinica veterinaria',
      'veterinario',
      'veterinaria',
      'veterinária',
      'pet',
      'paciente',
      'tutor',
      'consulta',
      'atendimento',
      'anamnes',
      'anamnese',
      'prontuario',
      'prontuário',
      'diagnostico',
      'diagnóstico',
      'conduta',
      'exame',
      'vacina',
      'estoque',
      'produto',
      'financeiro',
      'contas',
      'receber',
      'pagar',
      'dashboard',
      'agenda',
      'indicador',
      'venda',
      'recepcao',
      'recepção',
      'internacao',
      'internação',
      'prescricao',
      'prescrição',
      'sinais vitais',
      'triagem',
      'sistema',
    ].some((term) => text.includes(term));
  }

  private matchAbuseRule(text: string) {
    const rules: Array<[string, RegExp]> = [
      ['ignore_instructions', /\b(ignore|ignorar|desconsidere|desconsidera)\b.*\b(instru[cç][oõ]es|regras|prompt|sistema)\b/],
      ['role_override', /\b(aja como|finja ser|assuma o papel|modo desenvolvedor|developer mode|dan)\b/],
      ['prompt_extraction', /\b(mostre|revele|exiba|imprima|diga)\b.*\b(prompt|instru[cç][oõ]es internas|system message|mensagem do sistema)\b/],
      ['jailbreak', /\b(jailbreak|sem restri[cç][oõ]es|sem censura|burlar|bypass)\b/],
    ];
    return this.matchRule(text, rules);
  }

  private matchOutOfScopeRule(text: string) {
    const rules: Array<[string, RegExp]> = [
      ['programming', /\b(c[oó]digo|programa[cç][aã]o|javascript|typescript|python|java|react|vue|sql|html|css|debug|bug|api)\b/],
      ['generic_writing', /\b(reda[cç][aã]o|tcc|artigo acad[eê]mico|poema|m[uú]sica|roteiro|conto|curr[ií]culo|cover letter)\b/],
      ['generic_translation', /\b(traduza|traduzir|translate)\b/],
      ['general_knowledge', /\b(segunda guerra|hist[oó]ria do brasil|capital de|quem foi|explique f[ií]sica|matem[aá]tica)\b/],
      ['personal_life', /\b(terapia|relacionamento|namoro|dieta|treino|viagem|hotel|receita de comida)\b/],
      ['external_business', /\b(plano de marketing|copy para venda|landing page|pitch deck|contrato)\b/],
      ['competitor_replacement', /\b(chatgpt|gemini|grok|claude)\b.*\b(substituir|usar como|fa[cç]a qualquer coisa|perguntar qualquer coisa)\b/],
    ];
    return this.matchRule(text, rules);
  }

  private matchPromptLeakRule(text: string) {
    return /\b(system message|prompt interno|instru[cç][oõ]es internas|dados atuais da tela|tipo de contexto)\b/.test(
      text,
    );
  }

  private matchStrongOutOfDomainOutput(text: string) {
    return [
      /\b(aqui est[aá] o c[oó]digo|segue o c[oó]digo|```(js|ts|python|java|html|css|sql))\b/,
      /\b(aqui est[aá] seu poema|aqui est[aá] sua m[uú]sica|roteiro solicitado)\b/,
    ].some((rule) => rule.test(text));
  }

  private matchRule(text: string, rules: Array<[string, RegExp]>) {
    return rules.find(([, rule]) => rule.test(text))?.[0] || null;
  }

  private normalize(value: string) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
