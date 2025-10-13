import { z } from "zod";

// Asset türleri için enum
export const AssetTypeSchema = z.enum([
    "GOLD",
    "SILVER", 
    "STOCK",
    "FUND",
    "CRYPTO",
    "EUROBOND",
    "ETF"
]);

// Transaction türleri için enum
export const TransactionTypeSchema = z.enum(["BUY", "SELL"]);

// Yeni varlık oluşturma şeması
export const CreateAssetSchema = z.object({
    name: z.string().min(1, "Varlık adı gereklidir").max(100, "Varlık adı çok uzun"),
    assetType: AssetTypeSchema,
    symbol: z.string().optional(),
    category: z.string().optional(),
    portfolioId: z.string().optional(),
    currency: z.enum(["TRY", "USD", "EUR"]).optional().default("TRY"),
});

// Varlık güncelleme şeması
export const UpdateAssetSchema = CreateAssetSchema.partial();

// Yeni işlem oluşturma şeması
export const CreateTransactionSchema = z.object({
    assetId: z.string().min(1, "Geçersiz varlık ID"),
    transactionType: TransactionTypeSchema,
    quantity: z.number().positive("Miktar pozitif olmalıdır"),
    pricePerUnit: z.number().positive("Birim fiyat pozitif olmalıdır"),
    transactionDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Geçersiz tarih formatı"),
    currency: z.enum(["TRY", "USD", "EUR"]).default("TRY"),
    notes: z.string().max(500, "Not çok uzun").optional(),
}).refine((data) => {
    // Toplam tutarı hesapla
    const total = data.quantity * data.pricePerUnit;
    return total > 0;
}, "Toplam tutar pozitif olmalıdır");

// İşlem güncelleme şeması
export const UpdateTransactionSchema = CreateTransactionSchema.partial();

// Portföy oluşturma şeması
export const CreatePortfolioSchema = z.object({
    name: z.string().min(1, "Portföy adı gereklidir").max(100, "Portföy adı çok uzun"),
    baseCurrency: z.string().length(3, "Para birimi 3 karakter olmalıdır").default("TRY"),
});

// Portföy güncelleme şeması
export const UpdatePortfolioSchema = CreatePortfolioSchema.partial();

// Asset listeleme için query parametreleri
export const AssetListQuerySchema = z.object({
    assetType: AssetTypeSchema.optional(),
    portfolioId: z.string().optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
});

// Transaction listeleme için query parametreleri
export const TransactionListQuerySchema = z.object({
    assetId: z.string().optional(),
    transactionType: TransactionTypeSchema.optional(),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Geçersiz başlangıç tarihi").optional(),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Geçersiz bitiş tarihi").optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20),
});

// Portföy performans query şeması
export const PortfolioPerformanceQuerySchema = z.object({
    portfolioId: z.string().uuid().optional(),
    period: z.enum(["1d", "7d", "30d", "90d", "1y", "all"]).default("30d"),
    currency: z.string().length(3).default("TRY"),
});

// Tip dışa aktarımları
export type CreateAssetInput = z.infer<typeof CreateAssetSchema>;
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type CreatePortfolioInput = z.infer<typeof CreatePortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof UpdatePortfolioSchema>;
export type AssetListQuery = z.infer<typeof AssetListQuerySchema>;
export type TransactionListQuery = z.infer<typeof TransactionListQuerySchema>;
export type PortfolioPerformanceQuery = z.infer<typeof PortfolioPerformanceQuerySchema>;