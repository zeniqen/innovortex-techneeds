import { apiMentor } from "@/lib/platform/guards";
import { audit, getResource, gradeResource, listMenteesForProgram } from "@/lib/platform/store";

/**
 * Grading a submission.
 *
 * The score is recorded against the resource and the mentee's total moves
 * by the difference, so a mentor can correct a mark later without the
 * total drifting.
 */
export async function POST(request: Request) {
  const mentor = await apiMentor();
  if (!mentor) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    menteeId?: string;
    resourceId?: string;
    score?: string | number;
    feedback?: string;
  };

  if (!body.menteeId || !body.resourceId) {
    return Response.json(
      { error: "Choose a mentee and a piece of work" },
      { status: 400 },
    );
  }

  const resource = await getResource(body.resourceId);
  if (!resource) {
    return Response.json({ error: "No such resource" }, { status: 404 });
  }
  if (!mentor.programIds.includes(resource.programId)) {
    return Response.json(
      { error: "That resource is not one of yours" },
      { status: 403 },
    );
  }

  // The mentee has to be on the program the resource belongs to.
  const mentees = await listMenteesForProgram(resource.programId);
  if (!mentees.some((mentee) => mentee.id === body.menteeId)) {
    return Response.json(
      { error: "That mentee is not on this program" },
      { status: 403 },
    );
  }

  const score = Number(body.score);
  if (!Number.isFinite(score) || score < 0) {
    return Response.json(
      { error: "The score has to be a number" },
      { status: 400 },
    );
  }

  if (score > resource.maxScore) {
    return Response.json(
      { error: `That is more than the ${resource.maxScore} this is worth` },
      { status: 400 },
    );
  }

  await gradeResource({
    menteeId: body.menteeId,
    resourceId: body.resourceId,
    score,
    feedback: body.feedback,
  });

  await audit({
    actorId: mentor.id,
    actorRole: mentor.role,
    action: "work.graded",
    subject: body.menteeId,
    detail: `${resource.title}: ${score}/${resource.maxScore}`,
  });

  return Response.json({ ok: true });
}
