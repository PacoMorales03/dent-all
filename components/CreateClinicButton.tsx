"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Label } from "@radix-ui/react-label";
import { Input } from "./ui/input";
import { useState } from "react";

export function CreateClinicButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateClinic = async () => {
    setLoading(true);
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/clinics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          address,
        }),
      });

      if (!res.ok) {
        const errMsg = await res.text();
        setError(errMsg || "Error creating clinic");
        setLoading(false);
        return;
      }

      setOpen(false);
      setName("");
      setPhone("");
      setAddress("");
    } catch (e) {
      setError("Network or server error");
    } finally {
      setLoading(false);
    }
    router.refresh();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="h-14 px-8 text-lg gap-3 font-semibold"
          >
            <IconPlus className="w-5 h-5" /> Create Clinic
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="h-auto">
          <SheetHeader>
            <SheetTitle>Create Clinic</SheetTitle>
            <SheetDescription>
              Please enter the clinic details below.
            </SheetDescription>
          </SheetHeader>
          <div className="grid flex-1 auto-rows-min gap-6 px-4">
            <div className="grid gap-3">
              <Label htmlFor="sheet-name">Clinic Name</Label>
              <Input
                id="sheet-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="sheet-phone">Phone</Label>
              <Input
                id="sheet-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="sheet-address">Address</Label>
              <Input
                id="sheet-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-600">{error}</p>}
          </div>
          <SheetFooter>
            <Button type="submit" onClick={handleCreateClinic} disabled={loading}>
              {loading ? "Loading..." : "Create"}
            </Button>
            <SheetClose asChild>
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
