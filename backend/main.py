# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import os
import pandas as pd
import numpy as np
import uvicorn

app = FastAPI(title="Manufacturing Analytics API", version="3.0")

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Data config (single Excel source)
# -----------------------------
DATA_DIR = os.environ.get("DATA_DIR", ".")
EXCEL_PATH = os.environ.get("EXCEL_PATH", os.path.join(DATA_DIR, "batch_details.xlsx"))
SHEET_NAME = os.environ.get("SHEET_NAME", "GME_BATCH_WIP")

# Columns used across all endpoints (superset)
REQUIRED_COLS = [
    # Core identifiers / grouping
    "WIP_PERIOD_NAME", "WIP_BATCH_STATUS", "WIP_LOT_NUMBER", "PRODUCT_TYPE",

    # Quantities
    "PLAN_QTY", "ORIGINAL_QTY", "WIP_QTY", "SCRAP_QTY",

    # Costs
    "STANDARD_COST", "ACTUAL_COST",

    # Timing / delays
    "START_TIME", "END_TIME", "DELAY_REASON",

    # Material / changes
    "MATERIAL_CODE", "QTY_CHANGE", "CHANGE_TIME",

    # Replacements
    "REPLACEMENT_FLAG", "REASON", "EXTRA_COST",
]

# Type hints for coercion
NUMERIC_COLS = [
    "PLAN_QTY", "ORIGINAL_QTY", "WIP_QTY", "SCRAP_QTY",
    "STANDARD_COST", "ACTUAL_COST", "QTY_CHANGE",
    "REPLACEMENT_FLAG", "EXTRA_COST", "WIP_VALUE", "WIP_RATE", "SCRAP_FACTOR"
]
DATETIME_COLS = ["START_TIME", "END_TIME", "CHANGE_TIME", "WIP_ACT_START_DATE", "WIP_CMPLT_DATE"]

# -----------------------------
# Data loading
# -----------------------------
_cached_df: pd.DataFrame = None  # simple in-process cache; restart/refresh to reload
def to_records(df: pd.DataFrame):
    # Ensure all NaN, NaT, inf values are converted to None
    safe_df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
    return safe_df.to_dict(orient="records")

def load_data() -> pd.DataFrame:
    global _cached_df
    if _cached_df is not None:
        return _cached_df

    if not os.path.exists(EXCEL_PATH):
        # Return empty frame with all expected columns so endpoints still respond consistently
        df = pd.DataFrame(columns=REQUIRED_COLS)
    else:
        try:
            df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME)
        except Exception:
            # If sheet not found or read fails, return empty with required columns
            df = pd.DataFrame(columns=REQUIRED_COLS)

    # Ensure all required columns exist
    for c in REQUIRED_COLS:
        if c not in df.columns:
            df[c] = np.nan

    # Coerce datetimes
    for c in DATETIME_COLS:
        df[c] = pd.to_datetime(df[c], errors="coerce")

    # Coerce numerics
    for c in NUMERIC_COLS:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    # Normalize some text columns to string where helpful
    for c in ["WIP_PERIOD_NAME", "WIP_BATCH_STATUS", "WIP_LOT_NUMBER", "PRODUCT_TYPE", "DELAY_REASON", "MATERIAL_CODE", "REASON"]:
        df[c] = df[c].astype("string").where(~df[c].isna(), None)

    _cached_df = df
    return _cached_df

def to_records(df: pd.DataFrame) -> List[Dict]:
    if df is None or df.empty:
        return []
    return df.replace({np.nan: None}).to_dict(orient="records")

def _duration_hours(start: pd.Series, end: pd.Series) -> pd.Series:
    return (end - start).dt.total_seconds() / 3600.0

def _bucketize(values: pd.Series, bins: List[float], labels: List[str]) -> pd.Series:
    return pd.cut(values, bins=bins, labels=labels, include_lowest=True, right=False)

# -----------------------------
# ORIGINAL (kept) ENDPOINTS
# -----------------------------
@app.get("/scrap-factor")
def scrap_factor():
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["scrap_factor"] = np.where(tmp["WIP_QTY"] > 0, tmp["SCRAP_QTY"] / tmp["WIP_QTY"], 0.0)
    res = (
        tmp.groupby("WIP_PERIOD_NAME", dropna=False)["scrap_factor"]
           .mean()
           .reset_index()
           .rename(columns={"scrap_factor":"avg_scrap_factor"})
    )
    return to_records(res)

