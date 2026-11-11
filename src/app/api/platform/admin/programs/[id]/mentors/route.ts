import { apiUser } from "@/lib/platform/guards";
import {
  assignMentorToProgram,
  audit,
  createMentor,
  getProgram,
  listMentors,
  listMentorsForProgram,
} from "@/lib/platform/store";

/**
 * The mentors on a program.
 *
 * `POST` puts a mentor on it. The mentor can be one who is already on the
 * platform, given by id, or a new mentor who is onboarded at the same
 * time.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await apiUser("admin");
  if (!admin) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id: programId } = await params;
  const program = await getProgram(programId);
  if (!program) {
    return Response.json({ error: "No such program" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    mentorId?: string;
    name?: string;
    email?: string;
    title?: string;
    skills?: string;
  };

  let mentorId = body.mentorId;
  let password: string | undefined;

  if (!mentorId) {
    if (!body.name?.trim() || !body.email?.trim()) {
      return Response.json(
        { error: "Give the mentor a name and an email address" },
        { status: 400 },
      );
    }

    const created = await createMentor({
      name: body.name,
      email: body.email,
      title: body.title,
      skills: body.skills
        ? body.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
        : [],
    });
    mentorId = created.mentor.id;
    password = created.password;
  }

  await assignMentorToProgram(programId, mentorId);

  const mentors = await listMentorsForProgram(programId);

  await audit({
    actorId: admin.id,
    actorRole: admin.role,
    action: "mentor.assigned",
    subject: programId,
    detail: mentorId,
  });

  return Response.json(
    {
      mentors,
      mentorId,
      // Only set when a mentor was created by this call.
      password,
    },
    { status: 201 },
  );
}

/**
 * The mentors that could be put on this program.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await apiUser("admin");
  if (!admin) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const all = await listMentors();
  const assigned = new Set(
    (await listMentorsForProgram(id)).map((mentor) => mentor.id),
  );

  return Response.json({
    mentors: all.filter((mentor) => !assigned.has(mentor.id)),
  });
}
