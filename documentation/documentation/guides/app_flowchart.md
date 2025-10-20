# App Flowchart

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

---
**Document Details**
- **Project ID**: 9996f6d0-22b9-4cb2-a2e4-6f42e720cff0
- **Document ID**: d29706b8-7bfd-4a0a-9bd6-f898e131c4fc
- **Type**: custom
- **Custom Type**: app_flowchart
- **Status**: completed
- **Generated On**: 2025-10-12T15:23:54.728Z
- **Last Updated**: N/A