@app.get("/quantity-variance")
def quantity_variance():
    df = load_data()
    if df.empty:
        return []
    agg = (
        df.groupby("WIP_PERIOD_NAME", dropna=False)
          .agg(total_plan_qty=("PLAN_QTY","sum"),
               total_wip_qty=("WIP_QTY","sum"),
               total_original_qty=("ORIGINAL_QTY","sum"))
          .reset_index()
    )
    return to_records(agg)

@app.get("/delays")
def delays():
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["duration_h"] = _duration_hours(tmp["START_TIME"], tmp["END_TIME"])
    med = tmp.groupby("WIP_PERIOD_NAME", dropna=False)["duration_h"].median().rename("median_duration_h")
    tmp = tmp.merge(med, on="WIP_PERIOD_NAME", how="left")
    tmp["is_delayed"] = (tmp["duration_h"] > tmp["median_duration_h"]).fillna(False)
    out = (
        tmp.groupby("WIP_PERIOD_NAME", dropna=False)
           .agg(total_batches=("WIP_LOT_NUMBER","count"),
                delayed_batches=("is_delayed", lambda s: int(s.sum())))
           .reset_index()
    )
    return to_records(out)


@app.get("/delay-reasons")
def delay_reasons():
    df = load_data()
    if df.empty:
        return []

    # Ensure column name consistency
    df.columns = df.columns.str.strip().str.upper()

    if "DELAY_REASON" not in df.columns:
        return [{"error": "DELAY_REASON column not found in data"}]

    # Clean the values and replace NaN with 'Unknown'
    df["DELAY_REASON"] = df["DELAY_REASON"].fillna("Unknown").astype(str).str.strip()

    res = (
        df.groupby(["WIP_PERIOD_NAME", "DELAY_REASON"], dropna=False)
        .size()
        .reset_index(name="count")
    )
    return to_records(res)


@app.get("/cost-variance")
def cost_variance():
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["cost_variance"] = (tmp["ACTUAL_COST"] - tmp["STANDARD_COST"]).fillna(0)
    out = (
        tmp.groupby("WIP_PERIOD_NAME", dropna=False)
           .agg(total_standard_cost=("STANDARD_COST","sum"),
                total_actual_cost=("ACTUAL_COST","sum"),
                total_cost_variance=("cost_variance","sum"))
           .reset_index()
    )
    return to_records(out)


@app.get("/raw-material-changes")
def raw_material_changes():
    df = load_data()
    if df.empty:
        return []

    # Normalize column names
    df.columns = df.columns.str.strip().str.upper()

    if "QTY_CHANGE" not in df.columns:
        return [{"error": "QTY_CHANGE column not found"}]

    # Convert to numeric safely
    df["QTY_CHANGE"] = pd.to_numeric(df["QTY_CHANGE"], errors="coerce").fillna(0)

    out = (
        df.groupby(["WIP_PERIOD_NAME", "WIP_BATCH_STATUS", "WIP_LOT_NUMBER"], dropna=False)
        .agg(total_qty_change=("QTY_CHANGE", "sum"))
        .reset_index()
    )

    return to_records(out)


@app.get("/replacement-identification")
def replacement_identification():
    df = load_data()
    if df.empty:
        return []
    # Prefer REASON if present; otherwise infer from REPLACEMENT_FLAG
    if df["REASON"].notna().any():
        src = df["REASON"].copy()
    else:
        # Map 1/True -> "Replacement", 0/False/NaN -> "None/Unknown"
        flag = df["REPLACEMENT_FLAG"].fillna(0).astype(float)
        src = np.where(flag > 0, "Replacement", None)

    tmp = df.copy()
    tmp["REASON_EFF"] = src
    res = (
        tmp.dropna(subset=["REASON_EFF"])
           .groupby("REASON_EFF", dropna=False)
           .size()
           .reset_index(name="count")
           .rename(columns={"REASON_EFF":"REASON"})
    )
    return to_records(res)

