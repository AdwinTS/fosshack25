from flask import Flask, request, jsonify
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from deep_translator import GoogleTranslator
import re
from flask_cors import CORS
import json
import requests
import yt_dlp
from fuzzywuzzy import fuzz

app = Flask(__name__)
CORS(app)



def get_youtube_title(url):
    ydl_opts = {
        'quiet': True,
        'skip_download': True,  # We just want metadata
        'extract_flat': True,
        'force_generic_extractor': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return info.get("title", "Title not found")

def fetch_transcript(youtube_url, supported_languages=["en", "hi", "es", "fr", "ml"], target_language="en"):
    """Fetches the transcript for a given YouTube video, translates if needed, and returns a timestamped dictionary."""
    try:
        video_id = youtube_url.split("v=")[-1]
        transcript_data = None
        detected_language = None

        for lang in supported_languages:
            try:
                transcript_data = YouTubeTranscriptApi.get_transcript(video_id, languages=[lang])
                detected_language = lang
                break
            except:
                continue

        if not transcript_data:
            return None, "No transcript available."

        transcript_with_timestamps = {}
        for entry in transcript_data:
            start_time = entry["start"]
            minutes = int(start_time // 60)
            seconds = int(start_time % 60)
            formatted_time = f"{minutes:02d}:{seconds:02d}"
            text = entry["text"]

            if detected_language != target_language:
                text = GoogleTranslator(source=detected_language, target=target_language).translate(text)
            
            transcript_with_timestamps[formatted_time] = text
        
        return transcript_with_timestamps, None
    except TranscriptsDisabled:
        return None, "Transcripts are disabled for this video."
    except Exception as e:
        return None, f"Error fetching transcript: {e}"

def convert_timestamp_to_seconds(timestamp):
    """Converts a timestamp string (MM:SS) into total seconds."""
    match = re.match(r"(\d+):(\d+)", timestamp)
    if match:
        minutes, seconds = map(int, match.groups())
        return minutes * 60 + seconds
    return None
    
def find_timestamp_for_heading(heading, explanation, transcript):
    """
    Finds the starting timestamp for a given heading and explanation by matching the content
    with the transcript using fuzzy matching.
    """
    # Combine heading and explanation for better matching
    search_text = f"{heading} {explanation}".lower()

    best_match = None
    best_score = 0

    # Iterate through the transcript to find the best match
    for timestamp, text in transcript.items():
        # Calculate the similarity ratio between the search text and transcript text
        score = fuzz.partial_ratio(search_text, text.lower())
        
        # Update the best match if the current score is higher
        if score > best_score:
            best_score = score
            best_match = timestamp

        # If we find a perfect match, return immediately
        if best_score == 100:
            return best_match

    # Return the best match if the score is above a threshold (e.g., 70)
    return best_match if best_score >= 70 else None

@app.route("/process", methods=["POST", "GET"])
def process_youtube_video():
    """Processes a YouTube video link to generate segmented summaries with timestamps."""
    try:
        if request.method == "POST":
            request_data = request.get_json()
            youtube_link = request_data.get("link")
        elif request.method == "GET":
            youtube_link = request.args.get("link")

        print("Received link:", youtube_link)
        if "v=" not in youtube_link:
            return jsonify({"error": "Invalid YouTube link."}), 400

        # Fetch the transcript
        transcript, error = fetch_transcript(youtube_link)
        print("transcript", transcript)
        if error:
            return jsonify({"error": error}), 400

        if not transcript:
            return jsonify({"error": "No transcript available."}), 400

        # Fetch the video title
        video_title = get_youtube_title(youtube_link)
        print("video", video_title)

        # Format the transcript
        formatted_transcript = "\n".join([f"{timestamp}: {text}" for timestamp, text in transcript.items()])
        print("Formatted transcript:", formatted_transcript)

        # Define payload for Ollama API
        url = "http://localhost:11435/api/generate"
        payload = {
            "model": "mistral",
            "prompt": f"""
            Based on the following transcript, generate structured lecture notes in JSON format:

            {formatted_transcript}

            **Instructions:**  
            - Return output as a **JSON object** with `"sections"` as a list.
            - Each section should contain:
              - `"heading"`: The main topic or key concept.
              - `"explanation"`: A brief yet informative explanation.
            - Provide **at least 5 sections**.
            - Ensure **clean and extractable JSON output**.

            **Expected JSON format:**
            ```json
            {{
                "sections": [
                    {{"heading": "Introduction to XYZ", "explanation": "XYZ refers to..."}},
                    {{"heading": "Key Concepts", "explanation": "The fundamental ideas are..."}},
                    ...
                ]
            }}
            ```
            """,
            "stream": False  # Disable streaming for a single response
        }

        # Send request to Ollama API
        response = requests.post(url, json=payload)
        print("Ollama API response:", response.text)

        # Check for API errors
        if response.status_code != 200:
            return jsonify({"error": f"Ollama API error: {response.status_code}", "details": response.text}), 500

        # Parse the API response
        try:
            response_json = response.json()
            # Extract the full response from the "response" key
            full_response = response_json.get("response", "")
            print("Full response:", full_response)

            # Attempt to extract JSON from the response
            match = re.search(r"\{.*\}", full_response, re.DOTALL)
            if match:
                response_json = json.loads(match.group())
            else:
                return jsonify({"error": "Failed to extract valid JSON from response"}), 500

            # Ensure "sections" exist in the response
            if isinstance(response_json, dict) and "sections" in response_json:
                # Add timestamps and links to each section
                for section in response_json["sections"]:
                    timestamp = find_timestamp_for_heading(
                        section["heading"],
                        section["explanation"],
                        transcript
                    )
                    print("Timestamp:", timestamp)
                    if timestamp:
                        section["timestamp"] = timestamp
                        section["link"] = f"{youtube_link}&t={convert_timestamp_to_seconds(timestamp)}"
                        print(section["link"])
                    else:
                        section["timestamp"] = "N/A"
                        section["link"] = youtube_link

                # Add the video title to the response
                response_json["title"] = video_title

                return jsonify(response_json), 200
            else:
                return jsonify({"error": "Invalid response format from AI model"}), 500

        except json.JSONDecodeError as e:
            return jsonify({"error": f"Failed to parse JSON response: {e}"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)