import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page space-y-3 py-24">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <Link href="/" className="font-semibold text-primary underline underline-offset-4">
        Back to the home page
      </Link>
    </div>
  );
}
