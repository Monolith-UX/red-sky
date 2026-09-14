"use client";

import { useState, useTransition } from "react";
import { moderateStory } from "@/app/stories/actions";

export function ReviewButtons({ id, published, flagged }: { id: string; published: boolean; flagged: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const run = (decision: "publish" | "reject" | "unpublish") =>
    startTransition(async () => {
      const res = await moderateStory(id, decision);
      setError(res.error ?? "");
    });

  return (
    <div className="flex flex-col gap-2">
      {published ? (
        <button type="button" disabled={pending} onClick={() => run("unpublish")} className="btn btn-ghost min-h-[2.5rem] px-3 text-[0.8125rem]">
          Unpublish
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={pending || flagged}
            onClick={() => run("publish")}
            title={flagged ? "Flagged stories need revising before they can be published" : undefined}
            className="btn btn-primary min-h-[2.5rem] px-3 text-[0.8125rem] disabled:opacity-50"
          >
            Publish
          </button>
          <button type="button" disabled={pending} onClick={() => run("reject")} className="btn btn-ghost min-h-[2.5rem] px-3 text-[0.8125rem]">
            Reject
          </button>
        </>
      )}
      {error && <p role="alert" className="text-[0.8125rem] text-sun">{error}</p>}
    </div>
  );
}
