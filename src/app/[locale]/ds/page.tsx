import type { Metadata } from "next";
import { PreviewShell } from "@/design-system/preview/PreviewShell";

export const metadata: Metadata = {
  title: "Design system · Pigmento Studio",
  description: "Preview de tokens, fundamentos y componentes",
};

export default function DesignSystemPage() {
  return <PreviewShell />;
}
