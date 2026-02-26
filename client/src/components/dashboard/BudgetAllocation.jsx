import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Progress } from "../ui/Progress";
import { Slider } from "../ui/Slider";
import { Badge } from "../ui/Badge";
import {
  PlusCircle,
  MinusCircle,
  PhilippinePeso,
  AlertCircle,
  PieChart,
  Wallet,
  TrendingUp,
  CreditCard,
  Trash2,
} from "lucide-react";
import { useTheme } from "../../context";
import { budgetApi } from "../../api/budget";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const BudgetAllocation = ({ projectId }) => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);
  const [categories, setCategories] = useState([]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [setupBudget, setSetupBudget] = useState("");
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  const [expandedCategory, setExpandedCategory] = useState(null);
  const [newExpenseDesc, setNewExpenseDesc] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchBudgetData();
    }
  }, [projectId]);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const response = await budgetApi.getBudget(projectId);
      if (response.success) {
        setTotalBudget(response.data.totalBudget);
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch budget:", error);
      toast.error("Failed to load budget data");
    } finally {
      setLoading(false);
    }
  };

  const allocatedTotal = categories.reduce(
    (sum, cat) => sum + cat.allocated,
    0,
  );

  const spentTotal = categories.reduce((sum, cat) => {
    return (
      sum + (cat.expenses ? cat.expenses.reduce((s, e) => s + e.amount, 0) : 0)
    );
  }, 0);

  const unallocatedBudget = totalBudget - allocatedTotal;
  const allocationPercentage =
    totalBudget > 0 ? (allocatedTotal / totalBudget) * 100 : 0;

  const updateAllocation = async (id, value) => {
    if (isSubmitting) return;

    try {
      // Optimistic update could go here, but for safety we wait for server
      const response = await budgetApi.updateCategory(id, value);
      if (response.success) {
        setCategories(
          categories.map((cat) =>
            cat.id === id
              ? { ...cat, allocated: response.data.allocated }
              : cat,
          ),
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update allocation",
      );
      fetchBudgetData(); // Revert on error
    }
  };

  const removeCategory = async (id) => {
    if (!window.confirm("Are you sure you want to remove this category?"))
      return;
    try {
      const response = await budgetApi.removeCategory(id);
      if (response.success) {
        setCategories(categories.filter((cat) => cat.id !== id));
        toast.success("Category removed");
      }
    } catch (error) {
      toast.error("Failed to remove category");
    }
  };

  const addCategory = async () => {
    if (newCategoryName.trim() && !isSubmitting) {
      const colors = [
        "bg-red-500",
        "bg-yellow-500",
        "bg-indigo-500",
        "bg-pink-500",
        "bg-teal-500",
        "bg-blue-500",
        "bg-green-500",
        "bg-purple-500",
        "bg-orange-500",
      ];
      try {
        setIsSubmitting(true);
        const response = await budgetApi.addCategory(projectId, {
          name: newCategoryName,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
        if (response.success) {
          setCategories([...categories, { ...response.data, expenses: [] }]);
          setNewCategoryName("");
          toast.success("Category added");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to add category");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const addExpense = async (categoryId) => {
    if (isSubmitting) return;

    const amount = parseFloat(newExpenseAmount);
    if (!newExpenseDesc.trim() || isNaN(amount) || amount <= 0) return;

    try {
      setIsSubmitting(true);
      const response = await budgetApi.addExpense(categoryId, {
        description: newExpenseDesc,
        amount: amount,
      });
      if (response.success) {
        setCategories(
          categories.map((cat) => {
            if (cat.id === categoryId) {
              return {
                ...cat,
                expenses: [...(cat.expenses || []), response.data],
              };
            }
            return cat;
          }),
        );
        setNewExpenseDesc("");
        setNewExpenseAmount("");
        toast.success("Expense added");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeExpense = async (categoryId, expenseId) => {
    try {
      const response = await budgetApi.removeExpense(expenseId);
      if (response.success) {
        setCategories(
          categories.map((cat) => {
            if (cat.id === categoryId) {
              return {
                ...cat,
                expenses: (cat.expenses || []).filter(
                  (e) => e.id !== expenseId,
                ),
              };
            }
            return cat;
          }),
        );
        toast.success("Expense removed");
      }
    } catch (error) {
      toast.error("Failed to remove expense");
    }
  };

  const handleSetBudget = async () => {
    if (!projectId) {
      toast.error("Project ID is missing");
      return;
    }

    const budget = parseFloat(setupBudget);
    if (budget >= 0) {
      try {
        console.log("Updating budget:", { projectId, budget });
        const response = await budgetApi.updateTotalBudget(projectId, budget);
        console.log("Budget update response:", response);

        if (response.success) {
          setTotalBudget(response.data.totalBudget);
          setIsEditingBudget(false);
          toast.success("Budget updated");
        } else {
          throw new Error(response.message || "Failed to update budget");
        }
      } catch (error) {
        console.error("Budget update error:", error);
        toast.error(error.message || "Failed to update budget");
      }
    } else {
      toast.error("Please enter a valid amount");
    }
  };

  const getPercentage = (amount) => {
    return totalBudget > 0 ? ((amount / totalBudget) * 100).toFixed(1) : "0.0";
  };

  const getCategorySpent = (category) => {
    return category.expenses
      ? category.expenses.reduce((sum, e) => sum + e.amount, 0)
      : 0;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Common styles
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";
  const bgCard = isDark ? "bg-gray-800" : "bg-white";
  const borderCard = isDark ? "border-gray-700" : "border-gray-200";
  // Increased contrast for inputs in dark mode with refined aesthetics
  const inputBg = isDark
    ? "bg-gray-950/40 border-gray-600/50 text-gray-100 placeholder:text-gray-500 focus:bg-gray-950/60 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-sm";

  if (totalBudget === 0 && categories.length === 0 && !isEditingBudget) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center h-full min-h-[500px] p-6 space-y-8"
      >
        <div className="text-center space-y-3 max-w-lg">
          <div
            className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"}`}
          >
            <Wallet className="w-10 h-10" />
          </div>
          <h1 className={`text-4xl font-bold ${textPrimary}`}>
            Project Budgeting
          </h1>
          <p className={`text-lg ${textSecondary}`}>
            Set a total budget to start managing allocations and tracking
            expenses for this project.
          </p>
        </div>

        <Card className="w-full max-w-md shadow-lg border-2 dark:border-gray-700">
          <CardHeader>
            <CardTitle>Set Total Budget</CardTitle>
            <CardDescription>Enter the total allocated funds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhilippinePeso className={`h-5 w-5 ${textSecondary}`} />
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={setupBudget}
                onChange={(e) => setSetupBudget(e.target.value)}
                className={`pl-10 text-lg h-12 ${inputBg}`}
                onKeyPress={(e) => e.key === "Enter" && handleSetBudget()}
                autoFocus
              />
            </div>
            <Button
              onClick={handleSetBudget}
              className="w-full h-12 text-lg font-medium"
              size="lg"
              disabled={!setupBudget || parseFloat(setupBudget) <= 0}
            >
              Start Budgeting
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 pb-20"
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <h1 className={`text-2xl md:text-3xl font-bold ${textPrimary}`}>
            Budget Overview
          </h1>
          <p className={textSecondary}>
            Track allocations and expenses against your budget
          </p>
        </div>
        {/* Render edit button here if needed for clearer hierarchy, currently stuck to card */}
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Total Budget Card */}
        <Card className="relative overflow-hidden">
          <div
            className={`absolute top-0 right-0 p-4 opacity-10 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            <Wallet className="w-24 h-24 transform translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start z-10">
              <CardDescription>Total Budget</CardDescription>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => {
                  setSetupBudget(totalBudget.toString());
                  setIsEditingBudget(!isEditingBudget);
                }}
              >
                <div className={`text-xs ${textSecondary} hover:text-blue-500`}>
                  Edit
                </div>
              </Button>
            </div>
            {isEditingBudget ? (
              <div className="flex items-center space-x-2 mt-1 z-10">
                <Input
                  type="number"
                  value={setupBudget}
                  onChange={(e) => setSetupBudget(e.target.value)}
                  className={`h-9 text-lg ${inputBg}`}
                  autoFocus
                />
                <Button size="sm" onClick={handleSetBudget}>
                  Save
                </Button>
              </div>
            ) : (
              <CardTitle className="text-3xl z-10">
                ₱{totalBudget.toLocaleString()}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {!isEditingBudget && (
              <div className="mt-2 flex items-center text-sm text-green-500 font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Active</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allocation Status Card */}
        <Card className="flex flex-col relative overflow-hidden">
          <div
            className={`absolute top-0 right-0 p-4 opacity-10 ${isDark ? "text-blue-400" : "text-blue-600"}`}
          >
            <PieChart className="w-24 h-24 transform translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription>Allocated Funds</CardDescription>
            <div className="flex items-baseline space-x-2 z-10">
              <CardTitle
                className={`text-3xl ${isDark ? "text-blue-400" : "text-blue-600"}`}
              >
                ₱{allocatedTotal.toLocaleString()}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="z-10 mt-auto">
            <div className="flex justify-between text-sm mb-2">
              <span className={textSecondary}>Progress</span>
              <span
                className={`font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}
              >
                {allocationPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={allocationPercentage} className="h-2" />
            <div className="mt-3 text-xs flex justify-between">
              <span className={textSecondary}>
                Spent: ₱{spentTotal.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Available Card */}
        <Card className="relative overflow-hidden">
          <div
            className={`absolute top-0 right-0 p-4 opacity-10 ${unallocatedBudget < 0 ? "text-red-500" : "text-green-500"}`}
          >
            <CreditCard className="w-24 h-24 transform translate-x-4 -translate-y-4" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription>Available to Allocate</CardDescription>
            <CardTitle
              className={`text-3xl z-10 ${unallocatedBudget < 0 ? (isDark ? "text-red-400" : "text-red-600") : isDark ? "text-green-400" : "text-green-600"}`}
            >
              ₱{unallocatedBudget.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="z-10">
            {unallocatedBudget < 0 ? (
              <Badge variant="danger" className="mt-2 text-sm py-1 px-3">
                <AlertCircle className="w-4 h-4 mr-2" /> Over Budget
              </Badge>
            ) : (
              <Badge
                variant="success"
                className="mt-2 text-sm py-1 px-3 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
              >
                Healthy
              </Badge>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List - spans 2 cols */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${textPrimary}`}>
              Categories
            </h2>

            {/* Add Category Inline */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Input
                  placeholder="New category..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addCategory()}
                  className={`w-48 h-9 text-sm ${inputBg}`}
                />
              </div>
              <Button
                onClick={addCategory}
                size="sm"
                disabled={!newCategoryName.trim()}
              >
                <PlusCircle className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {categories.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex flex-col items-center justify-center py-16 text-center rounded-xl border-2 border-dashed ${isDark ? "border-gray-700 bg-gray-800/30" : "border-gray-200 bg-gray-50/50"}`}
              >
                <div
                  className={`p-4 rounded-full mb-4 ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm`}
                >
                  <PlusCircle className={`w-8 h-8 ${textSecondary}`} />
                </div>
                <h3 className={`text-lg font-medium mb-1 ${textPrimary}`}>
                  No allocations yet
                </h3>
                <p className={`text-sm ${textSecondary} max-w-xs mx-auto`}>
                  Create categories above to start organizing your budget.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => {
                  const spent = getCategorySpent(category);
                  const remainingInCategory = category.allocated - spent;
                  const isExpanded = expandedCategory === category.id;

                  return (
                    <motion.div
                      key={category.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className={`rounded-xl border shadow-sm transition-all ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white hover:shadow-md"}`}
                    >
                      {/* Header/Summary Row */}
                      <div className="p-4 md:p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`p-3 rounded-xl ${category.color} text-white shadow-sm`}
                            >
                              <PhilippinePeso className="w-5 h-5" />
                            </div>
                            <div>
                              <h3
                                className={`font-semibold text-lg ${textPrimary}`}
                              >
                                {category.name}
                              </h3>
                              <div
                                className={`text-sm flex items-center gap-2 ${textSecondary}`}
                              >
                                <span>
                                  Allocated: ₱
                                  {category.allocated.toLocaleString()}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                <span>Spent: ₱{spent.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-auto">
                            <Button
                              variant={isExpanded ? "secondary" : "outline"}
                              size="sm"
                              onClick={() =>
                                setExpandedCategory(
                                  isExpanded ? null : category.id,
                                )
                              }
                              className={
                                isDark
                                  ? "border-gray-600 hover:bg-gray-700"
                                  : ""
                              }
                            >
                              {isExpanded ? "Close" : "Manage"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCategory(category.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Progress Bar & Slider */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs font-medium">
                            <span className={textSecondary}>
                              Allocation Limit
                            </span>
                            <span
                              className={
                                remainingInCategory < 0
                                  ? "text-red-500"
                                  : "text-green-500"
                              }
                            >
                              Available: ₱{remainingInCategory.toLocaleString()}
                            </span>
                          </div>
                          <Slider
                            value={[category.allocated]}
                            onValueChange={(value) =>
                              updateAllocation(category.id, value[0])
                            }
                            max={totalBudget}
                            step={100}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Expanded Expenses Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`border-t ${isDark ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50/50"}`}
                          >
                            <div className="p-4 md:p-5 space-y-5">
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Input
                                  placeholder="Expense description"
                                  value={newExpenseDesc}
                                  onChange={(e) =>
                                    setNewExpenseDesc(e.target.value)
                                  }
                                  className={`flex-grow ${inputBg}`}
                                />
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Amount"
                                    value={newExpenseAmount}
                                    onChange={(e) =>
                                      setNewExpenseAmount(e.target.value)
                                    }
                                    className={`w-32 ${inputBg}`}
                                  />
                                  <Button
                                    onClick={() => addExpense(category.id)}
                                    disabled={
                                      !newExpenseDesc || !newExpenseAmount
                                    }
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h4
                                  className={`text-xs uppercase tracking-wider font-semibold ${textSecondary}`}
                                >
                                  Transaction History
                                </h4>
                                <AnimatePresence mode="popLayout">
                                  {category.expenses &&
                                  category.expenses.length > 0 ? (
                                    <div className="space-y-2">
                                      {category.expenses.map((expense) => (
                                        <motion.div
                                          key={expense.id}
                                          layout
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: 10 }}
                                          className={`flex justify-between items-center p-3 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} hover:shadow-sm transition-shadow`}
                                        >
                                          <div>
                                            <p
                                              className={`font-medium ${textPrimary}`}
                                            >
                                              {expense.description}
                                            </p>
                                            <p
                                              className={`text-xs ${textSecondary}`}
                                            >
                                              {new Date(
                                                expense.date,
                                              ).toLocaleDateString()}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-4">
                                            <span
                                              className={`font-semibold ${textPrimary}`}
                                            >
                                              ₱{expense.amount.toLocaleString()}
                                            </span>
                                            <button
                                              onClick={() =>
                                                removeExpense(
                                                  category.id,
                                                  expense.id,
                                                )
                                              }
                                              className="text-gray-400 hover:text-red-500 transition-colors"
                                              title="Delete expense"
                                            >
                                              <MinusCircle className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  ) : (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className={`text-sm ${textSecondary} italic text-center py-6 border-2 border-dashed rounded-lg ${isDark ? "border-gray-700" : "border-gray-200"}`}
                                    >
                                      No expenses recorded yet.
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sidebar / Overview - spans 1 col */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribution</CardTitle>
              <CardDescription>Budget breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <div className="space-y-6">
                  {/* Visual Bar */}
                  <div className="flex h-4 w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {categories.map((category) => {
                      const percentage = getPercentage(category.allocated);
                      return (
                        <motion.div
                          key={category.id}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className={`${category.color}`}
                          title={`${category.name}: ${percentage}%`}
                        />
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="space-y-3">
                    {categories.map((category) => {
                      const percentage = getPercentage(category.allocated);
                      return (
                        <div
                          key={category.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full ${category.color}`}
                            />
                            <span className={textPrimary}>{category.name}</span>
                          </div>
                          <span className={`font-mono ${textSecondary}`}>
                            {percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={`text-center py-8 ${textSecondary} text-sm`}>
                  Add categories to see distribution
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-none">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Budget Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-blue-50 text-sm">
              <p>• Keep expenses updated regularly for accurate tracking.</p>
              <p>
                • Aim to keep allocations under 90% of total budget for
                flexibility.
              </p>
              <p>• Review category spend weekly.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BudgetAllocation;
