"use client";

import { useState } from "react";
import { IconDoor, IconDotsVertical, IconPencil, IconTrash } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EditCabinetDialog } from "./EditCabinet";
import { DeleteCabinetDialog } from "./DeleteCabinet";

type Cabinet = {
  id: string;
  clinicId: string;
  num: number;
  description?: string;
};

type Props = {
  cabinet: Cabinet;
  onUpdate: (updatedCabinet: Cabinet) => void;
  onDelete: (cabinetId: string) => void;
};

export function CabinetCard({ cabinet, onUpdate, onDelete }: Props) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div className="group bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
              <IconDoor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                #{cabinet.num}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <IconDotsVertical className="h-4 w-4" />
                    <span className="sr-only">Opciones</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <IconPencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Gabinete {cabinet.num}
            </h3>
            {cabinet.description ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                {cabinet.description}
              </p>
            ) : (
              <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
                Sin descripción
              </p>
            )}
          </div>
        </div>
      </div>

      <EditCabinetDialog
        cabinet={cabinet}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={onUpdate}
      />

      <DeleteCabinetDialog
        cabinet={cabinet}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onSuccess={() => onDelete(cabinet.id)}
      />
    </>
  );
}