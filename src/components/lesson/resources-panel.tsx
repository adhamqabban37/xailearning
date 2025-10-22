"use client";

import type { Resource } from "@/lib/types";
import { YouTubeEmbed } from "./youtube-embed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ResourcesPanel({ resources }: { resources: Resource[] }) {
  useEffect(() => {
    console.log("📚 ResourcesPanel received resources:", resources);
  }, [resources]);

  if (!resources || resources.length === 0) {
    return null;
  }

  // Separate videos from other resources based on type OR URL content
  // Filter out resources without valid URLs
  const validResources = resources.filter((r) => {
    if (!r.url || typeof r.url !== "string" || r.url.trim() === "") {
      console.warn("⚠️ Resource missing URL:", r);
      return false;
    }
    // Filter out example.com and other placeholder domains
    const url = r.url.toLowerCase();
    if (
      url.includes("example.com") ||
      url.includes("placeholder.com") ||
      url.includes("test.com") ||
      url.includes("dummy.com")
    ) {
      console.warn("⚠️ Skipping placeholder resource:", r);
      return false;
    }
    return true;
  });

  const youtubeLinks = validResources.filter(
    (r) =>
      r.type === "video" ||
      r.url.includes("youtube.com") ||
      r.url.includes("youtu.be")
  );
  const otherLinks = validResources.filter(
    (r) =>
      r.type !== "video" &&
      !r.url.includes("youtube.com") &&
      !r.url.includes("youtu.be")
  );

  console.log(
    "📹 Found",
    youtubeLinks.length,
    "YouTube videos and",
    otherLinks.length,
    "other links"
  );

  // Batch-validate YouTube links to exclude non-embeddable and collect exclusions
  const [validated, setValidated] = useState<
    Array<{
      url: string;
      embeddable: boolean;
      id: string | null;
      embedUrl: string | null;
      watchUrl: string | null;
      reason: string;
      title?: string;
      author?: string;
      thumbnail?: string;
      description?: string;
      debugReason?: string;
      replaced?: boolean;
    }>
  >([]);
  const [excludedCount, setExcludedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (youtubeLinks.length === 0) {
        setValidated([]);
        setExcludedCount(0);
        return;
      }
      try {
        const res = await fetch("/api/youtube-repair-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: youtubeLinks.map((r) => ({ url: r.url, title: r.title })),
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        const results = (data?.results || []) as Array<any>;
        setValidated(
          results.map((r: any, i: number) => ({
            url: youtubeLinks[i].url,
            embeddable: r.embeddable,
            id: r.id ?? null,
            embedUrl: r.embedUrl ?? null,
            watchUrl: r.watchUrl ?? null,
            reason: r.reason ?? "unknown",
            title: r.title,
            author: r.author,
            thumbnail: r.thumbnail,
            description: r.description,
            debugReason: r.debugReason,
            replaced: r.replaced,
          }))
        );
        setExcludedCount(results.filter((r) => !r.embeddable).length);
      } catch {
        // On failure, let per-item validation handle embeds by clearing batch results
        setValidated([]);
        setExcludedCount(0);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [youtubeLinks.map((r) => r.url).join("|")]);

  const validationMap = useMemo(() => {
    const map = new Map<string, (typeof validated)[number]>();
    for (const v of validated) map.set(v.url, v);
    return map;
  }, [validated]);

  const getShortHost = (href: string) => {
    try {
      const u = new URL(href);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return href;
    }
  };

  const getShortVideoDesc = (
    v: (typeof validated)[number] | undefined,
    resource: Resource
  ) => {
    if (v?.description && typeof v.description === "string") {
      const d = v.description.trim().replace(/\s+/g, " ");
      return d.length > 200 ? d.slice(0, 200) + "…" : d;
    }
    const by = v?.author ? ` by ${v.author}` : "";
    const ts = (resource as any).timestamps
      ? ` Timestamps: ${(resource as any).timestamps}.`
      : "";
    return `YouTube video${by}.${ts}`.trim();
  };

  const getShortLinkDesc = (resource: Resource) => {
    const host = getShortHost(resource.url);
    if (resource.type === "article") {
      const section = (resource as any).section
        ? ` Section: ${(resource as any).section}.`
        : "";
      return `Article on ${host}.${section}`.trim();
    }
    if (resource.type === "docs") {
      const pr = (resource as any).page_range
        ? ` Pages: ${(resource as any).page_range}.`
        : "";
      return `Document on ${host}.${pr}`.trim();
    }
    return `External resource on ${host}.`;
  };

  const getBenefit = (resource: Resource) => {
    const t = (resource.title || "").toLowerCase();
    if (resource.type === "video") {
      if (
        t.includes("introduction") ||
        t.includes("basics") ||
        t.includes("beginner")
      ) {
        return "Great for quickly grasping the core ideas before diving deeper.";
      }
      if (t.includes("tutorial") || t.includes("step") || t.includes("build")) {
        return "Hands-on guidance to help you follow along and implement the topic.";
      }
      return "Provides a visual walkthrough to reinforce the lesson concepts.";
    }
    if (resource.type === "article") {
      return "Offers detailed reading material you can reference at your own pace.";
    }
    if (resource.type === "docs") {
      return "Authoritative documentation to clarify specifics and edge cases.";
    }
    return "Helpful supplemental material to deepen your understanding.";
  };

  return (
    <Card className="mt-4 bg-secondary/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Link className="w-5 h-5 mr-2" />
          Additional Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {youtubeLinks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Video Resources
            </h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="videos-summary">
                <AccordionTrigger className="text-sm">
                  Summary of video resources
                </AccordionTrigger>
                <AccordionContent>
                  This list contains {youtubeLinks.length} video
                  {youtubeLinks.length === 1 ? "" : "s"}
                  {excludedCount > 0
                    ? `; ${excludedCount} could not be embedded and will be shown as external links.`
                    : "."}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            {youtubeLinks.map((resource, index) => {
              const v = validationMap.get(resource.url);
              // If validation is unavailable (v undefined), defer to per-item component validation
              const embeddable = v ? v.embeddable : undefined;
              const watchHref = v?.watchUrl || resource.url;
              const effectiveUrl =
                v?.replaced && v.watchUrl ? v.watchUrl : resource.url;
              const humanReason =
                v?.reason && v.reason !== "ok"
                  ? v.reason.replace(/_/g, " ")
                  : null;
              return (
                <div key={`yt-${index}`} className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    {resource.title}
                    {v?.replaced && (
                      <span className="ml-2 inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        Replaced
                      </span>
                    )}
                  </h4>
                  {embeddable === undefined || embeddable === true ? (
                    <YouTubeEmbed url={effectiveUrl} title={resource.title} />
                  ) : (
                    <a
                      href={watchHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Watch on YouTube
                    </a>
                  )}
                  {!embeddable && humanReason && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Reason: {humanReason}</span>
                    </div>
                  )}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={`yt-${index}-summary`}>
                      <AccordionTrigger className="text-sm">
                        Short description
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          {getShortVideoDesc(v, resource)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          <span className="font-medium">Benefit:</span>{" "}
                          {getBenefit(resource)}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              );
            })}
          </div>
        )}
        {excludedCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {excludedCount} video{excludedCount === 1 ? " was" : "s were"} not
            embeddable and shown as external links.
          </p>
        )}

        {otherLinks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Additional Links
            </h3>
            <Accordion type="single" collapsible className="w-full mb-2">
              <AccordionItem value="links-summary">
                <AccordionTrigger className="text-sm">
                  Summary of additional links
                </AccordionTrigger>
                <AccordionContent>
                  This list contains {otherLinks.length} external resource
                  {otherLinks.length === 1 ? "" : "s"}.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <ul className="space-y-3">
              {otherLinks.map((resource, index) => (
                <li key={`link-${index}`} className="text-sm">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline transition-colors"
                  >
                    {resource.title}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getShortLinkDesc(resource)}
                  </p>
                  <Accordion type="single" collapsible className="w-full mt-1">
                    <AccordionItem value={`link-${index}-summary`}>
                      <AccordionTrigger className="text-xs">
                        Summary & benefit
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          {getShortLinkDesc(resource)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          <span className="font-medium">Benefit:</span>{" "}
                          {getBenefit(resource)}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
