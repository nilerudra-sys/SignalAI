import Link from 'next/link';

export default function SettingsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-16 text-center font-sans text-graphite">
      <p className="text-sm font-medium text-cobalt">Settings</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Email preferences are coming soon</h1>
      <p className="mt-3 max-w-md text-balance text-slate">
        You&rsquo;ll be able to manage which competitors you&rsquo;re tracking and how often you
        hear from us here. For now, reply to any digest email if you&rsquo;d like to unsubscribe.
      </p>
      <Link href="/" className="mt-6 text-sm font-medium text-cobalt hover:text-cobalt-hover">
        &larr; Back to Signal
      </Link>
    </main>
  );
}
