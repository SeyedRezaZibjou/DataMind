import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { DatasetRow, ParsedDataset } from './types';
import { normalizeRows } from './infer';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_EXT = ['csv', 'xlsx', 'xls'];

export type ParseError = { code: string; message: string };

function getExt(name: string): string {
  const parts = name.toLowerCase().split('.');
  return parts[parts.length - 1] ?? '';
}

export function validateFile(file: File): ParseError | null {
  const ext = getExt(file.name);
  if (!ACCEPTED_EXT.includes(ext)) {
    return { code: 'INVALID_TYPE', message: 'invalidType' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { code: 'FILE_TOO_LARGE', message: 'fileTooLarge' };
  }
  return null;
}

function parseCSV(file: File): Promise<{ rows: DatasetRow[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<DatasetRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const columns = (res.meta.fields ?? []).filter((f) => f && f.length > 0);
        if (columns.length === 0) {
          reject(new Error('EMPTY'));
          return;
        }
        const rows = res.data.filter((r) => r && Object.keys(r).length > 0);
        if (rows.length === 0) {
          reject(new Error('EMPTY'));
          return;
        }
        resolve({ rows, columns });
      },
      error: (err) => reject(err),
    });
  });
}

async function parseExcel(file: File): Promise<{ rows: DatasetRow[]; columns: string[] }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('EMPTY');
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<DatasetRow>(sheet, { defval: null, raw: true });
  if (rows.length === 0) throw new Error('EMPTY');
  const columns = Object.keys(rows[0]);
  if (columns.length === 0) throw new Error('EMPTY');
  return { rows, columns };
}

export async function parseFile(file: File): Promise<ParsedDataset> {
  const ext = getExt(file.name);
  let parsed: { rows: DatasetRow[]; columns: string[] };
  try {
    parsed = ext === 'csv' ? await parseCSV(file) : await parseExcel(file);
  } catch (err) {
    if (err instanceof Error && err.message === 'EMPTY') {
      throw new Error('EMPTY');
    }
    throw new Error('PARSE_ERROR');
  }
  const rows = normalizeRows(parsed.rows, parsed.columns);
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  return {
    name: baseName,
    rows,
    columns: parsed.columns,
    source: 'upload',
    uploadedAt: Date.now(),
  };
}
