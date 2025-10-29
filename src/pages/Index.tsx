import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, Download, Edit2, Plus, Save, Settings2, Trash2, Upload, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Unimarks Legal — Skills & Training Matrix
 * ------------------------------------------------
 * Single-file React component with Flask API integration placeholders.
 * Tailwind + shadcn/ui + lucide-react.
 *
 * Features
 * - Departments: Sales, Marketing, Legal, Operations, HR (tabs)
 * - Per-department skills (editable: add/remove, rename)
 * - Employee roster per department (add / inline rename / remove)
 * - Skill levels per employee per skill with legend: X, 1, 2, 3, 4
 * - Current vs Target capability metrics (per-employee & team)
 * - Target threshold selectable (default: level 3)
 * - Search filter, CSV/JSON export & JSON import
 * - LocalStorage persistence (for preview) + Flask API placeholders
 */

// ----------------------------- Types

type Level = "X" | 1 | 2 | 3 | 4;

type Employee = {
  id: string;
  name: string;
  role?: string;
  levels: Record<string, Level>; // key = skill name
};

type Department = {
  id: string;
  name: string;
  targetLevel: 1 | 2 | 3 | 4;
  skills: string[]; // ordered list
  employees: Employee[];
};

type Store = {
  departments: Department[];
  version: number;
};

// ----------------------------- API Service (Flask Integration Points)

const API_BASE = "https://skill-matrix-9fer.onrender.com/api";