# -----------------------------
# NEW ENDPOINTS (single-source)
# -----------------------------
# == Production Performance ==
@app.get("/batch-throughput-trend")
def batch_throughput_trend():
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["is_completed"] = tmp["WIP_BATCH_STATUS"].str.lower().eq("completed")
    out = (
        tmp.groupby("WIP_PERIOD_NAME", dropna=False)["is_completed"]
           .sum()
           .reset_index(name="batches_completed")
    )
    return to_records(out)

@app.get("/average-batch-duration")
def average_batch_duration():
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["duration_h"] = _duration_hours(tmp["START_TIME"], tmp["END_TIME"])
    out = (
        tmp.groupby("WIP_PERIOD_NAME", dropna=False)["duration_h"]
           .mean()
           .reset_index()
           .rename(columns={"duration_h":"avg_duration_hours"})
    )
    return to_records(out)

@app.get("/bottleneck-batches")
def bottleneck_batches(top_n: int = 20):
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["duration_h"] = _duration_hours(tmp["START_TIME"], tmp["END_TIME"])
    tmp = tmp.sort_values("duration_h", ascending=False).head(top_n)
    cols = ["WIP_PERIOD_NAME","WIP_LOT_NUMBER","PRODUCT_TYPE","WIP_BATCH_STATUS","duration_h","DELAY_REASON"]
    tmp = tmp[cols].rename(columns={"duration_h":"duration_hours"})
    return to_records(tmp)

# == Quality & Waste ==
@app.get("/scrap-rate-trend")
def scrap_rate_trend():
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["scrap_rate"] = np.where(tmp["WIP_QTY"] > 0, tmp["SCRAP_QTY"]/tmp["WIP_QTY"], 0.0)
    out = (
        tmp.groupby("WIP_PERIOD_NAME", dropna=False)["scrap_rate"]
           .mean()
           .reset_index()
           .rename(columns={"scrap_rate":"avg_scrap_rate"})
    )
    return to_records(out)

@app.get("/top-scrap-contributors")
def top_scrap_contributors(top_n: int = 10):
    df = load_data()
    if df.empty:
        return []
    out = (
        df.groupby("PRODUCT_TYPE", dropna=False)["SCRAP_QTY"]
          .sum()
          .reset_index()
          .rename(columns={"SCRAP_QTY":"total_scrap_qty"})
          .sort_values("total_scrap_qty", ascending=False)
          .head(top_n)
    )
    return to_records(out)


import math


@app.get("/scrap-delay-correlation")
def scrap_delay_correlation():
    df = load_data()
    if df.empty:
        return []

    tmp = df.copy()
    tmp["duration_h"] = _duration_hours(tmp["START_TIME"], tmp["END_TIME"])
    tmp["scrap_rate"] = np.where(tmp["WIP_QTY"] > 0, tmp["SCRAP_QTY"] / tmp["WIP_QTY"], np.nan)

    overall = tmp[["duration_h", "scrap_rate"]].dropna()
    overall_r = float(overall["duration_h"].corr(overall["scrap_rate"])) if len(overall) > 2 else None

    by_period = (
        tmp.groupby("WIP_PERIOD_NAME", dropna=False)
        .apply(lambda g: pd.Series({
            "n": int(g[["duration_h", "scrap_rate"]].dropna().shape[0]),
            "pearson_r": float(g["duration_h"].corr(g["scrap_rate"])) if g[["duration_h", "scrap_rate"]].dropna().shape[
                                                                             0] > 2 else None
        }))
        .reset_index()
    )

    out = [{"scope": "overall", "pearson_r": overall_r}]
    out += by_period.rename(columns={"WIP_PERIOD_NAME": "scope"}).to_dict(orient="records")

    # Convert NaN to None for JSON serialization
    for record in out:
        for key, value in record.items():
            if isinstance(value, float) and math.isnan(value):
                record[key] = None

    return out


# == Cost & Efficiency ==
@app.get("/cost-overrun-frequency")
def cost_overrun_frequency():
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["overrun"] = (tmp["ACTUAL_COST"] > tmp["STANDARD_COST"]).fillna(False)
    out = (
        tmp.groupby("WIP_PERIOD_NAME", dropna=False)
           .agg(overrun_count=("overrun", lambda s: int(s.sum())),
                total_batches=("WIP_LOT_NUMBER","count"))
           .reset_index()
    )
    return to_records(out)

