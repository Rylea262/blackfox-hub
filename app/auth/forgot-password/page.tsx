import { requestReset } from "./actions";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; sent?: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <form
        action={requestReset}
        className="flex w-full max-w-sm flex-col gap-3 rounded border p-6"
      >
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="text-sm text-neutral-500">
          Enter your email and we&apos;ll send you a link to set a new password.
        </p>
        {searchParams.sent && (
          <p className="rounded border border-green-300 bg-green-50 p-2 text-sm text-green-700">
            If that email is on file, a reset link has been sent. Check your
            inbox (and spam folder).
          </p>
        )}
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
        <button
          type="submit"
          className="rounded bg-black p-2 text-white hover:bg-neutral-800"
        >
          Send reset link
        </button>
        <a
          href="/login"
          className="text-center text-sm text-neutral-500 hover:underline"
        >
          Back to sign in
        </a>
      </form>
    </main>
  );
}
