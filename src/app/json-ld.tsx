import { serializeJsonLd } from "./seo";

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />; // conformance-exempt: serializeJsonLd escapa < y tiene test
}
