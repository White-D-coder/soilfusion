import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            "app_title": "SoilFusion",
            "accuracy_badge": "System Accuracy: >90% Verified",
            "upload_title": "Upload Sensor Data",
            "upload_desc": "Upload your raw CSV, Excel, or JSON sensor logs to kickstart ML model training.",
            "process_btn": "Process Data",
            "select_field": "Select Field",
            "get_insights": "Get Insights",
            "expected_yield": "Expected Yield",
            "recovery_time": "Field Recovery Time",
            "risk_level": "Soil Health Risk",
            "ai_summary": "AI Field Summary",
            "planting_status": "Planting Status",
            "confidence": "Confidence",
            "target_crop": "Target Crop",
            "start_date": "Recommended Start Date",
            "moisture": "Moisture Level",
            "ph": "pH Level",
            "nitrogen": "Nitrogen (N)",
            "anomalies_detected": "Anomalies Detected",
            "no_anomalies": "No Anomalies",
            "healthy": "Soil is Healthy",
            "wait_time": "Wait Time",
            "ready_to_plant": "Ready to Plant",
            "lang_en": "English",
            "lang_hi": "हिंदी"
        }
    },
    hi: {
        translation: {
            "app_title": "SoilFusion",
            "accuracy_badge": "सिस्टम सटीकता: >90% प्रमाणित",
            "upload_title": "सेंसर डेटा अपलोड करें",
            "upload_desc": "अपनी मिट्टी का डेटा (CSV/Excel/JSON) अपलोड करें।",
            "process_btn": "डेटा प्रोसेस करें",
            "select_field": "खेत चुनें",
            "get_insights": "जानकारी प्राप्त करें",
            "expected_yield": "अनुमानित उपज",
            "recovery_time": "खेत के ठीक होने का समय",
            "risk_level": "मिट्टी के स्वास्थ्य का जोखिम",
            "ai_summary": "खेत का सारांश",
            "planting_status": "बुवाई की स्थिति",
            "confidence": "विश्वास दर",
            "target_crop": "उपयुक्त फसल",
            "start_date": "सुझाए गए बुवाई की तारीख",
            "moisture": "नमी का स्तर",
            "ph": "पीएच स्तर",
            "nitrogen": "नाइट्रोजन (N)",
            "anomalies_detected": "असामान्य स्थिति पाई गई",
            "no_anomalies": "स्थिति सामान्य है",
            "healthy": "मिट्टी स्वस्थ है",
            "wait_time": "प्रतीक्षा समय",
            "ready_to_plant": "बुवाई के लिए तैयार",
            "lang_en": "English",
            "lang_hi": "हिंदी"
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "en",
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
