import streamlit as st
import requests
import pandas as pd
import plotly.graph_objects as go
import yfinance as yf

API_URL = "http://127.0.0.1:8000"

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

# Sidebar
st.sidebar.header("Settings")
company = st.sidebar.selectbox("Select Stock", list(TICKERS.keys()))
ticker = TICKERS[company]
sentiment_score = st.sidebar.slider("Sentiment Score", 0.0, 1.0, 0.5)
sentiment_label = st.sidebar.radio("Sentiment", ["Positive", "Neutral", "Negative"])
sentiment_numeric = {"Positive": 1.0, "Neutral": 0.0, "Negative": -1.0}[sentiment_label]

# Predict button
if st.sidebar.button("🔮 Predict"):
    with st.spinner("Running model..."):
        try:
            response = requests.post(f"{API_URL}/predict", json={
                "ticker": ticker,
                "sentiment_score": sentiment_score,
                "sentiment_numeric": sentiment_numeric
            })
            result = response.json()

            col1, col2, col3 = st.columns(3)
            signal = result["signal"]
            color = "🟢" if signal == "BUY" else "🟡"
            col1.metric("Signal", f"{color} {signal}")
            col2.metric("Confidence", f"{result['confidence']*100:.1f}%")
            col3.metric("RSI", result["rsi"])

            st.subheader("Technical Indicators")
            col4, col5 = st.columns(2)
            col4.metric("MACD Diff", result["macd_diff"],
                       delta="Bullish" if result["macd_diff"] > 0 else "Bearish")
            col5.metric("Sentiment Input", sentiment_label)

        except Exception as e:
            st.error(f"API error: {e}")

# Price chart
st.subheader(f"{company} — Last 6 Months")
data = yf.download(ticker, period="6mo", auto_adjust=True)
if not data.empty:
    close = data["Close"]
    if hasattr(close, 'squeeze'):
        close = close.squeeze()
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=data.index,
        y=close,
        mode="lines",
        name="Close Price",
        line=dict(color="#00b4d8", width=2)
    ))
    fig.update_layout(
        template="plotly_dark",
        height=400,
        margin=dict(l=0, r=0, t=30, b=0)
    )
    st.plotly_chart(fig, use_container_width=True)