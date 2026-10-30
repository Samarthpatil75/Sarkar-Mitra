/**
 * Sarkar Mitra - Q&A Answer Formatter & Numbered List Parser
 * 
 * 100% offline, deterministic parser that extracts numbered list items from
 * Marathi (Devanagari numerals: १, २, ३...), English (1, 2, 3...), Roman numerals
 * (i, ii, iii... / I, II, III...), and lettered lists (a, b, c... / A, B, C...).
 * 
 * Accurately handles:
 * - Single-line answers lacking newlines (common in JSON datasets)
 * - Multiline answers with headings, intros, and trailing notes
 * - Currency guards (e.g. ₹२.५०, ₹1,500, Rs. 2.50)
 * - Sentence-ending numbers (e.g. वय २१ ते ६५.)
 * - Land records & fractions (e.g. ७/१२ उतारा, ८-अ)
 * - Helpline phone numbers (e.g. १८०० २२ ४९५०., १०४)
 */

/**
 * Converts a raw numeral string (Devanagari digits, English digits, Roman numerals, or letters)
 * into a standard 1-based positive integer value.
 * Returns null if not a valid numeral.
 */
export function parseNumeralValue(raw) {
  if (!raw || typeof raw !== 'string') return null;

  // 1. Devanagari numerals (०, १, २, ३, ४, ५, ६, ७, ८, ९) and English digits (0-9)
  let normalized = '';
  const devanagariZero = 0x0966;
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    if (code >= 0x0966 && code <= 0x096F) {
      normalized += (code - devanagariZero).toString();
    } else if (ch >= '0' && ch <= '9') {
      normalized += ch;
    }
  }

  if (normalized.length > 0) {
    const n = parseInt(normalized, 10);
    return isNaN(n) ? null : n;
  }

  // 2. Roman numerals (i, ii, iii, iv, v, vi, vii, viii, ix, x, xi, xii)
  const lower = raw.toLowerCase();
  const romanMap = {
    i: 1, ii: 2, iii: 3, iv: 4, v: 5,
    vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
    xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15
  };
  if (romanMap[lower] !== undefined) {
    return romanMap[lower];
  }

  // 3. Single alphabetic letters (a-z / A-Z) -> 1-26
  if (/^[a-zA-Z]$/.test(raw)) {
    return raw.toLowerCase().charCodeAt(0) - 96;
  }

  return null;
}

/**
 * Scans text for potential list markers.
 * Delimiters supported:
 * - Parenthesized: (1), (१), (i), (a)
 * - Dot / Full Stop: 1., १., i., a.
 * - Right Parenthesis: 1), १), i), a)
 * - Devanagari Danda: 1।, १।
 * - Hyphen / Colon followed by whitespace: 1 -, १ -, 1:, १:
 */
export function findCandidateMarkers(text) {
  if (!text || typeof text !== 'string') return [];

  // Regex breakdown:
  // (?:^|[\r\n\s:।\.\?!;]) -> Preceded by start of string, newline, whitespace, colon, or sentence terminator.
  // (?<![₹\$\€\£\/\d०-९a-zA-Z\-,]) -> Negative lookbehind: NOT preceded by currency symbols, slash, digits, or hyphen.
  // Pattern 1: \(([०-९]+|\d+|[ivxIVX]+|[a-zA-Z])\) -> Parenthesized e.g. (१), (1), (a)
  // Pattern 2: ([०-९]+|\d+|[ivxIVX]+|[a-zA-Z])[\.\)\।](?!\d|[०-९]) -> e.g. १., 1., 1), १। (not followed by a digit e.g. 2.50)
  // Pattern 3: ([०-९]+|\d+|[ivxIVX]+|[a-zA-Z])\s*[-:]\s+ -> e.g. 1 - , १: (hyphen/colon MUST be followed by whitespace)
  const regex = /(?:^|[\r\n\s:।\.\?!;])(?<![₹\$\€\£\/\d०-९a-zA-Z\-,])(?:\(([०-९]+|\d+|[ivxIVX]+|[a-zA-Z])\)|([०-९]+|\d+|[ivxIVX]+|[a-zA-Z])[\.\)\।](?!\d|[०-९])|([०-९]+|\d+|[ivxIVX]+|[a-zA-Z])\s*[-:]\s+)/g;

  const candidates = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const rawNum = match[1] || match[2] || match[3];
    const val = parseNumeralValue(rawNum);
    if (val === null || val <= 0) continue;

    const fullMatch = match[0];
    const matchIndex = match.index;

    // Find where the actual marker starts in fullMatch (skipping any preceding separator)
    const markerSub = fullMatch.search(/[\(\d०-९a-zA-Z]/);
    const markerStart = matchIndex + (markerSub >= 0 ? markerSub : 0);
    const markerStr = text.slice(markerStart, matchIndex + fullMatch.length).trim();

    // Extra guard against currency, decimals, or land records like ७/१२
    if (markerStart > 0) {
      const prevCh = text[markerStart - 1];
      if (/[₹\$\€\£\/\d०-९a-zA-Z\-,]/.test(prevCh)) continue;
    }

    candidates.push({
      start: markerStart,
      end: matchIndex + fullMatch.length,
      rawNum,
      val,
      marker: markerStr
    });
  }

  return candidates;
}

