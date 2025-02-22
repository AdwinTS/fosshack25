"use client";

import { useState } from "react";
import jsPDF from "jspdf";

export default function SummarizePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!videoUrl.trim()) return;
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: videoUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch summary");
      }

      const data = await response.json();
      setSegments(data.segments || []);
    } catch (error) {
      console.error("Error:", error);
      setSegments([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generates a PDF from the summarized segments.
   */
  const generatePDF = () => {
    const doc = new jsPDF();

    // Add a title to the PDF
    doc.setFontSize(18);
    doc.text("Video Summary", 10, 10);

    // Add each segment to the PDF
    let yPosition = 20; // Starting Y position for content
    segments.forEach((segment, index) => {
      doc.setFontSize(12);
      doc.text(`Segment ${index + 1}: ${segment.title}`, 10, yPosition);
      yPosition += 10;
      doc.text(`Summary: ${segment.summary}`, 10, yPosition);
      yPosition += 10;
      doc.text(`Timestamp: ${segment.timestamp}`, 10, yPosition);
      yPosition += 15; // Add extra space between segments
    });

    // Save the PDF
    doc.save("video-summary.pdf");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-center text-violet-400">
          Video Summarizer
        </h1>

        <div className="max-w-3xl mx-auto bg-violet-900 bg-opacity-20 rounded-lg p-8 backdrop-blur-lg">
          <div className="mb-8">
            <div className="flex items-center space-x-2">
              <input
                type="url"
                placeholder="Paste YouTube video URL here"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-grow bg-black bg-opacity-50 border border-violet-500 text-white placeholder-violet-300 px-3 py-2 rounded-md"
                required
              />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-md"
              >
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>

          <div className="bg-black bg-opacity-50 rounded-lg p-6 min-h-[200px]">
            <h2 className="text-2xl font-semibold mb-4 text-violet-300">
              Summary
            </h2>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <svg
                  className="animate-spin h-8 w-8 text-violet-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : segments.length > 0 ? (
              <>
                {/* Add a Download PDF Button */}
                <button
                  onClick={generatePDF}
                  className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-md mb-4"
                >
                  Download PDF
                </button>

                {/* Display Segments */}
                {segments.map((segment, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-center items-center">
                      <a
                        className="hover:text-blue-700 underline text-violet-300"
                        href={segment.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {segment.title}
                      </a>
                    </div>
                    <p className="text-gray-300">{segment.summary}</p>
                    <p className="text-gray-500">Timestamp: {segment.timestamp}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-gray-300">
                Your video summary will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}