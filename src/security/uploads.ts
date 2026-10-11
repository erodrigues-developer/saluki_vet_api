import { BadRequestException } from '@nestjs/common';
export function validateRaster(buffer: Buffer, mime: string) {
  const match = mime === 'image/png' ? buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : mime === 'image/jpeg' ? buffer.subarray(0,3).equals(Buffer.from([255,216,255]))
    : mime === 'image/gif' ? /^GIF8[79]a$/.test(buffer.subarray(0,6).toString())
    : mime === 'image/webp' ? buffer.subarray(0,4).toString() === 'RIFF' && buffer.subarray(8,12).toString() === 'WEBP' : false;
  if (!match) throw new BadRequestException('Imagem inválida: apenas PNG, JPEG, GIF ou WebP com assinatura compatível');
}
export function validateFileContent(buffer: Buffer, mime: string) {
  if (mime.startsWith('image/')) return validateRaster(buffer,mime);
  if (mime === 'application/pdf' && buffer.subarray(0,5).toString() !== '%PDF-') throw new BadRequestException('PDF inválido');
  if (mime.includes('openxmlformats') && !buffer.subarray(0,4).equals(Buffer.from([80,75,3,4]))) throw new BadRequestException('Documento inválido');
}
export function rasterExtension(mime: string) { return ({'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp'} as Record<string,string>)[mime]; }
