import React, { useState, useEffect } from "react";
import { useAuth } from "../context";
import api from "../api";
import {
  FileText,
  Filter,
  Download,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import logger from "../utils/logger.js";

const ReportPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null); // 'pdf' or 'csv'

  // Filters
  const [filters, setFilters] = useState({
    projectId: "",
    employeeName: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchReports();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      if (response.data.success) {
        setProjects(response.data.data);
      }
    } catch (error) {
      logger.error("Error fetching projects:", error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get("/reports", { params: filters });
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch report data");
      logger.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = async (format) => {
    if (reports.length === 0) {
      toast.error("No data to export");
      return;
    }

    setExporting(format);
    try {
      const response = await api.post(
        "/reports/export",
        { format, data: reports },
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `TaskForge_Report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export ${format.toUpperCase()}`);
      logger.error(`Export ${format} error:`, error);
    } finally {
      setExporting(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle size={12} />
            <span>Completed</span>
          </span>
        );
      case "LATE":
        return (
          <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle size={12} />
            <span>Late</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Clock size={12} />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 overflow-y-auto p-4 max-h-full scrollbar-hide sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Performance Reports
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting === "pdf" || reports.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white shadow-lg shadow-red-500/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-red-700"
          >
            <Download size={18} />
            {exporting === "pdf" ? "Exporting..." : "Export PDF"}
          </button>
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting === "csv" || reports.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg shadow-green-500/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-green-700"
          >
            <Download size={18} />
            {exporting === "csv" ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          <Filter size={16} />
          Filters
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
              Project
            </label>
            <select
              name="projectId"
              value={filters.projectId}
              onChange={handleFilterChange}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {user?.role !== "USER" && (
            <div className="space-y-1">
              <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
                Employee Name
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={14}
                />
                <input
                  type="text"
                  name="employeeName"
                  value={filters.employeeName}
                  onChange={handleFilterChange}
                  placeholder="Search name..."
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
              From Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
              To Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="LATE">Late</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={fetchReports}
            className="w-full rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 hover:bg-blue-700 sm:w-auto"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        <div className="space-y-3 p-3 md:hidden">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40"
              >
                <div className="space-y-3">
                  <div className="h-5 w-2/3 rounded bg-gray-100 dark:bg-gray-700" />
                  <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 rounded bg-gray-100 dark:bg-gray-700" />
                    <div className="h-10 rounded bg-gray-100 dark:bg-gray-700" />
                  </div>
                </div>
              </div>
            ))
          ) : reports.length > 0 ? (
            reports.map((report, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {report.taskTitle}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {report.projectName}
                    </p>
                  </div>
                  {getStatusBadge(report.status)}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Assigned To
                    </p>
                    <p className="text-gray-700 dark:text-gray-200">
                      {report.assignedEmployee}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Submitted
                    </p>
                    <p className="text-gray-700 dark:text-gray-200">
                      {report.submissionDate}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Deadline
                    </p>
                    <p className="text-gray-700 dark:text-gray-200">
                      {report.deadline}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              <div className="flex flex-col items-center gap-2">
                <FileText size={48} className="opacity-20" />
                <p>No reporting data found. Adjust your filters or click Generate.</p>
              </div>
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : reports.length > 0 ? (
                reports.map((report, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium dark:text-white">
                      {report.projectName}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {report.taskTitle}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-semibold">
                      {report.assignedEmployee}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {report.submissionDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {report.deadline}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(report.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={48} className="opacity-20" />
                      <p>
                        No reporting data found. Adjust your filters or click
                        Generate.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
