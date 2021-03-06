#!/usr/bin/env python3
import datetime
import pandas as pd
import requests


# Helper Functions
def create_options(query: str, skip_iterator: int) -> str:
    return query.replace("skip_param", str(skip_iterator))


# Get Funding Rates
def get_funding_rates() -> list:
    trades = []
    query = '{"query":"{\\n fundingRateUpdatedEvents(first: 1000, orderBy: timestamp, orderDirection: desc, where : {timestamp_lt : \\"skip_param\\", amm : \\"0x8d22F1a9dCe724D8c1B4c688D75f17A2fE2D32df\\"}) {\\n id\\n amm\\n rate\\n underlyingPrice\\n timestamp\\n }\\n}\\n","variables":null}'

    headers = {
        "authority": "api.thegraph.com",
        "content-type": "application/json",
        "accept": "*/*",
        "origin": "https://thegraph.com",
        "sec-fetch-site": "same-site",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://thegraph.com/",
        "accept-language": "en-US,en;q=0.9",
    }

    # Getting current time
    timestamp = int(datetime.datetime.now().timestamp())
    # 1609459200 == Jan 1 00:00:00 GMT
    # Running till timestamp reaches the above time
    while timestamp > 1609459200:
        data = create_options(query, timestamp)
        response = requests.post(
            "https://api.thegraph.com/subgraphs/name/perpetual-protocol/perp-position-subgraph",
            headers=headers,
            data=data,
        ).json()["data"]["fundingRateUpdatedEvents"]
        trades.append(response)
        # Get the last record's datetime and update
        # the timestamp value
        timestamp = int(response[-1]["timestamp"])

    # Flatten and return
    return [item for sublist in trades for item in sublist]

# TODO (@vineetred): Clean up type casting
def get_dataframe(flat_list: list) -> pd.DataFrame:
    # Convert it into a Pandas DataFrame
    df = pd.DataFrame(flat_list)
    df["date"] = pd.to_datetime(df["timestamp"], unit="s")
    # Normalising funding rate and ETH spot price
    df["rate"] = df["rate"].astype(float)
    df["rate"] = df["rate"] / 10 ** 18
    df["underlyingPrice"] = df["underlyingPrice"].astype(float)
    df["underlyingPrice"] = df["underlyingPrice"] / 10 ** 18
    # Sorting by date
    df = df.sort_values("date", ascending=True)
    return df


def main():
    # Get funding rates
    funding_rates_buff = get_funding_rates()
    # Converting it into a DF
    funding_rates = get_dataframe(funding_rates_buff)
    # Save CSV
    funding_rates.to_csv("/home/nginx/lemma/lemma_analytics/graph/data/funding_rates.csv")
    print(datetime.datetime.now())



if __name__ == "__main__":
    main()
