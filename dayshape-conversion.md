# TAX Preparer Projects – Flow Diagram (Cutover Step Finalized)

```mermaid
graph TD
    %% Current Year
    A["2025 Projects"] --> A1["Extract Forecast Data from Warehouse Whole Year"]
    A1 -->|Manual Workday Team| A2["Export Forecasts into Dayshape Nov–Dec 2025 (Template Provided)"]

    %% Rolled Projects Strategies
    B["2026 Rolled Projects"] --> B1["Strategy 1: Light Roll 2025 Projects Minus Forecast and RPL"]
    B --> B2["Strategy 2: Full Roll 2025 Projects With Forecast and RPL"]

    B1 --> B1a["Generate Forecasts and RPL from Warehouse Actuals (To Be Developed)"]
    B2 --> B2a["Create Forecasts and RPL in Workday Based on Actuals or Plan"]
    B2a --> B3["Extract Forecast Data from Warehouse Whole Year"]
    B1a --> B3

    %% Export for 2026
    B3 -->|Manual Workday Team| B4["Export Forecasts into Dayshape Jan–Dec 2026 (Template Provided)"]

    %% Common Flow
    A2 --> C["Steps to Create Demand in Dayshape from Exported Workday Project Forecasts"]
    B4 --> C

    C -->|Integration DS Packaged| D1["Create 2025 Projects in Dayshape (Batch Processing)"]
    C -->|Integration DS Packaged| D2["Create 2026 Projects in Dayshape (Batch Processing)"]

    %% Manual DS Team
    D1 -->|Manual DS Team| E1["Import Forecasts Into Dayshape Nov–Dec 2025"]
    D2 -->|Manual DS Team| E2["Import Forecasts Into Dayshape Jan–Dec 2026"]

    %% Integration Back to Workday
    E1 -->|Integration DS Packaged| F1["Upsert RPL Lines Back to Workday (2025 Jul–Dec)"]
    F1 --> G1["Delete and Replace Forecast in Workday With DS Forecast (Cutover) – For 2025 Projects, ONLY Nov and Dec Forecasts Will Exist"]

    E2 -->|Integration DS Packaged| F2["Upsert RPL Lines Back to Workday (2026 Jan–Dec)"]
    F2 --> G2["Delete and Replace Forecast in Workday With DS Forecast (Cutover) – For 2026 Projects, Full Year Forecasts Will Exist"]
