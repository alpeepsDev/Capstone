# Monday.com Inspired UI Components

A complete Monday.com replica built with React, Tailwind CSS, and Framer Motion. This implementation features a dark modern theme with professional animations and exact Monday.com behavior.

## 🎨 Design System

### Color Palette
- **Background**: Deep navy (`slate-900`)
- **Sections**: Soft gray (`slate-800`, `slate-700`)
- **Accents**: Bright blue (`blue-500`, `blue-600`)
- **Text**: White primary, `slate-300` secondary, `slate-400` tertiary

### Layout Structure
- **Two-Panel Layout**: Fixed sidebar + Main content area
- **Responsive**: Collapsible sidebar with smooth animations
- **Typography**: Clean, readable fonts with proper hierarchy

## 🚀 Components

### 1. MainLayout
**File**: `client/src/components/layout/MainLayout.jsx`

The root layout component that provides the Monday.com two-panel structure.

```jsx
import MainLayout from "../components/layout/MainLayout";

<MainLayout title="My Workspace">
  <YourContent />
</MainLayout>
```

**Features**:
- Collapsible sidebar with animation
- Responsive design
- Page transition animations
- Context-aware layout

### 2. Sidebar
**File**: `client/src/components/layout/Sidebar.jsx`

Monday.com inspired navigation sidebar with workspace organization.

**Features**:
- **Workspace accordion** with task/member counts
- **Project hierarchy** with color-coded status dots
- **Quick navigation** (Home, Favorites, Recent)
- **Settings section** with profile and preferences
- **Smooth animations** on expand/collapse
- **Hover effects** on all interactive elements

**Structure**:
```
├── App Logo & Brand
├── Quick Navigation
│   ├── Home
│   ├── Favorites
│   └── Recent
├── Workspaces (Accordion)
│   └── Projects List
│       ├── Project Alpha (status dot)
│       ├── Project Beta (status dot)
│       └── Project Gamma (status dot)
└── Settings
    ├── Profile
    ├── Preferences
    └── Help
```

### 3. Header
**File**: `client/src/components/layout/Header.jsx`

Monday.com inspired header with workspace context and navigation.

**Features**:
- **Workspace title** with task count and team member avatars
- **Search bar** with focus animations
- **View tabs** (Table, Timeline, Board, Calendar)
- **Profile dropdown** with user actions
- **Notifications** with unread count
- **Add task button** (CTA)

**Components**:
- Workspace metadata (task count, team size)
- Global search with keyboard shortcuts
- View switcher with active state
- User profile with dropdown menu
- Notification center

### 4. TaskTable
**File**: `client/src/components/common/TaskTable.jsx`

Clean data table matching Monday.com's task management interface.

**Features**:
- **Status dropdowns** with color-coded labels
- **Priority badges** (HIGH red, MEDIUM yellow, LOW green)
- **Due date** with calendar icon
- **Assignee avatars** with initials
- **Row hover effects** with subtle scaling
- **Action menus** (Edit, Delete)
- **Staggered animations** on load

**Columns**:
1. **Task**: Name and description
2. **Status**: Dropdown with color states (To Do, In Progress, Review, Completed)
3. **Priority**: Color-coded levels (HIGH, MEDIUM, LOW)
4. **Due Date**: Formatted date with calendar icon
5. **Assignee**: Avatar circle with user initials
6. **Actions**: Three-dot menu with Edit/Delete

**Status States**:
- `TODO`: Gray background
- `IN_PROGRESS`: Blue background
- `REVIEW`: Yellow background
- `COMPLETED`: Green background

### 5. Motion Variants Library
**File**: `client/src/styles/motionVariants.js`

Comprehensive animation system with Monday.com timing and easing.

**Available Variants**:
- `pageTransition`: Page enter/exit animations
- `sidebarSlide`: Sidebar expand/collapse
- `staggerContainer`: Parent for staggered children
- `staggerItem`: Individual animated items
- `fadeSlide`: Fade in with upward slide
- `hoverScale`: Subtle scale on hover
- `tabButton`: Tab switching animations
- `dropdownMenu`: Dropdown reveal/hide
- `searchFocus`: Search bar focus effects
- `accordionContent`: Accordion expand/collapse
- `projectHover`: Project list item hover
- `statusBadge`: Status badge interactions

## 📱 Dashboard Integration

### Updated Dashboard
**File**: `client/src/pages/Dashboard.jsx`

