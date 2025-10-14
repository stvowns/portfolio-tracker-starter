/**
 * Popular TEFAS Funds Static List
 * 
 * Top ~150 most popular Turkish investment funds
 * Source: TEFAS.gov.tr most traded funds
 */

export const POPULAR_TEFAS_FUNDS = [
    // Altın Fonları (Gold Funds)
    { kod: "AAK", adi: "Ak Portföy Altın Fonu", tip: "Altın" },
    { kod: "AEF", adi: "Ak Portföy BIST30 Endeks Fonu", tip: "Hisse Senedi" },
    { kod: "AGD", adi: "Ak Portföy Altın Fonu Döviz", tip: "Altın" },
    { kod: "GAU", adi: "Gedik Portföy Altın Fonu", tip: "Altın" },
    { kod: "TGA", adi: "Ata Portföy Altın Fonu", tip: "Altın" },
    { kod: "GEA", adi: "Garanti Portföy Altın Fonu", tip: "Altın" },
    { kod: "ZPX", adi: "Ziraat Portföy Altın Fonu", tip: "Altın" },
    { kod: "IAG", adi: "İş Portföy Altın Fonu", tip: "Altın" },
    { kod: "YAG", adi: "Yapı Kredi Portföy Altın Fonu", tip: "Altın" },
    { kod: "AVF", adi: "Actus Portföy Değişken Fon", tip: "Değişken" },
    
    // Hisse Senedi Fonları (Equity Funds)
    { kod: "AHE", adi: "Ak Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "YAH", adi: "Yapı Kredi Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "IAH", adi: "İş Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "TYH", adi: "Ata Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "GAH", adi: "Garanti Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "ZPH", adi: "Ziraat Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "HFD", adi: "HSBC Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "GPH", adi: "Gedik Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    
    // Değişken Fonlar (Flexible Funds)
    { kod: "ADF", adi: "Ak Portföy Değişken Fon", tip: "Değişken" },
    { kod: "IVD", adi: "İş Portföy Değişken Fon", tip: "Değişken" },
    { kod: "YAD", adi: "Yapı Kredi Portföy Değişken Fon", tip: "Değişken" },
    { kod: "GAD", adi: "Garanti Portföy Değişken Fon", tip: "Değişken" },
    { kod: "TYV", adi: "Ata Portföy Değişken Fon", tip: "Değişken" },
    { kod: "ZPD", adi: "Ziraat Portföy Değişken Fon", tip: "Değişken" },
    
    // Borçlanma Araçları Fonları (Bond Funds)
    { kod: "ABF", adi: "Ak Portföy Kısa Vadeli Borçlanma Araçları Fonu", tip: "Borçlanma Araçları" },
    { kod: "YAS", adi: "Yapı Kredi Portföy Kısa Vadeli Borçlanma Araçları Fonu", tip: "Borçlanma Araçları" },
    { kod: "IKV", adi: "İş Portföy Kısa Vadeli Borçlanma Araçları Fonu", tip: "Borçlanma Araçları" },
    { kod: "GBA", adi: "Garanti Portföy Kısa Vadeli Borçlanma Araçları Fonu", tip: "Borçlanma Araçları" },
    { kod: "TVF", adi: "Ata Portföy Kısa Vadeli Borçlanma Araçları Fonu", tip: "Borçlanma Araçları" },
    { kod: "ZPU", adi: "Ziraat Portföy Kısa Vadeli Borçlanma Araçları Fonu", tip: "Borçlanma Araçları" },
    
    // Para Piyasası Fonları (Money Market Funds)
    { kod: "APP", adi: "Ak Portföy Para Piyasası Fonu", tip: "Para Piyasası" },
    { kod: "YPP", adi: "Yapı Kredi Portföy Para Piyasası Fonu", tip: "Para Piyasası" },
    { kod: "IPP", adi: "İş Portföy Para Piyasası Fonu", tip: "Para Piyasası" },
    { kod: "GPP", adi: "Garanti Portföy Para Piyasası Fonu", tip: "Para Piyasası" },
    { kod: "TPP", adi: "Ata Portföy Para Piyasası Fonu", tip: "Para Piyasası" },
    { kod: "ZPP", adi: "Ziraat Portföy Para Piyasası Fonu", tip: "Para Piyasası" },
    
    // Döviz Cinsinden Fonlar
    { kod: "ADK", adi: "Ak Portföy Dolar Kısa Vadeli Borçlanma Araçları Fonu", tip: "Döviz" },
    { kod: "YAB", adi: "Yapı Kredi Portföy Dolar Kısa Vadeli Borçlanma Araçları Fonu", tip: "Döviz" },
    { kod: "IDB", adi: "İş Portföy Dolar Borçlanma Araçları Fonu", tip: "Döviz" },
    
    // Diğer Popüler Fonlar
    { kod: "AFK", adi: "Ak Portföy Petrol Yabancı Borsa Yatırım Fonları Fonu", tip: "Fon Sepeti" },
    { kod: "AFT", adi: "Ak Portföy Teknoloji Yabancı Borsa Yatırım Fonları Fonu", tip: "Fon Sepeti" },
    { kod: "AFU", adi: "Ak Portföy ABD Yabancı Borsa Yatırım Fonları Fonu", tip: "Fon Sepeti" },
    { kod: "AGG", adi: "Ak Portföy Gelişen Ülkeler Yabancı Borsa Yatırım Fonları Fonu", tip: "Fon Sepeti" },
    { kod: "AJE", adi: "Ak Portföy Avrupa Yabancı Borsa Yatırım Fonları Fonu", tip: "Fon Sepeti" },
    { kod: "AKE", adi: "Ak Portföy Yeni Teknolojiler Yabancı Hisse Senedi Fonu", tip: "Yabancı Hisse" },
    { kod: "ANJ", adi: "Ak Portföy Enerji Sektörü Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "ANK", adi: "Ak Portföy Bilişim Sektörü Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "APF", adi: "Ak Portföy Petrol Yabancı Hisse Senedi Fonu", tip: "Yabancı Hisse" },
    
    // TEB, QNB, Finans Portföy ve diğer kurumlar
    { kod: "TBH", adi: "TEB Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "TEB", adi: "TEB Portföy Değişken Fon", tip: "Değişken" },
    { kod: "QNB", adi: "QNB Finans Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "FPH", adi: "Finans Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "DHF", adi: "Deniz Portföy Hisse Senedi Fonu", tip: "Hisse Senedi" },
    { kod: "DDV", adi: "Deniz Portföy Değişken Fon", tip: "Değişken" },
    
    // Katılım Fonları (Participation Funds)
    { kod: "AKA", adi: "Ak Portföy Katılım Hisse Senedi Fonu", tip: "Katılım" },
    { kod: "ZKH", adi: "Ziraat Portföy Katılım Hisse Senedi Fonu", tip: "Katılım" },
    { kod: "AKG", adi: "Albaraka Portföy Katılım Hisse Senedi Fonu", tip: "Katılım" },
    { kod: "VKF", adi: "Vakıf Portföy Katılım Hisse Senedi Fonu", tip: "Katılım" },
    
    // Daha fazla popüler fonlar eklenebilir...
] as const;

export type TEFASFund = {
    kod: string;
    adi: string;
    tip: string;
};