/**
 * Validates and groups candidate markers into legitimate ordered sequences.
 * Prevents isolated numbers (e.g. phone numbers, sentence-ending numbers) from being misclassified as lists.
 */
export function groupLists(candidates, text) {
  const lists = [];
  let currentList = [];

  const flush = () => {
    if (currentList.length >= 2) {
      lists.push(currentList);
    } else if (currentList.length === 1) {
      // Single-item list accepted only if it is explicitly at start of string or right after a colon/newline
      const item = currentList[0];
      const before = text.slice(0, item.start).trim();
      if (before === '' || /[:।\n\r]$/.test(before)) {
        lists.push(currentList);
      }
    }
    currentList = [];
  };

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (currentList.length === 0) {
      // Every valid list sequence must begin at index 1
      if (c.val === 1) {
        currentList.push(c);
      }
    } else {
      const prev = currentList[currentList.length - 1];
      if (c.val === prev.val + 1) {
        // Consecutively incrementing item
        currentList.push(c);
      } else if (c.val === 1) {
        // New list starting
        flush();
        currentList = [c];
      }
    }
  }

  flush();
  return lists;
}

/**
 * Parses raw answer text into structured UI blocks:
 * - { type: 'paragraph', text: string, isIntro: boolean }
 * - { type: 'list', items: [{ prefix: string, text: string }] }
 */
export function parseAnswerText(text) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  const candidates = findCandidateMarkers(text);
  const lists = groupLists(candidates, text);

  // If no ordered list was identified, return single paragraph
  if (lists.length === 0) {
    return [{ type: 'paragraph', text: trimmed, isIntro: false }];
  }

  const blocks = [];
  let cursor = 0;

  for (let listIdx = 0; listIdx < lists.length; listIdx++) {
    const list = lists[listIdx];

    // Introductory text / heading before this list
    const preText = text.slice(cursor, list[0].start).trim();
    if (preText) {
      blocks.push({
        type: 'paragraph',
        text: preText,
        isIntro: true
      });
    }

    const items = [];
    let trailingText = null;

    for (let i = 0; i < list.length; i++) {
      const itemMarker = list[i];
      let itemEnd;

      if (i < list.length - 1) {
        itemEnd = list[i + 1].start;
      } else {
        // Last item ends at the start of the next list or the end of the text
        const nextListStart = listIdx < lists.length - 1 ? lists[listIdx + 1][0].start : text.length;
        itemEnd = nextListStart;
      }

      let rawItemText = text.slice(itemMarker.end, itemEnd);

      // Check if the last item contains a distinct trailing paragraph (separated by double newline or note prefix)
      if (i === list.length - 1) {
        const doubleNl = rawItemText.indexOf('\n\n');
        if (doubleNl >= 0) {
          trailingText = rawItemText.slice(doubleNl + 2).trim();
          rawItemText = rawItemText.slice(0, doubleNl);
        }
      }

      items.push({
        prefix: itemMarker.marker,
        text: rawItemText.trim()
      });
    }

    blocks.push({
      type: 'list',
      items
    });

    if (trailingText) {
      blocks.push({
        type: 'paragraph',
        text: trailingText,
        isIntro: false
      });
    }

    cursor = listIdx < lists.length - 1 ? lists[listIdx + 1][0].start : text.length;
  }

  return blocks;
}
