import { apiUser } from "@/lib/platform/guards";
import {
  assignMentorToProgram,
  audit,
  getMentor,
  getProgram,
} from "@/lib/platform/store";

/**
 * The programs a mentor runs.
 *
 * `POST` puts the mentor on one. The other way round - opening a program
 * and putting a mentor on it - is the same thing, and both are here
 * because an admin thinks about it both ways: "this mentor should run
 * this program" and "this program needs a mentor".
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await apiUser("admin");
  if (!admin) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id: mentorId } = await params;
  const mentor = await getMentor(mentorId);
  if (!mentor) {
    return Response.json({ error: "No such mentor" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    programId?: string;
  };

  if (!body.programId) {
    return Response.json({ error: "Choose a program" }, { status: 400 });
  }

  const program = await getProgram(body.programId);
  if (!program) {
    return Response.json({ error: "No such program" }, { status: 404 });
  }

  await assignMentorToProgram(program.id, mentor.id);

  await audit({
    actorId: admin.id,
    actorRole: admin.role,
    action: "mentor.assigned",
    subject: mentor.id,
    detail: program.name,
  });

  return Response.json({ mentor: await getMentor(mentor.id) }, { status: 201 });
}
