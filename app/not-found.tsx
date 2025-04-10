import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="mb-8 text-gray-600 max-w-md">The page you are looking for doesn't exist or has been moved.</p>
      <Link href="/" className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
        Go back home
      </Link>
    </div>
  )
}
