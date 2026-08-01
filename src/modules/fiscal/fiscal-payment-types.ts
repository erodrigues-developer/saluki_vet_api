export interface FiscalPaymentType {
  code: string;
  label: string;
}

export const FISCAL_PAYMENT_TYPES: FiscalPaymentType[] = [
  { code: '01', label: 'Dinheiro' },
  { code: '02', label: 'Cheque' },
  { code: '03', label: 'Cartão de crédito' },
  { code: '04', label: 'Cartão de débito' },
  { code: '05', label: 'Cartão da loja / crediário' },
  { code: '10', label: 'Vale alimentação' },
  { code: '11', label: 'Vale refeição' },
  { code: '12', label: 'Vale presente' },
  { code: '13', label: 'Vale combustível' },
  { code: '15', label: 'Boleto bancário' },
  { code: '16', label: 'Depósito bancário' },
  { code: '17', label: 'PIX dinâmico' },
  { code: '18', label: 'Transferência bancária / TED' },
  { code: '19', label: 'Programa de fidelidade / cashback / crédito virtual' },
  { code: '20', label: 'PIX estático' },
  { code: '21', label: 'Crédito em loja' },
  { code: '22', label: 'Pagamento eletrônico não informado' },
  { code: '23', label: 'PIX automático' },
  { code: '24', label: 'TEF / Book Transfer' },
  { code: '90', label: 'Sem pagamento' },
  { code: '91', label: 'Pagamento posterior' },
  { code: '99', label: 'Outros' },
];

export const FISCAL_PAYMENT_TYPE_CODES = new Set(
  FISCAL_PAYMENT_TYPES.map((type) => type.code),
);

export const normalizeFiscalPaymentTypeCode = (value?: string | null) => {
  const normalized = String(value || '').replace(/\D/g, '').padStart(2, '0');
  return normalized === '00' ? '' : normalized;
};
