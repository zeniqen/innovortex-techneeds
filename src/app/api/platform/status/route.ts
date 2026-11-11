import { connection } from "next/server";

import { describeDatabase } from "@/lib/platform/db";
import { adminCount } from "@/lib/platform/admin-store";
import { counts as platformCounts, usesTnBackend } from "@/lib/platform/store";
import { TN_BACKEND_URL } from "@/lib/platform/backends/tn";

/**
 * What state the platform is in.
 *
 * The admin panel reads this to decide whether to show the setup screen or
 * the panel itself.
 */
export async function GET() {
  // The counts change as people are added, so this is answered at request
  // time rather than baked into the build.
  await connection();

  const admins = await adminCount();
  const counts = await platformCounts();

  return Response.json({
    needsSetup: admins === 0,
    // Where the platform data is, so the admin panel can say so.
    backend: usesTnBackend ? "tn" : "sqlite",
    ...(usesTnBackend ? { backendUrl: TN_BACKEND_URL } : {}),
    database: usesTnBackend ? TN_BACKEND_URL : describeDatabase(),
    counts,
  });
}