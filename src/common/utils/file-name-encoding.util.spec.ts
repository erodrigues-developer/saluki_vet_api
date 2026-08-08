import { normalizeFileNameEncoding } from './file-name-encoding.util';

describe('normalizeFileNameEncoding', () => {
  it('decodes UTF-8 names received as latin1 mojibake', () => {
    expect(normalizeFileNameEncoding('Cupom nÃ£o fiscal.pdf')).toBe(
      'Cupom não fiscal.pdf',
    );
    expect(normalizeFileNameEncoding('RelatÃ³rio clÃ­nico â€“ tutor.pdf')).toBe(
      'Relatório clínico – tutor.pdf',
    );
  });

  it('keeps names that are already decoded', () => {
    expect(normalizeFileNameEncoding('Relatório clínico.pdf')).toBe(
      'Relatório clínico.pdf',
    );
  });

  it('uses a fallback for empty names', () => {
    expect(normalizeFileNameEncoding('')).toBe('arquivo');
  });
});
