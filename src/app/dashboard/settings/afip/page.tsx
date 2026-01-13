import { auth } from "@/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AfipSettingsForm } from "./afip-settings-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AfipSettingsPage() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, session.user.businessId),
    });

    if (!business) return <div>No se encontró el negocio</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tighter">Configuración AFIP</h1>
                <p className="text-gray-500 text-sm italic">Configura la facturación electrónica exclusiva para tu negocio</p>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
                <InfoIcon className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 font-bold">Modo Desarrollo</AlertTitle>
                <AlertDescription className="text-blue-700 text-sm">
                    Para probar el sistema, puedes usar el entorno **"dev"** y el CUIT de prueba de AFIP SDK: <code className="bg-white px-1 rounded border">20409378472</code>. No necesitas subir certificado ni llave privada para pruebas.
                </AlertDescription>
            </Alert>

            <Card className="border-2">
                <CardHeader>
                    <CardTitle>Credenciales y Certificados</CardTitle>
                    <CardDescription>
                        Ingresa los datos proporcionados por ARCA (AFIP) y AFIP SDK para comenzar a facturar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AfipSettingsForm initialData={business} />
                </CardContent>
            </Card>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                <h3 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
                    ¡Seguridad Importante!
                </h3>
                <p className="text-amber-700 text-sm leading-relaxed">
                    Estos datos son cifrados y almacenados de forma segura. Solo tu negocio puede acceder a ellos y son utilizados únicamente para firmar tus facturas electrónicas. Nunca compartas tu "Access Token" ni tu llave privada con terceros.
                </p>
            </div>
        </div>
    );
}
