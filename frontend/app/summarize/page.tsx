"use client";

import { useState } from "react";
import jsPDF from "jspdf";

export default function SummarizePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [sections, setSections] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle the generate button click
  const handleGenerate = async () => {
    if (!videoUrl.trim()) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setLoading(true);
    setError("");
    setSections(null);
    setTitle("");

    try {
      const response = await fetch("https://v2n-backend-server.onrender.com/process_video", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ link: videoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server error");
      }

      const data = await response.json();
      setTitle(data.title);
      setSections(data.sections || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch data from the server");
    } finally {
      setLoading(false);
    }
  };

  // Generate a PDF of the summary
  const generatePDF = () => {
    const doc = new jsPDF();
    let x = 10, y = 20;
    doc.setFontSize(18);
    doc.text("Video Summary", x, y);
    y += 10;
    doc.setFontSize(12);

    if (sections) {
      sections.forEach((section, index) => {
        if (y > 270) { // Ensure content fits on the page
          doc.addPage();
          y = 20;
        }
        doc.text(`Section ${index + 1}: ${section.heading}`, x, y);
        y += 10;
        doc.text(section.explanation, x, y, { maxWidth: 180 });
        y += 10;
      });
    }

    doc.save("video-summary.pdf");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-center text-violet-400">Video Summarizer</h1>
        <div className="max-w-3xl mx-auto bg-violet-900 bg-opacity-20 rounded-lg p-8 backdrop-blur-lg">
          <div className="mb-8 flex items-center space-x-2">
            <input
              type="url"
              placeholder="Paste YouTube video URL here"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="flex-grow bg-black bg-opacity-50 border border-violet-500 text-white px-3 py-2 rounded-md"
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`px-4 py-2 rounded-md transition ${
                loading ? "bg-gray-600 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700"
              }`}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>

          <div className="bg-black bg-opacity-50 rounded-lg p-6 min-h-[200px]">
            <h2 className="text-2xl font-semibold mb-4 text-violet-300">{title || "Summary"}</h2>
            {error && <p className="text-red-400">{error}</p>}
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <svg
                  className="animate-spin h-8 w-8 text-violet-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : sections ? (
              <>
                <button
                  onClick={generatePDF}
                  className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-md mb-4"
                >
                  Download PDF
                </button>
                {sections.map((section, index) => (
                  <div key={index} className="mb-4">
                    <a
                      href={section.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-violet-300 underline"
                    >
                      {section.heading}
                    </a>
                    <p className="text-gray-300">{section.explanation}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-gray-300">Your video summary will appear here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
