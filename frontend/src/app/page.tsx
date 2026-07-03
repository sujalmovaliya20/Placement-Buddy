import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-2xl text-center animate-fade-in">
        <div className="mb-6 inline-flex items-center rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-success" />
          Platform Active
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Placement{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Buddy
          </span>
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Streamline your college placement process. Manage drives, track
          applications, and connect students with top companies — all in one
          place.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Go to Dashboard
          </a>
          <a
            href="/drives"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Browse Drives
          </a>
        </div>

        <p className="mt-12 text-sm text-muted-foreground/60">
          Built for placement coordinators and students
        </p>
      </div>
    </main>
  );
}
