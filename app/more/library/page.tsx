import { CompoundBrowser } from "@/components/inventory-client";

export default function LibraryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
      <CompoundBrowser />
    </div>
  );
}
