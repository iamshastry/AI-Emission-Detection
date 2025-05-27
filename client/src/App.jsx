import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Loader2 } from 'lucide-react';

function App() {
  const [inputImg, setInputImg] = useState(null);
  const [outputImg, setOutputImg] = useState(null);
  const [smokePercent, setSmokePercent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // 🔄 Fetch detection logs
  const fetchLogs = () => {
    fetch("http://localhost:5001/api/logs")
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch((err) => console.error("Log fetch error:", err));
  };

  useEffect(fetchLogs, []);

  // 📤 Handle image upload and analysis
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setLoading(true);
      const res = await axios.post('http://localhost:5001/api/images/upload', formData);
      setInputImg(res.data.original);
      setOutputImg(res.data.processed);
      setSmokePercent(res.data.smokePercent);
      fetchLogs(); // 🔄 Refresh logs right after analysis
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    const confirmClear = window.confirm("Are you sure you want to delete all detection logs?");
    if (!confirmClear) return;
  
    try {
      await axios.delete("http://localhost:5001/api/logs");
      fetchLogs(); // Refresh log view
    } catch (err) {
      console.error("Error clearing logs:", err);
      alert("Failed to clear logs.");
    }
  };
  
  return (
    <div className="app-wrapper">
      <div className="min-h-screen bg-gray-100 p-6 text-center">
        {/* 🔷 Banner Title */}
        <div className="banner">
          <h1 className="page-title">
            🌫️ AI powered visual detection of <br />Automobile emissions
          </h1>
        </div>

        {/* 📁 File Input */}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="mb-6 p-2 border rounded"
        />

        {/* 🔄 Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center gap-2 mb-6">
            <Loader2 className="animate-spin w-5 h-5" />
            <p>Processing image... please wait.</p>
          </div>
        )}

        {/* 🖼️ Image Preview & Result */}
        <div className="image-grid">
          {inputImg && (
            <div className="image-wrapper">
              <h3>Original Image</h3>
              <img src={inputImg} alt="Original" />
            </div>
          )}

          {outputImg && (
            <div className="image-wrapper">
              <h3>Processed Image</h3>
              <img src={outputImg} alt="Processed" />
              {typeof smokePercent === 'number' && (
                <p className="percentage-display">
                  Smoke Detected: {smokePercent.toFixed(1)}%
                </p>
              )}
            </div>
          )}
        </div>

        {/* 📋 Detection Logs */}
        <h2 className="text-xl font-semibold mt-12 mb-4">📝 Recent Detection Logs</h2>
        <div className="flex justify-center mb-4">
          <button
            onClick={handleClearLogs}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
          🗑️ Clear Logs
          </button> 
        </div>

        <div className="log-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Smoke %</th>
                <th>Result</th>
                <th>Timestamp</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index}>
                  <td>{log.imageName}</td>
                  <td>{log.smokePercent.toFixed(1)}%</td>
                  <td style={{ color: log.result === 'fail' ? 'red' : 'green' }}>{log.result}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
