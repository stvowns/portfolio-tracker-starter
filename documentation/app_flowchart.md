flowchart TD
    AppStart[Open App]
    AppStart --> AuthCheck{User Authenticated?}
    AuthCheck -->|No| AuthPage[Login Signup Page]
    AuthPage -->|Submit| AuthCheck
    AuthCheck -->|Yes| Dashboard[Dashboard Page]
    Dashboard --> Portfolio[View Portfolio]
    Dashboard --> NewTxn[Add New Transaction]
    Dashboard --> PriceFetch[Fetch Live Prices]
    Portfolio --> AssetList[Asset List]
    AssetList --> AssetDetail[Asset Detail]
    AssetDetail --> Portfolio
    NewTxn --> TxnForm[Transaction Form]
    TxnForm -->|Save| SaveTxn[Save Transaction]
    SaveTxn --> Dashboard
    PriceFetch --> PriceAPI[External Price API]
    PriceAPI --> Dashboard