import { Suspense } from "react";
import { HealthCheck } from "@/features/health";

// Placeholder (PLAN §6); the real page comes with its own step. HealthCheck is the Apollo demo (KAN-68).
export default function UsersPage() {
  return (
    <main>
      <h1>Employees</h1>
      <Suspense fallback={<p>Checking the backend…</p>}>
        <HealthCheck />
      </Suspense>
    </main>
  );
}
