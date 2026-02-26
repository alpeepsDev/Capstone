import React from "react";
import { Star } from "lucide-react";
import { Card } from "../ui";

export const NoFavorites = ({ isDark, setActiveView }) => (
  <div className="w-full h-full flex items-center justify-center p-4">
    <div className="text-center">
      <div
        className={`p-4 rounded-full inline-block mb-4 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
      >
        <Star
          className={`w-8 h-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
        />
      </div>
      <h2
        className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
      >
        No Favorites Yet
      </h2>
      <p
        className={`${isDark ? "text-gray-400" : "text-gray-600"} max-w-md mx-auto`}
      >
        Star your most important projects to access them quickly from here.
      </p>
      <button
        onClick={() => setActiveView("dashboard")}
        className="mt-6 text-blue-600 hover:text-blue-500 font-medium"
      >
        View all projects
      </button>
    </div>
  </div>
);

export const NoProjects = ({ isDark }) => (
  <div className="w-full p-4 sm:p-6">
    <Card className={`p-6 text-center ${isDark ? "bg-gray-800" : "bg-white"}`}>
      <h2
        className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
      >
        No Projects Available
      </h2>
      <p className={`${isDark ? "text-gray-400" : "text-gray-600"} mt-2`}>
        You have not been assigned to any projects yet. Please contact your
        manager.
      </p>
    </Card>
  </div>
);
