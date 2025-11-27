import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TaskWithAssignee, User } from "@shared/schema";
import { ListTodo, Plus, Trash2, Calendar as CalendarIcon, Star, AlertCircle, Clock, Repeat, Filter } from "lucide-react";
import { format, isAfter, isBefore, startOfDay, addDays } from "date-fns";

type Priority = "low" | "medium" | "high";
type Category = "daily" | "weekly" | "one_time";
type FilterType = "all" | "daily" | "weekly" | "one_time";

const priorityColors: Record<Priority, string> = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const categoryLabels: Record<Category, string> = {
  daily: "Daily",
  weekly: "Weekly",
  one_time: "One-time",
};

export function TaskList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newTaskName, setNewTaskName] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("unassigned");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<Category>("one_time");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [pointValue, setPointValue] = useState<number>(10);
  const [filterCategory, setFilterCategory] = useState<FilterType>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: tasks, isLoading } = useQuery<TaskWithAssignee[]>({
    queryKey: ["/api/families", user?.family?.id, "tasks"],
    enabled: !!user?.family,
  });

  const { data: members } = useQuery<User[]>({
    queryKey: ["/api/families", user?.family?.id, "members"],
    enabled: !!user?.family,
  });

  const addTaskMutation = useMutation({
    mutationFn: async (taskData: {
      name: string;
      assignedToId: number | null;
      priority: Priority;
      category: Category;
      dueDate: string | null;
      pointValue: number;
    }) => {
      const response = await apiRequest("POST", `/api/families/${user?.family?.id}/tasks`, taskData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task added!",
        description: "The new chore has been added to the list.",
      });
      setNewTaskName("");
      setAssignedTo("unassigned");
      setPriority("medium");
      setCategory("one_time");
      setDueDate(undefined);
      setPointValue(10);
      queryClient.invalidateQueries({ queryKey: ["/api/families", user?.family?.id, "tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add task",
        variant: "destructive",
      });
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/toggle`, {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.completed) {
        toast({
          title: "Great job!",
          description: `You earned ${data.pointValue} points!`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/families", user?.family?.id, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("DELETE", `/api/tasks/${taskId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task removed",
        description: "The chore has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/families", user?.family?.id, "tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    addTaskMutation.mutate({
      name: newTaskName.trim(),
      assignedToId: assignedTo === "unassigned" ? null : parseInt(assignedTo),
      priority,
      category,
      dueDate: dueDate ? dueDate.toISOString() : null,
      pointValue,
    });
  };

  const getDueDateStatus = (task: TaskWithAssignee) => {
    if (!task.dueDate || task.completed) return null;
    const due = new Date(task.dueDate);
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    if (isBefore(due, today)) {
      return { status: "overdue", label: "Overdue", className: "text-red-600 dark:text-red-400" };
    }
    if (isBefore(due, tomorrow)) {
      return { status: "today", label: "Due today", className: "text-orange-600 dark:text-orange-400" };
    }
    if (isBefore(due, addDays(today, 3))) {
      return { status: "soon", label: format(due, "MMM d"), className: "text-yellow-600 dark:text-yellow-400" };
    }
    return { status: "later", label: format(due, "MMM d"), className: "text-muted-foreground" };
  };

  if (!user?.family) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ListTodo className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Join or create a family to manage tasks
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredTasks = tasks?.filter((task) => {
    if (filterCategory === "all") return true;
    return task.category === filterCategory;
  });

  const sortedTasks = filteredTasks?.sort((a, b) => {
    // Sort by completion status first
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    // Then by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
    // Then by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  const completedCount = tasks?.filter((t) => t.completed).length || 0;
  const totalCount = tasks?.length || 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Tasks
          </CardTitle>
          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {completedCount}/{totalCount} done
              </Badge>
            )}
            <Button
              size="icon"
              variant={showFilters ? "default" : "ghost"}
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button
              size="sm"
              variant={filterCategory === "all" ? "default" : "outline"}
              onClick={() => setFilterCategory("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filterCategory === "daily" ? "default" : "outline"}
              onClick={() => setFilterCategory("daily")}
            >
              <Repeat className="h-3 w-3 mr-1" />
              Daily
            </Button>
            <Button
              size="sm"
              variant={filterCategory === "weekly" ? "default" : "outline"}
              onClick={() => setFilterCategory("weekly")}
            >
              <Clock className="h-3 w-3 mr-1" />
              Weekly
            </Button>
            <Button
              size="sm"
              variant={filterCategory === "one_time" ? "default" : "outline"}
              onClick={() => setFilterCategory("one_time")}
            >
              One-time
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : sortedTasks && sortedTasks.length > 0 ? (
          <div className="space-y-3">
            {sortedTasks.map((task) => {
              const dueDateStatus = getDueDateStatus(task);
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                    task.completed
                      ? "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500"
                      : dueDateStatus?.status === "overdue"
                      ? "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500"
                      : "bg-accent/30"
                  }`}
                  data-testid={`task-${task.id}`}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskMutation.mutate(task.id)}
                    className="h-5 w-5"
                    data-testid={`checkbox-task-${task.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-medium ${
                          task.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.name}
                      </span>
                      <Badge variant="outline" className={priorityColors[task.priority]} data-testid={`badge-priority-${task.id}`}>
                        {task.priority}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        {task.pointValue}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                      {task.assignedTo && (
                        <span>Assigned to {task.assignedTo.displayName}</span>
                      )}
                      {task.category !== "one_time" && (
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[task.category]}
                        </Badge>
                      )}
                      {dueDateStatus && (
                        <span className={`flex items-center gap-1 ${dueDateStatus.className}`}>
                          {dueDateStatus.status === "overdue" && <AlertCircle className="h-3 w-3" />}
                          <CalendarIcon className="h-3 w-3" />
                          {dueDateStatus.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    disabled={deleteTaskMutation.isPending}
                    data-testid={`button-delete-task-${task.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <ListTodo className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No tasks yet. Add your first chore!</p>
          </div>
        )}

        <div className="pt-4 border-t space-y-3">
          <Input
            placeholder="New chore (e.g. Wash dishes)"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            data-testid="input-new-task"
          />
          
          <div className="grid grid-cols-2 gap-2">
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger data-testid="select-assignee">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members?.map((member) => (
                  <SelectItem key={member.id} value={String(member.id)}>
                    {member.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger data-testid="select-priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One-time</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={String(pointValue)} onValueChange={(v) => setPointValue(parseInt(v))}>
              <SelectTrigger data-testid="select-points">
                <SelectValue placeholder="Points" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 points</SelectItem>
                <SelectItem value="10">10 points</SelectItem>
                <SelectItem value="15">15 points</SelectItem>
                <SelectItem value="20">20 points</SelectItem>
                <SelectItem value="25">25 points</SelectItem>
                <SelectItem value="50">50 points</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1" data-testid="button-due-date">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dueDate ? format(dueDate, "MMM d, yyyy") : "Set due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
                {dueDate && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setDueDate(undefined)}
                    >
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            
            <Button
              onClick={handleAddTask}
              disabled={!newTaskName.trim() || addTaskMutation.isPending}
              data-testid="button-add-task"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
