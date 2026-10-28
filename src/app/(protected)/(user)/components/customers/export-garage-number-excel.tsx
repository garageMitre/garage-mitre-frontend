'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Customer } from '@/types/cutomer.type';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
  customers: Customer[];
}

export const ExportGarageNumberExcel = ({ customers }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleExport = () => {
    const exportData: any[] = [];

    customers.forEach((customer) => {
      if (customer.customerType === 'OWNER') {
        customer.vehicles.forEach((vehicle) => {
          exportData.push({
            Garage: vehicle.garageNumber,
            Apellido: customer.lastName,
            Nombre: customer.firstName,
          });
        });
      } else if (customer.customerType === 'RENTER') {
        customer.vehicleRenters.forEach((vehicleRenter) => {
          exportData.push({
            Garage: vehicleRenter.garageNumber,
            Apellido: customer.lastName,
            Nombre: customer.firstName,
            Dueño: vehicleRenter.vehicle ?`${vehicleRenter.vehicle.customer.firstName} ${vehicleRenter.vehicle.customer.lastName}`: 'Garage Mitre', // Esta es la columna extra
          });
        });
      }
    });

    if (exportData.length === 0) {
      return alert('No hay datos para exportar.');
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Garages');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `garages_registrados.xlsx`);
  };

  return (
    <div className="flex flex-col space-y-4">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start" size="sm">
            Exportar Excel  Cocheras
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full p-5">
          <DialogHeader className="items-center text-center space-y-6">
            <DialogTitle className="text-base font-normal leading-relaxed">
              Se exportarán los tipos de Cocheras
              <br />
              ¿Desea continuar?
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button 
              className=" py-5 px-10 text-lg font-semibold" 
              onClick={() => {
                handleExport();
                setIsDialogOpen(false);
              }}
            >
              Confirmar exportación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  
};
