/**
 * YOJANA SETU — RFC-4180 COMPLIANT CSV PARSER
 *
 * Robust, streaming-ready parser for candidate scheme datasets.
 * Handles embedded quotes (""), commas within fields, and multi-line descriptions.
 */

import { RawSchemeCandidate } from '../../types/rawScheme';

export function parseCSVToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF after CR
      }
      currentRow.push(currentField);
      if (currentRow.length > 1 || currentRow[0]?.trim() !== '') {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Flush remaining field/row
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1 || currentRow[0]?.trim() !== '') {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses raw CSV string into strongly-typed RawSchemeCandidate records.
 */
export function parseSchemeCandidateCSV(csvText: string): RawSchemeCandidate[] {
  const rows = parseCSVToRows(csvText);
  if (rows.length < 2) {
    return [];
  }

  const rawHeaders = rows[0].map((h) => h.trim().toLowerCase());
  const headerMap: { [key: string]: number } = {};
  rawHeaders.forEach((header, index) => {
    headerMap[header] = index;
  });

  const candidates: RawSchemeCandidate[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0 || (row.length === 1 && !row[0]?.trim())) {
      continue;
    }

    const getField = (name: string): string => {
      const idx = headerMap[name];
      return idx !== undefined && row[idx] !== undefined ? row[idx].trim() : '';
    };

    candidates.push({
      id: getField('id'),
      state_or_ut: getField('state_or_ut'),
      scope: getField('scope'),
      scheme_name: getField('scheme_name'),
      tag: getField('tag'),
      ministry: getField('ministry'),
      benefit: getField('benefit'),
      annual: getField('annual'),
      application_url: getField('application_url'),
      application_type: getField('application_type'),
      relevance_tier: getField('relevance_tier'),
      source_file: getField('source_file'),
    });
  }

  return candidates;
}
