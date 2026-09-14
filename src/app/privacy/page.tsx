import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";
import { policies } from "@/lib/legal";

const policy = policies["privacy"];

export const metadata: Metadata = {
  title: `${policy.title} — Red Sky`,
  description: policy.standfirst,
};

export default function Page() {
  return <PolicyPage slug="privacy" />;
}
