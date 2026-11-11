import { apiUser } from "@/lib/platform/guards";
import {
  audit,
  createProgram,
  listMentorsForProgram,
  listPrograms,
} from "@/lib/platform/store";

/**
 * The programs an admin manages.
 *
 * `GET` lists them. `POST` creates one.
 */
export async function GET() {
  const admin = await apiUser("admin");
  if (!admin) return Response.json({ error: "Not signed in" }, { status: 401 });

  const programs = await listPrograms();
  const withMentors = await Promise.all(
    programs.map(async (program) => ({
      ...program,
      mentors: await listMentorsForProgram(program.id),
    })),
  );

  return Response.json({ programs: withMentors });
}

/**
 * Creates a program.
 */
export async function POST(request: Request) {
  const admin = await apiUser("admin");
  if (!admin) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
    track?: string;
  };

  if (!body.name?.trim()) {
    return Response.json({ error: "Give the program a name" }, { status: 400 });
  }

  const program = await createProgram({
    name: body.name,
    description: body.description,
    track: body.track,
  });

  await audit({
    actorId: admin.id,
    actorRole: admin.role,
    action: "program.created",
    subject: program.id,
    detail: program.name,
  });

  return Response.json({ program }, { status: 201 });
}
