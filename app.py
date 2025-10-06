# app.py
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Base folder containing this app.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
print("Current working directory:", os.getcwd())
print("Files in folder:", os.listdir(BASE_DIR))

# Model files to try loading
model_files = [
    os.path.join(BASE_DIR, 'crime_safety_model_deployment.pkl'),
    os.path.join(BASE_DIR, 'city_safety_predictor_model.pkl')
]

# Load model with debug prints
model = None
label_encoders = {}
feature_columns = []
all_cities = []
city_stats = {}

for file in model_files:
    print(f"\nTrying to load model from: {file}")
    if os.path.exists(file):
        try:
            artifacts = joblib.load(file)
            print(f"✅ Loaded object type: {type(artifacts)}")

            if isinstance(artifacts, dict):
                print(f"Keys in artifacts: {list(artifacts.keys())}")
                model = artifacts.get('model', None)
                label_encoders = artifacts.get('label_encoders', {})
                feature_columns = artifacts.get('feature_columns', [])
                all_cities = artifacts.get('all_cities', [])
                city_stats = artifacts.get('city_stats', {})
            else:
                model = artifacts  # if it's just a model object

            if model is not None:
                print(f"✅ Model loaded successfully from {file}")
                print(f"Model object: {model}")
                break
            else:
                print(f"❌ No model found inside {file}")
        except Exception as e:
            print(f"❌ Failed to load model from '{file}': {e}")
    else:
        print(f"❌ File does not exist: {file}")

if model is None:
    print("❌ No valid model loaded. Check your .pkl files.")

# Prediction function
def predict_city_safety(age, gender, year):
    """Prediction function for the API"""
    if model is None:
        raise Exception("Model not loaded")

    predictions = []

    for city in all_cities:
        try:
            # Build feature vector
            features = {}
            features['Victim Age'] = age
            features['Year'] = year

            # Encode categorical features if label_encoders exist
            if label_encoders.get('City'):
                features['City'] = label_encoders['City'].transform([city])[0]
            if label_encoders.get('Victim Gender'):
                features['Victim Gender'] = label_encoders['Victim Gender'].transform([gender])[0]

            # Age group
            if age <= 18:
                age_group = '0-18'
            elif age <= 25:
                age_group = '19-25'
            elif age <= 35:
                age_group = '26-35'
            elif age <= 45:
                age_group = '36-45'
            elif age <= 55:
                age_group = '46-55'
            elif age <= 65:
                age_group = '56-65'
            else:
                age_group = '65+'

            if label_encoders.get('Age_Group'):
                features['Age_Group'] = label_encoders['Age_Group'].transform([age_group])[0]

            # City statistics
            features['Total_Crimes'] = city_stats.get('Total_Crimes', {}).get(city, 0)
            features['Avg_Victim_Age'] = city_stats.get('Avg_Victim_Age', {}).get(city, 0)
            features['City_Crime_Density'] = city_stats.get('City_Crime_Density', {}).get(city, 0)

            # Create feature vector
            if feature_columns:
                feature_vector = [features.get(col, 0) for col in feature_columns]
            else:
                # If no feature_columns saved, use all features
                feature_vector = list(features.values())

            # Predict
            safety_score = model.predict([feature_vector])[0]
            safety_score = max(0, min(100, safety_score))  # Clamp 0-100

            predictions.append({
                'city': city,
                'safety_score': round(float(safety_score), 2),
                'age': age,
                'gender': gender,
                'year': year
            })

        except Exception as e:
            print(f"Error predicting for city {city}: {e}")
            continue

    return predictions


# API routes
@app.route('/health')
def health():
    return jsonify({"status": "healthy", "model_loaded": model is not None})

@app.route('/cities')
def get_cities():
    return jsonify({"cities": all_cities})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        age = data.get('age')
        gender = data.get('gender')
        year = data.get('year', 2024)

        if age is None or gender is None:
            return jsonify({"error": "Missing required parameters: age and gender"}), 400
        if not (0 <= age <= 100):
            return jsonify({"error": "Age must be between 0 and 100"}), 400
        if gender.upper() not in ['M', 'F']:
            return jsonify({"error": "Gender must be 'M' or 'F'"}), 400
        if not (2020 <= year <= 2030):
            return jsonify({"error": "Year must be between 2020 and 2030"}), 400

        predictions = predict_city_safety(age, gender.upper(), year)
        if not predictions:
            return jsonify({"error": "No predictions generated"}), 500

        # Sort and rank
        predictions.sort(key=lambda x: x['safety_score'], reverse=True)
        for i, pred in enumerate(predictions):
            pred['rank'] = i + 1

        response = {
            "input": {"age": age, "gender": gender.upper(), "year": year},
            "safest_cities": predictions[:5],
            "most_dangerous_cities": predictions[-5:][::-1],
            "total_cities_analyzed": len(predictions)
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


# Optional web interface route
@app.route('/web')
def web_interface():
    return render_template('index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
