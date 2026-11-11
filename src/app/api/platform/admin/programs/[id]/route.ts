import { apiUser } from "@/lib/platform/guards";
import { audit, updateProgram } from "@/lib/platform/store";

/**
 * One program.
 *
 * `PATCH` changes its name, description, track or status.
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
