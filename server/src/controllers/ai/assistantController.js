import prisma from "../../config/database.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Deterministic Fallback Logic (Rule-Based)
 * Used when Gemini is offline or rate-limited.
 */
const runDeterministicFallback = async (query, userId) => {
  const lowerQuery = query.toLowerCase();
  let responseText = "";
  let data = null;

  // Overdue Intent
  if (lowerQuery.includes("overdue") || lowerQuery.includes("late")) {
    const overdueTasks = await prisma.task.findMany({
      where: {
        isOverdue: true,
        // assigneeId: userId // optional filter
      },
      take: 5,
      orderBy: { priorityScore: "desc" },
      include: { project: true, assignee: true },
    });

    if (overdueTasks.length > 0) {
      responseText = `(Fallback) I found ${overdueTasks.length} overdue tasks. Critical one: "${overdueTasks[0].title}".`;
      data = overdueTasks;
    } else {
      responseText = "(Fallback) No overdue tasks found.";
      data = [];
    }
  }

  // Risk Intent
  else if (lowerQuery.includes("risk") || lowerQuery.includes("warning")) {
    const riskyTasks = await prisma.task.findMany({
      where: {
        riskLevel: { in: ["HIGH", "CRITICAL"] },
        status: { not: "COMPLETED" },
      },
      take: 5,
      orderBy: { priorityScore: "desc" },
      include: { project: true },
    });

    if (riskyTasks.length > 0) {
      responseText = `(Fallback) Found ${riskyTasks.length} high-risk tasks. Focus on "${riskyTasks[0].title}".`;
      data = riskyTasks;
    } else {
      responseText = "(Fallback) No high-risk tasks detected.";
      data = [];
    }
  }

  // Work / Priority Intent
  else if (lowerQuery.includes("work") || lowerQuery.includes("priority")) {
    const topTasks = await prisma.task.findMany({
      where: { status: { notIn: ["COMPLETED", "IN_REVIEW"] } },
      take: 3,
      orderBy: { priorityScore: "desc" },
      include: { project: true },
    });

    if (topTasks.length > 0) {
      responseText = `(Fallback) You should work on "${topTasks[0].title}" (Score: ${topTasks[0].priorityScore}).`;
      data = topTasks;
    } else {
      responseText = "(Fallback) No pending tasks found.";
      data = [];
    }
  }

  // Default
  else {
    responseText =
      "(Fallback) Brain is offline. Ask about 'overdue', 'risks', or 'work'.";
  }

  return { message: responseText, data, author: "Nova (Offline Mode)" };
};

/**
 * Nova Smart Assistant Controller (Powered by Gemini + Fallback)
 * Processes natural language queries using LLM with database context.
 */
