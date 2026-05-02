export function ThankYouCard() {
  return (
    <div className="text-center">
      <h1 className="text-xl font-semibold text-gray-900">Thanks for signing up</h1>
      <div className="mt-4 space-y-3 text-sm text-gray-600">
        <p>
          We received your registration. Our team will call you within 24 hours to verify
          your details.
        </p>
        <p>
          Once verified, you&apos;ll receive an activation email to set your password.
        </p>
        <p>
          Questions? Email{" "}
          <a className="font-medium text-gray-900 underline" href="mailto:support@mwrd.io">
            support@mwrd.io
          </a>
          .
        </p>
      </div>
      <a
        href="/"
        className="mt-6 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Back to home
      </a>
    </div>
  );
}
