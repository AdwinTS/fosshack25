from flask import Flask, request, jsonify, Response, stream_with_context
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled
from deep_translator import GoogleTranslator
import re
from flask_cors import CORS
import json
import requests

app = Flask(__name__)
CORS(app)

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

        transcript, error = fetch_transcript(youtube_link)
        if error:
            return jsonify({"error": error}), 400

        if not transcript:
            return jsonify({"error": "No transcript available."}), 400

        # Format the transcript
        formatted_transcript = "\n".join([f"{timestamp}: {text}" for timestamp, text in transcript.items()])
        print("Formatted transcript:", formatted_transcript)

        # Define payload for Ollama API
        url = "http://localhost:11435/api/generate"  # Updated endpoint
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
                return jsonify({"sections": response_json["sections"], "status": "success"}), 200
            else:
                return jsonify({"error": "Invalid response format from AI model"}), 500

        except json.JSONDecodeError as e:
            return jsonify({"error": f"Failed to parse JSON response: {e}"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)