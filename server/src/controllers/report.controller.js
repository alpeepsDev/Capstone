import prisma from "../config/database.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { decrypt, decryptUser } from "../utils/encryption.js";
import PDFDocument from "pdfkit";
import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import fs from "fs";
import logger from "../utils/logger.js";

/**
 * Generate report data based on filters and user role
 */
export const generateReport = asyncHandler(async (req, res) => {
  const { projectId, employeeName, startDate, endDate, status } = req.query;
  const { id: userId, role } = req.user;

  // Build filter object
  const whereClause = {};

  // Role-Based Access Control Filtering
  if (role === "USER") {
    // Employees only see their own deliverables
    whereClause.assigneeId = userId;
  } else if (role === "MANAGER") {
    // Managers see deliverables in their managed projects
    const managedProjects = await prisma.project.findMany({
      where: { managerId: userId },
      select: { id: true },
    });
    const managedProjectIds = managedProjects.map((p) => p.id);
    
    if (projectId) {
      if (!managedProjectIds.includes(projectId)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this project's reports",
        });
      }
      whereClause.projectId = projectId;
    } else {
      whereClause.projectId = { in: managedProjectIds };
    }
  } else if (role === "ADMIN") {
    if (projectId) {
      whereClause.projectId = projectId;
    }
  }

  // Additional Filters
  if (employeeName) {
    whereClause.assignee = {
      name: { contains: employeeName, mode: "insensitive" },
    };
  }

  if (status) {
    whereClause.status = status;
  }

  if (startDate || endDate) {
    whereClause.completedAt = {};
    if (startDate) whereClause.completedAt.gte = new Date(startDate);
    if (endDate) whereClause.completedAt.lte = new Date(endDate);
  }

  // Fetch report data
  const reports = await prisma.task.findMany({
    where: whereClause,
    include: {
      project: true,
      assignee: true,
    },
    orderBy: { completedAt: "desc" },
  });

  // Decrypt and format data
  const formattedReports = reports.map((report) => {
    const decryptedAssignee = report.assignee;
    
    // Status Logic: Completed, Pending, Late
    let reportStatus = report.status;
    if (report.status === "COMPLETED") {
       if (report.dueDate && new Date(report.completedAt) > new Date(report.dueDate)) {
         reportStatus = "LATE";
       } else {
         reportStatus = "COMPLETED";
       }
    } else if (report.status === "DONE" || report.status === "IN_REVIEW") {
       reportStatus = "COMPLETED"; // Treat finished but not yet "archived" as completed for reporting
    } else {
       reportStatus = "PENDING";
    }

    return {
      projectName: report.project.name,
      taskTitle: report.title,
      assignedEmployee: decryptedAssignee
        ? decryptedAssignee.name || decryptedAssignee.username
        : "Unassigned",
      submissionDate: report.completedAt
        ? report.completedAt.toISOString().split("T")[0]
        : "N/A",
      deadline: report.dueDate
        ? report.dueDate.toISOString().split("T")[0]
        : "N/A",
      status: reportStatus,
      remarks: report.description
        ? report.description.substring(0, 100)
        : "No remarks",
    };
  });

  // Calculate stats for charts
  const stats = {
    statusCounts: {
      COMPLETED: 0,
      LATE: 0,
      PENDING: 0,
    },
    projectDistribution: {},
  };

  formattedReports.forEach((r) => {
    stats.statusCounts[r.status] = (stats.statusCounts[r.status] || 0) + 1;
    stats.projectDistribution[r.projectName] =
      (stats.projectDistribution[r.projectName] || 0) + 1;
  });

  res.json({
    success: true,
    data: formattedReports,
    stats,
  });
});

/**
 * Export report as PDF or CSV
 */
