import sys
import json
import logging
import warnings
import os

warnings.filterwarnings('ignore')
logging.getLogger().setLevel(logging.ERROR)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from ml_pipeline import SoilFusionMLPipeline, predict_yield, detect_anomaly, recommend_planting
    
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Field ID required"}))
        sys.exit(1)
        
    field_id = int(sys.argv[1])
    lang = sys.argv[2] if len(sys.argv) > 2 else "en"
    
    pipeline = SoilFusionMLPipeline(
        data_dir='data', 
        model_dir='models', 
        plots_dir='plots'
    )
    pipeline.load_data()
    pipeline.preprocess_data()
    
    df = pipeline.processed_df
    field_records = df[df['field_id'] == field_id]
    if field_records.empty:
        raise ValueError(f"No record found for Field ID {field_id}.")
    
    field_data = field_records.iloc[-1]
    yld = predict_yield(field_id, pipeline)
    is_anom = detect_anomaly(field_id, pipeline)
    rec = recommend_planting(field_id, pipeline)
    
    moisture = field_data['moisture']
    ph = field_data['ph']
    nitrogen = field_data['nitrogen']
    
    # NLP Engine
    if is_anom or rec["Soil_Health_Risk"] == "High":
        recovery_en = "3-4 Weeks (Treatment Required)"
        recovery_hi = "3-4 हफ़्ते (उपचार आवश्यक)"
        
        issue_en = f"Warning: Your field is currently unstable. "
        issue_hi = f"चेतावनी: आपका खेत अभी अस्थिर है। "
        
        if moisture < 20:
            issue_en += "Moisture is dangerously low. "
            issue_hi += "नमी बहुत कम है। "
        elif moisture > 40:
            issue_en += "Moisture is too high (waterlogging risk). "
            issue_hi += "नमी बहुत अधिक है (जलभराव का खतरा)। "
            
        if ph < 6.0 or ph > 7.0:
            issue_en += "The soil pH is unbalanced. "
            issue_hi += "मिट्टी का पीएच असंतुलित है। "
            
        if nitrogen < 50:
            issue_en += "Nitrogen levels are critically low. "
            issue_hi += "नाइट्रोजन का स्तर बहुत कम है। "
            
        action_en = "Precaution: Delay planting. Apply fertilizers and regulate irrigation immediately."
        action_hi = "सावधानी: बुवाई में देरी करें। तुरंत उर्वरक डालें और सिंचाई को नियंत्रित करें।"
        
    elif rec["Soil_Health_Risk"] == "Medium":
        recovery_en = "1-2 Weeks (Minor Adjustments)"
        recovery_hi = "1-2 हफ़्ते (मामूली सुधार)"
        issue_en = "Notice: Soil conditions are acceptable but not optimal. Minor nutrient or water adjustments are needed before planting."
        issue_hi = "ध्यान दें: मिट्टी की स्थिति ठीक है लेकिन सर्वोत्तम नहीं है। बुवाई से पहले थोड़ा उर्वरक या पानी सही करें।"
        action_en = "Precaution: Monitor pH and moisture closely for the next 7 days."
        action_hi = "सावधानी: अगले 7 दिनों तक मिट्टी की नमी और पीएच पर कड़ी नज़र रखें।"
    else:
        recovery_en = "Ready Now"
        recovery_hi = "तुरंत बुवाई के लिए तैयार"
        issue_en = "Success: Your soil health is excellently balanced. Moisture, pH, and Nitrogen are at perfect levels."
        issue_hi = "सफलता: आपकी मिट्टी का स्वास्थ्य बेहतरीन है। नमी, पीएच और नाइट्रोजन बिल्कुल सही स्तर पर हैं।"
        action_en = "Action: You are cleared to begin planting immediately."
        action_hi = "कार्रवाई: आप तुरंत बुवाई शुरू कर सकते हैं।"

    summary_text = f"{issue_en}\n\n{action_en}" if lang == "en" else f"{issue_hi}\n\n{action_hi}"
    recovery_text = recovery_en if lang == "en" else recovery_hi

    # Extract historical data for Graph
    if 'date' in field_records.columns:
        field_records = field_records.sort_values('date')
    recent_data = field_records.tail(14)
    graph_data = []
    for _, row in recent_data.iterrows():
        dt_str = row['date'].strftime('%m-%d') if hasattr(row.get('date'), 'strftime') else str(row.get('date', ''))[:10]
        graph_data.append({
            "date": dt_str,
            "moisture": round(float(row.get('moisture', 0)), 1),
            "temperature": round(float(row.get('temperature', 0)), 1),
            "ph": round(float(row.get('ph', 0)), 1),
            "nitrogen": round(float(row.get('nitrogen', 0)), 1)
        })

    output = {
        "field_id": field_id,
        "yield_prediction_kg_per_ha": float(yld),
        "anomaly_detected": bool(is_anom),
        "recommendation": rec,
        "recovery_time": recovery_text,
        "summary": summary_text,
        "historical_data": graph_data
    }
    
    print(json.dumps(output))
    
except Exception as e:
    import traceback
    var = traceback.format_exc()
    print(json.dumps({"error": str(e), "trace": var}))
    sys.exit(1)
