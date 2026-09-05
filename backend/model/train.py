import os
import joblib
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from feature_engineering import prepare_training_dataset

def train_model():
    print("=" * 60)
    print("🚀 WhenTho - Training Multiclass LightGBM Model")
    print("=" * 60)

    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "invoices.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Invoices dataset not found at {data_path}. Run generate_synthetic.py first.")

    raw_df = pd.read_csv(data_path)
    print(f"Loaded {len(raw_df)} records from {data_path}")

    # Prepare feature matrix
    X_df = prepare_training_dataset(raw_df)
    feature_columns = list(X_df.columns)

    # Encode target variable: on_time: 0, late: 1, very_late: 2
    label_mapping = {"on_time": 0, "late": 1, "very_late": 2}
    inverse_label_mapping = {0: "on_time", 1: "late", 2: "very_late"}
    y = raw_df["payment_status"].map(label_mapping).values

    # Train / Test split: 80/20 stratified
    X_train_full, X_test, y_train_full, y_test = train_test_split(
        X_df, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train size: {len(X_train_full)}, Test size: {len(X_test)}")

    # 5-fold Stratified Cross-Validation
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_f1_scores = []

    print("\n--- 5-Fold Stratified Cross-Validation ---")
    for fold, (train_idx, val_idx) in enumerate(skf.split(X_train_full, y_train_full), 1):
        X_tr, y_tr = X_train_full.iloc[train_idx], y_train_full[train_idx]
        X_val, y_val = X_train_full.iloc[val_idx], y_train_full[val_idx]

        clf = lgb.LGBMClassifier(
            objective="multiclass",
            num_class=3,
            n_estimators=180,
            learning_rate=0.04,
            max_depth=6,
            num_leaves=31,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42 + fold,
            verbose=-1
        )
        clf.fit(X_tr, y_tr)
        val_preds = clf.predict(X_val)
        fold_f1 = f1_score(y_val, val_preds, average="weighted")
        cv_f1_scores.append(fold_f1)
        print(f"Fold {fold} Weighted F1 Score: {fold_f1:.4f}")

    mean_cv_f1 = np.mean(cv_f1_scores)
    print(f"\nMean 5-Fold CV Weighted F1 Score: {mean_cv_f1:.4f} (+/- {np.std(cv_f1_scores):.4f})")

    # Fit final model on full training set
    final_model = lgb.LGBMClassifier(
        objective="multiclass",
        num_class=3,
        n_estimators=200,
        learning_rate=0.04,
        max_depth=6,
        num_leaves=31,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        verbose=-1
    )
    final_model.fit(X_train_full, y_train_full)

    # Evaluate on held-out 20% test set
    y_test_pred = final_model.predict(X_test)
    test_weighted_f1 = f1_score(y_test, y_test_pred, average="weighted")

    target_names = ["on_time", "late", "very_late"]
    print("\n--- Held-out Test Set Evaluation ---")
    print(classification_report(y_test, y_test_pred, target_names=target_names))

    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_test_pred))

    print("=" * 60)
    print(f"🎯 FINAL TARGET METRIC (Weighted F1 Score): {test_weighted_f1:.4f}")
    print("=" * 60)

    # Save artifacts
    curr_dir = os.path.dirname(__file__)
    model_path = os.path.join(curr_dir, "model.pkl")
    columns_path = os.path.join(curr_dir, "feature_columns.pkl")
    meta_path = os.path.join(curr_dir, "metadata.pkl")

    joblib.dump(final_model, model_path)
    joblib.dump(feature_columns, columns_path)
    joblib.dump({
        "label_mapping": label_mapping,
        "inverse_label_mapping": inverse_label_mapping,
        "weighted_f1": test_weighted_f1,
        "cv_mean_f1": mean_cv_f1
    }, meta_path)

    print(f"✅ Saved model to: {model_path}")
    print(f"✅ Saved feature columns ({len(feature_columns)}) to: {columns_path}")

    # Generate and save high-res feature importance plot
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        
        plt.figure(figsize=(10, 6), dpi=300)
        importances = final_model.feature_importances_
        sorted_idx = importances.argsort()
        
        plt.barh(range(len(sorted_idx)), importances[sorted_idx], color='#2563eb', edgecolor='#1d4ed8')
        plt.yticks(range(len(sorted_idx)), [feature_columns[i] for i in sorted_idx], fontsize=9)
        plt.xlabel('Feature Importance (Split Count)', fontsize=11, fontweight='bold')
        plt.title('WhenTho — LightGBM Feature Importance (Top Predictors of Payment Friction)', fontsize=12, fontweight='bold', pad=15)
        plt.grid(axis='x', linestyle='--', alpha=0.5)
        plt.tight_layout()
        
        chart_path = os.path.join(curr_dir, "feature_importance.png")
        plt.savefig(chart_path)
        plt.close()
        print(f"✅ Saved feature importance chart to: {chart_path}")
    except Exception as e:
        print(f"Notice: Could not generate feature importance plot ({e})")

if __name__ == "__main__":
    train_model()
