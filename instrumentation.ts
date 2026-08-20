export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.AUTO_MIGRATE === "false"
  ) {
    return;
  }

  const { runMigrations } = await import("@/lib/migrations");
  await runMigrations();
}
