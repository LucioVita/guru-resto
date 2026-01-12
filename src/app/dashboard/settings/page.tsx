import { auth } from "@/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateBusinessAction } from "@/actions/business-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const session = await auth();
    if (!session || !session.user.businessId) return null;

    const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, session.user.businessId),
    });

    if (!business) return <div>Business not found</div>;

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <form action={updateBusinessAction}>
                <div className="grid gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Business Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Business Name</Label>
                                <Input id="name" name="name" defaultValue={business.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">API Key (x-api-key)</Label>
                                <Input id="apiKey" name="apiKey" defaultValue={business.apiKey || ""} placeholder="Secure API Key for external integrations" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>AFIP Configuration (Argentina)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="afipCuit">CUIT (Tax ID)</Label>
                                    <Input id="afipCuit" name="afipCuit" defaultValue={business.afipCuit || ""} placeholder="20409378472" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="afipPuntoVenta">Punto de Venta</Label>
                                    <Input id="afipPuntoVenta" name="afipPuntoVenta" type="number" defaultValue={business.afipPuntoVenta || 1} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="afipToken">Afip SDK Access Token</Label>
                                <Input id="afipToken" name="afipToken" defaultValue={business.afipToken || ""} placeholder="Your SDK Access Token" />
                                <p className="text-[10px] text-gray-500">You can get this from app.afipsdk.com</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="afipEnvironment">Environment</Label>
                                <select
                                    id="afipEnvironment"
                                    name="afipEnvironment"
                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    defaultValue={business.afipEnvironment || "dev"}
                                >
                                    <option value="dev">Development / Testing</option>
                                    <option value="prod">Production</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="afipCertificate">Digital Certificate (Optional)</Label>
                                <textarea
                                    id="afipCertificate"
                                    name="afipCertificate"
                                    defaultValue={business.afipCertificate || ""}
                                    className="w-full min-h-[100px] flex rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="-----BEGIN CERTIFICATE-----..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="afipPrivateKey">Private Key (Optional)</Label>
                                <textarea
                                    id="afipPrivateKey"
                                    name="afipPrivateKey"
                                    defaultValue={business.afipPrivateKey || ""}
                                    className="w-full min-h-[100px] flex rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Webhooks</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="webhookUrl">Order Creation Webhook URL</Label>
                                <Input id="webhookUrl" name="webhookUrl" defaultValue={business.webhookUrl || ""} placeholder="https://n8n.yourdomain.com/webhook/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="webhookStatusUrl">Order Status Update Webhook URL</Label>
                                <Input id="webhookStatusUrl" name="webhookStatusUrl" defaultValue={business.webhookStatusUrl || ""} placeholder="https://n8n.yourdomain.com/webhook/status/..." />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6">
                            <Button type="submit">Save Changes</Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </div>
    );
}
