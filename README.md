# Project Title

SoilFusion: Intelligent Soil Health Dashboard from Sensor Logs

---

## 1. Problem Statement


### Problem Title

Soil Health Dashboard from Sensor Logs

Problem Description
Modern farms increasingly use IoT sensors to monitor soil parameters such as moisture, pH, nitrogen levels, and temperature. These sensors continuously generate large volumes of data, typically stored as raw CSV logs. While this data is abundant, it often lacks meaningful interpretation, creating an intelligence gap between data collection and real agricultural decisions.
Farmers are surrounded by numbers but lack the tools to convert those numbers into clear, actionable insights about soil health, irrigation timing, and planting decisions.


| Challenge                                   | Description                                                                                      | Impact on Farmers                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| **Raw Data Liability ("So What?" Problem)** | A sensor reading such as **Moisture: 15.2%** is just a number without context or interpretation. | Farmers cannot easily determine whether irrigation should happen now or later.       |
| **Human Interpretation Burden**             | Raw sensor logs require manual analysis to understand soil conditions.                           | Farmers must spend time interpreting data instead of focusing on farming activities. |
| **Snapshot vs Story Problem**               | Most tools only show the current soil reading instead of long-term soil trends.                  | Slow soil degradation or nutrient depletion may go unnoticed.                        |
| **Missing Historical Correlation**          | Current systems rarely correlate live soil conditions with historical crop yield data.           | Farmers cannot learn from past harvest outcomes to improve future decisions.         |
| **Alert Fatigue ("Cry Wolf" Problem)**      | Sensors operating in harsh environments may produce temporary spikes or noise in readings.       | Frequent false alerts reduce trust in the monitoring system.                         |
| **Decision Paralysis**                      | Farming decisions such as planting or irrigation depend heavily on correct timing.               | Without clear insights, farmers rely on intuition instead of data-driven decisions.  |


  ## Current Situation v/s Desired Outcome



| Current Situation                     | Desired Outcome                                          |
| ------------------------------------- | -------------------------------------------------------- |
| Raw sensor logs stored as CSV files   | Intelligent dashboards that visualize soil health trends |
| Farmers manually interpret numbers    | Automated insights and recommendations                   |
| Alerts triggered by simple thresholds | Smart alerts that filter noise and detect real risks     |
| Short-term data snapshots             | Long-term soil health analysis and predictions           |



-----


## Target Users

```mermaid
flowchart TD
A[SoilFusion System] --> B[Farmers]
A --> C[Farm Managers]
A --> D[Agricultural Analysts]
A --> E[AgriTech Developers]
```


| Category                                 | Details                                                                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Geographical Focus**                   | India 🇮🇳                                                                                                                                                                                                                           |
| **Estimated Farmers Using Soil Sensors** | ~30,00,000 (30 Lakh) active users (estimated adoption across medium & large farms)                                                                                                                                                   |
| **Type of Data Generated**               | Time-series soil data collected at 15–60 min intervals: <br>• pH (range: 4.5 – 9.0) <br>• Moisture (% volumetric water content: 5% – 60%) <br>• Nitrogen (ppm: 0 – 2000 ppm depending on soil type) <br>• Temperature (°C: 5 – 50°C) |
| **Current Market Gap**                   | • 70–80% sensor users rely on raw CSV exports <br>• No automated multi-parameter correlation <br>• Static threshold alerts (no adaptive intelligence)                                                                                |
| **Opportunity Identified**               | Development of a Soil Health Intelligence & Analytics Platform targeting early-stage precision agriculture adoption (initial 3,000 pilot users)                                                                                      |



| User Segment               | Description                                                                                  | Key Needs                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Sensor-Enabled Farmers** | Farmers already collecting soil data using IoT sensors (avg 2–10 sensors per farm)           | • Actionable insights within 24 hours <br>• <10% false alert rate <br>• Data-backed planting window suggestions |
| **Data Format**            | CSV-based sensor logs (time-series data, typically 5,000–50,000 rows per season)             | • Automated trend visualization <br>• Multi-parameter correlation matrix <br>• Exportable reports (PDF/CSV)     |
| **Primary Goal**           | Maintain optimal soil health to improve yield efficiency by 5–15% (target improvement range) | • Data-driven irrigation scheduling <br>• Nutrient optimization planning                                        |


