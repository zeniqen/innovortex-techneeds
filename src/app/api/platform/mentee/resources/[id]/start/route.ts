import { apiMentee } from "@/lib/platform/guards";
import { startResource } from "@/lib/platform/store";

/**
 * Starting a piece of work.
 *
 * This is what moves a resource from "assigned" to "in progress", and it
 * is what a click on the resource card sends.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const mentee = await apiMentee();
  if (!mentee) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  await startResource(mentee.id, id);

  return Response.json({ ok: true });
}
