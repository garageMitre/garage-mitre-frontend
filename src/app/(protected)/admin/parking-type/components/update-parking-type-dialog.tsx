'use client'

import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { ParkingType } from '@/types/parking-type'
import { updateParkingTypeSchema, UpdateParkingTypeSchemaType } from '@/schemas/parking-type.schema'
import { updateParkingTypeAction } from '@/actions/parking-type/update-parking-type.action'

// ==============================
// Helpers: mes/año a "YYYY-MM"
// ==============================
const MONTHS_ES = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

const getCurrentMonthYYYYMM = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const parseYYYYMM = (ym: string) => {
  const [y, m] = (ym || '').split('-')
  return {
    year: y || String(new Date().getFullYear()),
    month: m || String(new Date().getMonth() + 1).padStart(2, '0'),
  }
}

const buildYYYYMM = (year: string, month: string) => `${year}-${month}`

export function UpdateParkingTypeDailog({ parkingType }: { parkingType: ParkingType }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const form = useForm<UpdateParkingTypeSchemaType>({
    resolver: zodResolver(updateParkingTypeSchema),
    defaultValues: {
      amount: parkingType.amount || 0,
      parkingType: parkingType.parkingType,
      month: getCurrentMonthYYYYMM(), // "YYYY-MM"
    },
  })

  // Años (podés ajustar el rango si querés)
  const years = useMemo(() => {
    const current = new Date().getFullYear()
    const start = current - 2
    const end = current + 10
    const list: string[] = []
    for (let y = start; y <= end; y++) list.push(String(y))
    return list
  }, [])

  const onSubmit = async (values: UpdateParkingTypeSchemaType) => {
    startTransition(async () => {
      const response = await updateParkingTypeAction(parkingType.id, values)

      if (response?.error) {
        toast.error(response.error)
        return
      }

      toast.success('Tipo de Estacionamiento actualizado exitosamente')
      form.reset({
        amount: values.amount,
        parkingType: values.parkingType,
        month: values.month,
      })
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-2 px-2 font-normal" size="sm" onClick={() => setOpen(true)}>
          Editar
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[80vh] sm:max-h-[90vh] overflow-y-auto w-full max-w-md sm:max-w-lg">
        <DialogHeader className="items-center">
          <DialogTitle>Actualizar Tipo de Estacionamiento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* ✅ Mes a actualizar (Select) */}
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => {
                const { year, month } = parseYYYYMM(field.value)

                const setYear = (newYear: string) => field.onChange(buildYYYYMM(newYear, month))
                const setMonth = (newMonth: string) => field.onChange(buildYYYYMM(year, newMonth))

                return (
                  <FormItem>
                    <FormLabel>Mes a actualizar</FormLabel>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Año */}
                      <FormControl>
                        <Select disabled={isPending} value={year} onValueChange={setYear}>
                          <SelectTrigger>
                            <SelectValue placeholder="Año" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((y) => (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>

                      {/* Mes */}
                      <FormControl>
                        <Select disabled={isPending} value={month} onValueChange={setMonth}>
                          <SelectTrigger>
                            <SelectValue placeholder="Mes" />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS_ES.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </div>

                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            {/* Precio */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo */}
            <FormField
              control={form.control}
              name="parkingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Estacionamiento</FormLabel>
                  <FormControl>
                    <Select disabled={isPending} onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXPENSES_1">Expensas 1</SelectItem>
                        <SelectItem value="EXPENSES_2">Expensas 2</SelectItem>
                        <SelectItem value="EXPENSES_ZOM_1">Expensas salon 1</SelectItem>
                        <SelectItem value="EXPENSES_ZOM_2">Expensas salon 2</SelectItem>
                        <SelectItem value="EXPENSES_ZOM_3">Expensas salon 3</SelectItem>
                        <SelectItem value="EXPENSES_RICARDO_AZNAR">Expensas Ricardo Aznar</SelectItem>
                        <SelectItem value="EXPENSES_CARLOS_AZNAR">Expensas Carlos Aznar</SelectItem>
                        <SelectItem value="EXPENSES_ALDO_FONTELA">Expensas Aldo Fontela</SelectItem>
                        <SelectItem value="EXPENSES_NIDIA_FONTELA">Expensas Nidia Fontela</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" type="submit" disabled={isPending}>
              Editar
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