const apiService = {
  // GET /api/departments - Fetch all departments with employees and skills
  async fetchDepartments(): Promise<Store> {
    const response = await fetch(`${API_BASE}/departments`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch departments");
    }
    return await response.json();
  },

  // POST /api/departments/<dept_id>/employees - Add new employee to department
  async addEmployee(deptId: string, employee: Omit<Employee, "id">): Promise<Department> {
    const response = await fetch(`${API_BASE}/departments/${deptId}/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: employee.name, 
        role: employee.role,
        levels: employee.levels
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to add employee");
    }
    return await response.json();
  },

  // PUT /api/employees/:empId - Update employee details (name, role)
  async updateEmployee(empId: string, updates: { name?: string; role?: string }): Promise<Department> {
    const response = await fetch(`${API_BASE}/employees/${empId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error("Failed to update employee");
    }
    return await response.json();
  },

  // DELETE /api/employees/:empId - Remove employee
  async deleteEmployee(empId: string): Promise<Department> {
    const response = await fetch(`${API_BASE}/employees/${empId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to delete employee");
    }
    return await response.json();
  },

  // PUT /api/skills/level - Update skill level for an employee
  async updateSkillLevel(empId: string, skillName: string, level: Level): Promise<Department> {
    const response = await fetch(`${API_BASE}/skills/level`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        employeeId: empId, 
        skillName, 
        level 
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to update skill level");
    }
    return await response.json();
  },

  // POST /api/skills - Add new skill to department
  async addSkill(deptId: string, skillName: string): Promise<Department> {
    const response = await fetch(`${API_BASE}/skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        departmentId: deptId, 
        name: skillName 
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to add skill");
    }
    return await response.json();
  },

  // DELETE /api/skills - Remove skill from department
  async deleteSkill(deptId: string, skillName: string): Promise<Department> {
    const response = await fetch(`${API_BASE}/skills`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        departmentId: deptId, 
        name: skillName 
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to delete skill");
    }
    return await response.json();
  },

  // PUT /api/departments/:deptId - Update department target level
  async updateTargetLevel(deptId: string, targetLevel: number): Promise<Department> {
    const response = await fetch(`${API_BASE}/departments/${deptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetLevel }),
    });
    if (!response.ok) {
      throw new Error("Failed to update target level");
    }
    return await response.json();
  },

  // POST /api/import - Import entire dataset
  async importData(data: Store): Promise<void> {
    try {
      await fetch(`${API_BASE}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.log("API not available, using local state");
    }
  },

  // POST /api/departments - Create new department
  async addDepartment(department: Omit<Department, "id">): Promise<Department> {
    const response = await fetch(`${API_BASE}/departments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: department.name,
        targetLevel: department.targetLevel
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to add department");
    }
    return await response.json();
  },

  // PUT /api/departments/:deptId - Update department details
  async updateDepartment(deptId: string, updates: { name?: string }): Promise<Department> {
    const response = await fetch(`${API_BASE}/departments/${deptId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error("Failed to update department");
    }
    return await response.json();
  },

  // DELETE /api/departments/:deptId - Delete department and all its employees
  async deleteDepartment(deptId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/departments/${deptId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Failed to delete department");
    }
  },
};

// ----------------------------- Helpers

const LS_KEY = "unimarks-skills-matrix-v1";

const COLORS: Record<Level, string> = {
  X: "bg-muted text-muted-foreground border border-dashed",
  1: "bg-red-500/15 text-red-600 border border-red-500/30",
  2: "bg-amber-500/15 text-amber-700 border border-amber-500/30",
  3: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30",
  4: "bg-violet-500/15 text-violet-700 border border-violet-500/30",
};

const LEVEL_LABEL: Record<Level, string> = {
  X: "Exempt",
  1: "Not yet capable / needs training",
  2: "Some capability / training started",
  3: "Capable / training finished",
  4: "Expert / can train others",
};

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function clamp<T>(v: T) {
  return v;
}

function levelToPct(l: Level) {
  if (l === "X") return null; // excluded from denominator
  return (Number(l) / 4) * 100; // 1->25, 2->50, 3->75, 4->100
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(s: string) {
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ----------------------------- Seed Data

const seed: Store = {
  version: 1,
  departments: [
    {
      id: uid("dept"),
      name: "Sales",
      targetLevel: 3,
      skills: [
        "Lead Generation",
        "Discovery Calls",
        "Proposal Writing",
        "Negotiation",
        "CRM (HubSpot)",
        "IP Pitch (TM/Patent)",
        "Follow-ups & Closing",
      ],
      employees: [
        { id: uid("emp"), name: "Sribhavani", role: "CST Head", levels: {} },
        { id: uid("emp"), name: "Akash", role: "BD Executive", levels: {} },
      ],
    },
    {
      id: uid("dept"),
      name: "Marketing",
      targetLevel: 3,
      skills: [
        "Content Writing (IP)",
        "SEO Basics",
        "LinkedIn Posting",
        "Email Marketing",
        "Design (Canva)",
        "Ads (Meta/Google)",
        "Analytics & Reporting",
      ],
      employees: [
        { id: uid("emp"), name: "Priya", role: "Content Lead", levels: {} },
        { id: uid("emp"), name: "Naveen", role: "Designer", levels: {} },
      ],
    },
    {
      id: uid("dept"),
      name: "Legal",
      targetLevel: 3,
      skills: [
        "TM Prosecution",
        "Opposition & Rectification",
        "Drafting (Notices/Pleadings)",
        "Legal Research",
        "Client Advisory",
        "Court Filings (Madras HC)",
        "Evidence & Affidavits",
        "Patent Search (Novelty/FTO)",
      ],
      employees: [
        { id: uid("emp"), name: "Keerthana", role: "Associate", levels: {} },
        { id: uid("emp"), name: "Rahul", role: "Senior Associate", levels: {} },
      ],
    },
    {
      id: uid("dept"),
      name: "Operations",
      targetLevel: 3,
      skills: [
        "Billing & Invoicing",
        "Process Compliance",
        "Vendor Management",
        "Scheduling & Dockets",
        "Knowledge Management",
        "IT Tools (ClickUp/Drive)",
      ],
      employees: [
        { id: uid("emp"), name: "Meena", role: "Ops Lead", levels: {} },
      ],
    },
    {
      id: uid("dept"),
      name: "HR",
      targetLevel: 3,
      skills: [
        "Hiring & JD Crafting",
        "Onboarding",
        "Performance Reviews",
        "Training & L&D",
        "Culture & 4R Enforcement",
        "Payroll & Compliance",
      ],
      employees: [
        { id: uid("emp"), name: "Arjun", role: "People Dev.", levels: {} },
      ],
    },
  ],
};

// initialize levels to 1 for all defined skills unless present
seed.departments.forEach((d) => {
  d.employees.forEach((e) => {
    const initial: Record<string, Level> = {};
    d.skills.forEach((s) => (initial[s] = 1));
    e.levels = { ...initial, ...e.levels };
  });
});

// ----------------------------- UI Bits

function LevelBadge({ value }: { value: Level }) {
  return (
    <Badge className={`${COLORS[value]} rounded-md px-2 py-1 text-xs font-medium`}>{String(value)}</Badge>
  );
}

function LevelCell({ value, onChange }: { value: Level; onChange: (v: Level) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full min-w-[52px] px-1 py-1 flex items-center justify-center">
          <LevelBadge value={value} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-36">
        <DropdownMenuLabel>Set Level</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["X", 1, 2, 3, 4] as Level[]).map((lv) => (
          <DropdownMenuItem key={String(lv)} onClick={() => onChange(lv)}>
            <div className="flex items-center gap-2"><LevelBadge value={lv} /><span className="text-xs">{LEVEL_LABEL[lv]}</span></div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ----------------------------- Main Component

const Index = () => {
  const { toast } = useToast();
  
  const [store, setStore] = useState<Store>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return seed;
  });

  const [activeDeptId, setActiveDeptId] = useState<string>(store.departments[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [addEmpOpen, setAddEmpOpen] = useState(false);
  const [empDraft, setEmpDraft] = useState<{ name: string; role: string }>({ name: "", role: "" });
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [deptDraft, setDeptDraft] = useState<{ name: string }>({ name: "" });
  const [editDeptOpen, setEditDeptOpen] = useState(false);
  const [editDeptId, setEditDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");

  // Load initial data from Flask backend
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiService.fetchDepartments();
        setStore(data);
        if (data.departments[0]) {
          setActiveDeptId(data.departments[0].id);
        }
      } catch (error) {
        console.error("Failed to load departments:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Save to localStorage as fallback (remove when Flask backend is connected)
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  }, [store]);

  const dept = useMemo(() => store.departments.find((d) => d.id === activeDeptId)!, [store, activeDeptId]);

  // ------- Department Stats (for overview cards)
  const departmentStats = useMemo(() => {
    return store.departments.map((d) => {
      let sum = 0;
      let count = 0;
      for (const e of d.employees) {
        for (const s of d.skills) {
          const lv = e.levels[s];
          const pct = levelToPct(lv);
          if (pct !== null) {
            sum += pct;
            count += 1;
          }
        }
      }
      const avgPct = count ? sum / count : 0;
      // Convert to 5.0 scale (avgPct is 0-100, we want 0-5)
      const avgRating = (avgPct / 100) * 5;
      return {
        id: d.id,
        name: d.name,
        avgRating,
        employeeCount: d.employees.length,
      };
    });
  }, [store.departments]);

  // ------- Company-wide average
  const companyAverage = useMemo(() => {
    if (departmentStats.length === 0) return 0;
    const sum = departmentStats.reduce((acc, d) => acc + d.avgRating, 0);
    return sum / departmentStats.length;
  }, [departmentStats]);

  // ------- Metrics
  const teamStats = useMemo(() => {
    if (!dept) return { avgPct: 0, targetHitPct: 0 };
    let sum = 0;
    let count = 0;
    let hit = 0;
    let denom = 0;
    for (const e of dept.employees) {
      for (const s of dept.skills) {
        const lv = e.levels[s];
        const pct = levelToPct(lv);
        if (pct !== null) {
          sum += pct;
          count += 1;
          denom += 1;
          if (Number(lv) >= dept.targetLevel) hit += 1;
        }
      }
    }
    return {
      avgPct: count ? sum / count : 0,
      targetHitPct: denom ? (hit / denom) * 100 : 0,
    };
  }, [dept]);

  // ------- Actions
  function setDept(mutator: (d: Department) => void) {
    setStore((prev) => ({
      ...prev,
      departments: prev.departments.map((d) => {
        if (d.id !== dept.id) return d;
        const copy = structuredClone(d) as Department;
        mutator(copy);
        return copy;
      }),
    }));
  }

  async function addEmployee() {
    const name = empDraft.name.trim();
    if (!name) return;
    
    const levels: Record<string, Level> = {};
    dept.skills.forEach((s) => (levels[s] = 1));
    
    try {
      const updatedDept = await apiService.addEmployee(dept.id, {
        name,
        role: empDraft.role.trim(),
        levels,
      });
      
      // Update the specific department in the store
      setStore((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === updatedDept.id ? updatedDept : d
        ),
      }));
      
      setEmpDraft({ name: "", role: "" });
      setAddEmpOpen(false);
    } catch (error) {
      console.error("Failed to add employee:", error);
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function removeEmployee(id: string) {
    try {
      const updatedDept = await apiService.deleteEmployee(id);
      
      setStore((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === updatedDept.id ? updatedDept : d
        ),
      }));
    } catch (error) {
      console.error("Failed to delete employee:", error);
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function renameEmployee(id: string, name: string) {
    try {
      const updatedDept = await apiService.updateEmployee(id, { name });
      
      setStore((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === updatedDept.id ? updatedDept : d
        ),
      }));
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast({
        title: "Error",
        description: "Failed to update employee. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function setRole(id: string, role: string) {
    try {
      const updatedDept = await apiService.updateEmployee(id, { role });
      
      setStore((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === updatedDept.id ? updatedDept : d
        ),
      }));
    } catch (error) {
      console.error("Failed to update employee role:", error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function setLevel(empId: string, skill: string, lv: Level) {
    try {
      const updatedDept = await apiService.updateSkillLevel(empId, skill, lv);
      
      setStore((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === updatedDept.id ? updatedDept : d
        ),
      }));
    } catch (error) {
      console.error("Failed to update skill level:", error);
      toast({
        title: "Error",
        description: "Failed to update skill level. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function addSkill() {
    const s = newSkill.trim();
    if (!s) return;
    
    try {
      const updatedDept = await apiService.addSkill(dept.id, s);
      
      setStore((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === updatedDept.id ? updatedDept : d
        ),
      }));
      
      setNewSkill("");
    } catch (error) {
      console.error("Failed to add skill:", error);
      toast({
        title: "Error",
        description: "Failed to add skill. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function removeSkill(skill: string) {
    try {
      const updatedDept = await apiService.deleteSkill(dept.id, skill);
      
      setStore((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === updatedDept.id ? updatedDept : d
        ),
      }));
    } catch (error) {
      console.error("Failed to delete skill:", error);
      toast({
        title: "Error",
        description: "Failed to delete skill. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function updateTargetLevel(targetLevel: number) {
    try {
      const updatedDept = await apiService.updateTargetLevel(dept.id, targetLevel);
      
      setStore((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === updatedDept.id ? updatedDept : d
        ),
      }));
    } catch (error) {
      console.error("Failed to update target level:", error);
      toast({
        title: "Error",
        description: "Failed to update target level. Please try again.",
        variant: "destructive",
      });
    }
  }

  function exportJSON() {
    // TODO: Optional - export via Flask API endpoint for server-side processing
    download(`unimarks-skills-matrix.json`, JSON.stringify(store, null, 2));
  }

  function exportCSV() {
    // TODO: Optional - export via Flask API endpoint for server-side processing
    const rows: string[] = [];
    for (const d of store.departments) {
      const header = ["Department", "Employee", "Role", ...d.skills].map(csvEscape).join(",");
      rows.push(header);
      for (const e of d.employees) {
        const lv = d.skills.map((s) => String(e.levels[s] ?? ""));
        rows.push([csvEscape(d.name), csvEscape(e.name), csvEscape(e.role ?? ""), ...lv.map(csvEscape)].join(","));
      }
      rows.push("");
    }
    download("unimarks-skills-matrix.csv", rows.join("\n"));
  }

  async function importJSON() {
    try {
      const parsed: Store = JSON.parse(jsonText);
      if (!parsed?.departments?.length) throw new Error("Invalid file");
      
      // TODO: API call to Flask backend
      await apiService.importData(parsed);
      
      setStore(parsed);
      setActiveDeptId(parsed.departments[0].id);
      setImportOpen(false);
      setJsonText("");
    } catch (e) {
      alert("Could not import JSON. Please check the content.");
    }
  }

  async function addDepartment() {
    const name = deptDraft.name.trim();
    if (!name) return;

    // TODO: API call to Flask backend
    const newDept = await apiService.addDepartment({
      name,
      targetLevel: 3,
      skills: [],
      employees: [],
    });

    setStore((prev) => ({
      ...prev,
      departments: [...prev.departments, newDept],
    }));
    setDeptDraft({ name: "" });
    setAddDeptOpen(false);
    setActiveDeptId(newDept.id);
  }

  async function updateDepartmentName() {
    if (!editDeptId) return;
    const name = editDeptName.trim();
    if (!name) return;

    try {
      const updatedDept = await apiService.updateDepartment(editDeptId, { name });
      
      setStore((prev) => ({
        ...prev,
        departments: prev.departments.map((d) =>
          d.id === updatedDept.id ? updatedDept : d
        ),
      }));
      
      setEditDeptOpen(false);
      setEditDeptId(null);
      setEditDeptName("");
    } catch (error) {
      console.error("Failed to update department:", error);
      toast({
        title: "Error",
        description: "Failed to update department. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function deleteDepartment(deptId: string) {
    if (!confirm("Are you sure you want to delete this department? All employees in this department will be removed.")) {
      return;
    }

    try {
      await apiService.deleteDepartment(deptId);
      
      // Refetch data after deletion
      const updatedStore = await apiService.fetchDepartments();
      setStore(updatedStore);

      // Switch to first department if current is deleted
      if (activeDeptId === deptId && updatedStore.departments.length > 0) {
        setActiveDeptId(updatedStore.departments[0].id);
      }
    } catch (error) {
      console.error("Failed to delete department:", error);
      toast({
        title: "Error",
        description: "Failed to delete department. Please try again.",
        variant: "destructive",
      });
    }
  }

  function openEditDepartment(deptId: string) {
    const d = store.departments.find((d) => d.id === deptId);
    if (!d) return;
    setEditDeptId(deptId);
    setEditDeptName(d.name);
    setEditDeptOpen(true);
  }

  // Default active tab on mount
  useEffect(() => {
    if (!activeDeptId && store.departments[0]) setActiveDeptId(store.departments[0].id);
  }, [store.departments, activeDeptId]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dept?.employees || [];
    return (dept?.employees || []).filter((e) =>
      [e.name, e.role].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [dept, search]);

  if (!dept) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Unimarks Skills & Training Matrix</h1>
          <p className="text-sm text-muted-foreground">
            Track department capabilities and employee skills across the organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={exportCSV}><Download className="h-4 w-4" />CSV</Button>
          <Button variant="outline" className="gap-2" onClick={exportJSON}><Save className="h-4 w-4" />Save JSON</Button>
          <Button variant="secondary" className="gap-2" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" />Import</Button>
        </div>
      </header>

      {/* Company-Wide Performance */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Company-Wide Performance</div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold">{companyAverage.toFixed(2)}</div>
                <div className="text-lg text-muted-foreground">/ 5.0 average</div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">Total Departments</div>
              <div className="text-2xl font-semibold">{store.departments.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Overview Dashboard */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Department Overview</h2>
          <Button className="gap-2" onClick={() => setAddDeptOpen(true)}>
            <Building2 className="h-4 w-4" />
            Add Department
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentStats.map((deptStat) => (
            <Card key={deptStat.id} className="relative hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{deptStat.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDepartment(deptStat.id)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Rename Department
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteDepartment(deptStat.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Department
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">{deptStat.avgRating.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">/ 5.0 average</div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{deptStat.employeeCount} {deptStat.employeeCount === 1 ? 'employee' : 'employees'}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveDeptId(deptStat.id)}
                >
                  View Skills Matrix
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="col-span-1 md:col-span-2 flex items-center gap-2">
              <Input placeholder="Search team member…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button className="gap-2" onClick={() => setAddEmpOpen(true)}><UserPlus className="h-4 w-4" />Add Member</Button>
              <Button variant="outline" className="gap-2" onClick={() => setSkillsOpen(true)}><Settings2 className="h-4 w-4" />Skills</Button>
            </div>
            <div className="flex items-center gap-3 md:justify-end">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Team Capability (avg)</div>
                <div className="text-xl font-semibold">{fmtPct(teamStats.avgPct)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Target Hit</div>
                <div className="text-xl font-semibold">{fmtPct(teamStats.targetHitPct)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Target Level</Label>
                <Select value={String(dept.targetLevel)} onValueChange={(v) => updateTargetLevel(Number(v))}>
                  <SelectTrigger className="w-[72px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeDeptId} onValueChange={setActiveDeptId} className="w-full">
        <TabsList className="w-full flex flex-wrap justify-start gap-2">
          {store.departments.map((d) => (
            <TabsTrigger key={d.id} value={d.id} className="data-[state=active]:font-semibold">{d.name}</TabsTrigger>
          ))}
        </TabsList>
        {store.departments.map((d) => (
          <TabsContent key={d.id} value={d.id} className="mt-4">
            <DepartmentTable
              department={d.id === dept.id ? dept : d}
              onSetLevel={setLevel}
              onRenameEmployee={renameEmployee}
              onRenameRole={setRole}
              onRemoveEmployee={removeEmployee}
              search={search}
              active={d.id === dept.id}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Competency Key</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {(["X", 1, 2, 3, 4] as Level[]).map((lv) => (
            <div key={String(lv)} className="flex items-start gap-2">
              <LevelBadge value={lv} />
              <div className="text-xs leading-tight">{LEVEL_LABEL[lv]}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addEmpOpen} onOpenChange={setAddEmpOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Add Team Member — {dept?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="col-span-1 text-right">Name</Label>
              <Input className="col-span-3" autoFocus value={empDraft.name} onChange={(e) => setEmpDraft((x) => ({ ...x, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="col-span-1 text-right">Role</Label>
              <Input className="col-span-3" value={empDraft.role} onChange={(e) => setEmpDraft((x) => ({ ...x, role: e.target.value }))} />
            </div>
            <p className="text-[11px] text-muted-foreground">New member will default to level 1 for all current skills in this department. You can adjust in the grid.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddEmpOpen(false)}>Cancel</Button>
            <Button onClick={addEmployee} className="gap-2"><UserPlus className="h-4 w-4" />Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Skills Manager */}
      <Dialog open={skillsOpen} onOpenChange={setSkillsOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Manage Skills — {dept?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input placeholder="Add new skill" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
              <Button className="gap-2" onClick={addSkill}><Plus className="h-4 w-4" />Add</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {dept?.skills.map((s) => (
                <div key={s} className="flex items-center justify-between rounded-xl border p-2">
                  <div className="text-sm font-medium">{s}</div>
                  <Button size="icon" variant="destructive" onClick={() => removeSkill(s)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Removing a skill deletes the associated levels from all members in this department.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setSkillsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import JSON */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Import JSON</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full h-64 rounded-md border p-3 font-mono text-xs"
            placeholder="Paste a previously exported JSON here"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button className="gap-2" onClick={importJSON}><Upload className="h-4 w-4" />Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Department Dialog */}
      <Dialog open={addDeptOpen} onOpenChange={setAddDeptOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="col-span-1 text-right">Name</Label>
              <Input
                className="col-span-3"
                autoFocus
                placeholder="e.g., Finance, IT Support"
                value={deptDraft.name}
                onChange={(e) => setDeptDraft({ name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addDepartment();
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              New department will start with no skills or employees. You can add them after creation.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDeptOpen(false)}>Cancel</Button>
            <Button onClick={addDepartment} className="gap-2">
              <Building2 className="h-4 w-4" />
              Add Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={editDeptOpen} onOpenChange={setEditDeptOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Rename Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="col-span-1 text-right">Name</Label>
              <Input
                className="col-span-3"
                autoFocus
                value={editDeptName}
                onChange={(e) => setEditDeptName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateDepartmentName();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDeptOpen(false)}>Cancel</Button>
            <Button onClick={updateDepartmentName} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function DepartmentTable({
  department,
  onSetLevel,
  onRenameEmployee,
  onRenameRole,
  onRemoveEmployee,
  search,
  active,
}: {
  department: Department;
  onSetLevel: (empId: string, skill: string, lv: Level) => void;
  onRenameEmployee: (id: string, name: string) => void;
  onRenameRole: (id: string, role: string) => void;
  onRemoveEmployee: (id: string) => void;
  search: string;
  active: boolean;
}) {
  const [editNameId, setEditNameId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  useEffect(() => {
    // reset inline edit when tab switches
    if (!active) {
      setEditNameId(null);
      setEditRoleId(null);
    }
  }, [active]);

  const employees = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = department.employees;
    if (!q) return base;
    return base.filter((e) => [e.name, e.role].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [department.employees, search]);

  function rowStats(e: Employee) {
    let sum = 0;
    let count = 0;
    let hit = 0;
    let denom = 0;
    for (const s of department.skills) {
      const lv = e.levels[s];
      const pct = levelToPct(lv);
      if (pct !== null) {
        sum += pct;
        count += 1;
        denom += 1;
        if (Number(lv) >= department.targetLevel) hit += 1;
      }
    }
    const avg = count ? sum / count : 0;
    const hitPct = denom ? (hit / denom) * 100 : 0;
    return { avg, hitPct };
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">{department.name} — Skills Matrix</CardTitle>
          <div className="text-xs text-muted-foreground">{department.skills.length} skills · {department.employees.length} members</div>
        </div>
      </CardHeader>
      <CardContent className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Team Member</TableHead>
              <TableHead className="min-w-[140px]">Role</TableHead>
              {department.skills.map((s) => (
                <TableHead key={s} className="text-center min-w-[120px]">{s}</TableHead>
              ))}
              <TableHead className="text-right min-w-[120px]">Avg Capability</TableHead>
              <TableHead className="text-right min-w-[110px]">Target Hit</TableHead>
              <TableHead className="w-[52px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((e) => {
              const stats = rowStats(e);
              return (
                <TableRow key={e.id} className="hover:bg-muted/30">
                  <TableCell>
                    {editNameId === e.id ? (
                      <Input
                        defaultValue={e.name}
                        autoFocus
                        onBlur={(ev) => {
                          onRenameEmployee(e.id, ev.target.value.trim() || e.name);
                          setEditNameId(null);
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter") {
                            const t = ev.currentTarget as HTMLInputElement;
                            onRenameEmployee(e.id, t.value.trim() || e.name);
                            setEditNameId(null);
                          }
                          if (ev.key === "Escape") setEditNameId(null);
                        }}
                      />
                    ) : (
                      <button className="text-left w-full" onClick={() => setEditNameId(e.id)}>
                        <div className="font-medium leading-none">{e.name}</div>
                        <div className="text-xs text-muted-foreground">click to edit</div>
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    {editRoleId === e.id ? (
                      <Input
                        defaultValue={e.role ?? ""}
                        autoFocus
                        onBlur={(ev) => {
                          onRenameRole(e.id, ev.target.value.trim());
                          setEditRoleId(null);
                        }}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter") {
                            const t = ev.currentTarget as HTMLInputElement;
                            onRenameRole(e.id, t.value.trim());
                            setEditRoleId(null);
                          }
                          if (ev.key === "Escape") setEditRoleId(null);
                        }}
                      />
                    ) : (
                      <button className="text-left w-full text-muted-foreground" onClick={() => setEditRoleId(e.id)}>
                        <div className="leading-none">{e.role ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">click to edit</div>
                      </button>
                    )}
                  </TableCell>
                  {department.skills.map((s) => (
                    <TableCell key={s} className="text-center">
                      <LevelCell value={e.levels[s]} onChange={(lv) => onSetLevel(e.id, s, lv)} />
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-semibold">{fmtPct(stats.avg)}</div>
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-foreground/80" style={{ width: `${stats.avg}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-semibold">{fmtPct(stats.hitPct)}</div>
                      <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-emerald-600/80" style={{ width: `${stats.hitPct}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => onRemoveEmployee(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {employees.length === 0 && (
              <TableRow>
                <TableCell colSpan={3 + department.skills.length}>
                  <div className="text-sm text-muted-foreground py-4">No members match your search.</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default Index;
