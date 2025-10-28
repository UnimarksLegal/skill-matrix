import React, { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast"; // if your project uses shadcn/ui
import { Button } from "@/components/ui/button";

interface ActivityLog {
  id: number;
  username: string;
  action: string;
  timestamp: string;
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // 🧠 Your backend API base (same as used in Index.tsx)
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://skill-matrix-9fer.onrender.com/api";

  useEffect(() => {
    async function fetchLogs() {
      try {
        const response = await fetch(`${API_BASE}/activity`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        } else {
          toast({
            title: "Failed to load activity logs",
            description: "Please check your connection or credentials.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  if (loading) {
    return <p className="p-4 text-center">Loading activity logs...</p>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🧾 Activity Log</h1>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
        >
          Refresh
        </Button>
      </div>

      {logs.length === 0 ? (
        <p>No activity recorded yet.</p>
      ) : (
        <table className="min-w-full border border-gray-200 rounded-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{log.username}</td>
                <td className="px-4 py-2">{log.action}</td>
                <td className="px-4 py-2">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
