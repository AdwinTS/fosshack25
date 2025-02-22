import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold text-violet-400">VideoSummarizer</h1>
          <div className="space-x-4">
            <Link href="/login" className="text-violet-400 hover:text-violet-300">
              Login
            </Link>
            <Link href="/signup" className="text-violet-400 hover:text-violet-300">
              Sign Up
            </Link>
          </div>
        </nav>
        <main className="flex flex-col items-center text-center">
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
            Summarize Your Videos
          </h2>
          <p className="text-xl mb-12 max-w-2xl">
            Transform lengthy videos into concise summaries with our cutting-edge AI technology. Save time and extract
            key insights effortlessly.
          </p>
          <Link
            href="/summarize"
            className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-medium text-violet-600 bg-violet-100 rounded-lg shadow-2xl"
          >
            <span className="absolute inset-0 w-full h-full transition duration-300 ease-out opacity-0 bg-gradient-to-br from-violet-600 via-purple-600 to-violet-800 group-hover:opacity-100"></span>
            <span className="absolute top-0 left-0 w-full bg-gradient-to-b from-white to-transparent opacity-5 h-1/3"></span>
            <span className="relative text-lg font-semibold group-hover:text-white">
              Get Started
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </span>
          </Link>
        </main>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
          <path
            fill="#4c1d95"
            fillOpacity="1"
            d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,128C672,128,768,160,864,165.3C960,171,1056,149,1152,133.3C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  )
}

