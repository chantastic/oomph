"use server";

import { signOut } from "@workos-inc/authkit-nextjs";

export default async function workosSignOut() {
  await signOut();
}
