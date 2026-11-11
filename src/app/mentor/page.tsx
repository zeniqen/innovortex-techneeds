import { redirect } from "next/navigation";

/**
 * The mentor panel lives on the techboard.
 *
 * This route is kept so that an old link still lands somewhere sensible:
 * it sends you to the techboard, which shows the panel when you are signed
 * in as a mentor.
 */
export default function Page() {
  redirect("/techboard");
}
