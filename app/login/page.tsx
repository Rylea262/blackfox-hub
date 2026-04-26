import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <form
        action={login}
        className="flex w-full max-w-sm flex-col gap-3 rounded border p-6"
      >
        <h1 className="text-2xl font-bold">Sign in</h1>
        {searchParams.error && (
          <p className="text-sm text-red-600">{searchParams.error}</p>
        )}
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded border p-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded border p-2"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-black p-2 text-white hover:bg-neutral-800"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