export const exportReport = asyncHandler(async (req, res) => {
  const { format, data } = req.body; // Expecting the filtered data to be passed or re-generated
  
  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ success: false, message: "No data provided for export" });
  }

  if (format === "csv") {
    const filePath = path.join(process.cwd(), `report_${Date.now()}.csv`);
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: "projectName", title: "Project Name" },
        { id: "taskTitle", title: "Task Title" },
        { id: "deliverableName", title: "Deliverable" },
        { id: "assignedEmployee", title: "Assigned To" },
        { id: "submissionDate", title: "Submission Date" },
        { id: "deadline", title: "Deadline" },
        { id: "status", title: "Status" },
        { id: "remarks", title: "Remarks" },
      ],
    });

    await csvWriter.writeRecords(data);

    res.download(filePath, "TaskForge_Report.csv", (err) => {
      if (err) logger.error("CSV download error:", err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Cleanup
    });
  } else if (format === "pdf") {
    const doc = new PDFDocument({
      autoFirstPage: true,
      margin: 0, // Manual control to prevent phantom pages
      size: "A4",
      layout: "landscape",
    });

    res.setHeader(
      "Content-disposition",
      `attachment; filename="TaskForge_Report.pdf"`,
    );
    res.setHeader("Content-type", "application/pdf");

    // --- Premium Styling Constants ---
    const COLORS = {
      PRIMARY: "#2563eb",
      SECONDARY: "#64748b",
      SUCCESS: "#16a34a",
      DANGER: "#dc2626",
      BORDER: "#e2e8f0",
      TEXT_DARK: "#1e293b",
      TEXT_MUTED: "#475569",
      BG_LIGHT: "#f8fafc",
    };

    doc.pipe(res);

    // --- Chart Helpers ---
    const drawStatsSection = (data) => {
      const statusCounts = { COMPLETED: 0, LATE: 0, PENDING: 0 };
      const projectCounts = {};
      data.forEach((item) => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
        projectCounts[item.projectName] =
          (projectCounts[item.projectName] || 0) + 1;
      });

      // --- Compact Analytics Box ---
      const boxY = 75;
      const boxH = 135;
      doc.rect(40, boxY, 760, boxH).fill(COLORS.BG_LIGHT);
      doc.rect(40, boxY, 760, boxH).strokeColor(COLORS.BORDER).lineWidth(0.5).stroke();

      // Donut Chart
      const centerX = 130;
      const centerY = boxY + 70;
      const outerRadius = 45;
      const innerRadius = 28;
      const total = data.length;
      let startAngle = -Math.PI / 2;

      const pieColors = {
        COMPLETED: COLORS.SUCCESS,
        LATE: COLORS.DANGER,
        PENDING: COLORS.PRIMARY,
      };

      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.TEXT_DARK);
      doc.text("Task Status Overview", 55, boxY + 12);

      Object.entries(statusCounts).forEach(([status, count], i) => {
        const sliceAngle = total > 0 ? (count / total) * 2 * Math.PI : 0;
        if (count > 0) {
          doc
            .moveTo(centerX, centerY)
            .arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle)
            .lineTo(centerX, centerY)
            .fill(pieColors[status]);
          startAngle += sliceAngle;
        }

        const legendX = 205;
        const legendY = boxY + 45 + i * 18;
        doc.rect(legendX, legendY, 8, 8).fill(pieColors[status]);
        doc
          .fillColor(COLORS.TEXT_MUTED)
          .fontSize(8)
          .font("Helvetica")
          .text(`${status}: ${count}`, legendX + 15, legendY - 0.5);
      });

      doc.circle(centerX, centerY, innerRadius).fill(COLORS.BG_LIGHT);
      doc
        .fillColor(COLORS.TEXT_DARK)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(String(total), centerX - 20, centerY - 8, { width: 40, align: "center" });
      doc
        .fontSize(5)
        .font("Helvetica-Bold")
        .fillColor(COLORS.TEXT_MUTED)
        .text("TOTAL", centerX - 20, centerY + 5, { width: 40, align: "center" });

      // Bar Chart - Right Side
      const barBaseX = 380;
      const barBaseY = boxY + 105;
      const barMaxH = 75;
      const barW = 28;
      const barG = 22;
      const projects = Object.entries(projectCounts).slice(0, 8);
      const maxV = Math.max(...Object.values(projectCounts), 1);

      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.TEXT_DARK);
      doc.text("Workload by Project", barBaseX, boxY + 12);

      projects.forEach(([name, count], i) => {
        const h = (count / maxV) * barMaxH;
        const x = barBaseX + i * (barW + barG);
        doc.rect(x, barBaseY - h, barW, h).fill(COLORS.PRIMARY);
        
        doc.fillColor(COLORS.TEXT_MUTED).fontSize(7).font("Helvetica")
          .text(name.length > 15 ? name.substring(0, 12) + ".." : name, x - 5, barBaseY + 6, {
            width: barW + 10, align: "left"
          });

        doc.fillColor(COLORS.TEXT_DARK).fontSize(8).font("Helvetica-Bold")
          .text(String(count), x, barBaseY - h - 10, { width: barW, align: "center" });
      });
    };

    // --- Precision Layout Helpers ---
    const MARGIN = 40;
    const PAGE_W = 841.89;
    const PAGE_H = 595.28;
    const CONTENT_W = PAGE_W - 2 * MARGIN;
    const COL_WIDTHS = [110, 180, 100, 80, 80, 70, 140]; // Sum: 760
    const HEADERS = ["Project", "Task Description", "Assignee", "Submitted", "Deadline", "Status", "Remarks"];

    const drawPageHeader = (pageNum) => {
      doc.fontSize(20).font("Helvetica-Bold").fillColor(COLORS.PRIMARY)
        .text("TASKFORGE", MARGIN, 25, { continued: true })
        .fillColor(COLORS.SECONDARY).font("Helvetica").text(" | Performance Report");
      
      doc.fontSize(8).fillColor(COLORS.TEXT_MUTED)
        .text(`Generated: ${new Date().toLocaleString()} | Page ${pageNum}`, MARGIN, 48);

      doc.moveTo(MARGIN, 62).lineTo(PAGE_W - MARGIN, 62).lineWidth(0.5).strokeColor(COLORS.BORDER).stroke();

      if (pageNum === 1) {
        drawStatsSection(data);
      }
    };

    const drawFooter = (pageNum, isLast = false) => {
      const text = isLast ? `End of Report | Page ${pageNum}` : `Continued | Page ${pageNum}`;
      // Draw at 565, safely within 595 and no auto-break
      doc.fontSize(7).fillColor(COLORS.SECONDARY).font("Helvetica")
        .text(text, MARGIN, 565, { align: "center", width: CONTENT_W });
    };

    const drawTableRow = (y, cells, isHeader = false, rowH = 15) => {
      if (isHeader) {
        doc.rect(MARGIN, y, CONTENT_W, 20).fill(COLORS.BG_LIGHT);
        doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.TEXT_DARK);
      } else {
        doc.font("Helvetica").fontSize(8);
      }

      let curX = MARGIN + 8;
      cells.forEach((cell, i) => {
        const text = String(cell || "N/A");
        if (!isHeader && i === 5) { // Status
          if (text === "COMPLETED") doc.fillColor(COLORS.SUCCESS).font("Helvetica-Bold");
          else if (text === "LATE") doc.fillColor(COLORS.DANGER).font("Helvetica-Bold");
          else doc.fillColor(COLORS.PRIMARY).font("Helvetica-Bold");
        } else if (!isHeader) {
          doc.fillColor(COLORS.TEXT_MUTED).font("Helvetica");
        }

        doc.text(text, curX, isHeader ? y + 6 : y, { width: COL_WIDTHS[i] - 12, align: "left" });
        curX += COL_WIDTHS[i];
      });

      if (isHeader) {
        doc.moveTo(MARGIN, y + 20).lineTo(PAGE_W - MARGIN, y + 20).lineWidth(0.5).strokeColor(COLORS.BORDER).stroke();
      } else {
        doc.moveTo(MARGIN, y + rowH + 4).lineTo(PAGE_W - MARGIN, y + rowH + 4).lineWidth(0.2).strokeColor(COLORS.BORDER).stroke();
      }
    };

    // --- Rendering Logic ---
    let pageNum = 1;
    drawPageHeader(pageNum);

    let curY = 230; 
    drawTableRow(curY, HEADERS, true);
    curY += 28;

    data.forEach((item, idx) => {
      const rowData = [item.projectName, item.taskTitle, item.assignedEmployee, item.submissionDate || "N/A", item.deadline || "N/A", item.status, item.remarks || "N/A"];
      
      // Height calc
      doc.font("Helvetica").fontSize(8);
      let rowH = 12;
      rowData.forEach((c, i) => {
        const h = doc.heightOfString(String(c), { width: COL_WIDTHS[i] - 12 });
        if (h > rowH) rowH = h;
      });

      // Page break check (Landscape H 595, footer at 565, break at 520)
      if (curY + rowH > 520) {
        drawFooter(pageNum);
        doc.addPage({ size: "A4", layout: "landscape", margin: 0 }); // Explicit size to ensure consistency
        pageNum++;
        drawPageHeader(pageNum);
        curY = 85; 
        drawTableRow(curY, HEADERS, true);
        curY += 28;
      }

      if (idx % 2 === 1) doc.rect(MARGIN, curY - 4, CONTENT_W, rowH + 8).fill("#fbfcfd");

      drawTableRow(curY, rowData, false, rowH);
      curY += rowH + 12;
    });

    drawFooter(pageNum, true);
    doc.end();
  } else {
    res.status(400).json({ success: false, message: "Invalid format" });
  }
});
