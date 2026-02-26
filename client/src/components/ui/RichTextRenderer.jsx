import React from "react";
import { useTheme } from "../../context";

const RichTextRenderer = ({ content }) => {
  const { isDark } = useTheme();

  if (!content) return null;

  // Simple HTML detection (if it starts with a tag-like structure or contains known HTML tags)
  // This is a naive check but works for our specific editor output which will likely start with content or be wrapped.
  // Actually, standard text might not start with a tag.
  // But our new editor produces HTML.
  // Let's rely on a check for tags like <span, <div, <p, <b, <i, <strong, <em
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtml) {
    return (
      <div
        className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"} 
        [&_p]:mb-3 [&_p]:leading-relaxed
        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
        [&_li]:mb-1 [&_li]:leading-relaxed
        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:text-gray-900 dark:[&_h1]:text-gray-100
        [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-gray-900 dark:[&_h2]:text-gray-100
        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3
        [&_u]:underline [&_s]:line-through [&_strike]:line-through 
        [&_strong]:font-bold [&_strong]:text-gray-900 dark:[&_strong]:text-gray-100
        [&_a]:text-blue-500 [&_a]:hover:underline
        [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:font-mono [&_pre]:my-3 [&_pre]:text-gray-800 [&_pre]:overflow-x-auto dark:[&_pre]:bg-gray-800 dark:[&_pre]:text-gray-200 dark:[&_pre]:border dark:[&_pre]:border-gray-700
        [&_code]:font-mono [&_code]:bg-gray-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs dark:[&_code]:bg-gray-800`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Legacy Markdown Rendering (Fallback)
  const lines = content.split("\n");

  return (
    <div className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
      {lines.map((line, lineIndex) => {
        // ...
        // Handle Bullet Points
        if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
          const listContent = line.replace(/^[•-]\s*/, "");
          return (
            <div key={lineIndex} className="flex gap-2 ml-2 my-1">
              <span className="text-gray-400">•</span>
              <span>{parseInlineFormatting(listContent, isDark)}</span>
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p key={lineIndex} className="min-h-[1.2em] mb-1">
            {parseInlineFormatting(line, isDark)}
          </p>
        );
      })}
    </div>
  );
};

// Helper to parse inline styles (Bold, Italic, Mentions)
const parseInlineFormatting = (text, isDark) => {
  if (!text) return null;

  // Tokenize string by regex for matches
  // Matches:
  // 1. **bold**
  // 2. _italic_
  // 3. @mention (now supports dots)

  const parts = text.split(/(\*\*.*?\*\*|_{1}.*?_{1}|@[\w.]+)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-gray-900 dark:text-gray-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={i} className="italic text-gray-900 dark:text-gray-100">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("@")) {
      return (
        <span
          key={i}
          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-600 text-white mx-0.5 select-none"
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

export default RichTextRenderer;
