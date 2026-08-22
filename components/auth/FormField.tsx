import { useId, type InputHTMLAttributes } from 'react';

export function FormField({
  label,
  ...inputProps
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-graphite">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-md border border-hairline-input bg-paper-surface px-3 py-2.5 text-sm text-graphite placeholder:text-slate-faint outline-none transition-colors focus:border-cobalt"
        {...inputProps}
      />
    </div>
  );
}
