# 🎥 V2N

## 📌 Overview
This is a **full-stack application** that extracts, summarizes, and translates **YouTube video transcripts**.

✅ Fetch **YouTube video transcripts**  
✅ Generate **summarized key points**  
✅ **Real-time WebSocket updates**  
✅ **Downloadable PDF** of the summary  

Built using:  
- 🖥 **Backend:** Flask, SocketIO, YouTube Transcript API  
- 🌐 **Frontend:** Next.js (React)  

---

## 🛠 Installation  

### 🔹 Prerequisites  
- **Python 3.8+**  
- **Node.js 16+**  
- **pip & npm/yarn installed**  

---

### 🔹 Backend (Flask API)  

1️⃣ **Clone the repository**  
   ```bash
   git clone https://github.com/prithvi1236/fosshack25.git
   cd fosshack25/backend
   ```  

2️⃣ **Install dependencies**  
   ```bash
   pip install -r requirements.txt
   ```  

3️⃣ **Run the Flask server**  
   ```bash
   python app.py
   ```  

---

### 🔹 Frontend (Next.js)  

1️⃣ **Navigate to frontend directory**  
   ```bash
   cd ../frontend
   ```  

2️⃣ **Install dependencies**  
   ```bash
   npm install
   ```  
   or  
   ```bash
   yarn install
   ```  

3️⃣ **Run the Next.js app**  
   ```bash
   npm run dev
   ```  

Your frontend will be available at **http://localhost:3000**  

---

## ⚡ Usage  

### 🔹 Fetch & Summarize YouTube Video  

#### **API Endpoint (Flask)**  
```http
GET /summarize?video_id=VIDEO_ID
```  
#### **Example Request**  
```bash
curl "http://127.0.0.1:5000/summarize?video_id=dQw4w9WgXcQ"
```  
#### **Response**  
```json
{
  "video_id": "dQw4w9WgXcQ",
  "summary": [
    {"heading": "Introduction", "explanation": "The video explains AI's impact on daily life."},
    {"heading": "Key Takeaways", "explanation": "AI helps in automation and decision-making."}
  ]
}
```  

---

### 🔹 Next.js Frontend Functionality  

- **Paste YouTube URL** to fetch the summary.  
- **Real-time updates** via WebSockets.  
- **Download summary as PDF** with structured sections.  

#### **WebSocket Event (`summary_update`)**  
```json
{
  "video_id": "dQw4w9WgXcQ",
  "sections": [
    {"heading": "AI Impact", "explanation": "AI is changing industries worldwide."}
  ]
}
```
---

## 📝 Commit Guidelines  
- ✅ **Good Examples:**  
  ```bash
  feat: add transcript summarization  
  fix: handle missing subtitles gracefully  
  refactor: improve summary translation logic  
  ```  
- ❌ **Bad Examples:**  
  ```bash
  update files  
  fix bugs  
  added summary feature  
  ```

---

## 🤝 Contributing  
1️⃣ **Fork the repo**  
2️⃣ **Create a feature branch (`feature-name`)**  
3️⃣ **Commit your changes**  
4️⃣ **Push and create a PR**  

---

## 📜 License  
MIT License  

---

