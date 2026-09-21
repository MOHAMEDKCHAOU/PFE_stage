import Link from "next/link";
  import { SpaceStudioClient } from "./SpaceEditorClient";
  import "./space-editor.css";

type PageProps = {
  params: Promise<{ capsuleId: string }>;
};

export default async function SpaceEditPage({ params }: PageProps) {
  const { capsuleId } = await params;

  return (
    <div>
      <div className="px-4 pt-2">
        <Link
          href="/dashboard/capsules"
          className="text-sm text-bordeaux-800 hover:underline"
        >
          ← Mes capsules
        </Link>
      </div>

      <SpaceStudioClient capsuleId={capsuleId} />
    </div>
  );
}