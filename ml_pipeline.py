import pandas as pd
import numpy as np
import os
import joblib
import logging
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.ensemble import RandomForestRegressor, IsolationForest
from xgboost import XGBRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error, silhouette_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.cluster import KMeans
from sklearn.pipeline import Pipeline
from sklearn.model_selection import TimeSeriesSplit
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnxruntime as rt

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class SoilFusionMLPipeline:
    def __init__(self, data_dir='data', model_dir='models', plots_dir='plots'):
        self.data_dir = data_dir
        self.model_dir = model_dir
        self.plots_dir = plots_dir
        self.models = {}
        self.encoders = {}
        
        for directory in [self.data_dir, self.model_dir, self.plots_dir]:
            os.makedirs(directory, exist_ok=True)
            
    def convert_files_to_csv(self):
        logging.info("Checking for new data formats to convert to CSV...")
        for file in os.listdir(self.data_dir):
            file_path = os.path.join(self.data_dir, file)
            filename, ext = os.path.splitext(file)
            
            try:
                if ext.lower() in ['.xlsx', '.xls']:
                    logging.info(f"Converting Excel file {file} to CSV...")
                    df = pd.read_excel(file_path)
                    df.to_csv(os.path.join(self.data_dir, f"{filename}.csv"), index=False)
                    os.remove(file_path)
                    
                elif ext.lower() == '.json':
                    logging.info(f"Converting JSON file {file} to CSV...")
                    df = pd.read_json(file_path)
                    df.to_csv(os.path.join(self.data_dir, f"{filename}.csv"), index=False)
                    os.remove(file_path)
            except Exception as e:
                logging.error(f"Error converting {file}: {e}")

    def load_data(self):
        # weather_data.csv is optional — new format embeds weather cols in sensor_readings
        required_files = ['sensor_readings.csv', 'fields.csv', 'yield_history.csv', 'crops.csv']
        missing = [f for f in required_files if not os.path.exists(os.path.join(self.data_dir, f))]
        
        if missing:
            logging.warning(f"Missing files {missing}. Generating high-fidelity synthetic data...")
            self._generate_synthetic_data(missing)
            
        logging.info("Loading Data...")
        self.fields = pd.read_csv(os.path.join(self.data_dir, 'fields.csv'))
        self.sensor_readings = pd.read_csv(os.path.join(self.data_dir, 'sensor_readings.csv'))
        self.yield_history = pd.read_csv(os.path.join(self.data_dir, 'yield_history.csv'))
        self.crops = pd.read_csv(os.path.join(self.data_dir, 'crops.csv'))
        weather_path = os.path.join(self.data_dir, 'weather_data.csv')
        self.weather_data = pd.read_csv(weather_path) if os.path.exists(weather_path) else pd.DataFrame()

        # Check for User's Custom Tabular "Farmer" format
        if 'Farmer' in self.sensor_readings.columns or 'farmer_name' in self.sensor_readings.columns:
            if 'Farmer' in self.sensor_readings.columns:
                df = self.sensor_readings.rename(columns={
                    'N': 'nitrogen', 'P': 'phosphorus', 'K': 'potassium',
                    'pH': 'ph', 'Temp': 'temperature', 'Rain': 'rainfall'
                }).copy()
                
                unique_farmers = df['Farmer'].unique()
                farmer_to_id = {f: 100000 + i for i, f in enumerate(unique_farmers)}
                df['field_id'] = df['Farmer'].map(farmer_to_id)
                df['farmer_name'] = df['Farmer']
                
                if 'moisture' not in df.columns:
                    df['moisture'] = (20 + (df['rainfall'] / 50) - (df['temperature'] / 5)).clip(5, 60)
                    if 'OM' in df.columns:
                        df['moisture'] = (df['moisture'] + df['OM'] * 5).clip(5, 60)
                
                if 'humidity' not in df.columns:
                    import numpy as np
                    df['humidity'] = 50 + np.random.normal(0, 5, len(df))
                    
                df['date'] = pd.NaT
                for fid in df['field_id'].unique():
                    n_rows = len(df[df['field_id'] == fid])
                    dates = pd.date_range(end=datetime.now(), periods=n_rows, freq='D')
                    df.loc[df['field_id'] == fid, 'date'] = dates
                
                df.to_csv(os.path.join(self.data_dir, 'sensor_readings.csv'), index=False)
            else:
                # farmer_name present with moisture_percent — use PATH A below
                pass  # fall-through handled by moisture_percent check
                
        if 'moisture_percent' in self.sensor_readings.columns:
            # PATH A: new wide format (moisture_percent present — covers both new generated data and user uploads)
            self.sensor_readings['timestamp'] = pd.to_datetime(self.sensor_readings['timestamp'])
            self.sensor_readings['date'] = self.sensor_readings['timestamp'].dt.date
            renames = {
                'moisture_percent': 'moisture',
                'temperature_c': 'temperature',
                'nitrogen_ppm': 'nitrogen',
                'rainfall_mm': 'rainfall',
                'humidity_percent': 'humidity'
            }
            df = self.sensor_readings.rename(columns=renames).copy()
            agg_cols = [c for c in ['moisture', 'temperature', 'ph', 'nitrogen', 'rainfall', 'humidity'] if c in df.columns]
            df = df.groupby(['field_id', 'date'])[agg_cols].mean().reset_index()
            df['date'] = pd.to_datetime(df['date'])
        else:
            # Legacy format processing (if data was synthetic or old)
            self.sensor_readings['timestamp'] = pd.to_datetime(self.sensor_readings['timestamp'])
            self.sensor_readings['date'] = self.sensor_readings['timestamp'].dt.date
            daily_soil = self.sensor_readings.groupby(['field_id', 'date', 'parameter'])['value'].mean().unstack().reset_index()
            daily_soil.columns.name = None
            daily_soil['date'] = pd.to_datetime(daily_soil['date'])
            
            self.weather_data['timestamp'] = pd.to_datetime(self.weather_data['timestamp'])
            self.weather_data['date'] = self.weather_data['timestamp'].dt.date
            daily_weather = self.weather_data.groupby(['field_id', 'date'])[['rainfall', 'humidity', 'temperature']].mean().reset_index()
            daily_weather['date'] = pd.to_datetime(daily_weather['date'])
            
            df = pd.merge(daily_soil, daily_weather, on=['field_id', 'date'], how='inner')
            
        df = pd.merge(df, self.fields[['field_id', 'soil_type']], on='field_id', how='left')
        
        # In case Soil_Type came from Farmer CSV directly, fill NaNs
        if 'Soil_Type' in df.columns and 'soil_type' in df.columns:
            df['soil_type'] = df['soil_type'].fillna(df['Soil_Type'])
        elif 'Soil_Type' in df.columns:
            df['soil_type'] = df['Soil_Type']
            
        self.raw_df = df
        return df

    def _generate_synthetic_data(self, missing_files=None):
        if missing_files is None:
            missing_files = ['sensor_readings.csv', 'fields.csv', 'weather_data.csv', 'yield_history.csv', 'crops.csv']
            
        np.random.seed(42)
        dates = pd.date_range(end=datetime.now(), periods=100, freq='D')
        
        if 'fields.csv' in missing_files:
            fields_data = pd.DataFrame({
                'field_id': [100001, 100002, 100003],
                'farm_id': [200001, 200001, 200002],
                'field_name': ['North Block', 'South Block', 'East Block'],
                'soil_type': ['Clay', 'Loam', 'Sandy'],
                'area': [5.5, 4.2, 8.0]
            })
            fields_data.to_csv(os.path.join(self.data_dir, 'fields.csv'), index=False)
        else:
            try:
                fields_data = pd.read_csv(os.path.join(self.data_dir, 'fields.csv'))
            except:
                fields_data = pd.DataFrame({'field_id': [100001, 100002, 100003]})
        
        if 'sensor_readings.csv' in missing_files or 'weather_data.csv' in missing_files:
            readings, weather = [], []
            fids = fields_data['field_id'] if 'field_id' in fields_data.columns else [100001, 100002, 100003]
            for fid in fids:
                for d in dates:
                    readings.append([fid, d, 'moisture', np.random.normal(25, 5)])
                    readings.append([fid, d, 'ph', np.random.normal(6.5, 0.5)])
                    readings.append([fid, d, 'nitrogen', np.random.normal(50, 10)])
                    
                    weather.append([fid, d, np.random.exponential(5), np.random.normal(60, 10), np.random.normal(25, 5)])
                    
            if 'sensor_readings.csv' in missing_files:
                pd.DataFrame(readings, columns=['field_id', 'timestamp', 'parameter', 'value']).to_csv(os.path.join(self.data_dir, 'sensor_readings.csv'), index=False)
            if 'weather_data.csv' in missing_files:
                pd.DataFrame(weather, columns=['field_id', 'timestamp', 'rainfall', 'humidity', 'temperature']).to_csv(os.path.join(self.data_dir, 'weather_data.csv'), index=False)
                
        if 'crops.csv' in missing_files:
            crops_data = pd.DataFrame({'crop_id': [300001, 300002], 'crop_name': ['Wheat', 'Rice'], 'growth_period_days': [120, 150]})
            crops_data.to_csv(os.path.join(self.data_dir, 'crops.csv'), index=False)
            
        if 'yield_history.csv' in missing_files:
            yield_data = pd.DataFrame({
                'yield_id': [400001, 400002, 400003],
                'field_id': [100001, 100002, 100003],
                'crop_id': [300001, 300002, 300001],
                'yield_value': [4500, 5200, 3100],
                'season': ['Kharif', 'Rabi', 'Kharif'],
                'year': [2023, 2023, 2023]
            })
            yield_data.to_csv(os.path.join(self.data_dir, 'yield_history.csv'), index=False)

    def preprocess_data(self):
        logging.info("Preprocessing Data & Engineering Features...")
        df = self.raw_df.copy().sort_values(by=['field_id', 'date']).reset_index(drop=True)
        
        df['day_of_year'] = df['date'].dt.dayofyear
        df['month'] = df['date'].dt.month
        df['season'] = df['month'].apply(lambda x: 'Kharif' if x in [6,7,8,9] else ('Rabi' if x in [10,11,12,1,2,3] else 'Zaid'))
        df['year'] = df['date'].dt.year
        
        roll_mean = df.groupby('field_id')[['moisture', 'ph', 'nitrogen']].transform(lambda x: x.rolling(7, min_periods=1).mean())
        roll_mean.columns = [f'roll_mean_{c}' for c in roll_mean.columns]
        
        roll_std = df.groupby('field_id')[['moisture', 'ph', 'nitrogen']].transform(lambda x: x.rolling(14, min_periods=1).std().fillna(0))
        roll_std.columns = [f'roll_std_{c}' for c in roll_std.columns]
        
        df = pd.concat([df, roll_mean, roll_std], axis=1)
        
        df['trend_slope_moisture'] = df.groupby('field_id')['moisture'].transform(lambda x: (x - x.shift(7)) / 7).fillna(0)
        
        avg_std = df[['roll_std_moisture', 'roll_std_ph', 'roll_std_nitrogen']].mean(axis=1)
        df['stability_score'] = 1 / (avg_std + 1)
        
        self.processed_df = df
        return df

    def train_yield_prediction(self):
        logging.info("Training Yield Prediction Model...")
        df = self.processed_df.copy()
        
        seasonal_df = df.groupby(['field_id', 'year', 'season', 'soil_type']).agg(
            avg_moisture=('moisture', 'mean'),
            avg_ph=('ph', 'mean'),
            avg_nitrogen=('nitrogen', 'mean'),
            avg_temperature=('temperature', 'mean'),
            rainfall=('rainfall', 'sum'),
            humidity=('humidity', 'mean'),
            roll_mean_moisture=('roll_mean_moisture', 'mean'),
            roll_mean_ph=('roll_mean_ph', 'mean'),
            roll_mean_nitrogen=('roll_mean_nitrogen', 'mean'),
            stability_score=('stability_score', 'mean')
        ).reset_index()

        train_data = pd.merge(seasonal_df, self.yield_history, on=['field_id', 'year', 'season'], how='inner')
        
        if train_data.empty:
            logging.warning("No matched yield data. Expanding dataset synthetically for training demonstration.")
            train_data = seasonal_df.copy()
            train_data['crop_id'] = 300001
            train_data['yield_value'] = 2000 + 40 * train_data['avg_moisture'] + np.random.normal(0, 50, len(train_data))
            
        Q1 = train_data['yield_value'].quantile(0.25)
        Q3 = train_data['yield_value'].quantile(0.75)
        IQR = Q3 - Q1
        train_data = train_data[~((train_data['yield_value'] < (Q1 - 1.5 * IQR)) | (train_data['yield_value'] > (Q3 + 1.5 * IQR)))]
        
        le = LabelEncoder()
        train_data['soil_type'] = le.fit_transform(train_data['soil_type'].astype(str))
        self.encoders['soil_type'] = le
        
        train_data = train_data.sort_values(by=['year', 'season'])
        
        features_num = [
            'avg_moisture', 'avg_ph', 'avg_nitrogen', 'avg_temperature', 'rainfall', 
            'humidity', 'crop_id', 'roll_mean_moisture', 
            'roll_mean_ph', 'roll_mean_nitrogen', 'stability_score'
        ]
        features_cat = ['soil_type']
        features = features_num + features_cat
        
        X = train_data[features]
        y = train_data['yield_value']
        
        features_num_idx = [features.index(c) for c in features_num]
        features_cat_idx = [features.index(c) for c in features_cat]

        tscv = TimeSeriesSplit(n_splits=3)
        for train_index, test_index in tscv.split(X):
            X_train, X_test = X.iloc[train_index], X.iloc[test_index]
            y_train, y_test = y.iloc[train_index], y.iloc[test_index]
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), features_num_idx),
                ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), features_cat_idx)
            ])
        
        rf_pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                                      ('model', RandomForestRegressor(n_estimators=100, random_state=42))])
        rf_pipeline.fit(X_train, y_train)
        rf_pred = rf_pipeline.predict(X_test)
        rf_r2 = r2_score(y_test, rf_pred)
        
        rf_train_r2 = r2_score(y_train, rf_pipeline.predict(X_train))
        
        xgb_pipeline = Pipeline(steps=[('preprocessor', preprocessor),
                                       ('model', XGBRegressor(n_estimators=100, random_state=42))])
        
        # XGBoost requires feature names to be strings, pipelines handle this internally usually but let's be safe
        xgb_pipeline.fit(X_train, y_train)
        xgb_pred = xgb_pipeline.predict(X_test)
        xgb_r2 = r2_score(y_test, xgb_pred)
        xgb_train_r2 = r2_score(y_train, xgb_pipeline.predict(X_train))
        
        logging.info(f"RandomForest -> Train R2: {rf_train_r2:.4f} | Test R2: {rf_r2:.4f}, Test RMSE: {np.sqrt(mean_squared_error(y_test, rf_pred)):.4f}")
        logging.info(f"XGBoost      -> Train R2: {xgb_train_r2:.4f} | Test R2: {xgb_r2:.4f}, Test RMSE: {np.sqrt(mean_squared_error(y_test, xgb_pred)):.4f}")
        
        best_model = rf_pipeline if rf_r2 >= xgb_r2 else xgb_pipeline
        best_name = "RandomForest" if rf_r2 >= xgb_r2 else "XGBoost"
        best_pred = rf_pred if rf_r2 >= xgb_r2 else xgb_pred
        
        self.features_num = features_num
        self.features_cat = features_cat
        
        logging.info(f"Selected Best Model: {best_name}")
        
        initial_type = [('float_input', FloatTensorType([None, len(features)]))]
        # Pipeline model types might need different initial types for categorical, handling as strings if string inputs, but we already encoded strings or handled them.
        # We actually just provide a dataframe to the pipeline usually. For ONNX with dicts:
        # Better: let's just register XGBoost to skl2onnx and use convert_sklearn for everything
        from skl2onnx import update_registered_converter
        from skl2onnx.shape_calculators.linear_regressor import calculate_linear_regressor_output_shapes
        from onnxmltools.convert.xgboost.operator_converters.XGBoost import convert_xgboost
        
        try:
            update_registered_converter(
                XGBRegressor, 'XGBoostXGBRegressor',
                calculate_linear_regressor_output_shapes, convert_xgboost
            )
        except Exception as e:
            pass # Already registered

        onx = convert_sklearn(best_model, initial_types=initial_type, target_opset={'': 15, 'ai.onnx.ml': 3})
            
        with open(os.path.join(self.model_dir, 'yield_model.onnx'), "wb") as f:
            f.write(onx.SerializeToString())
            
        self.models['yield_model'] = best_model
        
        plt.figure(figsize=(10, 6))
        # Get feature names after preprocessing
        num_names = self.features_num
        cat_names = best_model.named_steps['preprocessor'].named_transformers_['cat'].get_feature_names_out(self.features_cat)
        encoded_features = list(num_names) + list(cat_names)
        sns.barplot(x=best_model.named_steps['model'].feature_importances_, hue=encoded_features, palette='viridis', legend=False)
        plt.title(f'Feature Importance ({best_name})')
        plt.tight_layout()
        plt.savefig(os.path.join(self.plots_dir, 'feature_importance.png'))
        plt.close()
        
        plt.figure(figsize=(8, 6))
        plt.scatter(y_test, best_pred, alpha=0.7, color='teal')
        plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
        plt.xlabel('Actual Yield')
        plt.ylabel('Predicted Yield')
        plt.title('Yield Prediction Accuracy Map')
        plt.tight_layout()
        plt.savefig(os.path.join(self.plots_dir, 'yield_pred_vs_actual.png'))
        plt.close()

    def train_anomaly_detection(self):
        logging.info("Training Anomaly Detection Model...")
        df = self.processed_df.copy()
        
        features = ['moisture', 'ph', 'nitrogen', 'temperature', 'rainfall']
        X = df[features].fillna(df[features].mean())
        
        iso_pipeline = Pipeline(steps=[
            ('scaler', StandardScaler()),
            ('model', IsolationForest(contamination=0.05, random_state=42))
        ])
        
        df['anomaly_label'] = iso_pipeline.fit_predict(X)
        df['anomaly_score'] = iso_pipeline.named_steps['model'].decision_function(iso_pipeline.named_steps['scaler'].transform(X))
        
        anomalies = df[df['anomaly_label'] == -1]
        pct = (len(anomalies) / len(df)) * 100
        logging.info(f"Isolation Forest flagged {pct:.2f}% of the timeline as anomalies.")
        
        initial_type = [('float_input', FloatTensorType([None, len(features)]))]
        onx = convert_sklearn(iso_pipeline, initial_types=initial_type, target_opset={'': 15, 'ai.onnx.ml': 3})
        with open(os.path.join(self.model_dir, 'anomaly_model.onnx'), "wb") as f:
            f.write(onx.SerializeToString())
            
        self.models['anomaly_model'] = iso_pipeline
        self.processed_df = df
        
        plt.figure(figsize=(12, 5))
        sample_field = df['field_id'].iloc[0]
        subset = df[df['field_id'] == sample_field].tail(60)
        plt.plot(subset['date'], subset['moisture'], label='Moisture Level', color='b')
        anom_subset = subset[subset['anomaly_label'] == -1]
        plt.scatter(anom_subset['date'], anom_subset['moisture'], color='red', s=60, label='Soil Anomaly Flagged', zorder=5)
        plt.title(f'Soil Condition Anomalies (Field ID: {sample_field})')
        plt.legend()
        plt.tight_layout()
        plt.savefig(os.path.join(self.plots_dir, 'anomaly_timeseries.png'))
        plt.close()

    def train_soil_clustering(self):
        logging.info("Training Soil Health Clustering Model (K-Means)...")
        df = self.processed_df.copy()
        
        features = ['moisture', 'ph', 'nitrogen', 'temperature', 'rainfall']
        X = df[features].fillna(df[features].mean())
        
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Elbow method / finding best K
        inertias = []
        silhouettes = []
        K_range = range(2, 6)
        best_k = 3
        best_score = -1
        
        for k in K_range:
            # handle case where synthetic data might be too small
            if len(X) <= k:
                logging.warning("Not enough samples for clustering.")
                return
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_scaled)
            inertias.append(kmeans.inertia_)
            score = silhouette_score(X_scaled, labels)
            silhouettes.append(score)
            if score > best_score:
                best_score = score
                best_k = k
                
        logging.info(f"K-Means Evaluation -> Optimal Clusters: {best_k} | Silhouette Score: {best_score:.4f} | Inertia at K={best_k}: {inertias[best_k-2]:.2f}")
        
        cluster_pipeline = Pipeline(steps=[
            ('scaler', StandardScaler()),
            ('model', KMeans(n_clusters=best_k, random_state=42, n_init=10))
        ])
        
        df['soil_cluster'] = cluster_pipeline.fit_predict(X)
        
        initial_type = [('float_input', FloatTensorType([None, len(features)]))]
        onx = convert_sklearn(cluster_pipeline, initial_types=initial_type, target_opset={'': 15, 'ai.onnx.ml': 3})
        with open(os.path.join(self.model_dir, 'clustering_model.onnx'), "wb") as f:
            f.write(onx.SerializeToString())
            
        self.models['clustering_model'] = cluster_pipeline
        self.processed_df = df
        
        plt.figure(figsize=(12, 5))
        plt.subplot(1, 2, 1)
        plt.plot(list(K_range), inertias, marker='o')
        plt.title('Elbow Method (Inertia)')
        plt.xlabel('Number of Clusters (K)')
        plt.ylabel('Inertia')
        
        plt.subplot(1, 2, 2)
        plt.plot(list(K_range), silhouettes, marker='s', color='green')
        plt.title('Silhouette Score vs K')
        plt.xlabel('Number of Clusters (K)')
        plt.ylabel('Silhouette Score')
        plt.tight_layout()
        plt.savefig(os.path.join(self.plots_dir, 'clustering_evaluation.png'))
        plt.close()

    def generate_visualizations(self):
        logging.info("Generating Correlation Output...")
        df = self.processed_df.copy()
        
        cols = ['moisture', 'ph', 'nitrogen', 'temperature', 'rainfall', 'humidity']
        corr = df[cols].corr()
        
        plt.figure(figsize=(8, 6))
        sns.heatmap(corr, annot=True, cmap='RdBu', fmt=".2f", linewidths=.5)
        plt.title('Soil & Weather Core Correlation Heatmap')
        plt.tight_layout()
        plt.savefig(os.path.join(self.plots_dir, 'correlation_heatmap.png'))
        plt.close()

