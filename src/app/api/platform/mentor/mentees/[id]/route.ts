import { apiMentor } from "@/lib/platform/guards";
import {
  removeMenteeFromProgram,
} from "@/lib/platform/store";
import {
  audit,
} from "@/lib/platform/admin-store";

/**
 * Takes a mentee off a program.
 *
 * The mentee stays on the platform, and keeps their enrollment number and
 * their progress on the other programs they are on.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const mentor = await apiMentor();
  if (!mentor) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id: menteeId } = await params;
  const programId = new URL(request.url).searchParams.get("programId");

  if (!programId || !mentor.programIds.includes(programId)) {
    return Response.json(
      { error: "That program is not one of yours" },
      { status: 403 },
    );
  }

  await removeMenteeFromProgram(programId, menteeId);

  await audit({
    actorId: mentor.id,
    actorRole: mentor.role,
    action: "mentee.removed",
    subject: menteeId,
    detail: programId,
  });

  return Response.json({ ok: true });
}
