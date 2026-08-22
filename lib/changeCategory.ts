import type { DigestEvent } from '@/types/competitor';

export type ChangeCategory = {
  label: string;
  tagBg: string;
  tagFg: string;
  dot: string;
  footBg: string;
};

const CATEGORIES: Record<DigestEvent['change_type'], ChangeCategory> = {
  pricing: { label: 'Pricing', tagBg: 'bg-rose-tint', tagFg: 'text-rose', dot: 'bg-rose', footBg: 'bg-rose-line' },
  feature: { label: 'Launch', tagBg: 'bg-cobalt-tint', tagFg: 'text-cobalt', dot: 'bg-cobalt', footBg: 'bg-cobalt-tint' },
  hiring: { label: 'Hiring', tagBg: 'bg-moss-tint', tagFg: 'text-moss', dot: 'bg-moss', footBg: 'bg-moss-line' },
  other: {
    label: 'Update',
    tagBg: 'bg-hairline-soft',
    tagFg: 'text-graphite-soft',
    dot: 'bg-slate-faint',
    footBg: 'bg-paper-raised',
  },
};

export const WATCHING_CATEGORY: ChangeCategory = {
  label: 'Watching',
  tagBg: 'bg-hairline-soft',
  tagFg: 'text-slate-dim',
  dot: 'bg-hairline-card',
  footBg: 'bg-paper-raised',
};

export function categoryFor(changeType: DigestEvent['change_type'] | null | undefined): ChangeCategory {
  if (!changeType) return WATCHING_CATEGORY;
  return CATEGORIES[changeType];
}
