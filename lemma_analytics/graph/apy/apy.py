import time
from typing import Union
import pandas as pd

# Input Date Format - 1619000000
# TODO (@vineetred): Make the function modular
def generate_statistics_by_date(
    df: pd.DataFrame, timestamp: int, initial_amount: float, interval: str = "H"
) -> Union[dict, dict]:
    # Set the date of investment
    df.index = pd.to_datetime(df["date"])
    # Get the nearest funding rate
    date_buff = df.iloc[
        df.index.get_loc(
            pd.to_datetime(
                time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(timestamp))
            ),
            method="nearest",
        )
    ]["date"]
    # Get the date
    DATE = pd.to_datetime(date_buff)
    # Set the investment amount (in ETH)
    INITIAL_AMOUNT = initial_amount
    # Buying ETH at spot on DATE
    ETH_PRICE = float(df[df["date"] == DATE]["underlyingPrice"])
    TOTAL_USD = INITIAL_AMOUNT * ETH_PRICE
    # This USDC is now moved to Perpetual Finance
    TIME_PERIOD = DATE - df.iloc[-1]["date"]

    funding_payment = 0
    TOTAL_FUNDING = 0
    TOTAL_ETH = INITIAL_AMOUNT
    statistics = []

    # We go through every funding rate update
    for index, row in df[df["date"] >= DATE].iterrows():
        # Compute the funding rate payment
        # ETH present at that point * rate
        funding_payment = TOTAL_ETH * row["rate"]
        # Reinvest by increasing ETH balance
        TOTAL_ETH -= funding_payment
        # Update funding total
        TOTAL_FUNDING -= funding_payment
        statistics.append(
            {
                "FUNDING_PAYMENT": funding_payment,
                "TOTAL_ETH": TOTAL_ETH,
                "TOTAL_FUNDING": TOTAL_FUNDING,
                # The value of ETH using our startegy
                "USD_VALUE_LEMMA": row["underlyingPrice"] * TOTAL_ETH,
                # Value of ETH as is
                "USD_VALUE_ETH": INITIAL_AMOUNT * row["underlyingPrice"],
                "ROI": (TOTAL_ETH - INITIAL_AMOUNT) / (INITIAL_AMOUNT),
                "DATE": row["date"],
            }
        )

    # Compute total ETH gain
    ETH_GAIN = TOTAL_ETH - INITIAL_AMOUNT
    # ROI on ETH gain
    ROI_ETH = ETH_GAIN / (INITIAL_AMOUNT)

    # Sort dataframe by Date
    statistics = pd.DataFrame(statistics).sort_values("DATE")

    # Check for interval and process data accordingly

    if interval == "D":
        statistics = (
            statistics.groupby(pd.Grouper(key="DATE", freq="D")).sum().reset_index()
        )
    statistics["DATE"] = statistics["DATE"].astype("int64") // 10 ** 9

    # Converting the dataframe into a dict
    statistics = statistics.to_dict()

    # Adding the APY
    statistics["APY"] = ((1 + ROI_ETH) ** (12 / (abs(TIME_PERIOD.days) / 30)) - 1) * 100

    return (
        {
            "START_ETH": INITIAL_AMOUNT,
            "END_ETH": TOTAL_ETH,
            "ETH_Gain": ETH_GAIN,
            "ROI": ROI_ETH * 100,
            "APY": ((1 + ROI_ETH) ** (12 / (abs(TIME_PERIOD.days) / 30)) - 1) * 100,
            "TIME": abs(TIME_PERIOD.days),
        },
        statistics,
    )


# Get APY since inception
def generate_apy_inception(df: pd.DataFrame) -> dict:
    GENESIS_TIME = 1622505600
    inception_apy, _ = generate_statistics_by_date(df, GENESIS_TIME, 1)
    return inception_apy


def read_dataframe_from_csv(filepath: str) -> pd.DataFrame:
    df = pd.read_csv(filepath)
    df["date"] = pd.to_datetime(df["timestamp"], unit="s")
    return df
