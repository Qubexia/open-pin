import { notFound } from "next/navigation";
import { COMPOUNDS } from "@/data/compounds";
import { CompoundDetailClient } from "@/components/compound-detail-client";

export function generateStaticParams() {
  return COMPOUNDS.map((c) => ({ id: c.id }));
}

export default async function CompoundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const compound = COMPOUNDS.find((c) => c.id === id);
  if (!compound) notFound();
  return <CompoundDetailClient compound={compound} />;
}
