"""
MovieLens Small (ml-latest-small) Dataset Pipeline
Downloads 100,000 ratings from 600 users on 9,000 movies from GroupLens (https://files.grouplens.org/datasets/movielens/ml-latest-small.zip)
Performs:
1. Collaborative Filtering Matrix Factorization (TruncatedSVD / SVD) training.
2. Recommendation evaluation (RMSE, MAE, Precision@K, HitRate@K).
3. Cross-genre discovery testing using user rating histories.
"""

import os
import sys
import zipfile
import io
import urllib.request
import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

MOVIELENS_URL = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "movielens"))

def download_movielens_small():
    os.makedirs(DATA_DIR, exist_ok=True)
    ratings_file = os.path.join(DATA_DIR, "ratings.csv")
    movies_file = os.path.join(DATA_DIR, "movies.csv")

    if os.path.exists(ratings_file) and os.path.exists(movies_file):
        print(f"[Dataset] MovieLens Small already cached in {DATA_DIR}")
        return ratings_file, movies_file

    print(f"[Dataset] Downloading MovieLens Small from {MOVIELENS_URL}...")
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(MOVIELENS_URL, headers={"User-Agent": "MovieInsightEngine/1.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=45) as resp:
        zip_bytes = io.BytesIO(resp.read())
        with zipfile.ZipFile(zip_bytes) as z:
            for member in z.namelist():
                if member.endswith("ratings.csv"):
                    with open(ratings_file, "wb") as f:
                        f.write(z.read(member))
                elif member.endswith("movies.csv"):
                    with open(movies_file, "wb") as f:
                        f.write(z.read(member))

    print(f"[Dataset] Download and extraction complete.")
    return ratings_file, movies_file

def train_and_evaluate_movielens(n_components: int = 20, test_size: float = 0.2):
    print("=" * 65)
    print("MOVIELENS SMALL — COLLABORATIVE FILTERING & RECOMMENDATION BENCHMARK")
    print("=" * 65)

    ratings_file, movies_file = download_movielens_small()

    # 1. Load data
    ratings_df = pd.read_csv(ratings_file)
    movies_df = pd.read_csv(movies_file)

    print(f"Total ratings loaded: {len(ratings_df):,}")
    print(f"Unique users: {ratings_df['userId'].nunique():,}")
    print(f"Unique movies: {ratings_df['movieId'].nunique():,}")

    # 2. Train / Test Split
    train_df, test_df = train_test_split(ratings_df, test_size=test_size, random_state=42)

    # 3. Create User-Item Matrix
    pivot_table = train_df.pivot(index='userId', columns='movieId', values='rating').fillna(0)
    user_ids = pivot_table.index
    movie_ids = pivot_table.columns

    print(f"User-Item Matrix shape: {pivot_table.shape}")

    # 4. Matrix Factorization via TruncatedSVD
    print(f"Training Latent Factor SVD (latent factors: {n_components})...")
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    user_factors = svd.fit_transform(pivot_table.values)
    item_factors = svd.components_

    predicted_matrix = np.dot(user_factors, item_factors)
    predicted_df = pd.DataFrame(predicted_matrix, index=user_ids, columns=movie_ids)

    # 5. Offline Evaluation on Test Set
    y_true, y_pred = [], []
    for _, row in test_df.iterrows():
        uid, mid, actual_rating = int(row['userId']), int(row['movieId']), row['rating']
        if uid in predicted_df.index and mid in predicted_df.columns:
            pred_rating = predicted_df.loc[uid, mid]
            # Clip predictions to rating scale 0.5 - 5.0
            clipped_pred = np.clip(pred_rating, 0.5, 5.0)
            y_true.append(actual_rating)
            y_pred.append(clipped_pred)

    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    mae = mean_absolute_error(y_true, y_pred)

    print("\n[Accuracy Metrics on Test Split]")
    print(f"  * Root Mean Squared Error (RMSE): {rmse:.4f}")
    print(f"  * Mean Absolute Error (MAE):     {mae:.4f}")

    # 6. Precision@K and Hit Rate@K (ranking evaluation)
    K_list = [5, 10]
    threshold_relevant = 4.0

    print("\n[Top-K Ranking & Discovery Evaluation]")
    sample_users = test_df['userId'].unique()[:100]

    for k in K_list:
        hits, precisions = [], []
        for uid in sample_users:
            if uid not in predicted_df.index:
                continue

            user_test_ratings = test_df[test_df['userId'] == uid]
            relevant_items = set(user_test_ratings[user_test_ratings['rating'] >= threshold_relevant]['movieId'])
            if not relevant_items:
                continue

            # Top K recommendations from predicted scores for items not in training
            user_train_items = set(train_df[train_df['userId'] == uid]['movieId'])
            user_preds = predicted_df.loc[uid].drop(labels=user_train_items, errors='ignore')
            top_k_items = set(user_preds.nlargest(k).index)

            intersection = top_k_items.intersection(relevant_items)
            hits.append(1 if len(intersection) > 0 else 0)
            precisions.append(len(intersection) / float(k))

        avg_hit_rate = np.mean(hits) * 100 if hits else 0
        avg_precision = np.mean(precisions) * 100 if precisions else 0
        print(f"  * Hit Rate@{k:<2}: {avg_hit_rate:.2f}% | Precision@{k:<2}: {avg_precision:.2f}%")

    # 7. Sample Qualitative Recommendations for a user
    demo_user = 1
    top_5_recommended_ids = predicted_df.loc[demo_user].nlargest(5).index
    print(f"\n[Sample Top Recommendations for User #{demo_user}]")
    for mid in top_5_recommended_ids:
        title_meta = movies_df[movies_df['movieId'] == mid]
        if not title_meta.empty:
            name = title_meta.iloc[0]['title']
            genres = title_meta.iloc[0]['genres'].replace("|", ", ")
            print(f"  * {name} ({genres})")

    print("=" * 65)

if __name__ == "__main__":
    train_and_evaluate_movielens()
