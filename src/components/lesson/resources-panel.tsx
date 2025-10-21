"use client";

import type { Resource } from "@/lib/types";
import { YouTubeEmbed } from "./youtube-embed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
    Array<{ url: string; embeddable: boolean; id: string | null; embedUrl: string | null }>
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
        const res = await fetch("/api/youtube-validate-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: youtubeLinks.map((r) => r.url) }),
        });
        const data = await res.json();
        if (cancelled) return;
        const results = (data?.results || []) as Array<{
          embeddable: boolean;
          id: string | null;
          embedUrl: string | null;
          watchUrl: string | null;
          reason: string;
        }>;
        setValidated(
          results.map((r, i) => ({ url: youtubeLinks[i].url, embeddable: r.embeddable, id: r.id, embedUrl: r.embedUrl }))
        );
        setExcludedCount(results.filter((r) => !r.embeddable).length);
      } catch {
        // On failure, fall back to client-side embeds (handled individually)
        setValidated(youtubeLinks.map((r) => ({ url: r.url, embeddable: true, id: null, embedUrl: null })));
        setExcludedCount(0);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [youtubeLinks.map((r) => r.url).join("|")]);

  const filteredYouTube = useMemo(() => {
    if (validated.length === 0) return youtubeLinks;
    const allowed = new Set(validated.filter((v) => v.embeddable).map((v) => v.url));
    return youtubeLinks.filter((r) => allowed.has(r.url));
  }, [validated, youtubeLinks]);

  return (
    <Card className="mt-4 bg-secondary/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Link className="w-5 h-5 mr-2" />
          Additional Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredYouTube.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Video Resources
            </h3>
            {filteredYouTube.map((resource, index) => (
              <div key={`yt-${index}`} className="space-y-2">
                <h4 className="font-semibold text-sm">{resource.title}</h4>
                <YouTubeEmbed url={resource.url} />
              </div>
            ))}
          </div>
        )}
        {excludedCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {excludedCount} video{excludedCount === 1 ? " was" : "s were"} filtered out (not embeddable).
          </p>
        )}

        {otherLinks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Additional Links
            </h3>
            <ul className="space-y-2">
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
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
