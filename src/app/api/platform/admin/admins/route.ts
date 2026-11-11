import { apiUser } from "@/lib/platform/guards";
import {
  audit,
  createAdmin,
} from "@/lib/platform/admin-store";
import { generatePassword } from "@/lib/platform/credentials";

/**
 * Adding another admin.
 *
 * Only an admin who is already signed in can do this.
 */
export async function POST(request: Request) {
  const admin = await apiUser("admin");
  if (!admin) return Response.json({ error: "Not signed in" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!body.email?.trim()) {
    return Response.json(
      { error: "Give the admin an email address" },
      { status: 400 },
    );
  }

  const password = body.password?.trim() || generatePassword();

  try {
    const created = await createAdmin({
      name: body.name?.trim() || "Admin",
      email: body.email,
      password,
    });

    await audit({
      actorId: admin.id,
      actorRole: admin.role,
      action: "admin.added",
      subject: created.id,
      detail: created.email,
    });

    return Response.json({ admin: created, password }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "That admin could not be added.",
      },
      { status: 400 },
    );
  }
}
