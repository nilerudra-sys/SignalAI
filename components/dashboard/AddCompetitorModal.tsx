'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Competitor } from '@/types/competitor';

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

type FieldErrors = Partial<Record<'name' | 'websiteUrl' | 'pricingPageUrl' | 'changelogUrl', string>>;

export function AddCompetitorModal({
  userId,
  onClose,
  onCreated,
}: {
  userId: string;
  onClose: () => void;
  onCreated: (competitor: Competitor) => void;
}) {
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [pricingPageUrl, setPricingPageUrl] = useState('');
  const [changelogUrl, setChangelogUrl] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!name.trim()) {
      errors.name = 'Enter a competitor name.';
    }
    if (!websiteUrl.trim()) {
      errors.websiteUrl = 'Enter a website URL.';
    } else if (!isValidUrl(websiteUrl.trim())) {
      errors.websiteUrl = 'Enter a valid URL, including https://';
    }
    if (!pricingPageUrl.trim()) {
      errors.pricingPageUrl = 'Enter a pricing page URL.';
    } else if (!isValidUrl(pricingPageUrl.trim())) {
      errors.pricingPageUrl = 'Enter a valid URL, including https://';
    }
    if (changelogUrl.trim() && !isValidUrl(changelogUrl.trim())) {
      errors.changelogUrl = 'Enter a valid URL, including https://';
    }

    return errors;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('competitors')
      .insert({
        user_id: userId,
        name: name.trim(),
        website_url: websiteUrl.trim(),
        pricing_page_url: pricingPageUrl.trim(),
        changelog_url: changelogUrl.trim() || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        setFormError("You're already tracking a competitor with this website URL.");
      } else {
        setFormError(error.message);
      }
      setLoading(false);
      return;
    }

    onCreated(data as Competitor);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-graphite/40 px-4 py-8 backdrop-blur-[2px] sm:py-16"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-competitor-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[470px] rounded-2xl border border-hairline-card bg-paper-surface shadow-[0_24px_60px_-20px_rgba(20,24,28,0.35)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline-soft px-5 py-4">
          <div>
            <h2 id="add-competitor-title" className="text-[17px] font-semibold tracking-tight text-graphite">
              Add a competitor
            </h2>
            <p className="mt-1 text-[13.5px] text-slate">
              We&rsquo;ll start watching these pages within the hour.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-hairline bg-paper-raised text-slate transition-colors hover:text-graphite"
          >
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M4 4L14 14M14 4L4 14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 px-5 py-[18px]" noValidate>
          <Field
            label="Competitor name"
            value={name}
            onChange={setName}
            placeholder="Acme Analytics"
            error={fieldErrors.name}
          />
          <Field
            label="Website URL"
            value={websiteUrl}
            onChange={setWebsiteUrl}
            placeholder="https://acme.com"
            error={fieldErrors.websiteUrl}
          />
          <Field
            label="Pricing page URL"
            value={pricingPageUrl}
            onChange={setPricingPageUrl}
            placeholder="https://acme.com/pricing"
            error={fieldErrors.pricingPageUrl}
          />
          <Field
            label="Changelog / blog URL"
            optional
            value={changelogUrl}
            onChange={setChangelogUrl}
            placeholder="https://acme.com/changelog"
            error={fieldErrors.changelogUrl}
          />

          {formError && <p className="text-sm text-rose">{formError}</p>}

          <div className="flex justify-end gap-2.5 border-t border-hairline-soft pt-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-hairline-input bg-paper-surface px-4 py-2 text-sm font-medium text-graphite-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-cobalt px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Adding…' : 'Add competitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-baseline gap-1.5 text-[13px] font-medium text-graphite">
        {label}
        {optional && <span className="font-normal text-slate-faint">(optional)</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border bg-paper-surface px-3 py-2.5 text-sm text-graphite outline-none placeholder:text-slate-faint focus:border-cobalt ${
          error ? 'border-rose-border' : 'border-hairline-input'
        }`}
      />
      {error && <p className="text-xs text-rose">{error}</p>}
    </div>
  );
}