def get_soil_health_score(moisture, ph, nitrogen, is_anomalous):
    m_score = 30 if 20 <= moisture <= 40 else (15 if (10<=moisture<20 or 40<moisture<=50) else 0)
    ph_diff = abs(ph - 6.5)
    ph_score = 30 if ph_diff <= 0.5 else (15 if ph_diff <= 1.5 else 0)
    n_score = 30 if nitrogen >= 50 else (15 if 20 <= nitrogen < 50 else 0)
    penalty = 20 if is_anomalous else 0
    
    total_score = m_score + ph_score + n_score - penalty
    total_score = max(0, min(100, total_score))
    
    risk_level = "Low" if total_score >= 80 else ("Medium" if total_score >= 50 else "High")
    return total_score, risk_level

def predict_yield(field_id, pipeline):
    sess = rt.InferenceSession(os.path.join(pipeline.model_dir, 'yield_model.onnx'))
    input_name = sess.get_inputs()[0].name
    df = pipeline.processed_df
    
    field_data = df[df['field_id'] == field_id].iloc[-1]
    
    soil_type = field_data['soil_type']
    enc = pipeline.encoders.get('soil_type')
    try:
        soil_enc = enc.transform([soil_type])[0]
    except:
        soil_enc = 0 
        
    X_input = pd.DataFrame([{
        'avg_moisture': field_data['roll_mean_moisture'],
        'avg_ph': field_data['roll_mean_ph'],
        'avg_nitrogen': field_data['roll_mean_nitrogen'],
        'avg_temperature': field_data['temperature'],
        'rainfall': field_data['rainfall'],
        'humidity': field_data['humidity'],
        'soil_type_encoded': soil_enc,
        'crop_id': pipeline.crops['crop_id'].iloc[0],
        'roll_mean_moisture': field_data['roll_mean_moisture'],
        'roll_mean_ph': field_data['roll_mean_ph'],
        'roll_mean_nitrogen': field_data['roll_mean_nitrogen'],
        'stability_score': field_data['stability_score']
    }])
    
    input_data = X_input.values.astype(np.float32)
    prediction = sess.run(None, {input_name: input_data})[0][0][0]
    return float(prediction)

