import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src.predict import predict_ticker

app = FastAPI(
    title="FinPulse API",
    description="Real-time stock movement predictor using FinBERT sentiment + technical indicators",
    version="1.0.0"
)

class PredictRequest(BaseModel):
    ticker: str
    sentiment_score: float = 0.5
    sentiment_numeric: float = 0.0

@app.get("/")
def root():
    return {"message": "FinPulse API is running!"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(request: PredictRequest):
    try:
        result = predict_ticker(
            ticker=request.ticker,
            sentiment_score=request.sentiment_score,
            sentiment_numeric=request.sentiment_numeric
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict/{ticker}")
def predict_get(ticker: str):
    try:
        result = predict_ticker(ticker=ticker)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))