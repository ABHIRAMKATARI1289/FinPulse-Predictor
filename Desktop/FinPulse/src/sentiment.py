from transformers import pipeline
import pandas as pd

# Load FinBERT - a BERT model fine-tuned specifically on financial text
print("Loading FinBERT model...")
sentiment_pipeline = pipeline(
    "text-classification",
    model="ProsusAI/finbert",
    tokenizer="ProsusAI/finbert"
)

def get_sentiment(text: str) -> dict:
    """Run FinBERT on a single piece of text."""
    if not text or text.strip() == "":
        return {"label": "neutral", "score": 0.0}
    
    # FinBERT max input is 512 tokens — truncate long text
    text = text[:512]
    result = sentiment_pipeline(text)[0]
    return result  # returns {"label": "positive/negative/neutral", "score": 0.87}

def analyze_news_sentiment(csv_path: str = "data/news_headlines.csv") -> pd.DataFrame:
    """Run FinBERT on all headlines and save sentiment scores."""
    df = pd.read_csv(csv_path)
    print(f"Running FinBERT on {len(df)} headlines...")

    sentiments = []
    for i, row in df.iterrows():
        text = str(row["title"]) + " " + str(row.get("description", ""))
        result = get_sentiment(text)
        sentiments.append({
            "date": row["date"],
            "title": row["title"],
            "source": row["source"],
            "sentiment_label": result["label"],
            "sentiment_score": round(result["score"], 4)
        })
        if (i + 1) % 10 == 0:
            print(f"  Processed {i+1}/{len(df)} articles...")

    sentiment_df = pd.DataFrame(sentiments)
    sentiment_df.to_csv("data/news_sentiment.csv", index=False)
    print("✅ Sentiment scores saved to data/news_sentiment.csv")
    return sentiment_df

if __name__ == "__main__":
    df = analyze_news_sentiment()
    print("\nSample output:")
    print(df.head())
    print("\nSentiment distribution:")
    print(df["sentiment_label"].value_counts())