@app.get("/cost-variance-by-product")
def cost_variance_by_product():
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["cost_variance"] = (tmp["ACTUAL_COST"] - tmp["STANDARD_COST"]).fillna(0)
    out = (
        tmp.groupby(["WIP_PERIOD_NAME","PRODUCT_TYPE"], dropna=False)["cost_variance"]
           .sum()
           .reset_index()
           .rename(columns={"cost_variance":"total_cost_variance"})
    )
    return to_records(out)

@app.get("/cost-efficiency-index")
def cost_efficiency_index():
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["cei"] = np.where(tmp["ACTUAL_COST"] > 0, tmp["STANDARD_COST"]/tmp["ACTUAL_COST"], np.nan)
    out = (
        tmp.groupby("WIP_PERIOD_NAME", dropna=False)["cei"]
           .mean()
           .reset_index()
           .rename(columns={"cei":"avg_cost_efficiency_index"})
    )
    return to_records(out)

# == Planning Accuracy ==
@app.get("/forecast-accuracy")
def forecast_accuracy():
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["abs_pct_err"] = np.where(tmp["PLAN_QTY"] > 0, np.abs(tmp["WIP_QTY"] - tmp["PLAN_QTY"]) / tmp["PLAN_QTY"], np.nan)
    out = (
        tmp.groupby("WIP_PERIOD_NAME", dropna=False)["abs_pct_err"]
           .mean()
           .reset_index()
           .rename(columns={"abs_pct_err":"mape"})
    )
    return to_records(out)

@app.get("/variance-hotspots")
def variance_hotspots(top_n: int = 10):
    df = load_data()
    if df.empty:
        return []
    tmp = df.copy()
    tmp["qty_variance"] = (tmp["WIP_QTY"] - tmp["PLAN_QTY"]).fillna(0)
    out = (
        tmp.groupby(["WIP_PERIOD_NAME","PRODUCT_TYPE"], dropna=False)["qty_variance"]
           .sum()
           .reset_index()
           .rename(columns={"qty_variance":"total_qty_variance"})
           .assign(abs_variance=lambda d: d["total_qty_variance"].abs())
           .sort_values(["WIP_PERIOD_NAME","abs_variance"], ascending=[True, False])
    )
    if top_n:
        out = out.groupby("WIP_PERIOD_NAME", group_keys=False).head(top_n).drop(columns=["abs_variance"])
    else:
        out = out.drop(columns=["abs_variance"])
    return to_records(out)





@app.get("/replacement-cost-impact")
def replacement_cost_impact():
    df = load_data()
    if df.empty:
        return []
    b = df.copy()
    b["cost_variance"] = (b["ACTUAL_COST"] - b["STANDARD_COST"]).fillna(0)
    # Prefer explicit REASON when provided; if not, infer bucket from REPLACEMENT_FLAG
    reason = b["REASON"]
    if reason.isna().all():
        flag = b["REPLACEMENT_FLAG"].fillna(0).astype(float)
        reason = pd.Series(np.where(flag > 0, "Replacement", None), index=b.index, name="REASON")

    merged = b.assign(REASON_EFF=reason)
    out = (
        merged.dropna(subset=["REASON_EFF"])
              .groupby("REASON_EFF", dropna=False)
              .agg(events=("REASON_EFF","count"),
                   avg_cost_variance=("cost_variance","mean"),
                   avg_extra_cost=("EXTRA_COST","mean"))
              .reset_index()
              .rename(columns={"REASON_EFF":"REASON"})
    )
    return to_records(out)



@app.get("/correlation-matrix")
def correlation_matrix():
    """
    Returns a correlation matrix for key numeric fields in the batch dataset.
    Useful for identifying how metrics like quantity, scrap, and costs are related.
    """
    df = load_data()

    # Calculate delay days (so we can include it in correlations)
    df["delay_days"] = (df["WIP_CMPLT_DATE"] - df["WIP_ACT_START_DATE"]).dt.days

    # Pick numeric columns to analyze
    numeric_cols = ["PLAN_QTY", "WIP_QTY", "SCRAP_FACTOR", "WIP_VALUE", "WIP_RATE", "delay_days"]
    df_numeric = df[numeric_cols]

    # Compute correlation matrix
    corr_matrix = df_numeric.corr()

    # Return as a list of dicts for frontend compatibility
    return corr_matrix.reset_index().rename(columns={"index": "metric"}).to_dict(orient="records")