export const askNova = async (req, res) => {
  try {
    const { query } = req.body;
    const userId = req.user?.id;

    console.log(`[Nova AI] Received query: "${query}" from user ${userId}`);

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required.",
        data: null,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message:
          "Nova Brain is offline (Missing API Key). Please contact admin.",
      });
    }

    // --- INTENT DETECTION ---
    const lowerQuery = query.toLowerCase();

    // Project/Task Intent: Does the user need database context?
    const isProjectQuery =
      lowerQuery.includes("task") ||
      lowerQuery.includes("risk") ||
      lowerQuery.includes("overdue") ||
      lowerQuery.includes("priority") ||
      lowerQuery.includes("work") ||
      lowerQuery.includes("status") ||
      lowerQuery.includes("critical") ||
      lowerQuery.includes("urgent") ||
      lowerQuery.includes("deadline") ||
      lowerQuery.includes("project") ||
      lowerQuery.includes("assign") ||
      lowerQuery.includes("schedule") ||
      lowerQuery.includes("late") ||
      lowerQuery.includes("todo") ||
      lowerQuery.includes("doing") ||
      lowerQuery.includes("done") ||
      lowerQuery.includes("review") ||
      lowerQuery.includes("progress");

    // Chart Intent: Does the user want a visualization?
    const hasVisualKeyword =
      lowerQuery.includes("chart") ||
      lowerQuery.includes("graph") ||
      lowerQuery.includes("visual") ||
      lowerQuery.includes("show") ||
      lowerQuery.includes("display") ||
      lowerQuery.includes("stat") || // matches stats, statistics
      lowerQuery.includes("breakdown") ||
      lowerQuery.includes("distribution");

    const hasTextOnlyKeyword =
      lowerQuery.includes("list") ||
      lowerQuery.includes("tell me") ||
      lowerQuery.includes("what are") ||
      lowerQuery.includes("give me");

    // Only show charts if visual keywords present AND not explicitly asking for a list
    const isChartQuery = hasVisualKeyword && !hasTextOnlyKeyword;

    // --- CONTEXT LOADING (CONDITIONAL) ---
    let contextData = {};
    let prompt = "";

    if (isProjectQuery || isChartQuery) {
      console.log("[Nova AI] Project intent detected. Fetching context...");

      console.log(
        "[Nova AI] Fetching all user tasks to process context in memory...",
      );
      const allUserTasks = await prisma.task.findMany({
        where: { assigneeId: userId },
        select: {
          title: true,
          status: true,
          riskLevel: true,
          priorityScore: true,
          dueDate: true,
          isOverdue: true,
          updatedAt: true,
        },
      });

      // Compute stats
      const statusStats = {};
      const riskStats = {};

      allUserTasks.forEach((t) => {
        statusStats[t.status] = (statusStats[t.status] || 0) + 1;
        if (t.status !== "COMPLETED" && t.status !== "IN_REVIEW") {
          const rLevel = t.riskLevel || "LOW";
          riskStats[rLevel] = (riskStats[rLevel] || 0) + 1;
        }
      });

      // Sort copies for different list views
      const byPriority = [...allUserTasks].sort(
        (a, b) => (b.priorityScore || 0) - (a.priorityScore || 0),
      );
      const byUpdated = [...allUserTasks].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      );

      const activeList = byPriority.filter((t) => t.status !== "COMPLETED");
      const pendingReviewList = byPriority.filter(
        (t) => t.status !== "COMPLETED" && t.status !== "IN_REVIEW",
      );

      contextData = {
        overdue: activeList.filter((t) => t.isOverdue).slice(0, 5),
        highRisk: activeList
          .filter((t) => t.riskLevel === "HIGH" || t.riskLevel === "CRITICAL")
          .slice(0, 5),
        topPriority: pendingReviewList.slice(0, 5),
        completed: byUpdated
          .filter((t) => t.status === "COMPLETED")
          .slice(0, 5),
        inProgress: activeList
          .filter((t) => t.status === "IN_PROGRESS")
          .slice(0, 5),
        todo: activeList.filter((t) => t.status === "PENDING").slice(0, 5),
        inReview: activeList
          .filter((t) => t.status === "IN_REVIEW")
          .slice(0, 5),
        stats: riskStats,
        statusBreakdown: Object.keys(statusStats).reduce((acc, status) => {
          acc[status.replace(/_/g, " ")] = statusStats[status];
          return acc;
        }, {}),
      };

      // Helper for task lists
      const listTasks = (tasks, label) =>
        tasks?.length
          ? `\n=== ${label} (${tasks.length}) ===\n` +
            tasks
              .map(
                (t) =>
                  `- "${t.title}"${t.riskLevel ? ` [${t.riskLevel}]` : ""}${t.status ? ` (${t.status.replace(/_/g, " ")})` : ""}`,
              )
              .join("\n")
          : "";

      // Helper for stats
      const listStats = (stats) =>
        Object.keys(stats).length
          ? Object.entries(stats)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : "None";

      // Construct OPTIMIZED Prompt (Only include what exists)
      prompt = `You are Nova, a project management AI assistant.

USER QUERY: "${query}"

CONTEXT (User's Assigned Tasks):
${listTasks(contextData.overdue, "OVERDUE")}
${listTasks(contextData.highRisk, "HIGH RISK")}
${listTasks(contextData.topPriority, "TOP PRIORITY")}
${listTasks(contextData.inProgress, "IN PROGRESS")}
${listTasks(contextData.inReview, "IN REVIEW")}
${listTasks(contextData.todo, "TODO")}
${listTasks(contextData.completed, "RECENTLY COMPLETED")}

STATS:
- Status: ${listStats(contextData.statusBreakdown)}
- Risk: ${listStats(contextData.stats)}

GUIDELINES:
1. Answer strictly based on the provided context.
2. Be concise and professional.
3. If the user asks for a chart/visualization, say "Here is the chart you requested." and I will render it.
4. If no tasks match the query, say so clearly.
5. If listing items, use plain text numbers (1., 2., etc.). Do NOT use markdown symbols like **, *, _, or #. Output plain text.`;
    } else {
      // General Conversation (No Context)
      console.log("[Nova AI] General intent detected. Skipping context fetch.");
      prompt = `You are Nova, an AI assistant for a project management app.
User: "${query}"
Respond helpfully and concisely. If they ask about tasks/projects, ask them to be specific (e.g., "Show my overdue tasks").
If listing items, use plain text numbers (1., 2., etc.). Do NOT use markdown symbols like **, *, _, or #. Output plain text.`;
    }

    // --- SSE Setup ---
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Prevent NGINX/Vite from buffering
    res.flushHeaders();

    // --- STREAMING GENERATION (per-chunk idle timeout) ---
    const resultStream = await model.generateContentStream(prompt);

    let streamEnded = false;
    let chunkTimer;
    const resetTimer = () => {
      clearTimeout(chunkTimer);
      chunkTimer = setTimeout(() => {
        if (streamEnded) return;
        streamEnded = true;
        console.warn("[Nova AI] Stream idle timeout (15s). Ending response.");
        res.write(
          `data: ${JSON.stringify({ type: "error", text: "Response timed out. Please try again." })}\n\n`,
        );
        if (typeof res.flush === "function") res.flush();
        res.write(`data: [DONE]\n\n`);
        if (typeof res.flush === "function") res.flush();
        res.end();
      }, 15000);
    };

    resetTimer();
    for await (const chunk of resultStream.stream) {
      if (streamEnded) break;
      resetTimer();
      const chunkText = chunk.text();
      res.write(
        `data: ${JSON.stringify({ type: "text", text: chunkText })}\n\n`,
      );
      if (typeof res.flush === "function") res.flush();
    }
    clearTimeout(chunkTimer);
    if (streamEnded) return; // already ended by timeout

    console.log("[Nova AI] Response stream finished.");

    // --- CHART GENERATION (Targeted) ---
    let chartData = null;

    if (isChartQuery && isProjectQuery) {
      if (lowerQuery.includes("risk") || lowerQuery.includes("critical")) {
        chartData = {
          type: "risk",
          title: "Risk Distribution",
          data: Object.entries(contextData.stats || {}).map(
            ([name, value]) => ({ name, value }),
          ),
        };
      } else {
        // Default to status
        chartData = {
          type: "status",
          title: "Task Status",
          data: Object.entries(contextData.statusBreakdown || {}).map(
            ([name, value]) => ({ name, value }),
          ),
        };
      }
    }

    if (chartData) {
      res.write(`data: ${JSON.stringify({ type: "chart", chartData })}\n\n`);
      if (typeof res.flush === "function") res.flush();
    }

    // Legacy support data mapping
    if (isProjectQuery && contextData.highRisk) {
      res.write(
        `data: ${JSON.stringify({ type: "data", payload: contextData.highRisk })}\n\n`,
      );
      if (typeof res.flush === "function") res.flush();
    }

    res.write(`data: [DONE]\n\n`);
    if (typeof res.flush === "function") res.flush();
    res.end();
  } catch (error) {
    console.error("[Nova AI] Error:", error.message);

    if (!res.headersSent) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
    }

    // Fallback logic for rate limits, errors, or timeouts
    if (
      error.status === 429 ||
      error.status === 503 ||
      error.status >= 500 ||
      error.message === "Request timed out"
    ) {
      try {
        const fallback = await runDeterministicFallback(
          req.body.query,
          req.user?.id,
        );
        res.write(
          `data: ${JSON.stringify({ type: "fallback", text: fallback.message, data: fallback.data })}\n\n`,
        );
        if (typeof res.flush === "function") res.flush();
        res.write(`data: [DONE]\n\n`);
        if (typeof res.flush === "function") res.flush();
        res.end();
        return;
      } catch (e) {
        console.error("Fallback failed:", e);
      }
    }

    res.write(
      `data: ${JSON.stringify({ type: "error", text: "I'm having trouble connecting to my brain right now." })}\n\n`,
    );
    if (typeof res.flush === "function") res.flush();
    res.write(`data: [DONE]\n\n`);
    if (typeof res.flush === "function") res.flush();
    res.end();
  }
};

/**
 * Proofread text using Nova AI
 * Improves grammar, clarity, and professional tone
 */
export const proofreadText = async (req, res) => {
  try {
    const { text } = req.body;

    console.log(`[Nova AI Proofread] Received text for proofreading`);

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required for proofreading.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Nova AI is offline (Missing API Key).",
      });
    }

    // Construct proofreading prompt
    const prompt = `System: You are a professional editor.
User Text: """${text}"""
Task: Rewrite the text to fix grammar, improve clarity, and ensure a professional yet friendly tone.
Rules:
- Output ONLY the improved text. No explanations or markdown.
- Keep original meaning.
- Do not change technical terms.`;

    // Generate improved text with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), 8000),
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ]);
    const improvedText = result.response.text().trim();

    console.log("[Nova AI Proofread] Text improved successfully");

    res.json({
      success: true,
      original: text,
      improved: improvedText,
      message: "Text proofread successfully",
    });
  } catch (error) {
    console.error("[Nova AI Proofread] Error:", error.message);

    res.status(500).json({
      success: false,
      message:
        error.message === "Request timed out"
          ? "Nova AI is taking too long to respond. Please try again."
          : "Failed to proofread text. Please try again.",
      error: error.message,
    });
  }
};
