import { redirect } from "next/navigation";

// The main page after sign-in is the employees list (PLAN D17).
export default function HomePage() {
  redirect("/users");
}
