import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReviewButtons } from "@/components/stories/review-buttons";
import { getItem, shortDate } from "@/lib/catalog";
import { currentUser } from "@/lib/server/auth";
import { isModerator } from "@/lib/server/moderation";
import { storiesWith } from "@/lib/server/store";
import type { Story } from "@/lib/stories";

export const metadata: Metadata = {
  title: "Story review — Red Sky",
  robots: { index: false, follow: false },
};

function Entry({ story, published = false }: { story: Story; published?: boolean }) {
  return (
    <li className="grid12 gap-y-4 border-b border-hairline py-8">
      <div className="col-span-12 lg:col-span-3">
        <p className="t-data text-[0.8125rem]">{story.id}</p>
        <p className="t-label mt-2 text-graphite">{story.status}</p>
        <p className="t-data mt-2 text-[0.75rem] text-graphite">
          {shortDate((story.published ?? story.received).slice(0, 10))}
        </p>
        {story.flags.map((f) => (
          <p key={f} className="mt-3 text-[0.8125rem] font-medium leading-snug text-sun">
            {f}
          </p>
        ))}
        {story.verifiedOrder && <p className="t-label mt-3 text-ink">Verified order</p>}
      </div>
      <div className="col-span-12 lg:col-span-6">
        <p className="t-label text-graphite">
          {story.slugs.map((s) => getItem(s)?.name ?? s).join(" + ")}
          {story.lot && ` · lot ${story.lot}`}
        </p>
        <h3 className="t-h3 mt-2">{story.title}</h3>
        <p className="mt-3 whitespace-pre-line text-[0.9375rem] leading-relaxed">{story.story}</p>
        <p className="mt-4 whitespace-pre-line border-t border-hairline pt-3 text-[0.9375rem] leading-relaxed text-graphite">
          {story.outcome}
        </p>
        <p className="mt-4 text-[0.8125rem] text-graphite">
          {story.name} · {story.role}
          {story.organisation && `, ${story.organisation}`}
          {story.location && ` · ${story.location}`} · <span className="t-data">{story.email}</span>
        </p>
      </div>
      <div className="col-span-12 lg:col-span-2 lg:col-start-11">
        <ReviewButtons id={story.id} published={published} flagged={story.flags.length > 0} />
      </div>
    </li>
  );
}

/**
 * The moderation queue. Only accounts named in RED_SKY_MODERATORS see it, and
 * the Server Action re-checks, so the page is not the only thing standing in
 * the way.
 */
export default async function ReviewPage() {
  const user = await currentUser();
  if (!user) redirect("/account?next=/stories/review");

  if (!(await isModerator())) {
    return (
      <article className="bg-paper">
        <div className="shell pb-24 pt-16">
          <p className="rail-label">Story review</p>
          <h1 className="t-display mt-7 max-w-[14ch]">This queue is for moderators.</h1>
          <p className="t-lead mt-6">
            Signed in as {user.email}, which is not on the moderators list.{" "}
            <Link href="/stories">Back to client stories</Link>.
          </p>
        </div>
      </article>
    );
  }

  const [queue, live] = await Promise.all([storiesWith("flagged", "pending"), storiesWith("published")]);

  return (
    <article className="bg-paper">
      <header className="shell pb-10 pt-12 md:pt-16">
        <p className="rail-label">Story review — {queue.length} waiting</p>
        <h1 className="t-display mt-7 max-w-[15ch]">Read it, confirm it, then publish.</h1>
        <p className="t-lead mt-6 max-w-[58ch]">
          Confirm each story with its author at the address given before publishing. Anything flagged
          reads as use in people or animals, or as a health outcome — do not publish it as written.
        </p>
      </header>
      <div className="shell pb-24">
        <h2 className="t-label border-b border-ink pb-3 text-graphite">Waiting</h2>
        {queue.length ? (
          <ul role="list">{queue.map((s) => <Entry key={s.id} story={s} />)}</ul>
        ) : (
          <p className="border-b border-hairline py-10 text-graphite">Nothing waiting.</p>
        )}
        <h2 className="t-label mt-16 border-b border-ink pb-3 text-graphite">Published</h2>
        {live.length ? (
          <ul role="list">{live.map((s) => <Entry key={s.id} story={s} published />)}</ul>
        ) : (
          <p className="border-b border-hairline py-10 text-graphite">Nothing published yet.</p>
        )}
      </div>
    </article>
  );
}
