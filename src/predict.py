import joblib
import pandas as pd
import numpy as np
from src.features import add_technical_indicators, load_stock_data

FEATURE_COLS = [
    "rsi", "macd", "macd_signal", "macd_diff",
    "bb_upper", "bb_lower", "bb_width", "volume_delta",
    "avg_sentiment_score", "avg_sentiment_numeric", "article_count"
]

def load_model(path: str = "models/xgb_model.pkl"):
    return joblib.load(path)

def predict_ticker(ticker: str, sentiment_score: float = 0.5, sentiment_numeric: float = 0.0) -> dict:
    """Predict price direction for a given ticker."""
    model = load_model()
    df = load_stock_data()

    tech_df = add_technical_indicators(df, ticker)
    tech_df = tech_df.replace([np.inf, -np.inf], np.nan).dropna()

    # Take the most recent row
    latest = tech_df.iloc[-1].copy()

    # Fill sentiment with provided values
    latest["avg_sentiment_score"] = sentiment_score
    latest["avg_sentiment_numeric"] = sentiment_numeric
    latest["article_count"] = 1

    X = pd.DataFrame([latest[FEATURE_COLS]])
    prediction = model.predict(X)[0]
    probability = model.predict_proba(X)[0]

    return {
        "ticker": ticker,
        "signal": "BUY" if prediction == 1 else "HOLD",
        "confidence": round(float(max(probability)), 4),
        "rsi": round(float(latest["rsi"]), 2),
        "macd_diff": round(float(latest["macd_diff"]), 4)
    }

if __name__ == "__main__":
    result = predict_ticker("TCS.NS", sentiment_score=0.8, sentiment_numeric=1.0)
    print("\nPrediction:", result)