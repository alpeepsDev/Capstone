import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { authService } from "../../api/auth.js";
import NovaChart from "./NovaChart";

// Format message text with support for numbered lists and bullet points
const formatMessage = (text) => {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let currentList = null;
  let listItems = [];

  const flushList = () => {
    if (currentList && listItems.length > 0) {
      elements.push(
        <ul key={elements.length} className="ml-4 mt-2 mb-2 space-y-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-violet-500 font-bold">
                {currentList === "numbered" ? `${idx + 1}.` : "•"}
              </span>
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>,
      );
      listItems = [];
      currentList = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Numbered list: "1. ", "2. ", etc.
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      if (currentList !== "numbered") {
        flushList();
        currentList = "numbered";
      }
      listItems.push(numberedMatch[2]);
      return;
    }

    // Bullet list: "• ", "- ", "* "
    const bulletMatch = trimmed.match(/^[•\-\*]\s+(.+)$/);
    if (bulletMatch) {
      if (currentList !== "bulleted") {
        flushList();
        currentList = "bulleted";
      }
      listItems.push(bulletMatch[1]);
      return;
    }

    // Regular text
    if (trimmed) {
      flushList();
      elements.push(
        <p key={index} className="mb-2 last:mb-0">
          {trimmed}
        </p>,
      );
    } else if (elements.length > 0) {
      // Empty line - add spacing
      elements.push(<div key={index} className="h-2" />);
    }
  });

  flushList();

  return <div className="whitespace-pre-wrap">{elements}</div>;
};

const NovaAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm Nova, your project assistant. Ask me 'What should I work on?' or 'Any risks?'",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now(),
      text: query,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsTyping(true);

    try {
      // Get token from authService
      const token = authService.getAccessToken();

      // Call API
      // Note: Assuming /api prefix is proxy-handled or fully specified if needed
      // In local dev, usually /api/v1/...
      const response = await fetch("/api/v1/assistant/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: userMsg.text }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to Nova AI");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      const botMsgId = Date.now() + 1;

      // Add a placeholder bot message for the stream
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          text: "",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);

      let accumulatedText = "";
      let firstChunkReceived = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          if (!firstChunkReceived) {
            firstChunkReceived = true;
            setIsTyping(false); // Hide the dots once we start receiving text
          }

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");

          // Keep the last part in buffer if it's incomplete
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (part.startsWith("data: ")) {
              const dataStr = part.slice(6);
              if (dataStr === "[DONE]") {
                done = true;
                break;
              }

              try {
                const parsed = JSON.parse(dataStr);

                if (parsed.type === "text") {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMsgId
                        ? { ...msg, text: accumulatedText }
                        : msg,
                    ),
                  );
                } else if (parsed.type === "chart") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMsgId
                        ? { ...msg, chartData: parsed.chartData }
                        : msg,
                    ),
                  );
                } else if (parsed.type === "data") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMsgId
                        ? { ...msg, data: parsed.payload }
                        : msg,
                    ),
                  );
                } else if (parsed.type === "fallback") {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMsgId
                        ? { ...msg, text: accumulatedText, data: parsed.data }
                        : msg,
                    ),
                  );
                } else if (parsed.type === "error") {
                  accumulatedText += "\n" + parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === botMsgId
                        ? { ...msg, text: accumulatedText, isError: true }
                        : msg,
                    ),
                  );
                }
              } catch (e) {
                console.warn("Could not parse SSE line:", part);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Nova Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text:
            error.message ||
            "I'm having trouble connecting to my brain right now. Please try again.",
          sender: "bot",
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl hover:shadow-violet-500/50 transition-all duration-300 flex items-center justify-center z-50 group"
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="text-white h-6 w-6" />
        </motion.div>
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute -top-10 right-0 bg-white text-gray-800 px-3 py-1 rounded-lg text-xs font-medium shadow-lg whitespace-nowrap"
        >
          Ask Nova
        </motion.span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-6 right-6 w-80 md:w-96 bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 flex flex-col overflow-hidden z-50 h-[34rem]"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-5 flex items-center justify-between text-white relative overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent)]" />
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="bg-white/20 backdrop-blur-sm p-2 rounded-xl"
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h3 className="font-bold text-base">Nova AI</h3>
            <p className="text-xs text-white/80">Your intelligent assistant</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-2 rounded-lg transition-colors backdrop-blur-sm relative z-10"
        >
          <X className="h-5 w-5" />
        </motion.button>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50">
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 400,
                delay: index * 0.03,
              }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <motion.div
                whileHover={{ scale: 1.01 }}
                className={`max-w-[80%] rounded-2xl p-4 text-sm shadow-lg ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-md"
                    : "bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-gray-800 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 rounded-bl-md"
                }`}
              >
                {formatMessage(msg.text)}

                {/* Chart Visualization */}
                {msg.chartData && (
                  <NovaChart
                    data={msg.chartData.data}
                    type={msg.chartData.type}
                    title={msg.chartData.title}
                  />
                )}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-4 rounded-2xl rounded-bl-md border border-gray-200/50 dark:border-gray-700/50 flex gap-1.5 shadow-lg">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                  className="w-2 h-2 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full shadow-sm"
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSend}
        className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 flex gap-3"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isTyping}
          placeholder="Ask about tasks, risks, deadlines..."
          className="flex-1 text-sm bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm border border-transparent focus:border-violet-500 focus:bg-white dark:focus:bg-gray-900/90 rounded-2xl px-5 py-3 outline-none transition-all dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          type="submit"
          disabled={!query.trim() || isTyping}
          className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-3 rounded-2xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg disabled:shadow-none"
        >
          <Send className="h-5 w-5" />
        </motion.button>
      </motion.form>
    </motion.div>
  );
};

export default NovaAssistant;
