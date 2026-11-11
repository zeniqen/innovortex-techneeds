import { apiUser } from "@/lib/platform/guards";
import {
  createMentor,
} from "@/lib/platform/store";
import {
  audit,
} from "@/lib/platform/admin-store";

/**
 * Onboarding a mentor.
 *
 * The password is generated here and shown once. It is never stored in
 * the clear, so this is the only chance to copy it.
 */
export async function POST(request: Request) {
  const admin = await apiUser("admin");
  if (!admin) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    title?: string;
    bio?: string;
    skills?: string;
  };

  if (!body.name?.trim() || !body.email?.trim()) {
    return Response.json(
      { error: "Give the mentor a name and an email address" },
      { status: 400 },
    );
  }

  try {
    const { mentor, password } = await createMentor({
      name: body.name,
      email: body.email,
      title: body.title,
      bio: body.bio,
      skills: body.skills
        ? body.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
        : [],
    });

    await audit({
      actorId: admin.id,
      actorRole: admin.role,
      action: "mentor.onboarded",
      subject: mentor.id,
      detail: mentor.email,
    });

    return Response.json({ mentor, password }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "That mentor could not be onboarded.",
      },
      { status: 400 },
    );
  }
}
