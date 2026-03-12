import React, { useState, useRef } from "react";
import { Dialog } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "../ui";
import { useTheme } from "../../context";

const TaskProofModal = ({ isOpen, onClose, onConfirm, task }) => {
  const { isDark } = useTheme();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WebP)");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setError("");
    setFile(selectedFile);
    
    // Create preview
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
  };

  const clearFile = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setError("Proof photo is required to move task to review");
      return;
    }
    onConfirm(file);
    // Modal will be closed by parent, cleanup preview when properly closed
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          open={isOpen}
          onClose={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <Dialog.Panel
            as={motion.div}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`relative w-full max-w-md overflow-hidden rounded-2xl shadow-xl ${
              isDark ? "bg-gray-900 border border-gray-800" : "bg-white"
            }`}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b ${isDark ? "border-gray-800" : "border-gray-100"}`}>
              <div className="flex items-center justify-between">
                <Dialog.Title
                  className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Submit for Review
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full transition-colors ${
                    isDark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6 border-l-4 border-blue-500 pl-4 py-1">
                <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  You are moving <strong>{task?.title}</strong> to Review.
                  A proof photo is required.
                </p>
              </div>

              <div
                className={`relative group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-all ${
                  error ? "border-red-500 bg-red-50 dark:bg-red-900/10" :
                  preview ? "border-transparent" :
                  isDark
                    ? "border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-blue-500"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-500"
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !preview && fileInputRef.current?.click()}
              >
                {preview ? (
                  <div className="relative w-full h-full rounded-xl overflow-hidden group-hover:opacity-90 transition-opacity">
                    <img
                      src={preview}
                      alt="Proof preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg transform scale-90 group-hover:scale-100 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 cursor-pointer">
                    <div className={`p-3 rounded-full mb-3 ${isDark ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className={`mb-1 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Click to upload or drag and drop
                    </p>
                    <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                      PNG, JPG or WebP (MAX. 5MB)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                />
              </div>

              {error && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500" /> {error}
                </p>
              )}

              {/* Actions */}
              <div className="mt-8 flex items-center justify-end gap-3 flex-row-reverse">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className={!file ? "opacity-50 cursor-not-allowed" : ""}
                  disabled={!file}
                >
                  Submit for Review
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </Dialog.Panel>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default TaskProofModal;
