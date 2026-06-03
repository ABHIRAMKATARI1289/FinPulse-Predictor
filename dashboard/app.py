import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import yfinance as yf
import joblib
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

FEATURE_COLS = [
    "rsi", "macd", "macd_signal", "macd_diff",
    "bb_upper", "bb_lower", "bb_width", "volume_delta",
    "avg_sentiment_score", "avg_sentiment_numeric", "article_count"
]

TICKERS = {
    "Reliance Industries": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "Infosys": "INFY.NS",
    "HDFC Bank": "HDFCBANK.NS",
    "Wipro": "WIPRO.NS"
}

st.set_page_config(page_title="FinPulse", page_icon="📈", layout="wide")
st.title("📈 FinPulse — Stock Movement Predictor")
st.caption("Powered by FinBERT Sentiment + XGBoost + Technical Indicators")

@st.cache_resource
def load_model():
    return joblib.load("models/xgb_model.pkl")

@st.cache_data
def get_stock_features(ticker):
    import ta
    df = yf.download(ticker, period="2y", auto_adjust=True)
    df.dropna(inplace=True)
    close = df["Close"].squeeze()
    volume = df["Volume"].squeeze()
    result = pd.DataFrame(index=df.index)
    result["close"] = close
    result["rsi"] = ta.momentum.RSIIndicator(close=close, window=14).rsi()
    macd = ta.trend.MACD(close=close)
    result["macd"] = macd.macd()
    result["macd_signal"] = macd.macd_signal()
    result["macd_diff"] = macd.macd_diff()
    bb = ta.volatility.BollingerBands(close=close, window=20)
    result["bb_upper"] = bb.bollinger_hband()
    result["bb_lower"] = bb.bollinger_lband()
    result["bb_width"] = bb.bollinger_wband()
    result["volume_delta"] = volume.pct_change()
    result = result.replace([np.inf, -np.inf], np.nan).dropna()
    return result, close

# Sidebar
st.sidebar.header("Settings")
company = st.sidebar.selectbox("Select Stock", list(TICKERS.keys()))
ticker = TICKERS[company]
sentiment_score = st.sidebar.slider("Sentiment Score", 0.0, 1.0, 0.5)
sentiment_label = st.sidebar.radio("Sentiment", ["Positive", "Neutral", "Negative"])
sentiment_numeric = {"Positive": 1.0, "Neutral": 0.0, "Negative": -1.0}[sentiment_label]

if st.sidebar.button("🔮 Predict"):
    with st.spinner("Running model..."):
        try:
            model = load_model()
            tech_df, close = get_stock_features(ticker)
            latest = tech_df.iloc[-1].copy()
            latest["avg_sentiment_score"] = sentiment_score
            latest["avg_sentiment_numeric"] = sentiment_numeric
            latest["article_count"] = 1

            X = pd.DataFrame([latest[FEATURE_COLS]])
            prediction = model.predict(X)[0]
            probability = model.predict_proba(X)[0]
            confidence = round(float(max(probability)), 4)
            signal = "BUY" if prediction == 1 else "HOLD"

            col1, col2, col3 = st.columns(3)
            color = "🟢" if signal == "BUY" else "🟡"
            col1.metric("Signal", f"{color} {signal}")
            col2.metric("Confidence", f"{confidence*100:.1f}%")
            col3.metric("RSI", round(float(latest["rsi"]), 2))

            st.subheader("Technical Indicators")
            col4, col5 = st.columns(2)
            col4.metric("MACD Diff", round(float(latest["macd_diff"]), 4),
                       delta="Bullish" if latest["macd_diff"] > 0 else "Bearish")
            col5.metric("Sentiment Input", sentiment_label)

        except Exception as e:
            st.error(f"Error: {e}")

# Price chart
st.subheader(f"{company} — Last 6 Months")
data = yf.download(ticker, period="6mo", auto_adjust=True)
if not data.empty:
    close = data["Close"].squeeze()
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=data.index, y=close,
        mode="lines", name="Close Price",
        line=dict(color="#00b4d8", width=2)
    ))
    fig.update_layout(template="plotly_dark", height=400,
                     margin=dict(l=0, r=0, t=30, b=0))
    st.plotly_chart(fig, width="stretch")