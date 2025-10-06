import sys
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

# Load the trained model and encoders
try:
    model_data = joblib.load('city_safety_predictor_model.pkl')
    best_model = model_data['model']
    label_encoders = model_data['label_encoders']
    feature_columns = model_data['feature_columns']
    all_cities = model_data['all_cities']
    train_features_stats = model_data['train_features_stats'] # For getting mean values
except FileNotFoundError:
    print(json.dumps({"error": "Model file 'city_safety_predictor_model.pkl' not found. Please run train.py first."}))
    sys.exit(1)
except Exception as e:
    print(json.dumps({"error": f"Error loading model: {e}"}))
    sys.exit(1)

def get_age_group(age):
    if age <= 18: return '0-18'
    elif age <= 25: return '19-25'
    elif age <= 35: return '26-35'
    elif age <= 45: return '36-45'
    elif age <= 55: return '46-55'
    elif age <= 65: return '56-65'
    else: return '65+'

def predict_city_safety_improved(age, gender, year):
    predictions = []

    # Use a dummy DataFrame for train_features to access .mean() for missing cities
    # In a real scenario, you'd want to store these means or handle missing cities more robustly
    dummy_train_features = pd.DataFrame(columns=feature_columns)
    for col in feature_columns:
        if col in train_features_stats.columns:
            dummy_train_features[col] = [train_features_stats.loc['mean', col]]
        else:
            dummy_train_features[col] = [0] # Default to 0 if stat not available

    for city in all_cities:
        try:
            features = {}
            features['Victim Age'] = age
            features['Year'] = year

            features['City'] = label_encoders['City'].transform([city])[0]
            features['Victim Gender'] = label_encoders['Victim Gender'].transform([gender])[0]

            age_group = get_age_group(age)
            features['Age_Group'] = label_encoders['Age_Group'].transform([age_group])[0]

            # Use descriptive statistics from training data for city-specific features
            # This is a simplification; ideally, you'd have pre-calculated city stats
            # or fetch them from a database. For this script, we'll use overall means
            # if city-specific historical data isn't readily available in the loaded model.
            features['Total_Crimes'] = dummy_train_features['Total_Crimes'].mean()
            features['Avg_Victim_Age'] = dummy_train_features['Avg_Victim_Age'].mean()
            features['City_Crime_Density'] = dummy_train_features['City_Crime_Density'].mean()

            feature_vector = [features[col] for col in feature_columns if col in features]

            safety_score = float(best_model.predict([feature_vector])[0])
            safety_score = max(0, min(100, safety_score))

            predictions.append({
                'City': city,
                'Predicted_Safety_Score': round(safety_score, 2),
            })

        except Exception as e:
            # print(f"Error predicting for city {city}: {e}", file=sys.stderr)
            continue

    if predictions:
        results_df = pd.DataFrame(predictions)
        results_df = results_df.sort_values('Predicted_Safety_Score', ascending=False).reset_index(drop=True)
        results_df['Safety_Rank'] = results_df.index + 1
        return results_df.to_dict(orient='records')
    else:
        return []

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Usage: python predict_safety.py <age> <gender> <year>"}))
        sys.exit(1)

    try:
        age = int(sys.argv[1])
        gender = sys.argv[2]
        year = int(sys.argv[3])

        # Basic validation for gender
        if gender.lower() not in ['m', 'f', 'male', 'female']:
            print(json.dumps({"error": "Invalid gender. Use 'M', 'F', 'male', or 'female'."}))
            sys.exit(1)
        gender_encoded = 'M' if gender.lower() in ['m', 'male'] else 'F'

        results = predict_city_safety_improved(age, gender_encoded, year)
        print(json.dumps({"success": True, "predictions": results}))
    except ValueError:
        print(json.dumps({"error": "Invalid age or year. Must be integers."}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"An unexpected error occurred: {e}"}))
        sys.exit(1)
