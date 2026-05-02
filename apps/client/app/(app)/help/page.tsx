export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Help</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 space-y-2">
        <p>
          Need a hand? Email{" "}
          <a className="font-medium text-gray-900 underline" href="mailto:support@mwrd.io">
            support@mwrd.io
          </a>{" "}
          and we&apos;ll get back to you within one business day.
        </p>
        <p>
          For urgent supplier or order issues, call{" "}
          <span className="font-mono">+966 11 000 0000</span>.
        </p>
      </div>
    </div>
  );
}
