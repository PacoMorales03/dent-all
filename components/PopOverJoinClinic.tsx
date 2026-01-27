"use client";

import { useState } from "react";

export default function JoinClinicPopover({ show }: { show: boolean }) {
  const [code, setCode] = useState("");

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded">
        <h2>Unirse a una clínica</h2>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código de clínica"
          className="border p-2 rounded"
        />
        <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
          Unirse
        </button>
      </div>
    </div>
  );
}
