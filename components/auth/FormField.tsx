import { useId, type InputHTMLAttributes } from 'react';

export function FormField({
  label,
  ...inputProps
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-md border border-ink-border bg-ink-raised2 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-dim outline-none transition-colors focus:border-signal/60 focus:ring-1 focus:ring-signal/40"
        {...inputProps}
      />
    </div>
  );
}
