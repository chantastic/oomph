"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  Authenticated,
  Unauthenticated,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import workosSignOut from "../actions/workos-sign-out";

function AddAssigneeDialog() {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const createAssignee = useMutation(api.assignees.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await createAssignee({ name: name.trim() });
      setName("");
      setOpen(false);
    } catch (error) {
      console.error("Failed to create assignee:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Assignee</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Assignee</DialogTitle>
          <DialogDescription>
            Enter the name of the person you want to assign tasks to.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter assignee name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Add Assignee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const assignees = useQuery(api.assignees.get);

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Assignees</h1>
          <AddAssigneeDialog />
        </div>
        <Unauthenticated>
          <Link href="/sign-in">Sign in</Link>
        </Unauthenticated>
        <Authenticated>
          <div className="space-y-4">
            {assignees?.map(({ _id, name }) => (
              <Link key={_id} href={`/assignee/${_id}`}>
                <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <h3 className="font-medium">{name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Click to view assignments
                  </p>
                </div>
              </Link>
            ))}
            {assignees?.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No assignees yet. Add your first assignee using the button
                above.
              </div>
            )}
          </div>
          <form action={workosSignOut}>
            <Button type="submit">Sign out</Button>
          </form>
        </Authenticated>
      </div>
    </main>
  );
}
