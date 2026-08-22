import { SignupForm } from './SignupForm';

export function ClosingSignup() {
  return (
    <section id="waitlist" className="scroll-mt-16 border-b border-hairline">
      <div className="mx-auto grid max-w-[1000px] grid-cols-1 items-center gap-7 px-6 py-14 sm:px-8 sm:py-16 md:grid-cols-2">
        <div>
          <h2 className="text-balance text-[24px] font-semibold tracking-tight text-graphite sm:text-[32px]">
            Stop checking competitor sites by hand
          </h2>
          <p className="mt-2 max-w-[44ch] text-[15px] text-slate">
            Join the waitlist and get your first digest the week Signal opens up.
          </p>
        </div>
        <SignupForm source="closing" variant="accent" />
      </div>
    </section>
  );
}