Complete Monday.com dashboard implementation:

**Features**:
- **Welcome header** with user personalization
- **Task statistics** cards (Total, In Progress, Completed, High Priority)
- **Search and filters** toolbar
- **Task table** with full Monday.com functionality
- **Add task** floating action button

**Statistics Cards**:
- Real-time task counting
- Color-coded metrics
- Hover animations
- Clickable for filtering

## 🎯 Key Features

### 1. Exact Monday.com Behavior
- **Color system**: Matches Monday.com's professional palette
- **Spacing**: Consistent with Monday.com's design language
- **Interactions**: Identical hover states and click behaviors
- **Typography**: Clean, readable fonts with proper hierarchy

### 2. Professional Animations
- **Framer Motion**: Smooth, performant animations throughout
- **Staggered reveals**: Tables and lists animate in sequence
- **Hover effects**: Subtle feedback on all interactive elements
- **Page transitions**: Smooth navigation between views

### 3. Responsive Design
- **Collapsible sidebar**: Space-saving on smaller screens
- **Grid layouts**: Responsive task table and statistics
- **Mobile-friendly**: Touch-optimized interactions
- **Accessibility**: Keyboard navigation and screen reader support

### 4. Dark Theme
- **Deep navy**: Primary background for reduced eye strain
- **Soft grays**: Section backgrounds for content organization
- **Bright accents**: Blue highlights for calls-to-action
- **Color contrast**: WCAG compliant text contrast ratios

## 🛠 Usage Examples

### Basic Dashboard Setup
```jsx
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
```

### Custom Task Table
```jsx
import TaskTable from "./components/common/TaskTable";

const MyTasks = () => {
  const handleTaskUpdate = (taskId, updates) => {
    // Update task via API
  };

  return (
    <TaskTable
      tasks={myTasks}
      onTaskUpdate={handleTaskUpdate}
      onTaskDelete={handleTaskDelete}
      onTaskEdit={handleTaskEdit}
    />
  );
};
```

### Layout with Custom Content
```jsx
import MainLayout from "./components/layout/MainLayout";

const CustomPage = () => {
  return (
    <MainLayout title="Custom Workspace">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">
          My Custom Content
        </h1>
        {/* Your content here */}
      </div>
    </MainLayout>
  );
};
```

## 🎨 Customization

### Extending Motion Variants
```jsx
// Add to motionVariants.js
export const customVariant = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3 }
  }
};
```

### Adding Status Types
```jsx
// In TaskTable.jsx, extend statusOptions
const statusOptions = [
  { value: "TODO", label: "To Do", color: "bg-gray-500" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-500" },
  { value: "REVIEW", label: "Review", color: "bg-yellow-500" },
  { value: "COMPLETED", label: "Completed", color: "bg-green-500" },
  { value: "ARCHIVED", label: "Archived", color: "bg-purple-500" }, // New
];
```

### Custom Priority Colors
```jsx
// Extend priority color system
const priorityColors = {
  CRITICAL: "text-red-500",
  HIGH: "text-red-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-green-400",
  NICE_TO_HAVE: "text-gray-400",
};
```

## 🚀 Next Steps

### Planned Enhancements
1. **Timeline View**: Gantt chart style task timeline
2. **Board View**: Kanban board with drag-and-drop
3. **Calendar View**: Task scheduling calendar
4. **Advanced Filters**: Multi-criteria task filtering
5. **Team Management**: User roles and permissions
6. **Real-time Updates**: WebSocket integration for live collaboration

### Integration Points
- **API Integration**: Connect to your existing task management API
- **Authentication**: Integrate with your auth system
- **Notifications**: Real-time updates and alerts
- **File Attachments**: Document management system
- **Time Tracking**: Built-in time tracking for tasks

## 📦 Dependencies

```json
{
  "framer-motion": "^10.x.x",
  "lucide-react": "^0.x.x",
  "tailwindcss": "^3.x.x"
}
```

## 🎯 Best Practices

1. **Motion**: Use motion variants consistently across components
2. **Colors**: Stick to the Monday.com color palette
3. **Spacing**: Use Tailwind's spacing scale (4, 6, 8 units)
4. **Typography**: Maintain text hierarchy with proper sizing
5. **Accessibility**: Include proper ARIA labels and keyboard navigation

---

Built with ❤️ to replicate Monday.com's excellent UX design.