import { apiUser } from "@/lib/platform/guards";
import { audit, deleteProgram, updateProgram } from "@/lib/platform/store";

/**
 * One program.
 *
 * `PATCH` changes its name, description, track or status. `DELETE` removes
 * it, and everything on it with it.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await apiUser("admin");
  if (!admin) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    track?: string;
    status?: "active" | "archived";
  };

  const program = await updateProgram(id, body);
  if (!program) {
    return Response.json({ error: "No such program" }, { status: 404 });
  }

  await audit({
    actorId: admin.id,
    actorRole: admin.role,
    action: "program.updated",
    subject: program.id,
    detail: program.name,
  });

  return Response.json({ program });
}

/**
 * Removes a program from the platform.
 *
 * Everything on it goes too: the resources, the progress and the mentees
 * who were on it.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await apiUser("admin");
  if (!admin) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;

  const removed = await deleteProgram(id);
  if (!removed) {
    return Response.json({ error: "No such program" }, { status: 404 });
  }

  await audit({
    actorId: admin.id,
    actorRole: admin.role,
    action: "program.deleted",
    subject: id,
  });

  return Response.json({ ok: true });
}
