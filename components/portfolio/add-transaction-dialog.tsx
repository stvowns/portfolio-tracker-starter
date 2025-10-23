"use client";

import { useState, useEffect } from "react";
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
import { TickerAutocomplete } from "./ticker-autocomplete";

// Form schema
const transactionSchema = z.object({
    assetName: z.string().min(1, "Varlık adı gereklidir"),
    assetType: z.enum(["GOLD", "SILVER", "STOCK", "INTERNATIONAL_STOCK", "FUND", "CRYPTO", "EUROBOND", "ETF", "CASH"], {
        required_error: "Varlık türü seçmelisiniz",
        invalid_type_error: "Geçerli bir varlık türü seçiniz"
    }),
    transactionType: z.enum(["BUY", "SELL"], {
        required_error: "İşlem türü seçmelisiniz",
        invalid_type_error: "Alış veya satış seçiniz"
    }),
    quantity: z.number({
        required_error: "Miktar giriniz",
        invalid_type_error: "Miktar sayı olmalıdır"
    }).positive("Miktar sıfırdan büyük olmalıdır"),
    pricePerUnit: z.number({
        required_error: "Fiyat giriniz",
        invalid_type_error: "Fiyat sayı olmalıdır"
    }).positive("Fiyat sıfırdan büyük olmalıdır"),
    transactionDate: z.string().min(1, "Tarih gereklidir"),
    currency: z.enum(["TRY", "USD", "EUR"], {
        required_error: "Para birimi seçmelisiniz",
        invalid_type_error: "Geçerli para birimi seçiniz"
    }).default("TRY"),
    notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface AddTransactionDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: (data?: { transactionType: "BUY" | "SELL"; quantity: number; pricePerUnit: number; notes?: string }) => void;
    onNewAssetAdded?: (transactionData: any) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showSuccessNotifications?: boolean;
    defaultValues?: {
        assetType?: string;
        assetName?: string;
        transactionType?: "BUY" | "SELL";
        pricePerUnit?: number;
        quantity?: number;
        availableQuantity?: number;
        availableCash?: number;
    };
}

export function AddTransactionDialog({
    trigger,
    onSuccess,
    onNewAssetAdded,
    open: controlledOpen,
    onOpenChange,
    showSuccessNotifications = true,
    defaultValues
}: AddTransactionDialogProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [availableQuantity, setAvailableQuantity] = useState<number>(0);
    const [availableCash, setAvailableCash] = useState<number>(0);
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);
    const [selectedTickerSymbol, setSelectedTickerSymbol] = useState<string>("");
    
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
            assetType: (defaultValues?.assetType as any) || undefined,
            assetName: defaultValues?.assetName || "",
            transactionType: defaultValues?.transactionType || "BUY",
            transactionDate: new Date().toISOString().split("T")[0],
            currency: "TRY",
        },
    });

    const assetType = watch("assetType");
    const assetName = watch("assetName");
    const transactionType = watch("transactionType");
    const [customCurrency, setCustomCurrency] = useState("");
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Modal açıldığında formu resetle ve default değerleri set et
    useEffect(() => {
        if (isOpen) {
            // Her açılışta formu sıfırla
            setSelectedTickerSymbol(""); // Symbol'ü de temizle
            reset({
                assetType: (defaultValues?.assetType as any) || undefined,
                assetName: defaultValues?.assetName || "",
                transactionType: defaultValues?.transactionType || "BUY",
                quantity: defaultValues?.quantity || undefined,
                pricePerUnit: defaultValues?.pricePerUnit || undefined,
                transactionDate: new Date().toISOString().split("T")[0],
                currency: "TRY",
                notes: ""
            });
            
            // Mevcut miktar ve nakit bilgisini set et
            if (defaultValues?.availableQuantity !== undefined) {
                setAvailableQuantity(defaultValues.availableQuantity);
            }
            if (defaultValues?.availableCash !== undefined) {
                setAvailableCash(defaultValues.availableCash);
            }
        }
    }, [isOpen, defaultValues, reset]);

    // CASH seçildiğinde birim fiyatı 1 yap, Gram Altın/Gümüş seçildiğinde fiyatı otomatik getir
    useEffect(() => {
        if (assetType === "CASH") {
            setValue("pricePerUnit", 1);
        }
    }, [assetType, setValue]);

    // Altın/Gümüş varlık adı değiştiğinde otomatik fiyat getir
    useEffect(() => {
        if ((assetType === "GOLD" || assetType === "SILVER") && assetName) {
            // Sadece Gram Altın veya Gram Gümüş seçildiğinde otomatik fiyat getir
            if ((assetType === "GOLD" && assetName === "Gram Altın") ||
                (assetType === "SILVER" && assetName === "Gram Gümüş")) {
                fetchMarketPriceForPreciousMetal(assetType);
            }
        }
    }, [assetName, assetType]);

    // Kripto para seçildiğinde otomatik fiyat getir
    useEffect(() => {
        if (assetType === "CRYPTO" && assetName && !showCustomInput) {
            fetchMarketPriceForCrypto(assetName);
        }
    }, [assetName, assetType, showCustomInput]);

    const getAssetNamePlaceholder = (type: string) => {
        switch (type) {
            case "GOLD": return "Altın çeşidini seçin";
            case "SILVER": return "Gümüş çeşidini seçin";
            default: return "Varlık seçin";
        }
    };

    // Altın çeşitleri ve diğer varlık türleri için seçenekler
    const getAssetOptions = (type: string) => {
        switch (type) {
            case "GOLD":
                return [
                    { value: "Gram Altın", label: "Gram Altın" },
                    { value: "Çeyrek Altın", label: "Çeyrek Altın" },
                    { value: "Yarım Altın", label: "Yarım Altın" },
                    { value: "Tam Altın", label: "Tam Altın" },
                    { value: "Cumhuriyet Altını", label: "Cumhuriyet Altını" },
                    { value: "Ata Altın", label: "Ata Altın" },
                    { value: "Has Altın (24 Ayar)", label: "Has Altın (24 Ayar)" },
                    { value: "14 Ayar Bilezik", label: "14 Ayar Bilezik" },
                    { value: "18 Ayar Bilezik", label: "18 Ayar Bilezik" },
                    { value: "22 Ayar Bilezik", label: "22 Ayar Bilezik" },
                    { value: "Reşat Altını", label: "Reşat Altını" },
                    { value: "Hamit Altını", label: "Hamit Altını" }
                ];
            case "SILVER":
                return [
                    { value: "Gram Gümüş", label: "Gram Gümüş" },
                    { value: "Gümüş Külçe", label: "Gümüş Külçe" },
                    { value: "Gümüş Bilezik", label: "Gümüş Bilezik" },
                    { value: "Gümüş Ons", label: "Gümüş Ons" }
                ];
            case "CASH":
                return [
                    { value: "Nakit TRY", label: "💵 Türk Lirası" },
                    { value: "Nakit USD", label: "💵 Amerikan Doları" },
                    { value: "Nakit EUR", label: "💵 Euro" },
                    { value: "Nakit GBP", label: "💵 İngiliz Sterlini" },
                    { value: "Nakit CHF", label: "💵 İsviçre Frangı" },
                    { value: "Nakit JPY", label: "💵 Japon Yeni" },
                    { value: "Nakit AUD", label: "💵 Avustralya Doları" },
                    { value: "Nakit CAD", label: "💵 Kanada Doları" },
                    { value: "custom", label: "✏️ Özel Para Birimi" }
                ];
            case "CRYPTO":
                // Major 5 kripto para için hazır butonlar
                const majorCryptos = [
                    { value: "Bitcoin", label: "₿ Bitcoin (BTC)" },
                    { value: "Ethereum", label: "◈ Ethereum (ETH)" },
                    { value: "Binance Coin", label: "🟡 Binance Coin (BNB)" },
                    { value: "Cardano", label: "💙 Cardano (ADA)" },
                    { value: "Solana", label: "🟣 Solana (SOL)" },
                    { value: "custom", label: "✏️ Diğer Kripto Para" }
                ];
                return majorCryptos;
            default:
                return [];
        }
    };

    const getAssetTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            "GOLD": "Altın",
            "SILVER": "Gümüş",
            "STOCK": "BIST",
            "INTERNATIONAL_STOCK": "Yabancı Hisse",
            "FUND": "Yatırım Fonu",
            "CRYPTO": "Kripto Para",
            "EUROBOND": "Eurobond",
            "ETF": "ETF",
            "CASH": "Nakit"
        };
        return labels[type] || type;
    };

    // Fetch price when ticker is selected
    // Fetch gold/silver prices from market prices API
    const fetchMarketPriceForPreciousMetal = async (assetType: "GOLD" | "SILVER") => {
        setIsFetchingPrice(true);
        try {
            const symbol = assetType === "GOLD" ? "GOLD" : "SILVER";
            const response = await fetch(`/api/prices/latest?symbol=${symbol}&type=COMMODITY`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.data?.currentPrice) {
                const price = Math.round(data.data.currentPrice * 100) / 100; // 2 ondalık basamak
                setValue("pricePerUnit", price);

                const metalName = assetType === "GOLD" ? "Altın" : "Gümüş";
                if (showSuccessNotifications) {
                    toast.success(`${metalName} gram fiyatı alındı`, {
                        description: `₺${price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/gram`
                    });
                }

                return price;
            }

            toast.info("Fiyat bilgisi alınamadı", {
                description: "Manuel olarak girin"
            });
        } catch (error) {
            console.error('[Market Price] Error:', error);
            toast.info("Fiyat bilgisi alınamadı", {
                description: "Manuel olarak girin"
            });
        } finally {
            setIsFetchingPrice(false);
        }

        return null;
    };

    // Fetch crypto prices from market prices API
    const fetchMarketPriceForCrypto = async (cryptoName: string) => {
        setIsFetchingPrice(true);
        try {
            // Map crypto names to API symbols
            const cryptoSymbolMap: Record<string, string> = {
                "Bitcoin": "BTC",
                "Ethereum": "ETH",
                "Binance Coin": "BNB",
                "Cardano": "ADA",
                "Solana": "SOL"
            };

            const symbol = cryptoSymbolMap[cryptoName] || cryptoName;

            const response = await fetch(`/api/prices/latest?symbol=${symbol}&type=CRYPTO`);
            const data = await response.json();

            if (data.success && data.data?.currentPrice) {
                const price = Math.round(data.data.currentPrice * 100) / 100; // 2 ondalık basamak
                setValue("pricePerUnit", price);

                if (showSuccessNotifications) {
                    toast.success(`${cryptoName} fiyatı alındı`, {
                        description: `₺${price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    });
                }

                return price;
            }

            toast.info("Fiyat bilgisi alınamadı", {
                description: "Manuel olarak girin"
            });
        } catch (error) {
            console.error('[Crypto Price] Error:', error);
            toast.info("Fiyat bilgisi alınamadı", {
                description: "Manuel olarak girin"
            });
        } finally {
            setIsFetchingPrice(false);
        }

        return null;
    };

    const handleTickerSelect = async (ticker: { symbol: string; name: string }) => {
        console.log('[Ticker Select] Selected:', ticker);
        setValue("assetName", ticker.name);
        setSelectedTickerSymbol(ticker.symbol); // Symbol'ü sakla

        // Fetch current price from Yahoo Finance
        setIsFetchingPrice(true);
        try {
            console.log('[Ticker Select] Fetching price for', ticker.symbol);
            const response = await fetch(`/api/prices/latest?symbol=${ticker.symbol}&type=${assetType}`);

            if (response.ok) {
                const data = await response.json();
                console.log('[Ticker Select] Price data:', data);

                if (data.success && data.data?.currentPrice) {
                    setValue("pricePerUnit", data.data.currentPrice);
                    toast.success("Fiyat bilgisi alındı", {
                        description: `${ticker.symbol}: ${data.data.currentPrice.toFixed(2)} ${data.data.currency}`
                    });
                } else {
                    toast.info("Fiyat bilgisi alınamadı", {
                        description: "Manuel olarak girin"
                    });
                }
            } else {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.error || "API hatası";
                toast.error("Fiyat bilgisi alınamadı", {
                    description: errorMessage.length > 100 ? errorMessage.substring(0, 100) + "..." : errorMessage
                });
            }
        } catch (error) {
            console.error('[Ticker Select] Price fetch error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            toast.error("Fiyat bilgisi alınamadı", {
                description: errorMessage.length > 100 ? errorMessage.substring(0, 100) + "..." : errorMessage
            });
        } finally {
            setIsFetchingPrice(false);
        }
    };

    const onSubmit = async (data: TransactionFormData) => {
        // Validation kontrolü
        if (!data.assetType) {
            toast.error("Varlık türü seçmelisiniz");
            return;
        }
        
        if (!data.assetName) {
            toast.error("Varlık adı girmelisiniz");
            return;
        }
        
        // SATIŞ VALİDASYONU - Portföydeki miktardan fazla satış yapılamaz
        if (data.transactionType === "SELL" && availableQuantity > 0) {
            if (data.quantity > availableQuantity) {
                toast.error("Yetersiz miktar!", {
                    description: `Portföyünüzde sadece ${availableQuantity} adet var. ${data.quantity} adet satamazsınız.`
                });
                return;
            }
        }
        
        // ALIŞ VALİDASYONU - Kasadaki TL'den fazla alış yapılamaz
        if (data.transactionType === "BUY" && availableCash > 0) {
            const totalCost = data.quantity * data.pricePerUnit;
            if (totalCost > availableCash) {
                toast.error("Yetersiz bakiye!", {
                    description: `Kasanızda ${availableCash.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} var. ${totalCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} tutarında alım yapamazsınız.`
                });
                return;
            }
        }
        
        setIsLoading(true);
        try {
            // İlk önce asset'i oluştur veya bul
            const assetResponse = await fetch("/api/portfolio/assets", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: data.assetName,
                    assetType: data.assetType,
                    symbol: selectedTickerSymbol, // Symbol'ı da gönder
                    currency: data.currency || "TRY",
                }),
            });

            if (!assetResponse.ok) {
                const errorData = await assetResponse.json();
                const errorMsg = errorData.details 
                    ? `${errorData.error}: ${errorData.details}` 
                    : errorData.error || "Asset oluşturulurken hata oluştu";
                throw new Error(errorMsg);
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
                    currency: data.currency || "TRY",
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
            
            // Başarılı - transaction data'yı callback'e gönder
            const callbackData = {
                transactionType: data.transactionType,
                quantity: data.quantity,
                pricePerUnit: data.pricePerUnit,
                notes: data.notes
            };
            
            reset();
            setIsOpen(false);
            if (onSuccess) {
                onSuccess(callbackData);
            }
        } catch (error) {
            console.error("Transaction ekleme hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
            
            // Hata detaylarını daha iyi göster
            let detailedError = errorMessage;
            if (errorMessage.includes("Asset oluşturulurken hata oluştu")) {
                detailedError = "Varlık oluşturulamadı. Lütfen varlık türü ve adını kontrol edin.";
            }
            
            toast.error("İşlem eklenirken hata oluştu", {
                description: detailedError,
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
            {trigger !== null && (
                <DialogTrigger asChild>
                    {trigger || defaultTrigger}
                </DialogTrigger>
            )}
            <DialogContent className="max-w-[95vw] sm:max-w-[500px] w-[95vw] sm:w-full max-h-[95vh] overflow-y-auto">
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
                        <Select 
                            onValueChange={(value) => {
                                setValue("assetType", value as any);
                                setValue("assetName", "");
                            }}
                            value={assetType}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Varlık türünü seçin" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[90vw] sm:max-w-md">
                                <SelectItem value="GOLD">Altın</SelectItem>
                                <SelectItem value="SILVER">Gümüş</SelectItem>
                                <SelectItem value="STOCK">BIST</SelectItem>
                                <SelectItem value="INTERNATIONAL_STOCK">Yabancı Hisse</SelectItem>
                                <SelectItem value="FUND">Yatırım Fonu</SelectItem>
                                <SelectItem value="CRYPTO">Kripto Para</SelectItem>
                                <SelectItem value="EUROBOND">Eurobond</SelectItem>
                                <SelectItem value="ETF">ETF</SelectItem>
                                <SelectItem value="CASH">Nakit</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.assetType && (
                            <p className="text-sm text-red-500">{errors.assetType.message}</p>
                        )}
                    </div>

                    {/* Asset Name */}
                    <div className="space-y-2">
                        <Label htmlFor="assetName">Varlık Adı</Label>
                        {/* BIST or FUND - Use Ticker Autocomplete */}
                        {(assetType === "STOCK" || assetType === "FUND") ? (
                            <>
                                <TickerAutocomplete
                                    value={assetName}
                                    onValueChange={(value) => setValue("assetName", value)}
                                    onTickerSelect={handleTickerSelect}
                                    assetType={assetType}
                                    placeholder={assetType === "STOCK" ? "BIST ticker ara (örn: GARAN)" : "TEFAS fon ara"}
                                    disabled={isLoading}
                                />
                                {isFetchingPrice && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Fiyat bilgisi getiriliyor...
                                    </p>
                                )}
                            </>
                        ) : assetOptions.length > 0 ? (
                            <>
                                <Select 
                                    key={assetType}
                                    value={showCustomInput ? "custom" : assetName}
                                    onValueChange={(value) => {
                                        if (value === "custom") {
                                            setShowCustomInput(true);
                                            setCustomCurrency("");
                                            setValue("assetName", "");
                                        } else {
                                            setShowCustomInput(false);
                                            setValue("assetName", value);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={getAssetNamePlaceholder(assetType)} />
                                    </SelectTrigger>
                                    <SelectContent className="max-w-[90vw] sm:max-w-md">
                                        {assetOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value} title={option.label}>
                                                <span
                                                    style={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        wordBreak: 'break-word',
                                                        lineHeight: '1.2',
                                                        maxHeight: '2.4em'
                                                    }}
                                                >
                                                    {option.label}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {showCustomInput && (assetType === "CASH" || assetType === "CRYPTO") && (
                                    <div className="space-y-2">
                                        <Input
                                            placeholder={assetType === "CASH" ? "Özel para birimi kodu (örn: SAR, AED)" : "Kripto para adı (örn: Dogecoin)"}
                                            value={assetType === "CASH" ? customCurrency : assetName}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (assetType === "CASH") {
                                                    const upperValue = value.toUpperCase();
                                                    setCustomCurrency(upperValue);
                                                    if (upperValue.length > 0) {
                                                        setValue("assetName", `Nakit ${upperValue}`);
                                                    }
                                                } else {
                                                    setValue("assetName", value);
                                                }
                                            }}
                                            autoFocus
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setShowCustomInput(false);
                                                setValue("assetName", "");
                                                if (assetType === "CASH") {
                                                    setCustomCurrency("");
                                                }
                                            }}
                                        >
                                            ← Listeye Dön
                                        </Button>
                                    </div>
                                )}
                            </>
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="quantity">Miktar</Label>
                                {transactionType === "SELL" && availableQuantity > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        Mevcut: {availableQuantity}
                                    </Badge>
                                )}
                                {transactionType === "BUY" && availableCash > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                        Bakiye: {availableCash.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                    </Badge>
                                )}
                            </div>
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
                            <div className="flex items-center justify-between">
                                <Label htmlFor="pricePerUnit">Birim Fiyat</Label>
                                {isFetchingPrice && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Fiyat alınıyor...
                                    </div>
                                )}
                            </div>
                            <Input
                                type="number"
                                step="any"
                                {...register("pricePerUnit", { valueAsNumber: true })}
                                placeholder="0.00"
                                disabled={isFetchingPrice}
                            />
                            {errors.pricePerUnit && (
                                <p className="text-sm text-red-500">{errors.pricePerUnit.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Currency Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="currency">Satın Alma Para Birimi</Label>
                        <Select 
                            onValueChange={(value) => setValue("currency", value as any)}
                            defaultValue="TRY"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Para birimi seçin" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[90vw] sm:max-w-md">
                                <SelectItem value="TRY">₺ Türk Lirası</SelectItem>
                                <SelectItem value="USD">$ Amerikan Doları</SelectItem>
                                <SelectItem value="EUR">€ Euro</SelectItem>
                            </SelectContent>
                        </Select>
                        {assetType === "CASH" && (
                            <p className="text-xs text-muted-foreground">
                                💡 Nakit için birim fiyat: 1 yazın (1:1 değer)
                            </p>
                        )}
                        {errors.currency && (
                            <p className="text-sm text-red-500">{errors.currency.message}</p>
                        )}
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