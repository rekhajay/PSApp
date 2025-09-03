# TAX Preparer Projects – Flow Diagram

```mermaid
graph TD
    A["2025 Projects"] --> A1["Extract Forecast Data from Warehouse Whole Year"]
    A1 -->|Manual Workday Team| A2["Export Forecasts into Dayshape Template Provided"]

    %% Rolled Projects Strategies
    B["2026 Rolled Projects"] --> B1["Strategy 1: Light Roll 2025 Projects Minus Forecast and RPL"]
    B --> B2["Strategy 2: Full Roll 2025 Projects With Forecast and RPL"]

    B1 --> B1a["Generate Forecasts and RPL from Warehouse Actuals To Be Developed"]
    B2 --> B2a["Create Forecasts and RPL in Workday Based on Actuals or Plan"]
    B2a --> B3["Extract Forecast Data from Warehouse Whole Year"]
    B1a --> B3

    %% Common Activities
    A2 --> C["Transform Forecasts for Dayshape Demand Single Level RPL"]
    B3 --> C

    C -->|Integration DS Packaged| D1["Create 2025 Projects in Dayshape Batch Processing"]
    C -->|Integration DS Packaged| D2["Create 2026 Projects in Dayshape Batch Processing"]

    %% Manual DS Team
    D1 -->|Manual DS Team| E["Import Forecasts Into Dayshape To Create Demand"]
    D2 -->|Manual DS Team| E

    %% Integration Back to Workday
    E -->|Integration DS Packaged| F1["Upsert RPL Lines Back to Workday"]
    F1 --> G1["2025 Projects Jul–Dec Replace Forecast in Workday With Dayshape Version"]
    F1 --> G2["2026 Projects Jan–Dec Replace Forecast in Workday With Dayshape Version"]
