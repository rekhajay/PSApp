# TAX Preparer Projects – Flow Diagram

```mermaid
graph TD
    A[2025 Projects] --> A1[Extract Forecast Data from Warehouse Whole Year]
    A1 -->|Manual| A2[Export Forecasts into Dayshape Template Provided]
    B[2026 Rolled Projects] --> B1[Strategy 1: Light Roll 2025 Projects No FC RPL in WD]
    B --> B2[Strategy 2: Full Roll 2025 Projects With FC RPL in WD]
    B1 --> B1a[Generate FC & RPL from Warehouse Actuals]
    B2 --> B2a[Generate Forecasts from Actuals Plan in WD]
    B2a --> B3[Extract Forecast Data from Warehouse Whole Year]
    B1a --> B3
    A2 --> C[Transform to Dayshape Single Worker RPL DW Activity]
    B3 --> C
    C -->|Integration: DS Packaged| D1[Create 2025 Projects in DS Batch Processing]
    C -->|Integration: DS Packaged| D2[Create 2026 Projects in DS Batch Processing]
    D1 -->|Manual: DS Team| E[Import Forecasts into DS to Create Demand]
    D2 -->|Manual: DS Team| E
    E -->|Integration: DS Packaged| F1[Upsert RPL Lines Back to WD]
    F1 --> G1[2025 Projects Jul–Dec: Replace WD Forecast with DS]
    F1 --> G2[2026 Projects Jan–Dec: Replace WD Forecast with DS]
