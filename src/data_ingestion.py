import os
import yfinance as yf
import pandas as pd
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# NSE tickers use .NS suffix in yfinance
TICKERS = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "WIPRO.NS"]

def fetch_stock_data(ticker: str, period: str = "2y") -> pd.DataFrame:
    """Fetch OHLCV data for a given NSE ticker."""
    print(f"Fetching stock data for {ticker}...")
    df = yf.download(ticker, period=period, auto_adjust=True)
    df.dropna(inplace=True)
    df["Ticker"] = ticker
    return df

def fetch_all_stocks() -> pd.DataFrame:
    """Fetch and combine stock data for all tickers."""
    all_data = []
    for ticker in TICKERS:
        df = fetch_stock_data(ticker)
        all_data.append(df)
    combined = pd.concat(all_data)
    combined.to_csv("data/stock_prices.csv")
    print("✅ Stock data saved to data/stock_prices.csv")
    return combined

def fetch_news(query: str = "Indian stock market", days_back: int = 30) -> pd.DataFrame:
    """Fetch financial news headlines using NewsAPI."""
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        print("⚠️  No NEWS_API_KEY found in .env — skipping news fetch.")
        return pd.DataFrame()

    from_date = (datetime.today() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    url = (
        f"https://newsapi.org/v2/everything?"
        f"q={query}&from={from_date}&language=en&sortBy=publishedAt&apiKey={api_key}"
    )
    response = requests.get(url)
    articles = response.json().get("articles", [])

    records = []
    for a in articles:
        records.append({
            "date": a["publishedAt"][:10],
            "title": a["title"],
            "description": a.get("description", ""),
            "source": a["source"]["name"]
        })

    df = pd.DataFrame(records)
    df.to_csv("data/news_headlines.csv", index=False)
    print(f"✅ {len(df)} news articles saved to data/news_headlines.csv")
    return df

if __name__ == "__main__":
    fetch_all_stocks()
    fetch_news()