import { describeDatabase } from "@/lib/platform/db";
import { adminCount } from "@/lib/platform/store";
import { queryOne } from "@/lib/platform/db";

/**
 * What state the platform is in.
 *
 * The admin panel reads this to decide whether to show the setup screen or
 * the panel itself.
 */
export async function GET() {
  const admins = await adminCount();

  const counts = await queryOne<{
    programs: number;
    mentors: number;
    mentees: number;
    resources: number;
  }>(
    `SELECT
       (SELECT count(*) FROM programs)  AS programs,
       (SELECT count(*) FROM mentors)   AS mentors,
       (SELECT count(*) FROM mentees)   AS mentees,
       (SELECT count(*) FROM resources) AS resources`,
  );

  return Response.json({
    needsSetup: admins === 0,
    database: describeDatabase(),
    counts: {
      programs: counts?.programs ?? 0,
      mentors: counts?.mentors ?? 0,
      mentees: counts?.mentees ?? 0,
      resources: counts?.resources ?? 0,
    },
  });
}
