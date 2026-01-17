"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Phone, MapPin, Mail } from "lucide-react";
import { CustomerDialog } from "./customer-dialog";
import { deleteCustomerAction } from "@/actions/customer-actions";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export function CustomerTable({ customers }: { customers: any[] }) {
    const handleDelete = async (id: string) => {
        try {
            await deleteCustomerAction(id);
            toast.success("Cliente eliminado");
        } catch (error) {
            toast.error("Error al eliminar cliente");
        }
    };

    return (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm text-gray-900">
            <Table>
                <TableHeader className="bg-gray-100">
                    <TableRow>
                        <TableHead className="font-bold text-gray-700">Nombre</TableHead>
                        <TableHead className="font-bold text-gray-700">Teléfono</TableHead>
                        <TableHead className="font-bold text-gray-700">Dirección</TableHead>
                        <TableHead className="w-[100px] text-right font-bold text-gray-700">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                                No hay clientes registrados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        customers.map((customer) => (
                            <TableRow key={customer.id} className="hover:bg-gray-100 transition-colors border-b border-gray-100">
                                <TableCell className="font-medium text-gray-900">
                                    <div className="flex flex-col">
                                        <span className="text-base">{customer.name}</span>
                                        {customer.status === 'waiting_address' && (
                                            <Badge variant="secondary" className="w-fit text-[10px] mt-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                                Falta Dirección
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 text-sm text-gray-600">
                                        {customer.phone ? (
                                            <div className="flex items-center gap-1.5 text-gray-900">
                                                <Phone className="h-3 w-3 text-gray-500" />
                                                {customer.phone}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Sin teléfono</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {customer.address ? (
                                        <div className="flex items-center gap-1.5 text-sm text-gray-900">
                                            <MapPin className="h-3 w-3 text-gray-500" />
                                            {customer.address}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">Sin dirección</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <CustomerDialog
                                            customer={customer}
                                            trigger={
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            }
                                        />

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Se eliminará permanentemente al cliente
                                                        <span className="font-bold"> {customer.name}</span>.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-red-600 hover:bg-red-700"
                                                        onClick={() => handleDelete(customer.id)}
                                                    >
                                                        Eliminar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
