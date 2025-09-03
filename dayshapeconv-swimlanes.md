# TAX Preparer Projects – Swimlane Diagram (Finalized)

```mermaid
flowchart TD

    %% Workday Team
    subgraph WD[Workday Team]
        WD1["Extract 2025 Forecast Data from Warehouse"]
        WD2["Roll 2025 Projects Into 2026 (Strategy 1 or 2)"]
        WD3["Export Forecasts Into Dayshape Nov–Dec 2025 (Template Provided)"]
        WD4["Export Forecasts Into Dayshape Jan–Dec 2026 (Template Provided)"]
        WD5["Upsert RPL Lines Back to Workday (2025 Jul–Dec)"]
        WD6["Delete and Replace Forecast in Workday With DS Forecast (Cutover) – For 2025 Projects, ONLY Nov and Dec Forecasts Will Exist"]
        WD7["Upsert RPL Lines Back to Workday (2026 Jan–Dec)"]
        WD8["Delete and Replace Forecast in Workday With DS Forecast (Cutover) – For 2026 Projects, Full Year Forecasts Will Exist"]
    end

    %% Data Warehouse
    subgraph DW[Data Warehouse]
        DW1["Hold Forecasts for 2025 (Nov–Dec) and 2026 (Full Year)"]
        DW2["Generate Forecasts and RPL From Actuals (To Be Developed)"]
        DW3["Provide Forecast Extracts Whole Year"]
    end

    %% Dayshape Integration
    subgraph DSInt[Dayshape Packaged Integration]
        DS2["Create 2025 Projects in Dayshape (Batch Processing)"]
        DS3["Create 2026 Projects in Dayshape (Batch Processing)"]
    end

    %% Dayshape Team
    subgraph DS[Dayshape Team]
        DS1["Import Forecasts Into Dayshape Nov–Dec 2025"]
        DS4["Import Forecasts Into Dayshape Jan–Dec 2026"]
        DS5["Steps to Create Demand in Dayshape from Exported Workday Project Forecasts"]
    end

    %% Flows
    WD1 --> WD3 --> DW3 --> DS2
    WD2 --> DW2 --> DW3 --> DS3
    WD4 --> DS3

    WD3 --> DS5
    WD4 --> DS5

    DS2 --> DS1 --> WD5 --> WD6
    DS3 --> DS4 --> WD7 --> WD8
