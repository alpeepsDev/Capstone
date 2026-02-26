import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../../context";

const MentionInput = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  users = [],
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const editorRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [mentionRange, setMentionRange] = useState(null);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== value) {
      if (value === "") {
        editorRef.current.innerHTML = "";
      }
    }
  }, [value]);

  const handleInput = (e) => {
    const text = e.target.innerText;
    onChange(text);

    // Check for mention trigger
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textBeforeCursor = range.startContainer.textContent.slice(
        0,
        range.startOffset,
      );

      const lastAtPos = textBeforeCursor.lastIndexOf("@");

      if (lastAtPos !== -1) {
        const query = textBeforeCursor.slice(lastAtPos + 1);
        // Only show if no spaces (simple check)
        // Allow dots in username
        if (!query.includes(" ")) {
          setMentionRange({
            container: range.startContainer,
            start: lastAtPos,
            end: range.startOffset,
          });
          setSuggestionQuery(query);
          setShowSuggestions(true);
          setSuggestionIndex(0);
          return;
        }
      }
    }

    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showSuggestions) {
        insertMention(filteredUsers[suggestionIndex]);
      } else {
        onSubmit();
      }
    } else if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex((prev) =>
          prev < filteredUsers.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredUsers.length - 1,
        );
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      } else if (e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredUsers[suggestionIndex]);
      }
    }
  };

  const insertMention = (user) => {
    if (!user || !mentionRange) return;

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    // Create the pill element
    const pill = document.createElement("span");
    pill.className =
      "inline-flex items-center px-1.5 py-0.5 rounded text-sm font-medium bg-blue-600 text-white mx-1 select-none";
    pill.contentEditable = false;
    pill.innerText = `@${user.username}`;
    pill.dataset.userId = user.id;

    // Delete the typed @query
    const textNode = mentionRange.container;
    const beforeText = textNode.textContent.slice(0, mentionRange.start);
    const afterText = textNode.textContent.slice(mentionRange.end);

    textNode.textContent = beforeText;
    const afterNode = document.createTextNode(" " + afterText);

    // Debug logging
    console.log("Inserting mention:", {
      user: user.username,
      before: beforeText,
      after: afterText,
    });

    // Insert pill and trailing space
    textNode.parentNode.insertBefore(pill, textNode.nextSibling);
    textNode.parentNode.insertBefore(afterNode, pill.nextSibling);

    // Move cursor after the space
    const newRange = document.createRange();
    newRange.setStart(afterNode, 1);
    newRange.setEnd(afterNode, 1);
    selection.removeAllRanges();
    selection.addRange(newRange);

    // Update state
    onChange(editorRef.current.innerText);
    setShowSuggestions(false);
    editorRef.current.focus();
  };

  const filteredUsers = users.filter((user) =>
    (user.username || "").toLowerCase().includes(suggestionQuery.toLowerCase()),
  );

  return (
    <div className="relative w-full">
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[42px] max-h-32 overflow-y-auto whitespace-pre-wrap break-words ${
          isDark
            ? "border-gray-600 bg-gray-800 text-white"
            : "border-gray-300 bg-white text-gray-900"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
      />

      {/* Placeholder simulation */}
      {(!value || value === "\n") && (
        <div
          className={`absolute top-2 left-3 pointer-events-none ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          {placeholder}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredUsers.length > 0 && (
        <div
          className={`absolute top-full left-0 mt-1 w-64 max-h-48 overflow-y-auto rounded-md shadow-lg border ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          } z-50`}
        >
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              onClick={() => insertMention(user)}
              className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                index === suggestionIndex
                  ? isDark
                    ? "bg-gray-700"
                    : "bg-gray-100"
                  : ""
              } ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {(user.username || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <div
                  className={`text-sm font-medium ${
                    isDark ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  {user.username}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
