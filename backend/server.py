import os
import re
import json
import logging
from flask import Flask, request, jsonify
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from deep_translator import GoogleTranslator
import yt_dlp
from groq import Groq
from flask_cors import CORS

# Setup logging configuration
logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")

# Initialize Groq client using the GROQ_API_KEY environment variable
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
logging.debug("Initialized Groq client")

# Initialize Flask app
app = Flask(__name__)
CORS(app, cors_allowed_origins="*")  # Enable CORS for cross-origin requests
logging.debug("Flask app initialized")

# Function to extract video title from a YouTube URL
def get_youtube_title(url):
    logging.debug("Extracting YouTube title for URL: %s", url)
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        'extract_flat': True,
        'force_generic_extractor': True
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get("title", "Title not found")
            logging.debug("Extracted title: %s", title)
            return title
    except Exception as e:
        logging.error("Failed to extract title: %s", str(e))
        return "Title not found"

# Function to fetch transcript and translate if needed
def fetch_transcript(youtube_url, supported_languages=["en", "hi", "es", "fr", "ml"], target_language="en"):
    try:
        video_id = youtube_url.split("v=")[-1]
        logging.debug("Extracted video ID: %s", video_id)

        transcript_data, detected_language = None, None

        for lang in supported_languages:
            try:
                logging.debug("Trying to fetch transcript in language: %s", lang)
                transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=[lang])
                detected_language = lang
                logging.info("Transcript found in language: %s", lang)
                break
            except NoTranscriptFound:
                logging.warning("No transcript found for language: %s", lang)
            except Exception as e:
                logging.error("Error fetching transcript in %s: %s", lang, str(e))

        if not transcript_data:
            logging.error("No transcripts available for video ID: %s", video_id)
            return None, "No transcript available."

        transcript_with_timestamps = {}
        for entry in transcript_data:
            start_time = entry["start"]
            minutes, seconds = int(start_time // 60), int(start_time % 60)
            formatted_time = f"{minutes:02d}:{seconds:02d}"
            text = entry["text"]

            if detected_language and detected_language != target_language:
                logging.debug("Translating transcript from %s to %s", detected_language, target_language)
                try:
                    text = GoogleTranslator(source=detected_language, target=target_language).translate(text)
                except Exception as e:
                    logging.error("Translation failed: %s", str(e))

            transcript_with_timestamps[formatted_time] = text

        return transcript_with_timestamps, None

    except TranscriptsDisabled:
        logging.error("Transcripts are disabled for this video.")
        return None, "Transcripts are disabled for this video."
    except Exception as e:
        logging.exception("Error fetching transcript:")
        return None, f"Error fetching transcript: {e}"

# Route to process YouTube video
@app.route("/process_video", methods=["POST"])
def process_video():
    try:
        data = request.json
        youtube_link = data.get("link")
        logging.info("Received request to process video: %s", youtube_link)

        transcript, error = fetch_transcript(youtube_link)
        if error:
            logging.error("Transcript fetching failed: %s", error)
            return jsonify({"error": error}), 400

        video_title = get_youtube_title(youtube_link)
        formatted_transcript = "\n".join([f"{timestamp}: {text}" for timestamp, text in transcript.items()])

        logging.debug("Sending transcript to Groq for summarization")
        prompt_text = f"""
Based on the following transcript, generate structured lecture notes in JSON format:
{formatted_transcript}
**Instructions:**
- Return output as a JSON object with "sections" as a list.
- Each section should contain:
  - "heading": The main topic.
  - "explanation": A brief explanation of 8-15 sentences.
- Provide at least 4 sections.
- Ensure clean JSON output.
"""
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt_text}],
            model="llama-3.3-70b-versatile"
        )

        response_text = chat_completion.choices[0].message.content
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        response_json = json.loads(match.group()) if match else {}

        response_json["title"] = video_title
        logging.info("Summarization completed successfully.")
        return jsonify(response_json)

    except Exception as e:
        logging.exception("Exception in process_video:")
        return jsonify({"error": str(e)}), 500

# Run Flask app
if __name__ == "__main__":
    app.run(debug=True)
