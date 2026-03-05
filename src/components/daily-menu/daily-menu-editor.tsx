'use client';

import { useState, useTransition, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Save, Loader2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import {
    saveDailyMenuAction,
    getDailyMenusAction,
    type DiaSemana,
    type DailyMenuItem,
} from "@/actions/daily-menu-actions";

const DAYS: { value: DiaSemana; label: string }[] = [
    { value: "lunes", label: "Lunes" },
    { value: "martes", label: "Martes" },
    { value: "miercoles", label: "Miércoles" },
    { value: "jueves", label: "Jueves" },
    { value: "viernes", label: "Viernes" },
    { value: "sabado", label: "Sábado" },
    { value: "domingo", label: "Domingo" },
];

const MAX_MENUS = 3;

interface MenuFormItem extends DailyMenuItem {
    tempId: string; // for React key when no DB id yet
}

function createEmptyItem(): MenuFormItem {
    return {
        tempId: crypto.randomUUID(),
        name: "",
        description: "",
        price: 0,
        isAvailable: true,
    };
}

export default function DailyMenuEditor({
    initialMenus,
}: {
    initialMenus: Record<DiaSemana, any[]>;
}) {
    const today = new Date();
    const dayIndex = today.getDay();
    // JS getDay(): 0=sunday, 1=monday...6=saturday → map to our enum
    const dayMap: DiaSemana[] = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const initialDay = dayMap[dayIndex];

    const [selectedDay, setSelectedDay] = useState<DiaSemana>(initialDay);
    const [menuItems, setMenuItems] = useState<Record<DiaSemana, MenuFormItem[]>>(() => {
        const result: Record<string, MenuFormItem[]> = {};
        for (const day of DAYS) {
            const existing = initialMenus[day.value] || [];
            result[day.value] = existing.map((m: any) => ({
                id: m.id,
                tempId: crypto.randomUUID(),
                name: m.name,
                description: m.description || "",
                price: m.price,
                isAvailable: m.isAvailable,
            }));
        }
        return result as Record<DiaSemana, MenuFormItem[]>;
    });
    const [isPending, startTransition] = useTransition();

    const currentItems = menuItems[selectedDay] || [];

    const addItem = () => {
        if (currentItems.length >= MAX_MENUS) {
            toast.error(`Máximo ${MAX_MENUS} menús por día`);
            return;
        }
        setMenuItems(prev => ({
            ...prev,
            [selectedDay]: [...prev[selectedDay], createEmptyItem()],
        }));
    };

    const removeItem = (tempId: string) => {
        setMenuItems(prev => ({
            ...prev,
            [selectedDay]: prev[selectedDay].filter(item => item.tempId !== tempId),
        }));
    };

    const updateItem = (tempId: string, field: keyof DailyMenuItem, value: any) => {
        setMenuItems(prev => ({
            ...prev,
            [selectedDay]: prev[selectedDay].map(item =>
                item.tempId === tempId ? { ...item, [field]: value } : item
            ),
        }));
    };

    const handleSave = () => {
        const items = currentItems.filter(item => item.name.trim() !== "");
        if (items.length === 0) {
            // If all items are empty, save empty array (deletes all)
        }

        startTransition(async () => {
            try {
                await saveDailyMenuAction(selectedDay, items.map(item => ({
                    id: item.id,
                    name: item.name.trim(),
                    description: item.description.trim(),
                    price: item.price,
                    isAvailable: item.isAvailable,
                })));
                // Re-fetch to get updated IDs
                const updated = await getDailyMenusAction(selectedDay);
                setMenuItems(prev => ({
                    ...prev,
                    [selectedDay]: updated.map((m: any) => ({
                        id: m.id,
                        tempId: crypto.randomUUID(),
                        name: m.name,
                        description: m.description || "",
                        price: m.price,
                        isAvailable: m.isAvailable,
                    })),
                }));
                toast.success(`Menú del ${DAYS.find(d => d.value === selectedDay)?.label} guardado`);
            } catch (error) {
                toast.error("Error al guardar el menú");
            }
        });
    };

    const dayLabel = DAYS.find(d => d.value === selectedDay)?.label || selectedDay;

    return (
        <div className="space-y-6">
            {/* Day Selector */}
            <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                    const hasItems = (menuItems[day.value] || []).length > 0;
                    const isSelected = selectedDay === day.value;
                    return (
                        <button
                            key={day.value}
                            onClick={() => setSelectedDay(day.value)}
                            className={`
                                relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                                ${isSelected
                                    ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105"
                                    : "bg-white border border-gray-200 text-gray-600 hover:border-primary/30 hover:text-primary hover:shadow-sm"
                                }
                            `}
                        >
                            {day.label}
                            {hasItems && (
                                <span className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Menu Items for Selected Day */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        Menú del {dayLabel}
                    </h2>
                    <span className="text-sm text-gray-500">{currentItems.length}/{MAX_MENUS} platos</span>
                </div>

                {currentItems.length === 0 ? (
                    <Card className="p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
                        <UtensilsCrossed className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No hay menús cargados para el {dayLabel}</p>
                        <p className="text-gray-400 text-sm mt-1">Agregá hasta {MAX_MENUS} opciones del día</p>
                        <Button onClick={addItem} className="mt-4 gap-2" variant="outline">
                            <Plus className="h-4 w-4" />
                            Agregar menú
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {currentItems.map((item, index) => (
                            <Card key={item.tempId} className="p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    {/* Number indicator */}
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary font-black flex items-center justify-center text-sm">
                                        {index + 1}
                                    </div>

                                    {/* Form fields */}
                                    <div className="flex-1 space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`name-${item.tempId}`} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Nombre del plato *
                                                </Label>
                                                <Input
                                                    id={`name-${item.tempId}`}
                                                    value={item.name}
                                                    onChange={(e) => updateItem(item.tempId, "name", e.target.value)}
                                                    placeholder="Ej: Milanesa con puré"
                                                    className="font-medium text-gray-900 dark:text-gray-900 bg-gray-100 dark:bg-gray-200 dark:border-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`price-${item.tempId}`} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Precio ($)
                                                </Label>
                                                <Input
                                                    id={`price-${item.tempId}`}
                                                    type="number"
                                                    value={item.price || ""}
                                                    onChange={(e) => updateItem(item.tempId, "price", parseInt(e.target.value) || 0)}
                                                    placeholder="0"
                                                    min="0"
                                                    className="font-semibold text-gray-900 dark:text-gray-900 bg-gray-100 dark:bg-gray-200 dark:border-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor={`desc-${item.tempId}`} className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Descripción (opcional)
                                            </Label>
                                            <Input
                                                id={`desc-${item.tempId}`}
                                                value={item.description}
                                                onChange={(e) => updateItem(item.tempId, "description", e.target.value)}
                                                placeholder="Ej: Con ensalada mixta y bebida"
                                                className="font-medium text-gray-900 dark:text-gray-900 bg-gray-100 dark:bg-gray-200 dark:border-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Right side controls */}
                                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-semibold ${item.isAvailable ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                {item.isAvailable ? "Disponible" : "No disponible"}
                                            </span>
                                            <Switch
                                                checked={item.isAvailable}
                                                onCheckedChange={(checked) => updateItem(item.tempId, "isAvailable", checked)}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeItem(item.tempId)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2">
                    <Button
                        onClick={addItem}
                        variant="outline"
                        className="gap-2"
                        disabled={currentItems.length >= MAX_MENUS}
                    >
                        <Plus className="h-4 w-4" />
                        Agregar plato
                        {currentItems.length >= MAX_MENUS && <span className="text-xs text-gray-400 ml-1">(máximo alcanzado)</span>}
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={isPending}
                        className="gap-2 shadow-lg shadow-primary/20"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Guardar {dayLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
