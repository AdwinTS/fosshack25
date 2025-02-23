"use client";

import { useState } from "react";
import jsPDF from "jspdf";

export default function SummarizePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [sections, setSections] = useState([]); // Updated to handle sections
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    if (!videoUrl.trim()) return;
    setLoading(true);
    setSections([]); // Clear previous sections

    fetch(`http://127.0.0.1:5000/process?link=${encodeURIComponent(videoUrl)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success" && data.sections) {
          setSections(data.sections); // Set the sections from the response
        } else {
          console.error("Invalid response format");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
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

    // Add each section to the PDF
    sections.forEach((section, index) => {
      // Add section heading
      doc.text(`Section ${index + 1}: ${section.heading}`, x, y);
      y += 10; // Move down after the heading

      // Wrap and add the explanation
      const explanationLines = wrapText(section.explanation, 180); // 180 is the max width
      explanationLines.forEach((line) => {
        if (y > 280) {
          // Add a new page if the current page is full
          doc.addPage();
          y = 20; // Reset Y position for the new page
        }
        doc.text(line, x, y);
        y += 10; // Move down after each line
      });

      y += 10; // Add extra space between sections
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
            ) : sections.length > 0 ? (
              <>
                <button
                  onClick={generatePDF}
                  className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-md mb-4"
                >
                  Download PDF
                </button>

                {sections.map((section, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-center items-center">
                      <a href={section.link}>
                        <h3 className="text-lg font-semibold text-violet-300">
                          {section.heading}
                        </h3>
                      </a>
                    </div>
                    
                    {/* <h3 className="text-lg font-semibold text-violet-300">
                      {section.heading}
                    </h3> */}
                    <p className="text-gray-300">{section.explanation}</p>
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