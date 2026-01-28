import type { MetadataRoute } from "next";
import { BUNDLE, PLANS } from "@/lib/plans";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/pricing",
    "/waitlist",
    "/privacy",
    "/terms",
    "/contact",
    "/stage-1",
    "/stage-2",
    "/stage-3",
  ];
  const payRoutes = [...PLANS, BUNDLE].map((plan) => `/pay/${plan.slug}`);

  const now = new Date();
  return [...routes, ...payRoutes].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
  }));
}
