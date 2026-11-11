import {
  adminCount,
  createAdmin,
  programCount,
  resetPlatform,
} from "@/lib/platform/store";
import { seedPlatform } from "@/lib/platform/seed";
import { currentUser } from "@/lib/platform/session";
import { generatePassword } from "@/lib/platform/credentials";

/**
 * Setting the platform up.
 *
 * There is no way in until there is an admin, so this route is how the
 * first one is made. It only works while the platform is empty: once it
 * has programs, the route needs an admin to be signed in, and every
 * further admin has to be made by an admin who is already signed in.
 *
 * The body may ask for the live data to be copied in as well:
 *
 *   { "seed": true }
 */
export async function POST(request: Request) {
  const hasPrograms = (await programCount()) > 0;

  if (hasPrograms) {
    // Re-seeding throws away everything, so it takes an admin to ask for.
    const user = await currentUser();
    if (!user || user.role !== "admin") {
      return Response.json(
        { error: "The platform is already set up." },
        { status: 403 },
      );
    }
  }

  let body: {
    name?: unknown;
    email?: unknown;
    password?: unknown;
    seed?: unknown;
  } = {};

  try {
    body = await request.json();
  } catch {
    // An empty body is fine: the defaults below are used.
  }

  const wantsSeed = body.seed !== false;

  // A previous attempt may have left half a platform behind. Clear it, so
  // this route always starts from the same place.
  await resetPlatform();

  if (!wantsSeed) {
    const email =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim()
        : "admin@techneeds.test";
    const password =
      typeof body.password === "string" && body.password
        ? body.password
        : generatePassword();
    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim()
        : "Platform Admin";

    await createAdmin({ name, email, password });

    return Response.json({
      ok: true,
      report: {
        admin: { email, password },
        mentor: { email: "", password: "" },
        mentee: { enrollmentNumber: "", password: "" },
        counts: { programs: 0, mentors: 0, mentees: 0, resources: 0 },
      },
    });
  }

  try {
    const report = await seedPlatform();
    return Response.json({ ok: true, report });
  } catch (error) {
    // Leave nothing half made behind.
    await resetPlatform();

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "The seed could not finish.",
      },
      { status: 500 },
    );
  }
}
