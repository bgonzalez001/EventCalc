
export interface CostItem {
  id: string;
  description: string;
  amount: number;
}

export interface Task {
  id: string;
  description: string;
  dueDate: string; // YYYY-MM-DD format
  isComplete: boolean;
}

export interface EventData {
  id: string;
  name: string;
  date: string;
  totalBudget: number;
  costItems: CostItem[];
  tasks: Task[];
}
