export type HealthSource = "server" | "client";

export function HealthStatus({ source, status }: { source: HealthSource; status: string }) {
  return (
    <p>
      Backend health ({source}): {status}
    </p>
  );
}
