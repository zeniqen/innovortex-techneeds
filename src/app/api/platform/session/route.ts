import { currentUser } from "@/lib/platform/session";

/**
 * Who is signed in.
 *
 * The panels call this on mount so they can show the right thing while
 * the server-rendered page is still settling.
 */
export async function GET() {
  const user = await currentUser();

  if (!user) {
    return Response.json({ user: null });
  }

  return Response.json({ user });
}
