# 🚀 SoilFusion Production & Data Guide (Render)

## 1. Data mein kya missing tha? (What was missing in the Training Data?)

Jo tumne `soil_dataset_150_rows.csv` upload ki thi, usmein **Time-Series (Date/Time)** aur **Moisture** dono missing thay. SoilFusion ka ML Pipeline (Anomaly Detection & Yield Prediction) time-series trends par kaam karta hai (jaise pichle 7 din ka average, 14 din ka standard deviation). Ek hi reading se ML model trend nahi bata sakta.

**Missing Columns:**
- `Date` ya `Timestamp`: Kab ki reading hai? (Trend analyse karne ke liye zaroori hai).
- `Moisture`: Sabse main fact jo Alert system use karta hai.
- `Humidity`: ML Yield Prediction ke liye features mein se ek.
- **Multiple Rows Per Farmer:** Abhi har farmer ki sirf 1 row hai. ML ko ek farmer ke liye agle pichle dino ki zyada readings chahiye trend pakadne ke liye.

**Maine kaise fix kiya? (Temporary Fix in `ml_pipeline.py`)**
Abhi maine `ml_pipeline.py` mein **Data Imputation** daal diya hai. Agar user CSV mein sirf Farmer ka naam daalta hai, toh code khud:
1. Us farmer ke liye pichle 100~ din ki **fake dates** generate kar dega (taaki TimeSeriesSplit kaam kare).
2. `Moisture` ko rainfall aur temperature ke combination se calculate karke fake data bana dega.
3. `Farmer` ke naam ko ek unique `Field ID` (`10000X`) de dega.

**Production Setup ke liye asli Data kaisa hona chahiye?**
Bhavishya mein, original sensor reading sheet mein farmers ke naam ke aage roz ki readings honi chahiye, jisme `timestamp` column hona zaroori hai.

---

## 2. Render Deployment & Ephemeral Storage (Data kaise rahega?)

Render (aur Heroku) free-tier par **Ephemeral Storage** use karte hain. Iska matlab:
- Jab bhi Render so jata hai (sleep mode) ya dubara deploy hota hai, toh uske file system mein jo naye files aaye hain (jaise Uploaded CSVs) wo **delete ho jate hain**.
- **Fix:** Tumhe apna base CSV data (`soil_dataset_150_rows.csv`) Git repo ke andar hi save karke GitHub par Push karna padega. Code isko `data/` folder se padh lega. Agar tum user upload disable karke directly repo se data uthana chahte ho, toh wo best approach hai production ke liye.

---

## 3. Keep-Alive Script (Render Sleep Issue Fix)

Render free tier har 15 minute mein app ko sleep kar deta hai agar koi web request na aaye.
**Fix:** Tumne script maangi thi, toh **maine sidha tumhare `Backend/server.js` ke andar hi script daal di hai.**

Line `158` (server.js) mein dekho:
```javascript
// Configure keeping the server awake on Render Free Tier
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
setInterval(() => {
    fetch(`${RENDER_EXTERNAL_URL}/api/health`)
        .then(res => res.json())
        .then(data => console.log('Keep-alive ping successful:', data.message))
        .catch(err => console.error('Keep-alive ping failed:', err.message));
}, 10 * 60 * 1000); // Ping every 10 minutes
```

Jab tum isse Render par daaloge, toh waha **Environment Variables** mein `RENDER_EXTERNAL_URL` add kar dena (jaise `https://soilfusion-backend.onrender.com`). Ye backend khud ko har 10 minute mein request bhejega aur kabhi sleep nahi hoga!
