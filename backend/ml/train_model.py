"""
MindGuard – ML Model Training Script
Trains a Random Forest classifier to predict student risk levels.
Uses synthetic data for initial training; can be retrained with real data later.
"""
import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

np.random.seed(42)
N_SAMPLES = 2000


def generate_synthetic_data(n=N_SAMPLES):
    """Generate realistic synthetic student wellness data."""
    data = []
    labels = []

    for _ in range(n):
        # Generate features
        sleep = np.clip(np.random.normal(6.5, 1.5), 0, 12)
        stress = np.clip(int(np.random.normal(5, 2.5)), 1, 10)
        social = np.clip(int(np.random.normal(5, 2.5)), 1, 10)
        study = np.clip(np.random.normal(5, 3), 0, 16)
        mood = np.clip(int(np.random.normal(3, 1.2)), 1, 5)

        # Calculate label based on rules (with noise)
        score = 0
        if sleep < 5: score += 25
        elif sleep < 6: score += 15
        elif sleep < 7: score += 5

        if stress >= 8: score += 25
        elif stress >= 6: score += 15
        elif stress >= 4: score += 5

        if social <= 2: score += 20
        elif social <= 4: score += 10

        if study > 12: score += 15
        elif study < 1: score += 10

        if mood <= 1: score += 20
        elif mood <= 2: score += 10
        elif mood <= 3: score += 5

        # Add noise
        score += np.random.normal(0, 8)
        score = np.clip(score, 0, 100)

        # Classify
        if score > 70:
            label = 2  # High
        elif score > 40:
            label = 1  # Medium
        else:
            label = 0  # Low

        data.append([sleep, stress, social, study, mood])
        labels.append(label)

    return np.array(data), np.array(labels)


def train_model():
    print("🧠 MindGuard ML Model Training")
    print("=" * 40)

    # Generate data
    print("📊 Generating synthetic data...")
    X, y = generate_synthetic_data()
    print(f"   Total samples: {len(X)}")
    print(f"   Features: sleep_hours, stress_level, socialization, study_hours, mood")
    print(f"   Distribution: Low={sum(y==0)}, Medium={sum(y==1)}, High={sum(y==2)}")

    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train
    print("\n🏋️ Training Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n✅ Model Accuracy: {accuracy:.2%}")
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Low", "Medium", "High"]))

    # Feature importance
    feature_names = ["Sleep Hours", "Stress Level", "Socialization", "Study Hours", "Mood"]
    importances = model.feature_importances_
    print("📊 Feature Importance:")
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
        bar = "█" * int(imp * 50)
        print(f"   {name:15s} {imp:.3f} {bar}")

    # Save model
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, "risk_model.joblib")
    joblib.dump(model, model_path)
    print(f"\n💾 Model saved to: {model_path}")

    return model


if __name__ == "__main__":
    train_model()
