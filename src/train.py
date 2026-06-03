import pandas as pd
import numpy as np
import mlflow
import mlflow.xgboost
import optuna
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score, f1_score, classification_report
import joblib
import warnings
warnings.filterwarnings("ignore")

FEATURE_COLS = [
    "rsi", "macd", "macd_signal", "macd_diff",
    "bb_upper", "bb_lower", "bb_width", "volume_delta",
    "avg_sentiment_score", "avg_sentiment_numeric", "article_count"
]
TARGET_COL = "target"

def load_features() -> tuple:
    """Load features CSV and split into X and y."""
    df = pd.read_csv("data/features.csv")
    df = df.sort_values("Date")
    
    # Replace inf values and drop remaining NaNs
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna(subset=FEATURE_COLS + [TARGET_COL])
    
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]
    print(f"Clean dataset: {len(df)} rows after removing inf/nan values")
    return X, y

def get_tscv_score(X, y, params: dict) -> float:
    """Evaluate XGBoost with TimeSeriesSplit cross validation."""
    tscv = TimeSeriesSplit(n_splits=5)
    scores = []
    for train_idx, val_idx in tscv.split(X):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
        model = xgb.XGBClassifier(**params, eval_metric="logloss", verbosity=0)
        model.fit(X_train, y_train)
        preds = model.predict(X_val)
        scores.append(f1_score(y_val, preds))
    return np.mean(scores)

def objective(trial, X, y) -> float:
    """Optuna objective function — defines the hyperparameter search space."""
    params = {
        "n_estimators": trial.suggest_int("n_estimators", 100, 500),
        "max_depth": trial.suggest_int("max_depth", 3, 8),
        "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
        "subsample": trial.suggest_float("subsample", 0.6, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
        "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
        "scale_pos_weight": trial.suggest_float("scale_pos_weight", 1.0, 3.0),
        "use_label_encoder": False
    }
    return get_tscv_score(X, y, params)

def train(n_trials: int = 30):
    """Main training function with MLflow tracking."""
    X, y = load_features()
    print(f"Dataset: {X.shape[0]} rows, {X.shape[1]} features")
    print(f"Target distribution: {y.value_counts().to_dict()}")

    # Optuna hyperparameter search
    print(f"\nRunning Optuna search ({n_trials} trials)...")
    study = optuna.create_study(direction="maximize")
    study.optimize(lambda trial: objective(trial, X, y), n_trials=n_trials)
    best_params = study.best_params
    print(f"Best params: {best_params}")
    print(f"Best F1: {study.best_value:.4f}")

    # Train final model with best params + log to MLflow
    with mlflow.start_run():
        mlflow.log_params(best_params)

        # Final train/test split — last 20% as test (time-aware)
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

        final_model = xgb.XGBClassifier(
            **best_params,
            eval_metric="logloss",
            verbosity=0,
            use_label_encoder=False
        )
        final_model.fit(X_train, y_train)

        # Evaluate
        preds = final_model.predict(X_test)
        acc = accuracy_score(y_test, preds)
        f1 = f1_score(y_test, preds)

        mlflow.log_metric("accuracy", acc)
        mlflow.log_metric("f1_score", f1)
        mlflow.xgboost.log_model(final_model, "model")

        print(f"\n✅ Final Accuracy: {acc:.4f}")
        print(f"✅ Final F1 Score: {f1:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, preds))

        # Save model locally too
        joblib.dump(final_model, "models/xgb_model.pkl")
        print("✅ Model saved to models/xgb_model.pkl")

    return final_model

if __name__ == "__main__":
    train(n_trials=30)