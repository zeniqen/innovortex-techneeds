import { apiUser } from "@/lib/platform/guards";
import { audit, deleteMentor } from "@/lib/platform/store";

/**
 * Removes a mentor from the platform.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await apiUser("admin");
  if (!admin) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;

  const removed = await deleteMentor(id);
  if (!removed) {
    return Response.json({ error: "No such mentor" }, { status: 404 });
  }

  await audit({
    actorId: admin.id,
    actorRole: admin.role,
    action: "mentor.deleted",
    subject: id,
  });

  return Response.json({ ok: true });
}
