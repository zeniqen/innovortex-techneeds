import {
  programCount,
  resetPlatform,
  counts as platformCounts,
} from "@/lib/platform/store";
import { createAdmin, resetAdmins } from "@/lib/platform/admin-store";
import { seedPlatform } from "@/lib/platform/seed";
import { currentUser } from "@/lib/platform/session";
import { generatePassword } from "@/lib/platform/credentials";
import { usesTnBackend } from "@/lib/platform/store";

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
 *
 * The two backends are set up differently, because they hold the data
 * differently:
 *
 *  - In the SQLite mode the platform data lives in this project's own
 *    database, so it starts empty and is filled by copying the live
 *    platform in.
 *  - In the tn mode the platform data already lives in the backend, which
 *    has been running all along. There is nothing to copy and nothing to
 *    clear: clearing it would throw away the mentors, the mentees and the
 *    marks that are already there.
 */
export async function POST(request: Request) {
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

  if (usesTnBackend) {
    return setupAgainstBackend({ name, email, password });
  }

  return setupInSqlite({ name, email, password, wantsSeed: body.seed !== false });
}

/**
 * Sets the platform up when the data lives in the backend.
 *
 * Only the admin is made. The programs, the mentors, the mentees and the
 * marks are already in the backend, and they are left exactly as they
 * are.
 */
async function setupAgainstBackend(input: {
  name: string;
  email: string;
  password: string;
}) {
  const hasPrograms = (await programCount()) > 0;

  if (hasPrograms) {
    // Making an admin changes who can run the platform, so once the
    // platform is in use it takes an admin to ask for it.
    const user = await currentUser();
    if (!user || user.role !== "admin") {
      return Response.json(
        { error: "The platform is already set up." },
        { status: 403 },
      );
    }
  }

  try {
    await createAdmin(input);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "That admin could not be made.",
      },
      { status: 400 },
    );
  }

  return Response.json({
    ok: true,
    report: {
      admin: { email: input.email, password: input.password },
      mentor: { email: "", password: "" },
      mentee: { enrollmentNumber: "", password: "" },
      counts: await platformCounts(),
    },
  });
}

/**
 * Sets the platform up when the data lives in this project's own
 * database.
 *
 * The database starts empty, so it is filled by copying the live platform
 * in. A previous attempt may have left half a platform behind, so it is
 * cleared first.
 */
async function setupInSqlite(input: {
  name: string;
  email: string;
  password: string;
  wantsSeed: boolean;
}) {
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

  // A previous attempt may have left half a platform behind. Clear it, so
  // this route always starts from the same place.
  await resetPlatform();

  if (!input.wantsSeed) {
    await createAdmin({
      name: input.name,
      email: input.email,
      password: input.password,
    });

    return Response.json({
      ok: true,
      report: {
        admin: { email: input.email, password: input.password },
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
    // Leave nothing half made behind, so the next attempt starts from the
    // same place rather than colliding with an admin that already exists.
    await resetPlatform();
    await resetAdmins();

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "The seed could not finish.",
      },
      { status: 500 },
    );
  }
}
