// use client

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import jsPDF from "jspdf";

export default function SummarizePage() {
  const [videoUrl, setVideoUrl] = useState(""); // State to store the video URL input
  const [sections, setSections] = useState([]); // State to store summarized sections
  const [title, setTitle] = useState(""); // State to store the summary title
  const [loading, setLoading] = useState(false); // State to track loading status
  const [status, setStatus] = useState(""); // State to store status messages
  const [error, setError] = useState(""); // State to store error messages
  const [socket, setSocket] = useState(null); // State to manage the socket connection

  useEffect(() => {
    const newSocket = io("http://127.0.0.1:5000"); // Establish connection with the backend server
    setSocket(newSocket);

    newSocket.on("status", (data) => setStatus(data.message)); // Listen for status updates
    newSocket.on("summary", (data) => {
      setTitle(data.title); // Set the title from the response
      setSections(data.sections); // Update sections with the received summary
      setLoading(false);
    });
    newSocket.on("error", (data) => {
      setError(data.error); // Handle errors received from the server
      setLoading(false);
    });

    return () => newSocket.disconnect(); // Cleanup function to disconnect socket on unmount
  }, []);

  const handleGenerate = () => {
    if (!videoUrl.trim()) return; // Ensure the input is not empty
    setLoading(true);
    setStatus("Connecting to server...");
    setError("");

    socket.emit("process_video", { link: videoUrl }); // Send video URL to the backend for processing
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text(title, 10, y); // Add title to the PDF
    y += 10;
    doc.setFontSize(12);

    sections.forEach((section, index) => {
        const headingText = `${index + 1}: ${section.heading}`;
        doc.setTextColor(0, 0, 255); // Set color for the link
        doc.textWithLink(headingText, 10, y, { url: section.link });
        y += 10;
        doc.setTextColor(0, 0, 0); // Reset color
        doc.text(section.explanation, 10, y, { maxWidth: 180 });
        y += 20;
    });

    doc.save("video-summary.pdf"); // Download the generated PDF file
};

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
              {loading ? "Generating..." : "Generate"} {/* Show loading text when generating */}
            </button>
          </div>

          <div className="bg-black bg-opacity-50 rounded-lg p-6 min-h-[200px]">
            <h2 className="text-2xl font-semibold mb-4 text-violet-300">
              {title || "Summary"} {/* Display title or default text */}
            </h2>

            {status && <p className="text-gray-400">{status}</p>} {/* Show status messages */}
            {error && <p className="text-red-400">{error}</p>} {/* Show error messages */}

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <svg className="animate-spin h-8 w-8 text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> {/* Loading spinner */}
              </div>
            ) : sections.length > 0 ? (
              <>
                <button onClick={generatePDF} className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-md mb-4">
                  Download PDF {/* Button to download summary as PDF */}
                </button>
                {sections.map((section, index) => (
                  <div key={index} className="mb-4">
                    <a href={section.link} target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-violet-300 underline">
                      {section.heading} {/* Display section heading as a clickable link */}
                    </a>
                    <p className="text-gray-300">{section.explanation}</p> {/* Display section explanation */}
                  </div>
                ))}
              </>
            ) : (
              <p className="text-gray-300">Your video summary will appear here.</p> {/* Default message */}
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
