'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, Loader2 } from 'lucide-react';
import { getCSVReportAction } from '@/actions/cash-actions';

export default function DownloadPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const cajaId = searchParams.get('cajaId');
    const [loading, setLoading] = useState(false);
    const [downloadData, setDownloadData] = useState<{ content: string, filename: string } | null>(null);

    const triggerDownload = (content: string, filename: string) => {
        const csvContent = atob(content);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        async function fetchAndDownload() {
            if (!cajaId) return;
            setLoading(true);
            try {
                const result = await getCSVReportAction(cajaId);
                setDownloadData(result);
                triggerDownload(result.content, result.filename);
            } catch (error) {
                console.error("Error fetching report:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAndDownload();
    }, [cajaId]);

    const handleDownloadAgain = () => {
        if (downloadData) {
            triggerDownload(downloadData.content, downloadData.filename);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-16 space-y-6">
            <Card className="shadow-2xl border-2 border-primary/5">
                <CardHeader className="bg-gray-50/50 pb-8">
                    <CardTitle className="flex items-center gap-4 text-green-600 font-black italic tracking-tighter text-2xl">
                        {loading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                            <CheckCircle className="h-8 w-8" />
                        )}
                        {loading ? "Generando Reporte..." : "Caja Cerrada Exitosamente"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-8 px-8">
                    <div className="space-y-4">
                        <p className="text-gray-700 leading-relaxed font-medium">
                            {loading 
                                ? "Estamos preparando el resumen de ventas del día. Esto puede demorar unos segundos..." 
                                : "La caja ha sido cerrada correctamente y el reporte ha sido generado."}
                        </p>
                        {!loading && (
                            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                                <span className="font-bold text-gray-700">Nota:</span> El archivo CSV con el resumen se descarga automáticamente. Si no comenzó, usá el botón de abajo.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button 
                            onClick={handleDownloadAgain} 
                            className="gap-2 h-12 px-6 font-bold shadow-lg shadow-primary/20"
                            disabled={loading || !downloadData}
                        >
                            <Download className="h-5 w-5" />
                            Descargar CSV {downloadData ? "Nuevamente" : ""}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => router.push('/dashboard/cash-register')}
                            className="h-12 px-6 font-bold border-gray-200"
                        >
                            Volver a Caja
                        </Button>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 space-y-4">
                        <h4 className="font-black text-blue-900 text-xs uppercase tracking-widest flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                            ¿Qué incluye este reporte?
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-blue-800/80 font-medium">
                            <li className="flex items-start gap-2">✓ Detalles de todos los pedidos</li>
                            <li className="flex items-start gap-2">✓ Métodos de pago y clientes</li>
                            <li className="flex items-start gap-2">✓ Números de CAE y Factura</li>
                            <li className="flex items-start gap-2">✓ Arqueo: inicial, real y diferencia</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
