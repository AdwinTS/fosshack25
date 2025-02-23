from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from deep_translator import GoogleTranslator
import re
import json
import requests
import yt_dlp
from fuzzywuzzy import fuzz
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests
socketio = SocketIO(app, cors_allowed_origins="*")  # Initialize SocketIO

# Function to extract video title from a YouTube URL
def get_youtube_title(url):
    ydl_opts = {'quiet': True, 'skip_download': True, 'extract_flat': True, 'force_generic_extractor': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return info.get("title", "Title not found")

# Function to fetch the transcript of a YouTube video and translate if needed
def fetch_transcript(youtube_url, supported_languages=["en", "hi", "es", "fr", "ml"], target_language="en"):
    try:
        video_id = youtube_url.split("v=")[-1].split("&")[0]  # Extract video ID from URL
        transcript_data, detected_language = None, None
        
        # Attempt to fetch transcript in supported languages
        for lang in supported_languages:
            try:
                transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=[lang])
                detected_language = lang
                break  # Stop once a transcript is found
            except:
                continue
        
        if not transcript_data:
            return None, "No transcript available."
        
        transcript_with_timestamps = {}
        for entry in transcript_data:
            start_time = entry["start"]
            minutes, seconds = int(start_time // 60), int(start_time % 60)
            formatted_time = f"{minutes:02d}:{seconds:02d}"  # Convert time to MM:SS format
            text = entry["text"]
            
            # Translate text if needed
            if detected_language != target_language:
                text = GoogleTranslator(source=detected_language, target=target_language).translate(text)
            
            transcript_with_timestamps[formatted_time] = text
        
        return transcript_with_timestamps, None
    except TranscriptsDisabled:
        return None, "Transcripts are disabled for this video."
    except Exception as e:
        return None, f"Error fetching transcript: {e}"

# Convert timestamp format MM:SS to total seconds
def convert_timestamp_to_seconds(timestamp):
    match = re.match(r"(\d+):(\d+)", timestamp)
    return int(match.group(1)) * 60 + int(match.group(2)) if match else None

# Function to find the best matching timestamp for a given heading in the transcript
def find_timestamp_for_heading(heading, explanation, transcript):
    search_text, best_match, best_score = f"{heading} {explanation}".lower(), None, 0
    
    for timestamp, text in transcript.items():
        score = fuzz.partial_ratio(search_text, text.lower())  # Fuzzy matching score
        if score > best_score:
            best_score, best_match = score, timestamp
        if best_score == 100:
            return best_match  # Stop searching if perfect match found
    
    return best_match if best_score >= 70 else None  # Return match if confidence is high

# Event handler for processing YouTube video when requested from frontend
@socketio.on("process_video")
def process_youtube_video(data):
    try:
        youtube_link = data.get("link")
        if "v=" not in youtube_link:
            emit("error", {"error": "Invalid YouTube link."})
            return
        
        emit("status", {"message": "Fetching transcript..."})
        transcript, error = fetch_transcript(youtube_link)
        if error:
            emit("error", {"error": error})
            return
        
        emit("status", {"message": "Fetching video title..."})
        video_title = get_youtube_title(youtube_link)
        
        # Format transcript for AI model
        formatted_transcript = "\n".join([f"{timestamp}: {text}" for timestamp, text in transcript.items()])
        
        emit("status", {"message": "Generating summary..."})
        response = requests.post("http://localhost:11435/api/generate", json={
            "model": "mistral",
            "prompt": f"""
            Based on the following transcript, generate structured lecture notes in JSON format:
            {formatted_transcript}
            **Instructions:**
            - Return output as a JSON object with `"sections"` as a list.
            - Each section should contain:
              - `"heading"`: The main topic.
              - `"explanation"`: A brief explanation of minimum 8 sentences, maximum 15 sentences.
            - Provide at least 4 sections.
            - Ensure clean JSON output.
            """,
            "stream": False
        })
        
        if response.status_code != 200:
            emit("error", {"error": f"Ollama API error: {response.status_code}", "details": response.text})
            return
        
        match = re.search(r"\{.*\}", response.json().get("response", ""), re.DOTALL)
        if match:
            response_json = json.loads(match.group())
        else:
            emit("error", {"error": "Failed to extract valid JSON from response"})
            return
        
        if "sections" in response_json:
            for section in response_json["sections"]:
                timestamp = find_timestamp_for_heading(section["heading"], section["explanation"], transcript)
                section["timestamp"] = timestamp if timestamp else "N/A"
                section["link"] = f"{youtube_link}&t={convert_timestamp_to_seconds(timestamp)}" if timestamp else youtube_link
            response_json["title"] = video_title
            emit("summary", response_json)
        else:
            emit("error", {"error": "Invalid response format from AI model"})
    except Exception as e:
        emit("error", {"error": str(e)})

# Run the Flask app with SocketIO
if __name__ == "__main__":
    socketio.run(app, debug=True)
