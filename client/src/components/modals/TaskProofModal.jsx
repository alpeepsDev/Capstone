import React, { useState, useRef } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "../ui";
import { useTheme } from "../../context";

const TaskProofModal = ({ isOpen, onClose, onConfirm, task }) => {
  const { isDark } = useTheme();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  
  React.useEffect(() => {
    // Reset state when modal opens for a different task or is re-opened
    if (isOpen) {
      clearFiles();
    }
  }, [isOpen, task?.id]);

  React.useEffect(() => {
    // cleanup preview urls if component unmounts
    return () => {
      previews.forEach(preview => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [previews]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    addFiles(droppedFiles);
  };

  const addFiles = (newFiles) => {
    const validatedFiles = [];
    let newError = "";

    for (const selectedFile of newFiles) {
      if (!selectedFile.type.startsWith("image/")) {
        newError = "Please upload image files only (JPG, PNG, WebP)";
        continue;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        newError = "Each image must be smaller than 5MB";
        continue;
      }

      validatedFiles.push(selectedFile);
    }

    if (files.length + validatedFiles.length > 10) {
      setError("Maximum 10 images allowed");
      return;
    }

    if (newError) {
      setError(newError);
    } else {
      // Clear error when files are successfully added
      setError("");
    }

    if (validatedFiles.length > 0) {
      const newPreviews = validatedFiles.map(file => URL.createObjectURL(file));
      setFiles([...files, ...validatedFiles]);
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke the removed preview URL
    URL.revokeObjectURL(previews[index]);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    
    // Clear error if we still have files after removal
    if (newFiles.length > 0 && error) {
      setError("");
    }
  };

  const clearFiles = () => {
    setFiles([]);
    previews.forEach(preview => {
      if (preview) URL.revokeObjectURL(preview);
    });
    setPreviews([]);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError("At least one proof photo is required to move task to review");
      return;
    }
    onConfirm(files);
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <DialogPanel
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
                <DialogTitle
                  className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Submit for Review
                </DialogTitle>

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
                  You are moving <strong>{task?.title || "this task"}</strong> to Review.
                  You can upload one or more proof photos (up to 10).

                </p>
              </div>

              {/* Upload Area */}
              <div
                className={`relative group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-all cursor-pointer mb-4 ${
                  error ? "border-red-500 bg-red-50 dark:bg-red-900/10" :
                  isDark
                    ? "border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-blue-500"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-500"
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className={`p-3 rounded-full mb-3 ${isDark ? "bg-gray-700 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className={`mb-1 text-sm font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Click to upload or drag and drop
                  </p>
                  <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                    PNG, JPG or WebP (MAX. 5MB each)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                />
              </div>

              {/* Preview Grid */}
              {previews.length > 0 && (
                <div className="mb-4">
                  <p className={`text-xs font-semibold mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Selected Images ({files.length}/10)
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {previews.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={preview}
                          alt={`Proof ${idx + 1}`}
                          className={`w-20 h-20 object-cover rounded border ${isDark ? "border-gray-600" : "border-gray-300"}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  className={files.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
                  disabled={files.length === 0}
                >
                  Submit for Review
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogPanel>

        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default TaskProofModal;
