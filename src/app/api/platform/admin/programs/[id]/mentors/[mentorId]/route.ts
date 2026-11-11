import { apiUser } from "@/lib/platform/guards";
import { audit, removeMentorFromProgram } from "@/lib/platform/store";

/**
 * Takes a mentor off a program.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; mentorId: string }> },
) {
  const admin = await apiUser("admin");
  if (!admin) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id: programId, mentorId } = await params;
  await removeMentorFromProgram(programId, mentorId);

  await audit({
    actorId: admin.id,
    actorRole: admin.role,
    action: "mentor.unassigned",
    subject: programId,
    detail: mentorId,
  });

  return Response.json({ ok: true });
}
