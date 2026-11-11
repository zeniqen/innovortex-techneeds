import { apiMentor } from "@/lib/platform/guards";
import {
  createMentee,
  getProgram,
  listMenteesForProgram,
} from "@/lib/platform/store";
import {
  audit,
} from "@/lib/platform/admin-store";

/**
 * The mentees on a mentor's program.
 *
 * `POST` adds one. The enrollment number and the initial password are
 * generated here and shown once.
 */
export async function POST(request: Request) {
  const mentor = await apiMentor();
  if (!mentor) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    programId?: string;
    name?: string;
    bio?: string;
    interests?: string;
  };

  if (!body.programId) {
    return Response.json({ error: "Choose a program" }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return Response.json({ error: "Give the mentee a name" }, { status: 400 });
  }

  // A mentor can only add people to their own programs.
  if (!mentor.programIds.includes(body.programId)) {
    return Response.json(
      { error: "That program is not one of yours" },
      { status: 403 },
    );
  }

  const program = await getProgram(body.programId);
  if (!program) {
    return Response.json({ error: "No such program" }, { status: 404 });
  }

  try {
    const created = await createMentee({
      name: body.name,
      bio: body.bio,
      interests: body.interests
        ? body.interests
            .split(",")
            .map((interest) => interest.trim())
            .filter(Boolean)
        : [],
      programIds: [body.programId],
    });

    await audit({
      actorId: mentor.id,
      actorRole: mentor.role,
      action: "mentee.added",
      subject: created.mentee.id,
      detail: program.name,
    });

    return Response.json(
      {
        mentee: created.mentee,
        enrollmentNumber: created.enrollmentNumber,
        password: created.password,
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "That mentee could not be added.",
      },
      { status: 400 },
    );
  }
}

/**
 * The mentees on one of the mentor's programs.
 */
export async function GET(request: Request) {
  const mentor = await apiMentor();
  if (!mentor) return Response.json({ error: "Not signed in" }, { status: 401 });

  const programId = new URL(request.url).searchParams.get("programId");
  if (!programId || !mentor.programIds.includes(programId)) {
    return Response.json({ error: "No such program" }, { status: 404 });
  }

  return Response.json({ mentees: await listMenteesForProgram(programId) });
}
