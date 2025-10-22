export interface CostItem {
  id: string;
  description: string;
  amount: number;
  isVariable?: boolean;
}

export interface Task {
  id: string;
  description: string;
  dueDate: string;
  isComplete: boolean;
}

export interface EventData {
  id:string;
  name: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  attendees: number;
  costItems: CostItem[];
  tasks: Task[];
}
