import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function getSession() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Use at the top of every server action and protected page. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
