import React, { useRef, useState, useEffect, useCallback } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useTheme } from "../../context";
import { authService } from "../../api/auth";

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
      console.error("Proofreading error:", error);
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
        // Create separator
        const separator = document.createElement("span");
        separator.className = "ql-formats nova-separator";
        separator.style.cssText = `
          border-left: ${isDark ? "1px solid #374151" : "1px solid #e5e7eb"};
          height: 20px;
          margin: 0 4px;
          display: inline-block;
        `;

        // Create language selector
        const langContainer = document.createElement("span");
        langContainer.className = "ql-formats";
        const langSelect = document.createElement("select");
        langSelect.className = "nova-lang-select";
        langSelect.value = selectedLanguage;
        langSelect.style.cssText = `
          background: ${isDark ? "#374151" : "#f9fafb"};
          border: 1px solid ${isDark ? "#4b5563" : "#d1d5db"};
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 13px;
          color: ${isDark ? "#e5e7eb" : "#374151"};
          cursor: pointer;
        `;
        ["en", "es", "fr", "de", "it", "pt", "zh", "ja"].forEach((lang) => {
          const option = document.createElement("option");
          option.value = lang;
          option.textContent = lang.toUpperCase();
          langSelect.appendChild(option);
        });
        langSelect.addEventListener("change", (e) =>
          setSelectedLanguage(e.target.value),
        );
        langContainer.appendChild(langSelect);

        // Create undo/redo buttons
        const historyContainer = document.createElement("span");
        historyContainer.className = "ql-formats";

        const undoBtn = document.createElement("button");
        undoBtn.className = "ql-undo nova-undo-btn";
        undoBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>`;
        undoBtn.title = "Undo (Ctrl+Z)";
        undoBtn.addEventListener("click", (e) => {
          e.preventDefault();
          handleUndo();
        });

        const redoBtn = document.createElement("button");
        redoBtn.className = "ql-redo nova-redo-btn";
        redoBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/></svg>`;
        redoBtn.title = "Redo (Ctrl+Y)";
        redoBtn.addEventListener("click", (e) => {
          e.preventDefault();
          handleRedo();
        });

        historyContainer.appendChild(undoBtn);
        historyContainer.appendChild(redoBtn);

        // Create Nova AI button
        const novaContainer = document.createElement("span");
        novaContainer.className = "ql-formats";
        const novaButton = document.createElement("button");
        novaButton.className = "ql-nova-ai nova-ai-btn";
        novaButton.type = "button"; // Prevent form submission
        novaButton.title = "Nova Writing Assistant";
        novaButton.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/>
          </svg>
        `;
        novaButton.setAttribute("data-handler", "nova-proofread");
        novaContainer.appendChild(novaButton);

        // Append all to toolbar
        toolbarRef.current.appendChild(separator);
        toolbarRef.current.appendChild(langContainer);
        toolbarRef.current.appendChild(historyContainer);
        toolbarRef.current.appendChild(novaContainer);
      }

      // Update button states and attach fresh handlers
      const undoBtn = toolbarRef.current.querySelector(".nova-undo-btn");
      const redoBtn = toolbarRef.current.querySelector(".nova-redo-btn");
      const novaBtn = toolbarRef.current.querySelector(".nova-ai-btn");

      // Remove old event listeners and add fresh ones with current closure
      if (undoBtn) {
        const newUndoBtn = undoBtn.cloneNode(true);
        undoBtn.parentNode.replaceChild(newUndoBtn, undoBtn);
        newUndoBtn.disabled = historyIndex <= 0;
        newUndoBtn.style.opacity = historyIndex <= 0 ? "0.5" : "1";
        newUndoBtn.style.cursor = historyIndex <= 0 ? "not-allowed" : "pointer";
        newUndoBtn.addEventListener("click", (e) => {
          e.preventDefault();
          handleUndo();
        });
      }

      if (redoBtn) {
        const newRedoBtn = redoBtn.cloneNode(true);
        redoBtn.parentNode.replaceChild(newRedoBtn, redoBtn);
        newRedoBtn.disabled = historyIndex >= history.length - 1;
        newRedoBtn.style.opacity =
          historyIndex >= history.length - 1 ? "0.5" : "1";
        newRedoBtn.style.cursor =
          historyIndex >= history.length - 1 ? "not-allowed" : "pointer";
        newRedoBtn.addEventListener("click", (e) => {
          e.preventDefault();
          handleRedo();
        });
      }

      if (novaBtn) {
        const newNovaBtn = novaBtn.cloneNode(true);
        novaBtn.parentNode.replaceChild(newNovaBtn, novaBtn);

        // Don't disable, just style differently
        const hasText = value && value.trim() && value !== "<p><br></p>";
        newNovaBtn.style.background = isProofreading
          ? "#8b5cf6"
          : "transparent";
        newNovaBtn.style.opacity = !hasText ? "0.5" : "1";
        newNovaBtn.style.cursor =
          isProofreading || !hasText ? "not-allowed" : "pointer";
        newNovaBtn.style.borderRadius = "4px";
        newNovaBtn.style.padding = "3px 5px";

        const svg = newNovaBtn.querySelector("svg");
        if (svg) {
          svg.style.stroke = isProofreading
            ? "#fff"
            : isDark
              ? "#d1d5db"
              : "#4b5563";
          svg.style.animation = isProofreading
            ? "pulse 1.5s ease-in-out infinite"
            : "none";
        }

        newNovaBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Nova button clicked!", {
            hasText,
            isProofreading,
            value,
          });
          if (!isProofreading && hasText) {
            handleProofread();
          }
        });
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
