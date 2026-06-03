# FinPulse — Stock Movement Predictor

End-to-end ML system that predicts short-term NSE stock price direction using FinBERT sentiment analysis on financial news + technical indicators, deployed as a REST API with a live Streamlit dashboard.

## Tech Stack

| Layer | Tools |
|---|---|
| Data Ingestion | yfinance, NewsAPI |
| NLP | FinBERT (ProsusAI/finbert) |
| ML Model | XGBoost + Optuna hyperparameter tuning |
| Experiment Tracking | MLflow |
| Backend API | FastAPI |
| Dashboard | Streamlit + Plotly |

## Project Structure

    finpulse-predictor/
    ├── src/
    │   ├── data_ingestion.py   → Fetch stock prices + news
    │   ├── sentiment.py        → FinBERT sentiment scoring
    │   ├── features.py         → Technical indicators + merge
    │   ├── train.py            → XGBoost + MLflow + Optuna
    │   └── predict.py          → Inference logic
    ├── api/
    │   └── main.py             → FastAPI REST API
    ├── dashboard/
    │   └── app.py              → Streamlit dashboard
    └── requirements.txt

## Setup & Run

    git clone https://github.com/ABHIRAMKATARI1289/FinPulse-Predictor.git
    cd FinPulse-Predictor
    python -m venv venv && source venv/bin/activate
    pip install -r requirements.txt
    echo "NEWS_API_KEY=your_key_here" > .env

    python src/data_ingestion.py
    python src/sentiment.py
    python src/features.py
    python src/train.py

    uvicorn api.main:app --reload       # Terminal 1
    streamlit run dashboard/app.py      # Terminal 2

## API Usage

    curl -X POST "http://localhost:8000/predict" \
      -H "Content-Type: application/json" \
      -d '{"ticker": "RELIANCE.NS", "sentiment_score": 0.8, "sentiment_numeric": 1.0}'

    Response:
    {"ticker": "RELIANCE.NS", "signal": "BUY", "confidence": 0.54, "rsi": 37.02, "macd_diff": -4.83}

## Model Details

- **Algorithm:** XGBoost Classifier
- **Features:** RSI, MACD, MACD Signal, MACD Diff, Bollinger Bands, Volume Delta, FinBERT Sentiment Score
- **Target:** Binary — will stock price rise >1% in next 3 days?
- **Validation:** TimeSeriesSplit (5 folds) — prevents data leakage
- **Tuning:** Optuna with 30 trials optimizing F1 score

## Stocks Covered

RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS, WIPRO.NS
