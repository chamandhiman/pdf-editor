import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitHub Migration Test" },
      { name: "description", content: "A temporary project for testing GitHub synchronization." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
        GitHub Migration Test
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        This is a temporary project.
      </p>
    </main>
  );
}
