"use client";

import { useState } from "react";
import { loginAdmin } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await loginAdmin(username, password);
      if (result.success) {
        toast({ title: "Sukses", description: result.message });
        window.location.href = "/admin";
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 p-4">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-2">Admin/Staff Login</h2>
        <div>
          <label className="text-sm font-medium">Username</label>
          <Input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Proses..." : "Login"}
        </Button>
      </form>
    </div>
  );
}
