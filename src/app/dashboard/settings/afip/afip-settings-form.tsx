'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateAfipSettingsAction } from "@/actions/business-actions";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck } from "lucide-react";

export function AfipSettingsForm({ initialData }: { initialData: any }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await updateAfipSettingsAction(formData);
            toast.success("Configuración guardada correctamente");
        } catch (error: any) {
            toast.error(error.message || "Error al guardar la configuración");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            <div className="space-y-4 mb-6">
                <h3 className="text-lg font-bold border-b pb-2 mb-4">Datos del Negocio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="font-bold">Nombre del Negocio</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={initialData?.name || ""}
                            placeholder="Ej: Mi Restaurante"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="font-bold">Teléfono</Label>
                        <Input
                            id="phone"
                            name="phone"
                            defaultValue={initialData?.phone || ""}
                            placeholder="Ej: 11 1234 5678"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address" className="font-bold">Dirección</Label>
                    <Input
                        id="address"
                        name="address"
                        defaultValue={initialData?.address || ""}
                        placeholder="Ej: Av. Principal 123"
                    />
                </div>
            </div>

            <div className="space-y-4 mb-6">
                <h3 className="text-lg font-bold border-b pb-2 mb-4">Configuración Fiscal (AFIP)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="afipCuit" className="font-bold">CUIT del Negocio</Label>
                        <Input
                            id="afipCuit"
                            name="afipCuit"
                            defaultValue={initialData?.afipCuit || ""}
                            placeholder="Sin guiones (ej: 20409378472)"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="afipPuntoVenta" className="font-bold">Punto de Venta</Label>
                        <Input
                            id="afipPuntoVenta"
                            name="afipPuntoVenta"
                            type="number"
                            defaultValue={initialData?.afipPuntoVenta || 1}
                            placeholder="Ej: 1"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="afipToken" className="font-bold">Access Token (Afip SDK)</Label>
                    <Input
                        id="afipToken"
                        name="afipToken"
                        type="password"
                        defaultValue={initialData?.afipToken || ""}
                        placeholder="Pega aquí tu Token de autorización"
                    />
                    <p className="text-[10px] text-gray-400">Este token se obtiene desde el panel de Afip SDK.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="afipEnvironment" className="font-bold">Entorno de Facturación</Label>
                    <Select name="afipEnvironment" defaultValue={initialData?.afipEnvironment || "dev"}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona el entorno" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dev">Modo Prueba (Desarrollo)</SelectItem>
                            <SelectItem value="prod">Modo Real (Producción)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="divider border-t my-6"></div>

                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Certificados Propios (Opcional en modo Dev)
                    </h3>

                    <div className="space-y-2">
                        <Label htmlFor="afipCertificate" className="text-xs">Certificado (.crt)</Label>
                        <Textarea
                            id="afipCertificate"
                            name="afipCertificate"
                            className="font-mono text-[10px] min-h-[100px]"
                            defaultValue={initialData?.afipCertificate || ""}
                            placeholder="-----BEGIN CERTIFICATE----- ..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="afipPrivateKey" className="text-xs">Llave Privada (.key)</Label>
                        <Textarea
                            id="afipPrivateKey"
                            name="afipPrivateKey"
                            className="font-mono text-[10px] min-h-[100px]"
                            defaultValue={initialData?.afipPrivateKey || ""}
                            placeholder="-----BEGIN PRIVATE KEY----- ..."
                        />
                    </div>
                </div>

            </div>

            <Button
                type="submit"
                className="w-full h-12 text-lg font-bold gap-2 shadow-xl shadow-primary/20"
                disabled={loading}
            >
                {loading ? <Loader2 className="animate-spin" /> : <Save />}
                Guardar Configuración Fiscal
            </Button>
        </form>
    );
}
