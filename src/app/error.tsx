"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * A page that threw. The digest matches the server log, so quoting it to the
 * technical team lets them find the failure without a screenshot.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <article className="bg-paper">
      <div className="shell pb-24 pt-12 md:pb-32 md:pt-16">
        <div className="grid12 gap-y-8">
          <div className="col-span-12 lg:col-span-7">
            <p className="rail-label">Error — the run did not complete</p>
            <h1 className="t-display mt-7 max-w-[14ch] md:mt-9">Something failed on our side.</h1>
            <p className="t-lead mt-7 max-w-[48ch]">
              Nothing you did caused it, and nothing in your cart or account was lost. Try the page
              again; if it fails twice, tell us and quote the reference below.
            </p>
            {error.digest && (
              <p className="t-data mt-6 text-[0.8125rem] text-graphite">
                Reference <span className="text-ink">{error.digest}</span>
              </p>
            )}
            <div className="mt-9 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
              <button type="button" onClick={() => retry()} className="btn btn-primary">
                Try the page again
              </button>
              <Link href="/contact" className="btn btn-ghost">
                Tell the team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
