"""
CrimeSafe ML Training Pipeline
Trains time-series forecasting models on 2020-2023 data, tests on 2024
"""

import pandas as pd
import numpy as np
from datetime import datetime
import joblib
import json
import sys
from pathlib import Path

# ML libraries
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_squared_error, mean_absolute_error, accuracy_score, confusion_matrix
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression

# Time series
try:
    from prophet import Prophet
except ImportError:
    print("Prophet not installed, skipping Prophet model")
    Prophet = None

# Explainability
try:
    import shap
except ImportError:
    print("SHAP not installed, skipping explainability")
    shap = None

# Database connection
import os
import psycopg2

# Configuration
TRAIN_YEARS = [2020, 2021, 2022, 2023]
TEST_YEAR = 2024
MODEL_VERSION = f"v1_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
MODEL_DIR = Path("models")
MODEL_DIR.mkdir(exist_ok=True)

class CrimeSafeTrainer:
    def __init__(self):
        self.db_url = os.environ.get("DATABASE_URL")
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable not set")
        self.models = {}
        self.scalers = {}
        self.feature_names = [] # For the time-series model
        
        # For personalized safety model
        self.safety_label_encoders = {}
        self.safety_feature_columns = []
        self.all_cities = []
        self.train_features_stats = None
        self.best_safety_model = None

    def load_data(self):
        """Load data from database"""
        print("Loading data from database...")
        conn = psycopg2.connect(self.db_url)
        
        # Load monthly aggregations
        query = """
        SELECT 
            ma.*,
            ls.latitude,
            ls.longitude,
            ls.population
        FROM monthly_aggregations ma
        LEFT JOIN location_stats ls ON ma.location_id = ls.location_id
        ORDER BY ma.location_id, ma.year, ma.month
        """
        
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        print(f"Loaded {len(df)} monthly aggregation records")
        return df
    
    def enforce_year_split(self, df):
        """CRITICAL: Enforce strict year-based train/test split"""
        print(f"\n{'='*60}")
        print("ENFORCING YEAR SPLIT POLICY")
        print(f"{'='*60}")
        
        train_df = df[df['year'].isin(TRAIN_YEARS)].copy()
        test_df = df[df['year'] == TEST_YEAR].copy()
        
        print(f"Training data: {len(train_df)} records from years {TRAIN_YEARS}")
        print(f"Test data: {len(test_df)} records from year {TEST_YEAR}")
        print(f"Train years: {sorted(train_df['year'].unique())}")
        print(f"Test years: {sorted(test_df['year'].unique())}")
        
        # Verify no leakage
        assert not any(train_df['year'] == TEST_YEAR), "ERROR: Test year found in training data!"
        assert all(test_df['year'] == TEST_YEAR), "ERROR: Non-test year found in test data!"
        
        print("Year split verified - no data leakage")
        print(f"{'='*60}\n")
        
        return train_df, test_df
    
    def engineer_features(self, df):
        """Create lag features, rolling statistics, and seasonality indicators"""
        print("Engineering features...")
        
        df = df.sort_values(['location_id', 'year', 'month']).copy()
        
        # Create date column for easier manipulation
        df['date'] = pd.to_datetime(df[['year', 'month']].assign(day=1))
        
        features = []
        
        for location_id in df['location_id'].unique():
            loc_df = df[df['location_id'] == location_id].copy()
            
            # Lag features (1, 3, 6, 12 months)
            loc_df['lag_1'] = loc_df['crime_count'].shift(1)
            loc_df['lag_3'] = loc_df['crime_count'].shift(3)
            loc_df['lag_6'] = loc_df['crime_count'].shift(6)
            loc_df['lag_12'] = loc_df['crime_count'].shift(12)
            
            # Rolling statistics
            loc_df['rolling_mean_3'] = loc_df['crime_count'].rolling(window=3, min_periods=1).mean()
            loc_df['rolling_std_3'] = loc_df['crime_count'].rolling(window=3, min_periods=1).std()
            loc_df['rolling_mean_6'] = loc_df['crime_count'].rolling(window=6, min_periods=1).mean()
            
            # Trend (linear)
            loc_df['trend'] = np.arange(len(loc_df))
            
            features.append(loc_df)
        
        df = pd.concat(features, ignore_index=True)
        
        # Seasonality features
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        df['is_summer'] = df['month'].isin([4, 5, 6]).astype(int)
        df['is_winter'] = df['month'].isin([12, 1, 2]).astype(int)
        
        # Location features
        df['lat_norm'] = (df['latitude'] - df['latitude'].mean()) / df['latitude'].std()
        df['lon_norm'] = (df['longitude'] - df['longitude'].mean()) / df['longitude'].std()
        
        # Demographic features
        df['female_ratio'] = df['female_victims'] / (df['male_victims'] + df['female_victims'] + 1)
        
        print(f"Feature engineering complete. Shape: {df.shape}")
        return df
    
    def train_xgboost_model(self, train_df, test_df):
        """Train XGBoost model for crime count prediction"""
        print("\n" + "="*60)
        print("Training XGBoost Model")
        print("="*60)
        
        # Define features
        feature_cols = [
            'lag_1', 'lag_3', 'lag_6', 'lag_12',
            'rolling_mean_3', 'rolling_std_3', 'rolling_mean_6',
            'trend', 'month_sin', 'month_cos', 'is_summer', 'is_winter',
            'lat_norm', 'lon_norm', 'female_ratio', 'avg_victim_age'
        ]
        
        self.feature_names = feature_cols
        
        # Remove rows with NaN in features (due to lag/rolling)
        train_clean = train_df.dropna(subset=feature_cols + ['crime_count'])
        test_clean = test_df.dropna(subset=feature_cols + ['crime_count'])
        
        print(f"Training samples: {len(train_clean)}")
        print(f"Test samples: {len(test_clean)}")
        
        X_train = train_clean[feature_cols]
        y_train = train_clean['crime_count']
        X_test = test_clean[feature_cols]
        y_test = test_clean['crime_count']
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        self.scalers['xgboost'] = scaler
        
        # Train XGBoost
        model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1
        )
        
        model.fit(
            X_train_scaled, y_train,
            eval_set=[(X_test_scaled, y_test)],
            verbose=False
        )
        
        # Predictions
        y_pred_train = model.predict(X_train_scaled)
        y_pred_test = model.predict(X_test_scaled)
        
        # Metrics
        train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
        train_mae = mean_absolute_error(y_train, y_pred_train)
        test_mae = mean_absolute_error(y_test, y_pred_test)
        
        print(f"\nXGBoost Results:")
        print(f"  Train RMSE: {train_rmse:.2f}")
        print(f"  Test RMSE: {test_rmse:.2f}")
        print(f"  Train MAE: {train_mae:.2f}")
        print(f"  Test MAE: {test_mae:.2f}")
        
        # Feature importance
        feature_importance = dict(zip(feature_cols, model.feature_importances_))
        sorted_importance = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        
        print("\nTop 10 Feature Importances:")
        for feat, imp in sorted_importance[:10]:
            print(f"  {feat}: {imp:.4f}")
        
        # SHAP explainability
        explainer = None
        shap_values = None
        if shap is not None:
            try:
                print("\nCalculating SHAP values...")
                explainer = shap.TreeExplainer(model)
                shap_values = explainer.shap_values(X_test_scaled[:100])  # Sample for speed
                print("✓ SHAP values calculated")
            except Exception as e:
                print(f"SHAP calculation failed: {e}")
        
        self.models['xgboost'] = {
            'model': model,
            'scaler': scaler,
            'feature_cols': feature_cols,
            'metrics': {
                'train_rmse': float(train_rmse),
                'test_rmse': float(test_rmse),
                'train_mae': float(train_mae),
                'test_mae': float(test_mae),
            },
            'feature_importance': {k: float(v) for k, v in sorted_importance},
            'explainer': explainer,
        }
        
        return model, test_rmse, test_mae
    
    def classify_zones(self, df, predictions):
        """Classify locations into red/amber/green zones"""
        print("\nClassifying zones...")
        
        # Thresholds (configurable)
        RED_THRESHOLD = 50
        AMBER_THRESHOLD = 20
        
        classifications = []
        for pred in predictions:
            if pred > RED_THRESHOLD:
                classifications.append('red')
            elif pred > AMBER_THRESHOLD:
                classifications.append('amber')
            else:
                classifications.append('green')
        
        return classifications
    
    def evaluate_classification(self, test_df, predictions):
        """Evaluate zone classification accuracy"""
        print("\nEvaluating zone classification...")
        
        test_clean = test_df.dropna(subset=['crime_count'])
        y_true_zones = []
        
        RED_THRESHOLD = 50
        AMBER_THRESHOLD = 20
        
        for count in test_clean['crime_count']:
            if count > RED_THRESHOLD:
                y_true_zones.append('red')
            elif count > AMBER_THRESHOLD:
                y_true_zones.append('amber')
            else:
                y_true_zones.append('green')
        
        y_pred_zones = self.classify_zones(test_clean, predictions)
        
        # Ensure same length
        min_len = min(len(y_true_zones), len(y_pred_zones))
        y_true_zones = y_true_zones[:min_len]
        y_pred_zones = y_pred_zones[:min_len]
        
        accuracy = accuracy_score(y_true_zones, y_pred_zones)
        conf_matrix = confusion_matrix(y_true_zones, y_pred_zones, labels=['green', 'amber', 'red'])
        
        print(f"Zone Classification Accuracy: {accuracy:.2%}")
        print("\nConfusion Matrix:")
        print("                Predicted")
        print("              Green  Amber  Red")
        print(f"Actual Green  {conf_matrix[0]}")
        print(f"       Amber  {conf_matrix[1]}")
        print(f"       Red    {conf_matrix[2]}")
        
        return accuracy, conf_matrix.tolist()
    
    def _load_raw_crime_data(self):
        print("Loading raw crime data from CSV for personalized safety model...")
        # Assumes crime_dataset_india.csv is in the project root
        csv_path = Path("crime_dataset_india.csv")
        if not csv_path.exists():
            raise FileNotFoundError(f"Raw crime data CSV not found at {csv_path}")
        df = pd.read_csv(csv_path)
        print(f"Loaded {len(df)} raw crime records from CSV")
        return df

    def _preprocess_safety_data(self, df):
        print("Preprocessing data for personalized safety model...")
        df_clean = df.copy()
        df_clean = df_clean.dropna()
        df_clean = df_clean.drop_duplicates()

        date_columns = ['Date Reported', 'Date of Occurrence']
        for col in date_columns:
            if col in df_clean.columns:
                df_clean[col] = pd.to_datetime(df_clean[col], errors='coerce')
        
        categorical_columns = ['City', 'Crime Description', 'Victim Gender', 'Weapon Used', 'Crime Domain']
        for col in categorical_columns:
            if col in df_clean.columns:
                df_clean[col] = df_clean[col].astype(str).str.strip().str.title()

        if 'Victim Age' in df_clean.columns:
            df_clean['Victim Age'] = pd.to_numeric(df_clean['Victim Age'], errors='coerce')
            df_clean = df_clean[df_clean['Victim Age'].between(0, 100)]
        
        if 'Date of Occurrence' in df_clean.columns:
            df_clean['Year'] = df_clean['Date of Occurrence'].dt.year
        
        print(f"Data after preprocessing for safety model: {df_clean.shape}")
        return df_clean

    def _create_safety_features_simple(self, df):
        print("Creating features for personalized safety model...")
        crime_stats = df.groupby(['City', 'Victim Age', 'Victim Gender', 'Year']).agg({
            'Report Number': 'count',
        }).reset_index()
        crime_stats = crime_stats.rename(columns={'Report Number': 'Crime_Count'})

        city_stats = df.groupby(['City', 'Year']).agg({
            'Report Number': 'count',
            'Victim Age': 'mean'
        }).reset_index()
        city_stats = city_stats.rename(columns={'Report Number': 'Total_Crimes', 'Victim Age': 'Avg_Victim_Age'})

        features_df = pd.merge(crime_stats, city_stats, on=['City', 'Year'], how='left')

        max_crimes = features_df['Crime_Count'].max()
        features_df['Safety_Score'] = (1 - (features_df['Crime_Count'] / max_crimes)) * 100

        def get_age_group(age):
            if age <= 18: return '0-18'
            elif age <= 25: return '19-25'
            elif age <= 35: return '26-35'
            elif age <= 45: return '36-45'
            elif age <= 55: return '46-55'
            elif age <= 65: return '56-65'
            else: return '65+'

        features_df['Age_Group'] = features_df['Victim Age'].apply(get_age_group)

        city_density = df.groupby('City').size().reset_index(name='City_Crime_Density')
        features_df = pd.merge(features_df, city_density, on='City', how='left')
        features_df = features_df.fillna(0)

        print(f"Features created for safety model. Shape: {features_df.shape}")
        return features_df

    def _prepare_safety_ml_dat(self, features_df):
        print("Preparing ML data for personalized safety model...")
        df_ml = features_df.copy()

        label_encoders = {}
        categorical_cols = ['City', 'Victim Gender', 'Age_Group']

        for col in categorical_cols:
            le = LabelEncoder()
            df_ml[col] = le.fit_transform(df_ml[col].astype(str))
            label_encoders[col] = le

        feature_columns = ['Victim Age', 'Year', 'City', 'Victim Gender', 'Age_Group',
                           'Total_Crimes', 'Avg_Victim_Age', 'City_Crime_Density']

        available_features = [col for col in feature_columns if col in df_ml.columns]

        X = df_ml[available_features]
        y = df_ml['Safety_Score']

        return X, y, label_encoders, available_features
    
    def train_personalized_safety_model(self):
        print("\n" + "="*60)
        print("Training Personalized City Safety Model")
        print("="*60)

        # Load and preprocess raw data
        raw_df = self._load_raw_crime_data()
        df_clean = self._preprocess_safety_data(raw_df)

        # Create time-based split for safety model (using years 2020-2023 for training)
        train_safety_data = df_clean[df_clean['Year'].isin(TRAIN_YEARS)].copy()
        # test_safety_data = df_clean[df_clean['Year'] == TEST_YEAR].copy() # Not explicitly used for model training but for evaluation

        # Feature Engineering
        train_features = self._create_safety_features_simple(train_safety_data)
        # test_features = self._create_safety_features_simple(test_safety_data)

        # Prepare ML data
        X_train, y_train, label_encoders, feature_columns = self._prepare_safety_ml_dat(train_features)
        self.safety_label_encoders = label_encoders
        self.safety_feature_columns = feature_columns
        self.all_cities = train_features['City'].unique().tolist()
        self.train_features_stats = train_features.describe()

        # Train XGBoost model (as chosen in the notebook)
        model = xgb.XGBRegressor(n_estimators=100, random_state=42, max_depth=5)
        model.fit(X_train, y_train)
        self.best_safety_model = model

        print(f"Personalized safety model trained: {model.__class__.__name__}")
        print(f"Features used: {feature_columns}")
        print(f"Number of cities for prediction: {len(self.all_cities)}")
        print("="*60 + "\n")

        # Save the personalized safety model artifacts
        model_data = {
            'model': self.best_safety_model,
            'label_encoders': self.safety_label_encoders,
            'feature_columns': self.safety_feature_columns,
            'all_cities': self.all_cities,
            'train_features_stats': self.train_features_stats
        }
        safety_model_path = Path("scripts") / 'city_safety_predictor_model.pkl'
        joblib.dump(model_data, safety_model_path)
        print(f"✓ Saved personalized safety model: {safety_model_path}")

    def save_models(self):
        """Save trained models and metadata"""
        print(f"\nSaving models to {MODEL_DIR}...")
        
        # Save XGBoost model (time series)
        if 'xgboost' in self.models:
            model_path = MODEL_DIR / f"xgboost_{MODEL_VERSION}.joblib"
            joblib.dump(self.models['xgboost'], model_path)
            print(f"✓ Saved XGBoost model: {model_path}")
        
        # Save metadata
        metadata = {
            'model_version': MODEL_VERSION,
            'train_years': TRAIN_YEARS,
            'test_year': TEST_YEAR,
            'created_at': datetime.now().isoformat(),
            'models': {}
        }
        
        if 'xgboost' in self.models:
            metadata['models']['xgboost'] = {
                'metrics': self.models['xgboost']['metrics'],
                'feature_importance': self.models['xgboost']['feature_importance'],
                'feature_cols': self.models['xgboost']['feature_cols'],
            }
        
        metadata_path = MODEL_DIR / f"metadata_{MODEL_VERSION}.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✓ Saved metadata: {metadata_path}")
        
        return MODEL_VERSION
    
    def run_training_pipeline(self):
        """Execute full training pipeline"""
        print("\n" + "="*60)
        print("CRIMESAFE ML TRAINING PIPELINE")
        print("="*60)
        print(f"Model Version: {MODEL_VERSION}")
        print(f"Train Years: {TRAIN_YEARS}")
        print(f"Test Year: {TEST_YEAR}")
        print("="*60 + "\n")
        
        # --- Time-series model training ---
        df = self.load_data()
        train_df, test_df = self.enforce_year_split(df)
        train_df = self.engineer_features(train_df)
        test_df = self.engineer_features(test_df)
        model, test_rmse, test_mae = self.train_xgboost_model(train_df, test_df)
        
        test_clean = test_df.dropna(subset=self.feature_names + ['crime_count'])
        X_test = test_clean[self.feature_names]
        X_test_scaled = self.scalers['xgboost'].transform(X_test)
        predictions = model.predict(X_test_scaled)
        accuracy, conf_matrix = self.evaluate_classification(test_df, predictions)
        self.models['xgboost']['metrics']['classification_accuracy'] = float(accuracy)
        self.models['xgboost']['metrics']['confusion_matrix'] = conf_matrix

        # --- Personalized safety model training ---
        self.train_personalized_safety_model()

        # Save time-series models (the personalized model is saved within its own function)
        model_version = self.save_models()
        
        print("\n" + "="*60)
        print("TRAINING COMPLETE")
        print("="*60)
        print(f"Model Version: {model_version}")
        print(f"Time-Series Test RMSE: {test_rmse:.2f}")
        print(f"Time-Series Test MAE: {test_mae:.2f}")
        print(f"Time-Series Classification Accuracy: {accuracy:.2%}")
        print("="*60 + "\n")
        
        return {
            'model_version': model_version,
            'test_rmse': float(test_rmse),
            'test_mae': float(test_mae),
            'classification_accuracy': float(accuracy),
        }

if __name__ == "__main__":
    trainer = CrimeSafeTrainer()
    results = trainer.run_training_pipeline()
    print("\nTraining results:", json.dumps(results, indent=2))