def detect_anomaly(field_id, pipeline):
    sess = rt.InferenceSession(os.path.join(pipeline.model_dir, 'anomaly_model.onnx'))
    input_name = sess.get_inputs()[0].name
    df = pipeline.processed_df
    field_data = df[df['field_id'] == field_id].iloc[-1]
    
    features = pd.DataFrame([{
        'moisture': field_data['moisture'],
        'ph': field_data['ph'], 
        'nitrogen': field_data['nitrogen'], 
        'temperature': field_data['temperature'], 
        'rainfall': field_data['rainfall']
    }])
    
    input_data = features.values.astype(np.float32)
    pred_label = sess.run(None, {input_name: input_data})[0][0]
    is_anomaly = (pred_label == -1)
    if is_anomaly:
        logging.warning(f"ALERT: Abnormal Soil Trends Detected on {field_id}!")
        
    return is_anomaly

def recommend_planting(field_id, pipeline):
    df = pipeline.processed_df
    history = df[df['field_id'] == field_id].tail(7)
    
    avg_m = history['moisture'].mean()
    avg_ph = history['ph'].mean()
    avg_n = history['nitrogen'].mean()
    
    anomalous = detect_anomaly(field_id, pipeline)
    score, risk = get_soil_health_score(avg_m, avg_ph, avg_n, anomalous)
    
    moisture_ok = 15 <= avg_m <= 40
    ph_ok = 5.5 <= avg_ph <= 7.5
    nitrogen_ok = avg_n >= 30
    
    stability = history['stability_score'].mean()
    confidence = (score * 0.4) + (stability * 10 * 0.4) + (20 if not anomalous else 0)
    confidence = min(100, max(0, confidence))
    
    if moisture_ok and ph_ok and nitrogen_ok and not anomalous:
        status = "Optimal to Plant"
        crop = pipeline.crops['crop_name'].iloc[0]
        date = (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')
    else:
        status = "Warning - Delay Planting"
        crop = "Treat Soil First"
        date = "N/A"
        
    return {
        "Field_ID": field_id,
        "Status": status,
        "Confidence_Score": f"{confidence:.2f}%",
        "Target_Crop": crop,
        "Recommended_Start_Date": date,
        "Soil_Health_Risk": risk
    }

if __name__ == "__main__":
    print("-" * 50)
    print(" SoilFusion ML Training Pipeline Initializing...")
    print("-" * 50)
    
    pipeline = SoilFusionMLPipeline()
    pipeline.convert_files_to_csv()
    pipeline.load_data()
    pipeline.preprocess_data()
    pipeline.train_yield_prediction()
    pipeline.train_anomaly_detection()
    pipeline.train_soil_clustering()
    pipeline.generate_visualizations()
    
    print("\n" + "=" * 50)
    print(" INFERENCE ENGINE DEMONSTRATION ")
    print("=" * 50)
    
    sample_field = pipeline.processed_df['field_id'].iloc[0]
    
    print(f"\n[1] Yield Prediction for Field {sample_field}:")
    yld = predict_yield(sample_field, pipeline)
    print(f"    Expected Yield Output: {yld:.2f} kg/hectare")
    
    print(f"\n[2] Live Soil Anomaly Check for Field {sample_field}:")
    is_anom = detect_anomaly(sample_field, pipeline)
    print(f"    System Status: {'ABNORMAL BEHAVIOR FLAGGED' if is_anom else 'NORMAL (Healthy)'}")
    
    print(f"\n[3] Planting Recommendation Engine:")
    rec = recommend_planting(sample_field, pipeline)
    for k, v in rec.items():
        print(f"    {k.replace('_', ' ')}: {v}")
    
    print("\n✅ Pipeline Execution Completed Successfully. Models & Plots exported.")