@app.get("/scrap-delay-correlation")
def scrap_delay_correlation():
    df = load_data()
    # Calculate delay in days
    df["delay_days"] = (df["WIP_CMPLT_DATE"] - df["WIP_ACT_START_DATE"]).dt.days
    # Group by period and batch status
    results = []
    for (period, status), group in df.groupby(["WIP_PERIOD_NAME", "WIP_BATCH_STATUS"]):
        if group["SCRAP_FACTOR"].nunique() > 1 and group["delay_days"].nunique() > 1:
            correlation = group["SCRAP_FACTOR"].corr(group["delay_days"])
        else:
            correlation = None
        results.append({
            "WIP_PERIOD_NAME": period,
            "WIP_BATCH_STATUS": status,
            "scrap_delay_correlation": correlation
        })
    return results

@app.get("/cost-overrun-frequency")
def cost_overrun_frequency():
    df = load_data()
    df["standard_cost"] = df["PLAN_QTY"] * df["WIP_RATE"]
    df["cost_overrun"] = df["WIP_VALUE"] > df["standard_cost"]
    result = df.groupby(["WIP_PERIOD_NAME", "WIP_BATCH_STATUS"]).agg(
        total_batches=("WIP_BATCH_ID", "nunique"),
        cost_overrun_batches=("cost_overrun", "sum")
    ).reset_index().to_dict(orient="records")
    return result
@app.get("/cost-variance-by-product")
def cost_variance_by_product():
    df = load_data()
    df["standard_cost"] = df["PLAN_QTY"] * df["WIP_RATE"]
    df["cost_variance"] = df["standard_cost"] - df["WIP_VALUE"]
    result = df.groupby(["PRODUCT_TYPE"]).agg(
        total_standard_cost=("standard_cost", "sum"),
        total_actual_cost=("WIP_VALUE", "sum"),
        total_cost_variance=("cost_variance", "sum")
    ).reset_index().to_dict(orient="records")
    return result

@app.get("/forecast-accuracy")
def forecast_accuracy():
    df = load_data()
    # Forecast accuracy = 1 - (|Forecast - Actual| / Forecast)
    df["forecast_accuracy"] = 1 - (abs(df["PLAN_QTY"] - df["WIP_QTY"]) / df["PLAN_QTY"])
    result = df.groupby(["WIP_PERIOD_NAME", "WIP_BATCH_STATUS"]).agg(
        avg_forecast_accuracy=("forecast_accuracy", "mean")
    ).reset_index().to_dict(orient="records")
    return result
@app.get("/variance-hotspots")
def variance_hotspots(threshold: float = 0.15):
    df = load_data()
    # Variance ratio = (Actual - Planned) / Planned
    df["variance_ratio"] = (df["WIP_QTY"] - df["PLAN_QTY"]) / df["PLAN_QTY"]
    # Keep only entries exceeding the threshold
    hotspots = df[df["variance_ratio"].abs() > threshold]
    result = hotspots.groupby(["WIP_PERIOD_NAME", "WIP_BATCH_STATUS"]).size().reset_index(name="count")
    return result.to_dict(orient="records")




@app.get("/scrap-delay-correlation")
def scrap_delay_correlation():
    df = load_data()
    df["delay_days"] = (df["WIP_CMPLT_DATE"] - df["WIP_ACT_START_DATE"]).dt.days
    correlation = df["SCRAP_FACTOR"].corr(df["delay_days"])
    return {"scrap_delay_correlation": correlation}

@app.get("/cost-delay-correlation")
def cost_delay_correlation():
    df = load_data()
    # Calculate delay days
    df["delay_days"] = (df["WIP_CMPLT_DATE"] - df["WIP_ACT_START_DATE"]).dt.days
    # Calculate cost variance
    df["standard_cost"] = df["PLAN_QTY"] * df["WIP_RATE"]
    df["cost_variance"] = df["standard_cost"] - df["WIP_VALUE"]
    # Keep only numeric columns needed for correlation
    corr_value = df[["delay_days", "cost_variance"]].corr().iloc[0, 1]
    return {"cost_delay_correlation": corr_value}

