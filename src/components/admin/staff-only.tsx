import Link from "next/link";

/** What a signed-in visitor who is not staff sees at /admin. */
export function StaffOnly() {
  return (
    <section className="border-b border-hairline bg-paper">
      <div className="shell py-16 md:py-24">
        <p className="rail-label">Staff — restricted</p>
        <h1 className="t-display mt-7 max-w-[14ch]">This page is for Red Sky staff.</h1>
        <p className="t-lead mt-7 max-w-[54ch]">
          It holds orders and messages from other people, so it opens only for accounts named as
          staff.
        </p>
        <Link href="/account" className="btn btn-ghost mt-9">
          Back to your account
        </Link>
      </div>
    </section>
  );
}
