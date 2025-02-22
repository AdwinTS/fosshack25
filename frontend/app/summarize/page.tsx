"use client";

import { useState } from "react";
import jsPDF from "jspdf";

export default function SummarizePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (!videoUrl.trim()) return;
    setLoading(true);
    setSegments([]); // Clear previous segments
  
    const eventSource = new EventSource(`http://127.0.0.1:5000/process?link=${encodeURIComponent(videoUrl)}`);
  
    eventSource.onmessage = (event) => {
      if (event.data === "done") {
        eventSource.close();
        setLoading(false);
        return;
      }
  
      const newSegment = JSON.parse(event.data);
      setSegments((prevSegments) => [...prevSegments, newSegment]);
    };
  
    eventSource.onerror = () => {
      eventSource.close();
      setLoading(false);
      console.error("Error fetching data");
    };
  };

  const generatePDF = () => {
    const doc = new jsPDF();
  
    // Set initial position
    let x = 10; // X position (left margin)
    let y = 20; // Y position (starting from the top)
  
    // Set font size for the title
    doc.setFontSize(18);
    doc.text("Video Summary", x, y);
    y += 10; // Move down after the title
  
    // Set font size for the content
    doc.setFontSize(12);
  
    // Helper function to wrap text
    const wrapText = (text, maxWidth) => {
      const words = text.split(" ");
      let lines = [];
      let currentLine = words[0];
  
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = doc.getTextWidth(currentLine + " " + word);
        if (width < maxWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };
  
    // Add each segment to the PDF
    segments.forEach((segment, index) => {
      // Add segment title
      doc.text(`Segment ${index + 1}: ${segment.title}`, x, y);
      y += 10; // Move down after the title
  
      // Wrap and add the summary
      const summaryLines = wrapText(`Summary: ${segment.summary}`, 180); // 180 is the max width
      summaryLines.forEach((line) => {
        if (y > 280) {
          // Add a new page if the current page is full
          doc.addPage();
          y = 20; // Reset Y position for the new page
        }
        doc.text(line, x, y);
        y += 10; // Move down after each line
      });
  
      // Add timestamp
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(`Timestamp: ${segment.timestamp}`, x, y);
      y += 15; // Add extra space between segments
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
                <button
                  onClick={generatePDF}
                  className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-md mb-4"
                >
                  Download PDF
                </button>

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