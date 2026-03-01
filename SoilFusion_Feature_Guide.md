# 🌾 SoilFusion - Detailed Feature Guide

Ye guide tumhare project "SoilFusion" ke har ek single feature ko detail mein explain karti hai. Ise padh kar tum kisi ko bhi (jaise examiner, user ya investor) clearly samjha sakte ho ki backend se lekar frontend tak kya ho raha hai.

---

## 1. 📂 Intelligent Data Curation (CSV Upload & Parser)
*   **Kaam:** Farmers apna soil report Excel/CSV file mein dalte hain.
*   **Kaise Kaam Karta Hai:**
    *   Frontend par Drag-and-Drop widget hai.
    *   Upload hote hi Backend (`server.js`) multer use karke use save karta hai.
    *   `ml_pipeline.py` script automatically check karti hai ki CSV mein **Sensor Format** (moisture, date) hai ya **Farmer Format** (Farmer Name, N, P, K).
    *   Agar Farmer Format hai, toh system automatically har farmer ko ek unique `Field ID` assign karta hai aur unn missing parameters (jaise Moisture) ko Temperature aur Rainfall ke formula se calculate karke dataset feed karta hai.
*   **Faida:** Farmer ko format convert nahi karna padta. System itna smart hai ki kaisa bhi tabular data interpret kar leta hai.

---

## 2. 🌍 Multilingual Farmer UI (Hindi/English)
*   **Kaam:** App ko gaon ke kisan ke liye accessible banata hai.
*   **Kaise Kaam Karta Hai:**
    *   `LanguageContext.jsx` ek hook use karta hai jo pure UI ko toggle karta hai.
    *   Data dictionary (`translations.js`) English aur Shuddh Hindi (jaise "Nitrogen Level" ko "Natarjan Ka Star") mein translated hai.
    *   Browser ke local storage mein save rehta hai taaki app restart hone pe language same rahe.

---

## 3. 🌤️ Live Weather & Geolocation Strip
*   **Kaam:** Kisan ko uske field ke aas-pass ka live weather dikhata hai.
*   **Kaise Kaam Karta Hai:**
    *   Browser API se Device ki GPS location leta hai (Latitude/Longitude).
    *   **Nominatim API:** Lat/Long ko Pincode/City Name mein convert karta hai.
    *   **Open-Meteo API:** Us location ka Real-time Temperature, Humidity aur Feels-Like weather fetch karta hai aur Top Header Strip mein continuous scrolling slider mein dikhata hai.

---

## 4. 🧠 Hybrid ML Pipeline (4-Layered AI)
Ye system ka sabse strong point hai, jo sirf rules nahi balki Machine Learning Models pe chalta hai:
*   **RandomForest & XGBoost (Yield Prediction):** 
    *   Ye past historical data (kisi mitti pe kitni kheti hui) ko padhta hai.
    *   Dono models parallel train hote hain. Jiski Accuracy (R² Score) jyada aati hai, system usko auto-select kar leta hai.
    *   Result mein batata hai: *Abhi ki mitti ki halat pe exact kitne Kilo fasal hogi?*
*   **Isolation Forest (Anomaly Detection):**
    *   Static rules fail ho jate hain kyunki Har mitti alag hai.
    *   Ye model past data ki clustering karta hai. Agar achanak pH aur Moisture ke pattern normal se bahar chale jayein (भले ही wo limit ke andar ho par trend toot raha ho), ye usse pakad ke alert trigger kar deta hai.
*   **K-Means (Soil Clustering):** Mitti ki quality (Good, Bad, Average) ko segment karta hai.

---

## 5. 🤖 Rule-Based NLP Recommendation Engine
*   **Kaam:** AI models numbers return karte hain (`[3456.2]` yield, `True` anomaly). Kisan numbers nahi samajhte. 
*   **Kaise Kaam Karta Hai:**
    *   `inference.py` script un numbers ko padhti hai.
    *   Agar Moisture < 20 hai aur Temp > 30 hai, toh engine ek human-readable line generate karta hai: *"Aapki mitti sookh rahi hai, kripya subah 6 baje sinchai karein"*.
    *   Translation flag lagne par yahi chiz Hindi text mein UI par bheji jati hai.

---

## 6. 📊 Real-Time Interactive Charts & Badges
*   **Kaam:** Data ko visual banata hai.
*   **Kaise Kaam Karta Hai:**
    *   `Recharts` library pichle 14 din ka trend Area aur Line graphs mein plot karti hai.
    *   Nitrogen, Phosphorus aur pH ke liye **Cards & Badges** banaye gaye hain (Green/Red/Amber).
    *   Kisan ko exact current number dikhayi deta hai uske aage uska status (Low/Optimal/High).

---

## 7. ⏳ Field Recovery Estimation
*   **Kaam:** Kisan ko batata hai ki field ready hone mein kitna time hai.
*   **Kaise Kaam Karta Hai:**
    *   Soil Health Score (0-100) calculate hota hai.
    *   Agar score < 40 hai, th calculation batati hai "1-2 Weeks Recovery Time". Agar score 80+ hai toh "Ready To Plant" dikhata hai.

---

## 8. 🌱 Intelligent Planting Recommendations
*   **Kaam:** Batata hai ki is mitti pe kaunsi kheti sabse badhiya chalegi.
*   **Kaise Kaam Karta Hai:**
    *   NPK, pH aur current weather ke combinations match hote hain uske target crops databasets se.
    *   Current date nikal kar agle sowing season ka date batata hai (e.g. "Recommended Start: 2026-06-15").

