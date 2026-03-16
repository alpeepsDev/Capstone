import React, { useState } from "react";
import { Button, Badge, Card } from "../ui";
import logger from "../../utils/logger.js";

const ProjectMemberManager = ({
  project,
  availableUsers,
  onAddMember,
  onRemoveMember,
}) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Filter out users who are already members
  const nonMembers = availableUsers.filter(
    (user) => !project.members.some((member) => member.id === user.id),
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    try {
      await onAddMember(project.id, selectedUserId);
      setSelectedUserId("");
      setIsAddingMember(false);
    } catch (error) {
      logger.error("Failed to add member:", error);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "MANAGER":
        return "success";
      case "USER":
        return "primary";
      default:
        return "default";
    }
  };

  return (
    <Card
      title="Project Members"
      subtitle={`Manage ${project.name} team members`}
    >
      <div className="space-y-4">
        {/* Current Members */}
        <div className="space-y-3">
          {project.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="font-medium text-blue-600">
                    {member.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium">{member.username}</h4>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleColor(member.role)}>{member.role}</Badge>
                {member.role !== "MANAGER" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onRemoveMember(project.id, member.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Member Section */}
        <div className="border-t pt-4">
          {!isAddingMember ? (
            <Button
              onClick={() => setIsAddingMember(true)}
              disabled={nonMembers.length === 0}
            >
              {nonMembers.length === 0 ? "No Users Available" : "Add Member"}
            </Button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User to Add:
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a user...</option>
                  {nonMembers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddMember} disabled={!selectedUserId}>
                  Add Member
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsAddingMember(false);
                    setSelectedUserId("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProjectMemberManager;