@app.get("/planqty-scrap-correlation")
def planqty_scrap_correlation():
    df = load_data()
    # Ensure numeric data
    df = df[pd.to_numeric(df["PLAN_QTY"], errors="coerce").notna()]
    df = df[pd.to_numeric(df["SCRAP_FACTOR"], errors="coerce").notna()]
    # Calculate correlation
    corr_value = df[["PLAN_QTY", "SCRAP_FACTOR"]].corr().iloc[0, 1]
    return {"planqty_scrap_correlation": corr_value}

@app.get("/scrapfactor-costvariance-correlation")
def scrapfactor_costvariance_correlation():
    df = load_data()
    # Ensure numeric columns
    df = df[pd.to_numeric(df["SCRAP_FACTOR"], errors="coerce").notna()]
    df = df[pd.to_numeric(df["PLAN_QTY"], errors="coerce").notna()]
    df = df[pd.to_numeric(df["WIP_RATE"], errors="coerce").notna()]
    df = pd.DataFrame(df)  # Ensure DataFrame type

    # Calculate cost variance
    df["standard_cost"] = df["PLAN_QTY"] * df["WIP_RATE"]
    df = df[pd.to_numeric(df["WIP_VALUE"], errors="coerce").notna()]
    df["cost_variance"] = df["standard_cost"] - df["WIP_VALUE"]

    # Correlation
    corr_value = df[["SCRAP_FACTOR", "cost_variance"]].corr().iloc[0, 1]
    return {"scrapfactor_costvariance_correlation": corr_value}

@app.get("/delay-costvariance-correlation")
def delay_costvariance_correlation():
    df = load_data()

    # Ensure date columns are datetime
    df["WIP_ACT_START_DATE"] = pd.to_datetime(df["WIP_ACT_START_DATE"], errors="coerce")
    df["WIP_CMPLT_DATE"] = pd.to_datetime(df["WIP_CMPLT_DATE"], errors="coerce")

    # Calculate delay days
    df["delay_days"] = (df["WIP_CMPLT_DATE"] - df["WIP_ACT_START_DATE"]).dt.days

    # Ensure numeric columns for cost variance calculation
    df = df[pd.to_numeric(df["PLAN_QTY"], errors="coerce").notna()]
    df = df[pd.to_numeric(df["WIP_RATE"], errors="coerce").notna()]
    df = df[pd.to_numeric(df["WIP_VALUE"], errors="coerce").notna()]

    # Calculate cost variance
    df["standard_cost"] = df["PLAN_QTY"] * df["WIP_RATE"]
    df["cost_variance"] = df["standard_cost"] - df["WIP_VALUE"]

    # Drop rows with missing values in relevant columns
    df = df.dropna(subset=["delay_days", "cost_variance"])

    # Calculate correlation
    corr_value = df[["delay_days", "cost_variance"]].corr().iloc[0, 1]

    return {"delay_costvariance_correlation": corr_value}


@app.get("/throughput-scrap-correlation")
def throughput_scrap_correlation():
    df = load_data()

    # Ensure date columns are datetime
    df["WIP_ACT_START_DATE"] = pd.to_datetime(df["WIP_ACT_START_DATE"], errors="coerce")
    df["WIP_CMPLT_DATE"] = pd.to_datetime(df["WIP_CMPLT_DATE"], errors="coerce")

    # Calculate throughput (qty per day)
    df["processing_time_days"] = (df["WIP_CMPLT_DATE"] - df["WIP_ACT_START_DATE"]).dt.total_seconds() / 86400
    df = df[df["processing_time_days"] > 0]  # avoid division by zero
    df["throughput"] = df["PLAN_QTY"] / df["processing_time_days"]

    # Ensure scrap factor is numeric
    df = df[pd.to_numeric(df["SCRAP_FACTOR"], errors="coerce").notna()]

    # Calculate correlation
    corr_value = df[["throughput", "SCRAP_FACTOR"]].corr().iloc[0, 1]

    return {"throughput_scrap_correlation": corr_value}

# -----------------------------
# App runner
# -----------------------------
if __name__ == "__main__":
    # Example: uvicorn main:app --reload
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
