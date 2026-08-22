import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { WordDocModel } from '../types';
import { PdfDocumentTemplate } from './generator';

/**
 * Generates an immutable, high-resolution vector PDF buffer from a WordDocModel AST.
 * Runs in pure Node or browser JavaScript with zero headless Chrome dependencies.
 */
export async function generatePdfBuffer(model: WordDocModel): Promise<Buffer> {
  const documentElement = React.createElement(PdfDocumentTemplate, { model });
  const instance = pdf(documentElement);
  const blob = await instance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
