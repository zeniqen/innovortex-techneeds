import { apiMentee } from "@/lib/platform/guards";
import { audit, getResource, submitResource } from "@/lib/platform/store";

/**
 * Submitting work.
 *
 * A video is marked as watched by opening it. A quiz or a project carries
 * what the mentee wrote or linked to.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const mentee = await apiMentee();
  if (!mentee) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const resource = await getResource(id);
  if (!resource) {
    return Response.json({ error: "No such resource" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { body?: string };

  await submitResource(mentee.id, id, body.body ?? "");

  await audit({
    actorId: mentee.id,
    actorRole: mentee.role,
    action: "work.submitted",
    subject: id,
    detail: resource.title,
  });

  return Response.json({ ok: true });
}
