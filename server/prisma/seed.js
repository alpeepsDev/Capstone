// prisma/seed.js
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcrypt from "bcryptjs";
import { encrypt } from "../src/utils/encryption.js";
import { hash } from "../src/utils/hashing.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding with realistic data...\n");

  // Clean the database
  console.log("🧹 Cleaning database...");
  await prisma.apiLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemHealthLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.rateLimitConfig.deleteMany();
  await prisma.userRateLimit.deleteMany();
  await prisma.endpointRateLimit.deleteMany();

  // Delete projects first (cascades to tasks, members, etc.)
  await prisma.project.deleteMany();

  // Delete users last
  await prisma.user.deleteMany();

  console.log("✨ Database cleaned\n");

  // Hash password once for all users
  const hashedPassword = await bcrypt.hash("password123", 12);
  console.log("\n🔐 Creating users with encrypted passwords...");

  // Create realistic users with different roles
  const usersData = [
    // Admins
    {
      username: "admin",
      email: "admin@taskforge.io",
      password: hashedPassword,
      name: "System Administrator",
      role: "ADMIN",
    },
    // Managers
    {
      username: "sarah.chen",
      email: "sarah.chen@taskforge.io",
      password: hashedPassword,
      name: "Sarah Chen",
      role: "MANAGER",
    },
    {
      username: "marcus.johnson",
      email: "marcus.johnson@taskforge.io",
      password: hashedPassword,
      name: "Marcus Johnson",
      role: "MANAGER",
    },
    // Moderators
    {
      username: "priya.sharma",
      email: "priya.sharma@taskforge.io",
      password: hashedPassword,
      name: "Priya Sharma",
      role: "MODERATOR",
    },
    // Regular Users - Development Team
    {
      username: "alex.rivera",
      email: "alex.rivera@taskforge.io",
      password: hashedPassword,
      name: "Alex Rivera",
      role: "USER",
    },
    {
      username: "emily.watson",
      email: "emily.watson@taskforge.io",
      password: hashedPassword,
      name: "Emily Watson",
      role: "USER",
    },
    {
      username: "james.kim",
      email: "james.kim@taskforge.io",
      password: hashedPassword,
      name: "James Kim",
      role: "USER",
    },
    {
      username: "olivia.thompson",
      email: "olivia.thompson@taskforge.io",
      password: hashedPassword,
      name: "Olivia Thompson",
      role: "USER",
    },
    {
      username: "daniel.nguyen",
      email: "daniel.nguyen@taskforge.io",
      password: hashedPassword,
      name: "Daniel Nguyen",
      role: "USER",
    },
    {
      username: "sophia.martinez",
      email: "sophia.martinez@taskforge.io",
      password: hashedPassword,
      name: "Sophia Martinez",
      role: "USER",
    },
    {
      username: "michael.brown",
      email: "michael.brown@taskforge.io",
      password: hashedPassword,
      name: "Michael Brown",
      role: "USER",
    },
    {
      username: "emma.davis",
      email: "emma.davis@taskforge.io",
      password: hashedPassword,
      name: "Emma Davis",
      role: "USER",
    },
    {
      username: "ryan.taylor",
      email: "ryan.taylor@taskforge.io",
      password: hashedPassword,
      name: "Ryan Taylor",
      role: "USER",
    },
    {
      username: "jessica.lee",
      email: "jessica.lee@taskforge.io",
      password: hashedPassword,
      name: "Jessica Lee",
      role: "USER",
    },
  ];

  const createdUsers = [];

  for (const userData of usersData) {
    let finalUserData;
    let logSuffix;

    if (userData.role === "ADMIN") {
      // Keep Admin PII plaintext for login
      finalUserData = {
        ...userData,
        emailHash: hash(userData.email),
        usernameHash: hash(userData.username),
      };
      logSuffix = "(Plaintext PII)";
    } else {
      // Encrypt sensitive fields for others using AES (reversible)
      // Store deterministic hashes for lookup
      finalUserData = {
        ...userData,
        username: encrypt(userData.username),
        name: encrypt(userData.name),
        email: encrypt(userData.email),
        avatar: encrypt(`avatar_${userData.username}`),
        emailHash: hash(userData.email),
        usernameHash: hash(userData.username),
      };
      logSuffix = "(Encrypted PII)";
    }

    const user = await prisma.user.create({
      data: finalUserData,
    });

    // Push the user to createdUsers.
    // We don't need to restore original values because the rest of the script
    // (projects, tasks) relies on user OBJECTS (by reference or index),
    // not by matching username strings.
    createdUsers.push(user);

    console.log(`✅ Created ${user.role}: User ID ${user.id} ${logSuffix}`);
  }

  // Get users by role for easy reference
  const admin = createdUsers.find((u) => u.role === "ADMIN");
  const managers = createdUsers.filter((u) => u.role === "MANAGER");
  const moderators = createdUsers.filter((u) => u.role === "MODERATOR");
  const users = createdUsers.filter((u) => u.role === "USER");

  // ==================== CREATE PROJECTS ====================
  console.log("\n🏗️  Creating projects...");

  const projectsData = [
    {
      name: "E-Commerce Platform Redesign",
      description:
        "Complete overhaul of the company's main e-commerce platform with modern UI/UX, improved performance, and mobile-first approach. Target launch Q2 2026.",
      manager: managers[0],
      budget: 150000,
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-06-30"),
      members: [users[0], users[1], users[2], users[3], moderators[0]],
    },
    {
      name: "Mobile App Development",
      description:
        "Development of native iOS and Android applications for customer engagement, including push notifications, loyalty program, and in-app purchasing.",
      manager: managers[1],
      budget: 200000,
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-08-31"),
      members: [users[4], users[5], users[6], users[7]],
    },
    {
      name: "Data Analytics Dashboard",
      description:
        "Build real-time analytics dashboard for business intelligence, featuring sales metrics, customer behavior analysis, and predictive insights.",
      manager: managers[0],
      budget: 75000,
      startDate: new Date("2026-01-20"),
      endDate: new Date("2026-04-30"),
      members: [users[8], users[9], users[2]],
    },
    {
      name: "Customer Support Portal",
      description:
        "Self-service portal for customers including FAQ, ticket system, live chat integration, and knowledge base management.",
      manager: managers[1],
      budget: 50000,
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-03-31"),
      members: [users[1], users[3], users[5]],
    },
    {
      name: "Rokshu Task Management System",
      description:
        "Development of the Rokshu project management application for employees and managers, featuring Kanban boards, Gantt charts, file uploads, and real-time collaboration.",
      manager: managers[0],
      budget: 120000,
      startDate: new Date("2026-01-05"),
      endDate: new Date("2026-05-30"),
      members: [users[4], users[6], users[8], users[0], users[2]],
    },
  ];

  const createdProjects = [];
  for (const projectData of projectsData) {
    const project = await prisma.project.create({
      data: {
        name: encrypt(projectData.name),
        description: encrypt(projectData.description),
        managerId: projectData.manager.id,
        totalBudget: projectData.budget,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        members: {
          create: [
            { userId: projectData.manager.id },
            ...projectData.members.map((member) => ({ userId: member.id })),
          ],
        },
      },
    });
    createdProjects.push({
      ...project,
      memberUsers: projectData.members,
      manager: projectData.manager,
    });
    console.log(`✅ Created project: ${project.name}`);
  }

  // ==================== CREATE BUDGET CATEGORIES ====================
  console.log("\n💰 Creating budget categories...");

  const budgetCategories = [
    { name: "Development", color: "#3B82F6", percentage: 0.5 },
    { name: "Design", color: "#8B5CF6", percentage: 0.2 },
    { name: "Infrastructure", color: "#10B981", percentage: 0.15 },
    { name: "Testing & QA", color: "#F59E0B", percentage: 0.1 },
    { name: "Miscellaneous", color: "#6B7280", percentage: 0.05 },
  ];

  for (const project of createdProjects) {
    for (const category of budgetCategories) {
      const budgetCat = await prisma.budgetCategory.create({
        data: {
          name: encrypt(category.name),
          color: category.color,
          allocated: project.totalBudget * category.percentage,
          projectId: project.id,
        },
      });

      // Add some expenses for realism
      const numExpenses = Math.floor(Math.random() * 4) + 1;
      for (let i = 0; i < numExpenses; i++) {
        const expenseAmount =
          Math.floor(Math.random() * (budgetCat.allocated * 0.3)) + 100;
        await prisma.budgetExpense.create({
          data: {
            description: encrypt(getExpenseDescription(category.name)),
            amount: expenseAmount,
            categoryId: budgetCat.id,
            date: new Date(
              Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
            ),
          },
        });
      }
    }
    console.log(`✅ Created budget categories for: ${project.name}`);
  }

  // ==================== CREATE TASKS ====================
  console.log("\n📋 Creating tasks...");

  const now = new Date();
  const tasksData = [
    // E-Commerce Platform Redesign Tasks
    {
      projectIndex: 0,
      tasks: [
        {
          title: "Audit current website performance",
          description:
            "Perform comprehensive audit of current website including load times, Core Web Vitals, and user journey analysis using Google PageSpeed Insights and Lighthouse.",
          status: "COMPLETED",
          priority: "HIGH",
          assigneeIndex: 0,
          startDate: new Date("2026-01-15"),
          dueDate: new Date("2026-01-22"),
          completedAt: new Date("2026-01-21"),
          timeSpent: 960, // 16 hours
        },
        {
          title: "Design new homepage wireframes",
          description:
            "Create wireframes for the new homepage layout featuring hero section, product carousel, category navigation, and promotional banners. Must be mobile-responsive.",
          status: "COMPLETED",
          priority: "HIGH",
          assigneeIndex: 1,
          startDate: new Date("2026-01-18"),
          dueDate: new Date("2026-01-28"),
          completedAt: new Date("2026-01-27"),
          timeSpent: 1440, // 24 hours
        },
        {
          title: "Implement product catalog API",
          description:
            "Build RESTful API endpoints for product catalog including search, filtering, sorting, and pagination. Integrate with existing inventory system.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          assigneeIndex: 2,
          startDate: new Date("2026-01-25"),
          dueDate: new Date("2026-02-10"),
          timeSpent: 720, // 12 hours
          riskLevel: "MEDIUM",
        },
        {
          title: "Create shopping cart component",
          description:
            "Develop React shopping cart component with add/remove items, quantity adjustment, persistent storage, and mini-cart preview functionality.",
          status: "IN_PROGRESS",
          priority: "MEDIUM",
          assigneeIndex: 0,
          startDate: new Date("2026-02-01"),
          dueDate: new Date("2026-02-12"),
          timeSpent: 480, // 8 hours
        },
        {
          title: "Implement user authentication flow",
          description:
            "Build secure authentication system with login, registration, password reset, and OAuth integration for Google and Facebook sign-in.",
          status: "PENDING",
          priority: "HIGH",
          assigneeIndex: 3,
          startDate: new Date("2026-02-08"),
          dueDate: new Date("2026-02-20"),
        },
        {
          title: "Design checkout process UI",
          description:
            "Create multi-step checkout flow designs including cart review, shipping address, payment selection, and order confirmation screens.",
          status: "PENDING",
          priority: "MEDIUM",
          assigneeIndex: 1,
          startDate: new Date("2026-02-10"),
          dueDate: new Date("2026-02-18"),
        },
        {
          title: "Integrate Stripe payment gateway",
          description:
            "Set up Stripe integration for payment processing including credit cards, Apple Pay, and Google Pay. Implement webhook handlers for payment events.",
          status: "PENDING",
          priority: "URGENT",
          assigneeIndex: 2,
          startDate: new Date("2026-02-15"),
          dueDate: new Date("2026-02-28"),
          riskLevel: "HIGH",
        },
        {
          title: "Set up CDN for static assets",
          description:
            "Configure CloudFront CDN for serving images, stylesheets, and JavaScript files. Implement cache invalidation strategy and optimize delivery.",
          status: "PENDING",
          priority: "LOW",
          assigneeIndex: 3,
          startDate: new Date("2026-02-20"),
          dueDate: new Date("2026-03-01"),
        },
      ],
    },
    // Mobile App Development Tasks
    {
      projectIndex: 1,
      tasks: [
        {
          title: "Set up React Native project structure",
          description:
            "Initialize React Native project with TypeScript, configure navigation, state management (Redux Toolkit), and essential dependencies.",
          status: "COMPLETED",
          priority: "HIGH",
          assigneeIndex: 0,
          startDate: new Date("2026-02-01"),
          dueDate: new Date("2026-02-05"),
          completedAt: new Date("2026-02-04"),
          timeSpent: 480,
        },
        {
          title: "Design app navigation structure",
          description:
            "Create navigation architecture including bottom tabs, stack navigators, and drawer menu. Define deep linking scheme for push notifications.",
          status: "COMPLETED",
          priority: "HIGH",
          assigneeIndex: 1,
          startDate: new Date("2026-02-03"),
          dueDate: new Date("2026-02-08"),
          completedAt: new Date("2026-02-07"),
          timeSpent: 360,
        },
        {
          title: "Implement user profile screens",
          description:
            "Build user profile module including profile view, edit profile, order history, saved addresses, and notification preferences.",
          status: "IN_PROGRESS",
          priority: "MEDIUM",
          assigneeIndex: 2,
          startDate: new Date("2026-02-06"),
          dueDate: new Date("2026-02-14"),
          timeSpent: 540,
        },
        {
          title: "Build product browsing screens",
          description:
            "Create product list, grid views, filters, sorting options, and product detail screen with image gallery and add to cart functionality.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          assigneeIndex: 0,
          startDate: new Date("2026-02-08"),
          dueDate: new Date("2026-02-18"),
          timeSpent: 600,
          riskLevel: "MEDIUM",
        },
        {
          title: "Integrate Firebase push notifications",
          description:
            "Set up Firebase Cloud Messaging for iOS and Android. Handle notification permissions, background/foreground notifications, and deep linking.",
          status: "PENDING",
          priority: "HIGH",
          assigneeIndex: 3,
          startDate: new Date("2026-02-12"),
          dueDate: new Date("2026-02-22"),
        },
        {
          title: "Implement app onboarding flow",
          description:
            "Create onboarding screens with feature highlights, permission requests, and account creation prompts for first-time users.",
          status: "PENDING",
          priority: "MEDIUM",
          assigneeIndex: 1,
          startDate: new Date("2026-02-15"),
          dueDate: new Date("2026-02-20"),
        },
        {
          title: "Build loyalty program features",
          description:
            "Develop points system, rewards catalog, tier progression, and redemption flow. Integrate with backend loyalty API.",
          status: "PENDING",
          priority: "MEDIUM",
          assigneeIndex: 2,
          startDate: new Date("2026-02-18"),
          dueDate: new Date("2026-03-05"),
        },
        {
          title: "Implement biometric authentication",
          description:
            "Add Face ID and Touch ID support for app login and payment confirmation. Implement fallback to PIN entry.",
          status: "PENDING",
          priority: "LOW",
          assigneeIndex: 3,
          startDate: new Date("2026-02-25"),
          dueDate: new Date("2026-03-08"),
        },
      ],
    },
    // Data Analytics Dashboard Tasks
    {
      projectIndex: 2,
      tasks: [
        {
          title: "Define key performance metrics",
          description:
            "Work with stakeholders to identify critical KPIs including revenue, conversion rates, customer acquisition cost, and customer lifetime value.",
          status: "COMPLETED",
          priority: "HIGH",
          assigneeIndex: 0,
          startDate: new Date("2026-01-20"),
          dueDate: new Date("2026-01-25"),
          completedAt: new Date("2026-01-24"),
          timeSpent: 480,
        },
        {
          title: "Set up data pipeline infrastructure",
          description:
            "Configure ETL pipelines using Apache Airflow to pull data from multiple sources including database, analytics, and third-party integrations.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          assigneeIndex: 1,
          startDate: new Date("2026-01-26"),
          dueDate: new Date("2026-02-08"),
          timeSpent: 840,
          riskLevel: "MEDIUM",
        },
        {
          title: "Build sales dashboard component",
          description:
            "Create interactive sales dashboard with daily/weekly/monthly views, comparison charts, and drill-down capabilities by region and category.",
          status: "IN_PROGRESS",
          priority: "MEDIUM",
          assigneeIndex: 2,
          startDate: new Date("2026-02-01"),
          dueDate: new Date("2026-02-12"),
          timeSpent: 420,
        },
        {
          title: "Implement customer analytics module",
          description:
            "Develop customer behavior analysis including cohort analysis, retention metrics, RFM segmentation, and customer journey visualization.",
          status: "PENDING",
          priority: "MEDIUM",
          assigneeIndex: 0,
          startDate: new Date("2026-02-10"),
          dueDate: new Date("2026-02-22"),
        },
        {
          title: "Create automated reporting system",
          description:
            "Build scheduled report generation with PDF/Excel export, email distribution, and customizable report templates.",
          status: "PENDING",
          priority: "LOW",
          assigneeIndex: 1,
          startDate: new Date("2026-02-18"),
          dueDate: new Date("2026-03-01"),
        },
        {
          title: "Add predictive analytics features",
          description:
            "Implement ML-based forecasting for sales, demand prediction, and inventory optimization using historical data patterns.",
          status: "PENDING",
          priority: "MEDIUM",
          assigneeIndex: 2,
          startDate: new Date("2026-02-25"),
          dueDate: new Date("2026-03-15"),
          riskLevel: "HIGH",
        },
      ],
    },
    // Customer Support Portal Tasks
    {
      projectIndex: 3,
      tasks: [
        {
          title: "Design support portal information architecture",
          description:
            "Create site map and content structure for FAQ, knowledge base articles, ticket categories, and user flow diagrams.",
          status: "COMPLETED",
          priority: "HIGH",
          assigneeIndex: 0,
          startDate: new Date("2026-01-10"),
          dueDate: new Date("2026-01-15"),
          completedAt: new Date("2026-01-14"),
          timeSpent: 300,
        },
        {
          title: "Build FAQ management system",
          description:
            "Develop admin interface for creating, organizing, and publishing FAQ content with categories, search, and version control.",
          status: "COMPLETED",
          priority: "MEDIUM",
          assigneeIndex: 1,
          startDate: new Date("2026-01-16"),
          dueDate: new Date("2026-01-25"),
          completedAt: new Date("2026-01-26"),
          timeSpent: 720,
        },
        {
          title: "Implement ticket submission system",
          description:
            "Create ticket creation flow with category selection, priority assignment, file attachments, and confirmation notifications.",
          status: "IN_PROGRESS",
          priority: "HIGH",
          assigneeIndex: 2,
          startDate: new Date("2026-01-27"),
          dueDate: new Date("2026-02-08"),
          timeSpent: 540,
        },
        {
          title: "Build ticket tracking dashboard",
          description:
            "Develop customer-facing dashboard showing ticket status, history, communication thread, and resolution timeline.",
          status: "PENDING",
          priority: "HIGH",
          assigneeIndex: 0,
          startDate: new Date("2026-02-05"),
          dueDate: new Date("2026-02-15"),
          riskLevel: "MEDIUM",
        },
        {
          title: "Integrate live chat widget",
          description:
            "Add Intercom/Zendesk chat widget with business hours awareness, chatbot fallback, and seamless handoff to human agents.",
          status: "PENDING",
          priority: "MEDIUM",
          assigneeIndex: 1,
          startDate: new Date("2026-02-12"),
          dueDate: new Date("2026-02-22"),
        },
        {
          title: "Create knowledge base search",
          description:
            "Implement full-text search across FAQ and knowledge base with auto-suggestions, related articles, and analytics tracking.",
          status: "PENDING",
          priority: "LOW",
          assigneeIndex: 2,
          startDate: new Date("2026-02-18"),
          dueDate: new Date("2026-02-28"),
        },
      ],
    },
    // Rokshu Task Management System Tasks
    {
      projectIndex: 4,
      tasks: [
        {
          title: "Gather System Requirements",
          description:
            "Conduct meetings with stakeholders to define requirements for User flow, Manager view, and Employee view.",
          status: "COMPLETED",
          priority: "HIGH",
          assigneeIndex: 0,
          startDate: new Date("2026-01-05"),
          dueDate: new Date("2026-01-10"),
          completedAt: new Date("2026-01-09"),
          timeSpent: 360,
        },
        {
          title: "Design Database Schema",
          description:
            "Design relational database schema including Users, Tasks, Projects, and Notifications tables.",
          status: "COMPLETED",
          priority: "HIGH",
          assigneeIndex: 1,
          startDate: new Date("2026-01-11"),
          dueDate: new Date("2026-01-15"),
          completedAt: new Date("2026-01-14"),
          timeSpent: 480,
        },
        {
          title: "Implement Authentication System",
          description:
            "Develop secure login and registration using JWT tokens and password hashing. setup Role-based access control (RBAC).",
          status: "COMPLETED",
          priority: "URGENT",
          assigneeIndex: 2,
          startDate: new Date("2026-01-16"),
          dueDate: new Date("2026-01-25"),
          completedAt: new Date("2026-01-24"),
          timeSpent: 600,
        },
        {
          title: "Develop Kanban Board Interface",
          description:
            "Create a drag-and-drop Kanban board for task management, allowing users to move tasks between statuses (Pending, In Progress, Done).",
          status: "IN_PROGRESS",
          priority: "HIGH",
          assigneeIndex: 0,
          startDate: new Date("2026-01-26"),
          dueDate: new Date("2026-02-15"),
          timeSpent: 960,
          riskLevel: "MEDIUM",
        },
        {
          title: "Build Gantt Chart Component",
          description:
            "Implement Gantt chart visualization for project timelines, showing task dependencies and duration.",
          status: "IN_PROGRESS",
          priority: "MEDIUM",
          assigneeIndex: 3,
          startDate: new Date("2026-02-01"),
          dueDate: new Date("2026-02-20"),
          timeSpent: 420,
        },
        {
          title: "Implement File Upload Feature",
          description:
            "Allow users to attach files/documents to tasks. Configure cloud storage (e.g., AWS S3 or Firebase).",
          status: "PENDING",
          priority: "MEDIUM",
          assigneeIndex: 1,
          startDate: new Date("2026-02-15"),
          dueDate: new Date("2026-02-25"),
        },
        {
          title: "Setup Real-time Notifications",
          description:
            "Implement notification system for task assignments, deadlines, and status updates using WebSockets.",
          status: "PENDING",
          priority: "LOW",
          assigneeIndex: 2,
          startDate: new Date("2026-02-20"),
          dueDate: new Date("2026-03-05"),
        },
        {
          title: "Conduct User Acceptance Testing",
          description:
            "Run UAT sessions with sample employees and managers to verify functionality and usability.",
          status: "PENDING",
          priority: "HIGH",
          assigneeIndex: 4,
          startDate: new Date("2026-03-01"),
          dueDate: new Date("2026-03-15"),
        },
      ],
    },
  ];

  const createdTasks = [];
  let taskPosition = 0;

  for (const projectTasks of tasksData) {
    const project = createdProjects[projectTasks.projectIndex];

    for (const taskData of projectTasks.tasks) {
      const assignee =
        project.memberUsers[taskData.assigneeIndex] || project.memberUsers[0];

      const task = await prisma.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          projectId: project.id,
          createdById: project.manager.id,
          assigneeId: assignee.id,
          startDate: taskData.startDate,
          dueDate: taskData.dueDate,
          completedAt: taskData.completedAt,
          timeSpent: taskData.timeSpent || 0,
          position: taskPosition++,
          riskLevel: taskData.riskLevel || "LOW",
          isOverdue:
            taskData.dueDate < now &&
            taskData.status !== "COMPLETED" &&
            taskData.status !== "DONE",
          lastActivity: taskData.completedAt || now,
        },
      });

      createdTasks.push({ ...task, assignee, project });
      console.log(`✅ Created task: ${task.title.substring(0, 40)}...`);
    }
  }

  // ==================== CREATE TASK COMMENTS ====================
  console.log("\n💬 Creating task comments...");

  const commentTemplates = [
    "Made good progress on this today. Should have the first draft ready by tomorrow.",
    "Ran into some issues with the API integration. Need to discuss with the team.",
    "Completed the initial implementation. Ready for code review.",
    "Updated the documentation based on the latest changes.",
    "Added unit tests for the new functionality. All passing.",
    "Waiting on design assets from the UX team.",
    "Fixed the bug that was causing failures in production.",
    "Refactored the code for better performance.",
    "Need clarification on the requirements. @manager can you help?",
    "This is taking longer than expected due to scope changes.",
  ];

  for (const task of createdTasks.slice(0, 15)) {
    const numComments = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numComments; i++) {
      await prisma.taskComment.create({
        data: {
          content:
            commentTemplates[
              Math.floor(Math.random() * commentTemplates.length)
            ],
          taskId: task.id,
          authorId: task.assignee.id,
          createdAt: new Date(
            Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000,
          ),
        },
      });
    }
  }
  console.log("✅ Created task comments");

  // ==================== CREATE WORK LOGS ====================
  console.log("\n⏱️  Creating work logs...");

  for (const task of createdTasks.filter((t) => t.timeSpent > 0)) {
    const numLogs = Math.floor(Math.random() * 4) + 1;
    const timePerLog = Math.floor(task.timeSpent / numLogs);

    for (let i = 0; i < numLogs; i++) {
      // Debug logging for foreign key issues
      console.log(
        `Creating worklog for Task: ${task.id}, User: ${task.assignee.id}`,
      );

      await prisma.workLog.create({
        data: {
          timeSpent: timePerLog + Math.floor(Math.random() * 60) - 30,
          taskId: task.id,
          userId: task.assignee.id,
          description: getWorkLogDescription(),
          startedAt: new Date(Date.now() - (numLogs - i) * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log("✅ Created work logs");

  // ==================== CREATE NOTIFICATIONS ====================
  console.log("\n🔔 Creating notifications...");

  const notificationTypes = [
    { type: "TASK_ASSIGNED", title: "New Task Assigned" },
    { type: "DEADLINE_WARNING", title: "Deadline Approaching" },
    { type: "TASK_UPDATED", title: "Task Updated" },
    { type: "RISK_ALERT", title: "Risk Alert" },
  ];

  for (const user of users) {
    const numNotifs = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < numNotifs; i++) {
      const notifType =
        notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const userTasks = createdTasks.filter((t) => t.assignee.id === user.id);
      const randomTask =
        userTasks[Math.floor(Math.random() * userTasks.length)];

      if (randomTask) {
        await prisma.notification.create({
          data: {
            type: notifType.type,
            title: notifType.title,
            message: getNotificationMessage(notifType.type, randomTask.title),
            userId: user.id,
            taskId: randomTask.id,
            projectId: randomTask.project.id,
            isRead: Math.random() > 0.4,
            createdAt: new Date(
              Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000,
            ),
          },
        });
      }
    }
  }
  console.log("✅ Created notifications");

  // ==================== CREATE AI PREFERENCES ====================
  console.log("\n🤖 Creating AI preferences...");

  for (const user of [...managers, ...users]) {
    await prisma.userAIPreference.create({
      data: {
        userId: user.id,
        enableProactiveNotifs: true,
        enableAutoAssignment: user.role === "MANAGER",
        enableAutoEscalation: true,
        deadlineWarningDays: [1, 3, 7],
        preferredInsightTypes: [
          "RISK_DETECTED",
          "DEADLINE_WARNING",
          "PATTERN_FOUND",
          "PRODUCTIVITY_TIP",
        ],
        weeklyReportDay: 1, // Monday
        weeklyReportTime: "09:00",
      },
    });
  }
  console.log("✅ Created AI preferences");

  // ==================== CREATE NOVA INSIGHTS ====================
  console.log("\n💡 Creating Nova AI insights...");

  const insightTemplates = [
    {
      type: "RISK_DETECTED",
      title: "Potential Delay Risk",
      description:
        "Based on current progress, this task may miss its deadline. Consider reallocating resources or adjusting scope.",
    },
    {
      type: "DEADLINE_WARNING",
      title: "Deadline Approaching",
      description:
        "This task is due in 3 days. Current completion rate suggests it may need additional attention.",
    },
    {
      type: "PATTERN_FOUND",
      title: "Productivity Pattern Detected",
      description:
        "Your productivity peaks between 10 AM and 12 PM. Consider scheduling complex tasks during this window.",
    },
    {
      type: "WORKLOAD_IMBALANCE",
      title: "Team Workload Imbalance",
      description:
        "Some team members have 3x more tasks than others. Consider redistributing work for better balance.",
    },
    {
      type: "PRODUCTIVITY_TIP",
      title: "Focus Time Suggestion",
      description:
        "You've been highly productive this week! Keep up the great work and remember to take breaks.",
    },
  ];

  for (const user of [...managers, ...users.slice(0, 6)]) {
    const numInsights = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numInsights; i++) {
      const template =
        insightTemplates[Math.floor(Math.random() * insightTemplates.length)];
      const userTasks = createdTasks.filter((t) => t.assignee.id === user.id);
      const randomTask =
        userTasks[Math.floor(Math.random() * userTasks.length)];

      await prisma.novaInsight.create({
        data: {
          userId: user.id,
          type: template.type,
          title: template.title,
          description: template.description,
          taskId: randomTask?.id,
          projectId: randomTask?.project.id,
          confidence: 0.7 + Math.random() * 0.25,
          dismissed: Math.random() > 0.7,
          createdAt: new Date(
            Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000,
          ),
        },
      });
    }
  }
  console.log("✅ Created Nova insights");

  // ==================== CREATE TASK PREDICTIONS ====================
  console.log("\n🔮 Creating task predictions...");

  for (const task of createdTasks.filter((t) => t.status === "IN_PROGRESS")) {
    const dueDate = new Date(task.dueDate);
    const variance = Math.floor(Math.random() * 5) - 2; // -2 to +2 days
    const predictedDate = new Date(
      dueDate.getTime() + variance * 24 * 60 * 60 * 1000,
    );

    await prisma.taskPrediction.create({
      data: {
        taskId: task.id,
        predictedCompletionAt: predictedDate,
        confidence: 0.65 + Math.random() * 0.3,
        basedOnSimilarTasks: Math.floor(Math.random() * 15) + 5,
        userVelocityFactor: 0.8 + Math.random() * 0.4,
        factors: {
          complexity: Math.random() > 0.5 ? "high" : "medium",
          dependencies: Math.floor(Math.random() * 3),
          historicalAccuracy: 0.75 + Math.random() * 0.2,
        },
      },
    });
  }
  console.log("✅ Created task predictions");

  // ==================== CREATE RATE LIMIT CONFIGS ====================
  console.log("\n⚙️  Creating rate limit configurations...");

  const rateLimitConfigs = [
    { role: "ADMIN", limit: 10000, window: 3600 },
    { role: "MANAGER", limit: 5000, window: 3600 },
    { role: "MODERATOR", limit: 3000, window: 3600 },
    { role: "USER", limit: 1000, window: 3600 },
  ];

  for (const config of rateLimitConfigs) {
    await prisma.rateLimitConfig.create({ data: config });
  }
  console.log("✅ Created rate limit configurations");

  // ==================== SUMMARY ====================
  console.log("\n" + "=".repeat(60));
  console.log("📊 SEEDING COMPLETE - SUMMARY");
  console.log("=".repeat(60));

  const counts = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    tasks: await prisma.task.count(),
    comments: await prisma.taskComment.count(),
    workLogs: await prisma.workLog.count(),
    notifications: await prisma.notification.count(),
    insights: await prisma.novaInsight.count(),
    predictions: await prisma.taskPrediction.count(),
  };

  console.log(`
   👥 Users:          ${counts.users}
   📁 Projects:       ${counts.projects}
   📋 Tasks:          ${counts.tasks}
   💬 Comments:       ${counts.comments}
   ⏱️  Work Logs:      ${counts.workLogs}
   🔔 Notifications:  ${counts.notifications}
   💡 AI Insights:    ${counts.insights}
   🔮 Predictions:    ${counts.predictions}
  `);

  console.log("\n📝 LOGIN CREDENTIALS (all passwords: password123)");
  console.log("-".repeat(60));
  console.log("   ADMIN:    admin@taskforge.io");
  console.log("   MANAGER:  sarah.chen@taskforge.io");
  console.log("   MANAGER:  marcus.johnson@taskforge.io");
  console.log("   USER:     alex.rivera@taskforge.io");
  console.log("   ... and more users (see seed data above)");
  console.log("-".repeat(60));
  console.log("\n🎉 Database seeding completed successfully!\n");
}

// Helper functions
function getExpenseDescription(category) {
  const descriptions = {
    Development: [
      "Senior developer contractor fee",
      "Code review tools subscription",
      "Development environment licenses",
      "Third-party API integration costs",
    ],
    Design: [
      "Figma team subscription",
      "Stock imagery purchase",
      "UI design consultation",
      "Design system audit",
    ],
    Infrastructure: [
      "AWS hosting costs",
      "SSL certificate renewal",
      "Database hosting",
      "CDN service fees",
    ],
    "Testing & QA": [
      "Automated testing tools",
      "QA contractor services",
      "Device testing lab access",
      "Performance monitoring tools",
    ],
    Miscellaneous: [
      "Team training materials",
      "Documentation tools",
      "Communication tools",
      "Project management software",
    ],
  };

  const options = descriptions[category] || descriptions.Miscellaneous;
  return options[Math.floor(Math.random() * options.length)];
}

function getWorkLogDescription() {
  const descriptions = [
    "Implemented core functionality",
    "Fixed bugs and code review",
    "Research and planning",
    "Documentation updates",
    "Testing and debugging",
    "Code refactoring",
    "Team collaboration and meetings",
    "Feature development",
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function getNotificationMessage(type, taskTitle) {
  const shortTitle =
    taskTitle.substring(0, 30) + (taskTitle.length > 30 ? "..." : "");

  switch (type) {
    case "TASK_ASSIGNED":
      return `You have been assigned to: "${shortTitle}"`;
    case "DEADLINE_WARNING":
      return `Deadline approaching for: "${shortTitle}"`;
    case "TASK_UPDATED":
      return `Task has been updated: "${shortTitle}"`;
    case "RISK_ALERT":
      return `Risk detected in: "${shortTitle}"`;
    default:
      return `Update on: "${shortTitle}"`;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
