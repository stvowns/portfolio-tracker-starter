"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Form schema
const transactionSchema = z.object({
    assetName: z.string().min(1, "Varlık adı gereklidir"),
    assetType: z.enum(["GOLD", "SILVER", "STOCK", "FUND", "CRYPTO", "EUROBOND"]),
    transactionType: z.enum(["BUY", "SELL"]),
    quantity: z.number().positive("Miktar pozitif olmalıdır"),
    pricePerUnit: z.number().positive("Fiyat pozitif olmalıdır"),
    transactionDate: z.string().min(1, "Tarih gereklidir"),
    notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface AddTransactionDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
    onNewAssetAdded?: (transactionData: any) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultValues?: {
        assetType?: string;
        assetName?: string;
        transactionType?: "BUY" | "SELL";
    };
}

export function AddTransactionDialog({ 
    trigger, 
    onSuccess, 
    onNewAssetAdded,
    open: controlledOpen,
    onOpenChange,
    defaultValues 
}: AddTransactionDialogProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalIsOpen;
    const setIsOpen = onOpenChange || setInternalIsOpen;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            assetType: defaultValues?.assetType || "",
            assetName: defaultValues?.assetName || "",
            transactionType: defaultValues?.transactionType || "BUY",
            transactionDate: new Date().toISOString().split("T")[0],
        },
    });

    const assetType = watch("assetType");
    const transactionType = watch("transactionType");

    // Altın çeşitleri ve diğer varlık türleri için seçenekler
    const getAssetOptions = (type: string) => {
        switch (type) {
            case "GOLD":
                return [
                    { value: "Çeyrek Altın", label: "Çeyrek Altın" },
                    { value: "Yarım Altın", label: "Yarım Altın" },
                    { value: "Tam Altın", label: "Tam Altın" },
                    { value: "Cumhuriyet Altını", label: "Cumhuriyet Altını" },
                    { value: "Ata Altın", label: "Ata Altın" },
                    { value: "Has Altın (24 Ayar)", label: "Has Altın (24 Ayar)" },
                    { value: "14 Ayar Bilezik", label: "14 Ayar Bilezik" },
                    { value: "18 Ayar Bilezik", label: "18 Ayar Bilezik" },
                    { value: "22 Ayar Bilezik", label: "22 Ayar Bilezik" },
                    { value: "Gram Altın", label: "Gram Altın" },
                    { value: "Reşat Altını", label: "Reşat Altını" },
                    { value: "Hamit Altını", label: "Hamit Altını" }
                ];
            case "SILVER":
                return [
                    { value: "Gram Gümüş", label: "Gram Gümüş" },
                    { value: "Gümüş Külçe", label: "Gümüş Külçe" },
                    { value: "Gümüş Bilezik", label: "Gümüş Bilezik" },
                    { value: "Gümüş Para", label: "Gümüş Para" }
                ];
            default:
                return [];
        }
    };

    const getAssetTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            "GOLD": "Altın",
            "SILVER": "Gümüş",
            "STOCK": "Hisse Senedi",
            "FUND": "Yatırım Fonu",
            "CRYPTO": "Kripto Para",
            "EUROBOND": "Eurobond"
        };
        return labels[type] || type;
    };

    const onSubmit = async (data: TransactionFormData) => {
        setIsLoading(true);
        try {
            // Mock success for now - until authentication is fixed
            console.log("Mock transaction data:", data);
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate success
            toast.success(`İşlem başarıyla eklendi!`, {
                description: `${data.assetName} - ${data.transactionType === "BUY" ? "Alış" : "Satış"}: ${data.quantity} adet @ ₺${data.pricePerUnit}`,
                action: {
                    label: "Tamam",
                    onClick: () => console.log("Toast dismissed"),
                },
            });
            
            // Add new asset to dashboard if it's a new asset
            if (onNewAssetAdded && data.transactionType === "BUY") {
                onNewAssetAdded(data);
            }
            
            // Başarılı
            reset();
            setIsOpen(false);
            if (onSuccess) {
                onSuccess();
            }
            
            return;
            
            // Original API code (commented out until auth is fixed)
            /*
            // İlk önce asset'i oluştur veya bul
            const assetResponse = await fetch("/api/portfolio/assets", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: data.assetName,
                    assetType: data.assetType,
                }),
            });

            if (!assetResponse.ok) {
                throw new Error("Asset oluşturulurken hata oluştu");
            }

            const assetData = await assetResponse.json();
            const assetId = assetData.data.id;

            // Şimdi transaction'ı oluştur
            const transactionResponse = await fetch("/api/portfolio/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    assetId,
                    transactionType: data.transactionType,
                    quantity: data.quantity,
                    pricePerUnit: data.pricePerUnit,
                    transactionDate: data.transactionDate,
                    notes: data.notes,
                }),
            });

            if (!transactionResponse.ok) {
                const errorData = await transactionResponse.json();
                throw new Error(errorData.error || "Transaction oluşturulurken hata oluştu");
            }

            const transactionData = await transactionResponse.json();
            
            toast.success(`İşlem başarıyla eklendi!`, {
                description: `${data.assetName} - ${data.transactionType === "BUY" ? "Alış" : "Satış"}: ${data.quantity} adet @ ₺${data.pricePerUnit}`,
                action: {
                    label: "Tamam",
                    onClick: () => console.log("Toast dismissed"),
                },
            });
            
            // Başarılı
            reset();
            setIsOpen(false);
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error("Transaction ekleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
            toast.error("İşlem eklenirken hata oluştu", {
                description: `Hata detayı: ${errorMessage}`,
                action: {
                    label: "Tamam",
                    onClick: () => console.log("Error toast dismissed"),
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    const assetOptions = getAssetOptions(assetType);

    const defaultTrigger = (
        <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni İşlem
        </Button>
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Yeni İşlem Ekle</DialogTitle>
                    <DialogDescription>
                        Portföyünüze yeni bir alım veya satım işlemi ekleyin.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Asset Type Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="assetType">Varlık Türü</Label>
                        <Select onValueChange={(value) => setValue("assetType", value as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Varlık türünü seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GOLD">Altın</SelectItem>
                                <SelectItem value="SILVER">Gümüş</SelectItem>
                                <SelectItem value="STOCK">Hisse Senedi</SelectItem>
                                <SelectItem value="FUND">Yatırım Fonu</SelectItem>
                                <SelectItem value="CRYPTO">Kripto Para</SelectItem>
                                <SelectItem value="EUROBOND">Eurobond</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.assetType && (
                            <p className="text-sm text-red-500">{errors.assetType.message}</p>
                        )}
                    </div>

                    {/* Asset Name */}
                    <div className="space-y-2">
                        <Label htmlFor="assetName">Varlık Adı</Label>
                        {assetOptions.length > 0 ? (
                            <Select onValueChange={(value) => setValue("assetName", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Altın çeşidini seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assetOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                {...register("assetName")}
                                placeholder="ör: AAPL, Bitcoin, Hisse Senedi Adı"
                            />
                        )}
                        {errors.assetName && (
                            <p className="text-sm text-red-500">{errors.assetName.message}</p>
                        )}
                    </div>

                    {/* Transaction Type */}
                    <div className="space-y-2">
                        <Label>İşlem Türü</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={transactionType === "BUY" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setValue("transactionType", "BUY")}
                            >
                                <Badge variant="secondary" className="mr-2">
                                    ALIŞ
                                </Badge>
                            </Button>
                            <Button
                                type="button"
                                variant={transactionType === "SELL" ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => setValue("transactionType", "SELL")}
                            >
                                <Badge variant="secondary" className="mr-2">
                                    SATIŞ
                                </Badge>
                            </Button>
                        </div>
                        {errors.transactionType && (
                            <p className="text-sm text-red-500">{errors.transactionType.message}</p>
                        )}
                    </div>

                    {/* Quantity and Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Miktar</Label>
                            <Input
                                type="number"
                                step="any"
                                {...register("quantity", { valueAsNumber: true })}
                                placeholder="0"
                            />
                            {errors.quantity && (
                                <p className="text-sm text-red-500">{errors.quantity.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pricePerUnit">Birim Fiyat (₺)</Label>
                            <Input
                                type="number"
                                step="any"
                                {...register("pricePerUnit", { valueAsNumber: true })}
                                placeholder="0.00"
                            />
                            {errors.pricePerUnit && (
                                <p className="text-sm text-red-500">{errors.pricePerUnit.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Transaction Date */}
                    <div className="space-y-2">
                        <Label htmlFor="transactionDate">İşlem Tarihi</Label>
                        <Input
                            type="date"
                            {...register("transactionDate")}
                        />
                        {errors.transactionDate && (
                            <p className="text-sm text-red-500">{errors.transactionDate.message}</p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                        <Textarea
                            {...register("notes")}
                            placeholder="İşlem hakkında notlarınız..."
                            rows={3}
                        />
                        {errors.notes && (
                            <p className="text-sm text-red-500">{errors.notes.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            İşlemi Ekle
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}