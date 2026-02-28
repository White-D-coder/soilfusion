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
    
    pipeline = SoilFusionMLPipeline(
        data_dir='data', 
        model_dir='models', 
        plots_dir='plots'
    )
    pipeline.load_data()
    pipeline.preprocess_data()
    
    yld = predict_yield(field_id, pipeline)
    is_anom = detect_anomaly(field_id, pipeline)
    rec = recommend_planting(field_id, pipeline)
    
    output = {
        "field_id": field_id,
        "yield_prediction_kg_per_ha": float(yld),
        "anomaly_detected": bool(is_anom),
        "recommendation": rec
    }
    
    print(json.dumps(output))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
