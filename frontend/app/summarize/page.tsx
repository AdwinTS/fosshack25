"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import jsPDF from "jspdf";

export default function SummarizePage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [sections, setSections] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("http://127.0.0.1:5000");
    setSocket(newSocket);

    newSocket.on("status", (data) => setStatus(data.message));
    newSocket.on("summary", (data) => {
      setTitle(data.title);
      setSections(data.sections);
      setLoading(false);
    });
    newSocket.on("error", (data) => {
      setError(data.error);
      setLoading(false);
    });

    return () => newSocket.disconnect();
  }, []);

  const handleGenerate = () => {
    if (!videoUrl.trim()) return;
    setLoading(true);
    setStatus("Connecting to server...");
    setError("");

    socket.emit("process_video", { link: videoUrl });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text(title, 10, y);
    y += 10;
    doc.setFontSize(12);

    sections.forEach((section, index) => {
      const headingText = `${index + 1}: ${section.heading}`; // ✅ Fixed template literal
      doc.setTextColor(0, 0, 255); // Set color for the link
      doc.textWithLink(headingText, 10, y, { url: section.link });
      y += 10;
      doc.setTextColor(0, 0, 0); // Reset color
      doc.text(section.explanation, 10, y, { maxWidth: 180 });
      y += 20;
    });

    doc.save("video-summary.pdf");
  }; // ✅ Function closes properly here

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-center text-violet-400">
          Video Summarizer
        </h1>

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
              className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-md"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>

          <div className="bg-black bg-opacity-50 rounded-lg p-6 min-h-[200px]">
            <h2 className="text-2xl font-semibold mb-4 text-violet-300">
              {title || "Summary"}
            </h2>

            {status && <p className="text-gray-400">{status}</p>}
            {error && <p className="text-red-400">{error}</p>}

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
