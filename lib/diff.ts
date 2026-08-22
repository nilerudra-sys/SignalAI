import { diffLines } from 'diff';

export type DiffLineChange = {
  type: 'added' | 'removed';
  text: string;
};

export type DiffResult = {
  hasMeaningfulChange: boolean;
  lines: DiffLineChange[];
};

/**
 * Compares a competitor page's previous snapshot text to its current one and
 * returns only the lines that meaningfully changed — added or removed,
 * ignoring whitespace-only differences. Uses a plain line-based text diff
 * (jsdiff), no AI involved.
 */
export function diffSnapshots(previousText: string, currentText: string): DiffResult {
  const parts = diffLines(previousText, currentText, { ignoreWhitespace: true });

  const lines: DiffLineChange[] = [];
  for (const part of parts) {
    if (!part.added && !part.removed) continue;

    for (const line of part.value.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        lines.push({ type: part.added ? 'added' : 'removed', text: trimmed });
      }
    }
  }

  return { hasMeaningfulChange: lines.length > 0, lines };
}

/** Renders a diff as a plain-text block, one changed line per row, git-diff style. */
export function formatDiff(result: DiffResult): string {
  return result.lines
    .map((line) => `${line.type === 'added' ? '+' : '-'} ${line.text}`)
    .join('\n');
}
