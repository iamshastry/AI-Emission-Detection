// client/src/components/imageuploader.jsx

import React, { useState } from "react";
import { Loader2, Upload } from "lucide-react";

export default function ImageUploader() {
  const [image, setImage] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [resultImageURL, setResultImageURL] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewURL(URL.createObjectURL(file));
      setResultImageURL(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const blob = await res.blob();
      setResultImageURL(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Emission Detection</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="mb-4"
      />

      {previewURL && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="border p-2 rounded">
            <p className="text-center text-sm">Original Image</p>
            <img src={previewURL} alt="Preview" className="w-full" />
          </div>

          {resultImageURL ? (
            <div className="border p-2 rounded">
              <p className="text-center text-sm">Analyzed Image</p>
              <img src={resultImageURL} alt="Analyzed" className="w-full" />
            </div>
          ) : (
            <div className="border p-2 rounded flex justify-center items-center">
              {loading ? (
                <div className="text-center">
                  <Loader2 className="animate-spin mx-auto" />
                  <p>Analyzing...</p>
                </div>
              ) : (
                <p className="text-center">Click analyze to view results</p>
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!image || loading}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        <Upload className="w-4 h-4" />
        Analyze Image
      </button>
    </div>
  );
}
