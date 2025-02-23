"use client"
import Link from "next/link"
import { ArrowRight, Play, Radius } from "lucide-react"
import { motion } from "framer-motion"

/**
 * Renders the landing page for the VideoSummarizer application.
 * 
 * The page features:
 * - A navigation bar with links to login and signup.
 * - A main section with a title, description, and a call-to-action button leading to the summarize page.
 * - Animated feature tiles showcasing the application's capabilities.
 * - User testimonials section to provide social proof and feedback.
 * - A footer with branding and a link to the GitHub repository.
 * 
 * The page is styled with gradients, animations, and responsive layouts.
 */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-violet-900 text-white flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-grow">
        {/* Navbar */}
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
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl mb-12 max-w-2xl text-gray-300"
          >
            Transform lengthy videos into concise summaries with our cutting-edge AI technology. Save time and extract
            key insights effortlessly.
          </motion.p>
          <Link
            href="/summarize"
            className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-medium text-violet-600 bg-violet-100 rounded-full shadow-2xl"
          >
            <span className="absolute inset-0 w-full h-full transition duration-300 ease-out opacity-0 bg-gradient-to-br from-violet-600 via-purple-600 to-violet-800 group-hover:opacity-100 "></span>
            <span className="absolute top-0 left-0 w-full bg-gradient-to-b from-white to-transparent opacity-5 h-1/3 "></span>
            <span className="relative text-lg font-semibold group-hover:text-white" >
              Get Started
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </span>
          </Link>
        </main>

        {/* Animated Tiles */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, staggerChildren: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24"
        >
          {[
            { title: "AI-Powered Summaries", description: "Get concise AI-generated video summaries instantly." },
            { title: "Key Insights", description: "Extract important points without watching full videos." },
            { title: "Save Time", description: "Quickly digest information with easy-to-read summaries." },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 * index }}
              className="relative p-8 rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-900/50 to-purple-900/50 backdrop-blur-lg shadow-lg text-center transition-all hover:scale-105 hover:shadow-2xl group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-violet-500/20 rounded-full blur-2xl"></div>
              <h3 className="text-2xl font-semibold text-white mb-4 relative z-10">{feature.title}</h3>
              <p className="text-gray-300 relative z-10">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-24 text-center"
        >
          <h3 className="text-3xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600">
            What Our Users Say
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: "Adwin",
                role: "9 years old ",
                quote: "VideoSummarizer has revolutionized my content research process. It's a game-changer!",
              },
              {
                name: " Pranav J",
                role: "Zen Master Thantha",
                quote:
                  "I can now quickly grasp key concepts from lecture videos. It's boosted my study efficiency tremendously.",
              },
            ].map((testimonial, index) => (
              <div key={index} className="p-6 rounded-2xl bg-violet-800/30 backdrop-blur-sm">
                <p className="text-lg mb-4">"{testimonial.quote}"</p>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-violet-300">{testimonial.role}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="mt-24 bg-violet-900/50 backdrop-blur-md py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-8 md:mb-0">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-600 mb-2">
              VideoSummarizer
            </h3>
            <p className="text-violet-300">Transforming video content into actionable insights</p>
          </div>
          <div className="flex spacea-x-6">
            {["GitHub"].map((social) => (
              <a key={social} href="https://github.com/prithvi1236/fosshack25" className="text-violet-300 hover:text-white transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}