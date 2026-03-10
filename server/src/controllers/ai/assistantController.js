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

    // Chart Intent: Only trigger on EXPLICIT chart/graph keywords
    const isChartQuery =
      lowerQuery.includes("chart") ||
      lowerQuery.includes("graph") ||
      lowerQuery.includes("pie") ||
      lowerQuery.includes("visual") ||
      lowerQuery.includes("breakdown") ||
      lowerQuery.includes("distribution");

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

      const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const totalTasks = allUserTasks.length;
      const activeTasks = allUserTasks.filter(
        (t) => t.status !== "COMPLETED",
      ).length;

      const formatSection = (tasks, label) => {
        const content = listTasks(tasks, label);
        return content || `\n=== ${label} (0) ===\n(none)`;
      };

      prompt = `[SYSTEM IDENTITY]
You are Nova, the built-in AI assistant for this project management application. You answer questions about the user's tasks, deadlines, risks, and workload using ONLY the data provided below. You have no access to the internet, external tools, or any information outside of the data block.

[TODAY'S DATE]
${currentDate}

[USER QUERY]
"${query}"

[BEGIN DATA — This is the ONLY source of truth]
Total tasks assigned to this user: ${totalTasks}
Active (non-completed) tasks: ${activeTasks}
${formatSection(contextData.overdue, "OVERDUE")}
${formatSection(contextData.highRisk, "HIGH RISK")}
${formatSection(contextData.topPriority, "TOP PRIORITY")}
${formatSection(contextData.inProgress, "IN PROGRESS")}
${formatSection(contextData.inReview, "IN REVIEW")}
${formatSection(contextData.todo, "TODO / PENDING")}
${formatSection(contextData.completed, "RECENTLY COMPLETED")}

STATUS COUNTS: ${listStats(contextData.statusBreakdown)}
RISK COUNTS: ${listStats(contextData.stats)}
[END DATA]

[RULES — Violating any rule is a critical failure]
1. GROUNDING: Every claim you make MUST map to a specific task or number from [BEGIN DATA] to [END DATA]. If a task name, date, or number is not explicitly listed above, you MUST NOT mention it.
2. ZERO FABRICATION: Do NOT invent task names, due dates, percentages, priorities, team members, or any detail not present in the data. If asked about something not in the data, respond exactly: "I don't have that information in your current task data."
3. COUNTS ARE FINAL: The total task count is ${totalTasks} and active count is ${activeTasks}. Do not state any other totals.
4. NO FOLLOW-UP QUESTIONS: Never ask the user for clarification, more details, or follow-up. Answer with what you have and stop.
5. NO FILLER: Do not use greetings ("Hi!", "Hello!"), sign-offs ("Let me know if you need anything"), or conversational padding. Start directly with the answer.
6. SCOPE BOUNDARY: You can ONLY discuss tasks, projects, deadlines, risks, priorities, and workload. For anything else (weather, jokes, coding help, general knowledge), respond exactly: "I can only help with your project tasks and workload. Try asking about your tasks, deadlines, or risks."
7. CHART QUERIES: If the user asked for a chart, graph, pie, breakdown, or distribution, respond ONLY with: "Here is the chart you requested." — the chart is rendered separately by the application.

[OUTPUT FORMAT]
- Plain text only. No markdown formatting (no **, *, #, ## etc.).
- Use numbered lists (1. 2. 3.) when listing multiple items.
- Use one blank line between distinct points.
- Always reference task names exactly as they appear in the data using quotes, e.g. "Task Name Here".`;
    }

    // --- FALLBACK PROMPT for general/off-topic queries ---
    if (!prompt) {
      prompt = `You are Nova, the built-in AI assistant for a project management application. You can ONLY help with tasks, deadlines, risks, priorities, and workload.

USER QUERY: "${query}"

RULES:
1. If the query is a greeting (hi, hello, hey), respond with a single short sentence introducing yourself and suggest the user ask about their tasks, risks, or deadlines.
2. For ANY other topic (weather, jokes, coding, general knowledge, etc.), respond exactly: "I can only help with your project tasks and workload. Try asking about your tasks, deadlines, or risks."
3. No markdown formatting. Plain text only.
4. Do not ask follow-up questions.`;
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

    if (isChartQuery) {
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