| Parameter                | Description                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Initial Target Users** | 3,000 Farmers (Pilot Phase – Year 1)                                                                                                                                                                    |
| **Purpose**              | • Validate model accuracy (target R² > 0.75 for yield prediction) <br>• Reduce false alerts by 30–40% compared to static threshold systems                                                              |
| **Key Objectives**       | • Adaptive threshold detection using rolling averages (7–14 day window) <br>• Correlate soil parameters with past 3–5 crop cycles <br>• Generate planting recommendation confidence score (0–100 scale) |
| **Expected Outcome**     | Achieve Product–Market Fit with ≥70% monthly active usage among pilot farmers and measurable improvement in decision timing                                                                             |


------

## Existing Gap vs SoilFusion Improvement


```mermaid
xychart-beta
title "Without Solution (Current System)"
x-axis ["Data Interpretation","Trend Monitoring","Alert Accuracy","Decision Support","Yield Correlation"]
y-axis "Capability Score (%)" 0 --> 100
bar [25,20,30,15,10]
```

```mermaid
xychart-beta
title "With SoilFusion Solution"
x-axis ["Data Interpretation","Trend Monitoring","Alert Accuracy","Decision Support","Yield Correlation"]
y-axis "Capability Score (%)" 0 --> 100
bar [85,80,75,90,70]
```

  

| Limitation in Existing Systems                       | Impact on Farmers (with Practical Metrics)                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data collected but not effectively visualized**    | • 60–75% of IoT agri users rely on raw CSV/manual export analysis (industry estimate) <br> • 4–8 hrs/week spent reviewing sensor logs manually                   |
| **No proper correlation with historical yield data** | • <20% of small–mid farms use structured yield analytics tools <br> • Yield variance of 10–25% remains unexplained due to lack of historical modeling            |
| **No advisory or predictive insights**               | • Less than 15% of Indian farms use predictive analytics (precision agri reports) <br> • Planting timing errors can reduce yield by 5–15% depending on crop type |
| **No intelligent alerts**                            | • Static threshold systems generate 30–50% false positives (IoT field studies range) <br> • Alert fatigue reduces farmer response rate over time                 |
| **Raw logs without interpretation**                  | • Sensor systems generate 5,000–50,000 data points per season per farm <br> • >70% of collected data remains underutilized without analytics layer               |







## System Workflow

```mermaid
flowchart LR
A[Soil Sensors] --> B[CSV Logs]
B --> C[Data Processing]
C --> D[Trend Analysis]
D --> E[Dashboard]
E --> F[Farmer Insights]
```


---

## 2. Problem Understanding & Approach

### Root Cause Analysis
### Solution Strategy

---

## 3. Proposed Solution

### Solution Overview
### Core Idea
### Key Features

---

## 4. System Architecture

### High-Level Flow
User → Frontend → Backend → Model → Database → Response

### Architecture Description

### Architecture Diagram
(Add system architecture diagram image here)

---

## 5. Database Design

### ER Diagram
(Add ER diagram image here)

### ER Diagram Description

---

## 6. Dataset Selected

### Dataset Name
### Source
### Data Type
### Selection Reason
### Preprocessing Steps

---

## 7. Model Selected

### Model Name
### Selection Reasoning
### Alternatives Considered
### Evaluation Metrics

---

## 8. Technology Stack

### Frontend
### Backend
### ML/AI
### Database
### Deployment

---

## 9. API Documentation & Testing

### API Endpoints List
- Endpoint 1:
- Endpoint 2:
- Endpoint 3:

### API Testing Screenshots
(Add Postman / Thunder Client screenshots here)

---

## 10. Module-wise Development & Deliverables

### Checkpoint 1: Research & Planning
- Deliverables:

### Checkpoint 2: Backend Development
- Deliverables:

### Checkpoint 3: Frontend Development
- Deliverables:

### Checkpoint 4: Model Training
- Deliverables:

### Checkpoint 5: Model Integration
- Deliverables:

### Checkpoint 6: Deployment
- Deliverables:

---

## 11. End-to-End Workflow

1.
2.
3.
4.
5.
6.
7.

---

## 12. Demo & Video

- Live Demo Link:
- Demo Video Link:
- GitHub Repository:

---

## 13. Hackathon Deliverables Summary

-
-
-
-

---

## 14. Team Roles & Responsibilities

| Member Name | Role | Responsibilities |
|-------------|------|-----------------|

---

## 15. Future Scope & Scalability

### Short-Term
-

### Long-Term
-

---

## 16. Known Limitations

-
-
-

---

## 17. Impact

-
-
-
