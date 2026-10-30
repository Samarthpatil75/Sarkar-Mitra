import React, { useMemo } from 'react';

/**
 * Converts a raw numeral string (Devanagari digits, English digits, Roman numerals, or letters)
 * into a standard 1-based positive integer value.
 * Returns null if not a valid numeral.
 */
function parseNumeralValue(raw) {
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

  // 2. Roman numerals (i, ii, iii, iv, v, vi, vii, viii, ix, x...)
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
 * Scans text for candidate list item markers.
 * Supports:
 * - Parenthesized: (1), (१), (i), (a)
 * - Dot / Full Stop: 1., १., i., a.
 * - Right Parenthesis: 1), १), i), a)
 * - Devanagari Danda: 1।, १।
 * - Hyphen / Colon followed by whitespace: 1 -, १ -, 1:, १:
 */
function findCandidateMarkers(text) {
  if (!text || typeof text !== 'string') return [];

  const regex = /(?:^|[\r\n\s:।\.\?!;])(?<![₹\$\€\£\/\d०-९a-zA-Z\-,])(?:\(([०-९]+|\d+|[ivxIVX]+|[a-zA-Z])\)|([०-९]+|\d+|[ivxIVX]+|[a-zA-Z])[\.\)\।](?!\d|[०-९])|([०-९]+|\d+|[ivxIVX]+|[a-zA-Z])\s*[-:]\s+)/g;

  const candidates = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const rawNum = match[1] || match[2] || match[3];
    const val = parseNumeralValue(rawNum);
    if (val === null || val <= 0) continue;

    const fullMatch = match[0];
    const matchIndex = match.index;

    // Find where the actual marker starts in fullMatch
    const markerSub = fullMatch.search(/[\(\d०-९a-zA-Z]/);
    const markerStart = matchIndex + (markerSub >= 0 ? markerSub : 0);
    const markerStr = text.slice(markerStart, matchIndex + fullMatch.length).trim();

    // Guard against currency, decimals, or land records like ७/१२
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
 * Validates and groups candidate markers into sequential ordered lists.
 * Discards isolated numbers (e.g. phone numbers, sentence-ending numbers).
 */
function groupLists(candidates, text) {
  const lists = [];
  let currentList = [];

  const flush = () => {
    if (currentList.length >= 2) {
      lists.push(currentList);
    } else if (currentList.length === 1) {
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
      if (c.val === 1) {
        currentList.push(c);
      }
    } else {
      const prev = currentList[currentList.length - 1];
      if (c.val === prev.val + 1) {
        currentList.push(c);
      } else if (c.val === 1) {
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
        const nextListStart = listIdx < lists.length - 1 ? lists[listIdx + 1][0].start : text.length;
        itemEnd = nextListStart;
      }

      let rawItemText = text.slice(itemMarker.end, itemEnd);

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

/**
 * FormattedAnswer Component
 * 
 * Accurately parses and renders numbered lists in Marathi (१, २, ३...),
 * English (1, 2, 3...), and Roman/lettered formats into semantic, vertically spaced items.
 * Keeps headings and introductory paragraphs cleanly separated from lists.
 */
export default function FormattedAnswer({ text, isAssistant = true, className = '' }) {
  const blocks = useMemo(() => parseAnswerText(text), [text]);

  // Handle null, undefined, and empty text safely
  if (!text || !blocks || blocks.length === 0) {
    return null;
  }

  // If there are no numbered lists, render as standard paragraph
  if (blocks.length === 1 && blocks[0].type === 'paragraph') {
    return (
      <p className={`font-medium whitespace-pre-line text-base sm:text-lg leading-relaxed ${className}`}>
        {blocks[0].text}
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.type === 'paragraph') {
          return (
            <p
              key={bIdx}
              className={`leading-relaxed text-base sm:text-lg whitespace-pre-line ${
                block.isIntro
                  ? 'font-bold text-slate-900 dark:text-white mb-2'
                  : 'font-medium text-slate-800 dark:text-slate-200 mt-2'
              } ${!isAssistant ? '!text-white' : ''}`}
            >
              {block.text}
            </p>
          );
        }

        if (block.type === 'list') {
          return (
            <ol
              key={bIdx}
              className="space-y-2.5 my-2.5 list-none p-0 m-0"
              aria-label="क्रमांकित यादी"
            >
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-2.5 sm:gap-3 text-base sm:text-lg leading-relaxed"
                >
                  <span
                    className={`font-black shrink-0 select-none min-w-[1.6rem] text-right ${
                      isAssistant
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-amber-300'
                    }`}
                  >
                    {item.prefix}
                  </span>
                  <span
                    className={`flex-1 font-medium ${
                      isAssistant
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-white'
                    }`}
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        return null;
      })}
    </div>
  );
}
