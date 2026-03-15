import React, { useRef, useState, useEffect, useCallback } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useTheme } from "../../context";
import { authService } from "../../api/auth";
import logger from "../../utils/logger.js";

const RichMentionEditor = ({
  value,
  onChange,
  placeholder,
  users = [],
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const quillRef = useRef(null);
  const toolbarRef = useRef(null);
  const [isProofreading, setIsProofreading] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const [improvedText, setImprovedText] = useState("");
  const [wordStats, setWordStats] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = useCallback(
    (text) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(text);
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const handleProofread = useCallback(async () => {
    if (!value || !value.trim() || isProofreading) return;

    // Save to history before proofreading
    addToHistory(value);

    try {
      setIsProofreading(true);
      const token = authService.getAccessToken();

      // Remove HTML tags for proofreading (send plain text)
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = value;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";

      if (!plainText.trim()) {
        setIsProofreading(false);
        return;
      }

      const response = await fetch(
        "http://localhost:3001/api/v1/assistant/proofread",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: plainText,
            language: selectedLanguage,
          }),
        },
      );

      const data = await response.json();

      if (data.success && data.improved) {
        // Calculate word stats
        const origWords = plainText
          .split(/\s+/)
          .filter((w) => w.length > 0).length;
        const improvedWords = data.improved
          .split(/\s+/)
          .filter((w) => w.length > 0).length;
        const origChars = plainText.length;
        const improvedChars = data.improved.length;

        setWordStats({
          originalWords: origWords,
          improvedWords: improvedWords,
          originalChars: origChars,
          improvedChars: improvedChars,
          reduction: origWords - improvedWords,
        });

        // Store both versions
        setOriginalText(plainText);
        setImprovedText(data.improved);

        // Show diff modal for accept/reject
        setShowDiffModal(true);
      }
    } catch (error) {
      logger.error("Proofreading error:", error);
    } finally {
      setIsProofreading(false);
    }
  }, [value, selectedLanguage, addToHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onChange(history[historyIndex - 1]);
    }
  }, [historyIndex, history, onChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onChange(history[historyIndex + 1]);
    }
  }, [historyIndex, history, onChange]);

  const handleAccept = useCallback(() => {
    onChange(improvedText);
    addToHistory(improvedText);
    setShowDiffModal(false);
    setOriginalText("");
    setImprovedText("");
    setWordStats(null);
  }, [improvedText, addToHistory, onChange]);

  const handleReject = useCallback(() => {
    setShowDiffModal(false);
    setOriginalText("");
    setImprovedText("");
    setWordStats(null);
  }, []);

  // Add custom Nova button to toolbar after mount
  useEffect(() => {
    if (toolbarRef.current) {
      // Check if button already exists
      const existingButton = toolbarRef.current.querySelector(".nova-ai-btn");
      if (!existingButton) {
        // No extra toolbar buttons needed
      }
    }
  }, [
    isDark,
    selectedLanguage,
    history,
    historyIndex,
    isProofreading,
    value,
    handleProofread,
    handleUndo,
    handleRedo,
  ]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "link"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
  };

  const formats = ["header", "bold", "italic", "underline", "link", "list"];

  return (
    <>
      <div
        className={`rich-mention-editor-container ${isDark ? "dark-mode-quill" : ""}`}
      >
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          /* Container Structure */
          .rich-mention-editor-container {
              border-radius: 0.375rem;
              overflow: visible;
              border: 1px solid ${isDark ? "#4b5563" : "#d1d5db"};
              background-color: ${isDark ? "#111827" : "#ffffff"};
              display: flex;
              flex-direction: column;
          }

          /* Toolbar Styling */
          .rich-mention-editor-container .ql-toolbar {
              border: none;
              border-bottom: 1px solid ${isDark ? "#374151" : "#e5e7eb"} !important;
              background-color: ${isDark ? "#1f2937" : "#f9fafb"};
              padding: 8px;
              border-top-left-radius: 0.375rem;
              border-top-right-radius: 0.375rem;
          }

          /* Icon Colors */
          .rich-mention-editor-container .ql-snow .ql-stroke {
              stroke: ${isDark ? "#d1d5db" : "#4b5563"};
          }
          .rich-mention-editor-container .ql-snow .ql-fill {
              fill: ${isDark ? "#d1d5db" : "#4b5563"};
          }
          .rich-mention-editor-container .ql-snow .ql-picker {
              color: ${isDark ? "#d1d5db" : "#4b5563"};
          }
          
          /* Nova AI Button Hover */
          .ql-nova-ai:hover svg {
              stroke: #8b5cf6 !important;
          }
          .ql-nova-ai {
              border-radius: 4px;
          }

          /* Undo/Redo Hover */
          .nova-undo-btn:hover svg, .nova-redo-btn:hover svg {
              stroke: #3b82f6;
          }
          
          /* Active State */
          .rich-mention-editor-container .ql-snow .ql-active .ql-stroke {
              stroke: #3b82f6 !important;
          }
          .rich-mention-editor-container .ql-snow .ql-active .ql-fill {
              fill: #3b82f6 !important;
          }

          /* Editor Content */
          .rich-mention-editor-container .ql-container {
              border: none !important;
              font-family: inherit;
              font-size: 0.875rem;
              flex: 1;
              display: flex;
              flex-direction: column;
              border-bottom-left-radius: 0.375rem;
              border-bottom-right-radius: 0.375rem;
          }
          
          .rich-mention-editor-container .ql-editor {
              color: ${isDark ? "#e5e7eb" : "#111827"};
              min-height: 120px;
              max-height: 200px;
              overflow-y: auto;
              padding: 12px 15px;
              line-height: 1.625;
          }

          .rich-mention-editor-container .ql-editor p {
              margin-bottom: 0.75rem;
          }
          
          .rich-mention-editor-container .ql-editor h1 {
              font-size: 1.25rem;
              font-weight: 700;
              margin-top: 1rem;
              margin-bottom: 0.75rem;
              color: ${isDark ? "#f3f4f6" : "#111827"};
          }
          
          .rich-mention-editor-container .ql-editor h2 {
              font-size: 1.125rem;
              font-weight: 600;
              margin-top: 0.75rem;
              margin-bottom: 0.5rem;
              color: ${isDark ? "#f3f4f6" : "#111827"};
          }

          .rich-mention-editor-container .ql-editor ul,
          .rich-mention-editor-container .ql-editor ol {
              padding-left: 1.5rem;
              margin-bottom: 1rem;
          }

          .rich-mention-editor-container .ql-editor li {
              margin-bottom: 0.25rem;
          }

          .rich-mention-editor-container .ql-editor li.ql-indent-1 { padding-left: 1.5rem; }
          .rich-mention-editor-container .ql-editor li.ql-indent-2 { padding-left: 3rem; }
          .rich-mention-editor-container .ql-editor li.ql-indent-3 { padding-left: 4.5rem; }
          
          .rich-mention-editor-container .ql-editor.ql-blank::before {
              color: ${isDark ? "#9ca3af" : "#9ca3af"};
              font-style: normal;
          }

          .rich-mention-editor-container .ql-tooltip {
              z-index: 50;
              background-color: ${isDark ? "#1f2937" : "#ffffff"};
              border: 1px solid ${isDark ? "#374151" : "#e5e7eb"};
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              border-radius: 0.375rem;
              color: ${isDark ? "#e5e7eb" : "#374151"};
          }
          .rich-mention-editor-container .ql-tooltip input[type=text] {
              border: 1px solid ${isDark ? "#374151" : "#d1d5db"};
              background-color: ${isDark ? "#374151" : "#ffffff"};
              color: ${isDark ? "#e5e7eb" : "#111827"};
              border-radius: 0.25rem;
          }
          .rich-mention-editor-container .ql-tooltip .ql-action {
               color: #3b82f6;
               font-weight: 500;
          }
        `}</style>

        <div ref={toolbarRef} className="ql-toolbar ql-snow" />
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={(content) => {
            onChange(content);
            if (content !== value && history[historyIndex] !== content) {
              addToHistory(content);
            }
          }}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
        />
      </div>

      {/* Diff Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div
            className={`${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"} border rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col`}
          >
            {/* Header */}
            <div
              className={`p-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
            >
              <h3
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Nova AI Improvements
              </h3>
              {wordStats && (
                <div
                  className={`mt-2 flex gap-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  <span>
                    Words: {wordStats.originalWords} → {wordStats.improvedWords}
                    {wordStats.reduction > 0 && (
                      <span className="text-green-500">
                        {" "}
                        (-{wordStats.reduction})
                      </span>
                    )}
                  </span>
                  <span>
                    Characters: {wordStats.originalChars} →{" "}
                    {wordStats.improvedChars}
                  </span>
                </div>
              )}
            </div>

            {/* Diff View */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Original */}
                <div>
                  <h4
                    className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Original
                  </h4>
                  <div
                    className={`p-3 rounded border ${isDark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"} max-h-96 overflow-y-auto`}
                  >
                    <p
                      className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${isDark ? "text-gray-300" : "text-gray-800"}`}
                      style={{ wordBreak: "break-word" }}
                    >
                      {originalText}
                    </p>
                  </div>
                </div>

                {/* Improved */}
                <div>
                  <h4
                    className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Improved
                  </h4>
                  <div
                    className={`p-3 rounded border ${isDark ? "bg-green-900/20 border-green-800" : "bg-green-50 border-green-200"} max-h-96 overflow-y-auto`}
                  >
                    <p
                      className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${isDark ? "text-gray-300" : "text-gray-800"}`}
                      style={{ wordBreak: "break-word" }}
                    >
                      {improvedText}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              className={`p-4 border-t ${isDark ? "border-gray-700" : "border-gray-200"} flex justify-end gap-3`}
            >
              <button
                onClick={handleReject}
                className={`px-4 py-2 rounded-lg font-medium ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium hover:from-violet-700 hover:to-purple-700"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RichMentionEditor;
