import pandas as pd
import ta

def load_stock_data() -> pd.DataFrame:
    df = pd.read_csv("data/stock_prices.csv", header=[0, 1], index_col=0)
    df.index = pd.to_datetime(df.index)
    return df

def add_technical_indicators(df: pd.DataFrame, ticker: str) -> pd.DataFrame:
    """Add RSI, MACD, Bollinger Bands and volume delta for a single ticker."""
    close = df["Close"][ticker]
    volume = df["Volume"][ticker]

    result = pd.DataFrame(index=df.index)
    result["close"] = close
    result["volume"] = volume
    result["ticker"] = ticker

    # RSI — measures if stock is overbought or oversold (0-100)
    result["rsi"] = ta.momentum.RSIIndicator(close=close, window=14).rsi()

    # MACD — trend following indicator
    macd = ta.trend.MACD(close=close)
    result["macd"] = macd.macd()
    result["macd_signal"] = macd.macd_signal()
    result["macd_diff"] = macd.macd_diff()

    # Bollinger Bands — volatility indicator
    bb = ta.volatility.BollingerBands(close=close, window=20)
    result["bb_upper"] = bb.bollinger_hband()
    result["bb_lower"] = bb.bollinger_lband()
    result["bb_width"] = bb.bollinger_wband()

    # Volume delta — % change in volume day over day
    result["volume_delta"] = volume.pct_change()

    # Price return over next 3 days — this is our TARGET variable
    result["future_return"] = close.pct_change(-3)  # negative = look forward
    result["target"] = (result["future_return"] > 0.01).astype(int)  # 1 if price goes up >1%

    return result

def merge_sentiment(tech_df: pd.DataFrame) -> pd.DataFrame:
    """Merge daily sentiment scores into the technical indicator dataframe."""
    sentiment_df = pd.read_csv("data/news_sentiment.csv")
    sentiment_df["date"] = pd.to_datetime(sentiment_df["date"])

    # Aggregate sentiment per day — average score, and map label to number
    label_map = {"positive": 1, "neutral": 0, "negative": -1}
    sentiment_df["sentiment_numeric"] = sentiment_df["sentiment_label"].map(label_map)

    daily_sentiment = sentiment_df.groupby("date").agg(
        avg_sentiment_score=("sentiment_score", "mean"),
        avg_sentiment_numeric=("sentiment_numeric", "mean"),
        article_count=("title", "count")
    ).reset_index()

    tech_df = tech_df.reset_index()
    tech_df["Date"] = pd.to_datetime(tech_df["Date"])
    merged = pd.merge(tech_df, daily_sentiment, left_on="Date", right_on="date", how="left")
    merged.fillna({"avg_sentiment_score": 0.5, "avg_sentiment_numeric": 0, "article_count": 0}, inplace=True)
    return merged

def build_features() -> pd.DataFrame:
    """Main function — builds full feature set for all tickers."""
    TICKERS = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "WIPRO.NS"]
    df = load_stock_data()
    all_features = []

    for ticker in TICKERS:
        print(f"Building features for {ticker}...")
        tech_df = add_technical_indicators(df, ticker)
        merged = merge_sentiment(tech_df)
        all_features.append(merged)

    final_df = pd.concat(all_features, ignore_index=True)
    technical_cols = ["rsi", "macd", "macd_signal", "macd_diff", 
                  "bb_upper", "bb_lower", "bb_width", "volume_delta", "target"]
    final_df.dropna(subset=technical_cols, inplace=True)
    final_df.to_csv("data/features.csv", index=False)
    print(f"✅ Features saved to data/features.csv — {len(final_df)} rows, {len(final_df.columns)} columns")
    return final_df

if __name__ == "__main__":
    df = build_features()
    print("\nFeature columns:", list(df.columns))
    print("\nTarget distribution:")
    print(df["target"].value_counts())