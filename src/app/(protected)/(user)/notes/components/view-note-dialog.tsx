'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Customer } from '@/types/cutomer.type';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Note } from '@/types/note.type';
import { Separator } from '@/components/ui/separator';


export function ViewNoteDialog({ note }: { note: Note }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start" size="sm">
          Ver Detalles
        </Button>
      </DialogTrigger>
  
      <DialogContent className="max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-lg sm:max-w-xl">
        <DialogHeader className="items-center">
          <DialogTitle>Aviso</DialogTitle>
        </DialogHeader>

        <Card className="p-4 space-y-3 text-sm sm:text-base w-full max-h-[80vh] overflow-y-auto">
          <CardContent className="p-4 space-y-3 text-sm sm:text-base w-full max-h-[20vh] overflow-y-auto">
            <p className="break-words">{note.description}</p>
          </CardContent>
        </Card>
  
        <p><strong>Fecha:</strong> {note.date}</p>
        <p><strong>Creado por:</strong> {note.user.email}</p>
  
        {/* Botón de Cerrar */}
        <div className="flex justify-end mt-4">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
  
}
