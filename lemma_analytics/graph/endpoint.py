from datetime import datetime
import flask
from flask import request
from apy import apy


app = flask.Flask(__name__)

@app.route("/")
def index() -> str:
    return "Lemma Analytics Endpoint"


@app.route("/get_apy_inception", methods=["GET"])
def get_apy_inception() -> dict:
    df = apy.read_dataframe_from_csv("data/funding_rates.csv")
    apy_inception = apy.generate_apy_inception(df)
    apy_inception["timestamp"] = datetime.now().timestamp()
    return apy_inception


@app.route("/get_apy_date", methods=["GET"])
def get_apy_date() -> dict:
    timestamp = int(request.args.get("timestamp"))
    initial_amount = float(request.args.get("amount"))
    df = apy.read_dataframe_from_csv("data/funding_rates.csv")
    apy_by_date, _ = apy.generate_statistics_by_date(df, timestamp, initial_amount)
    apy_by_date["timestamp"] = datetime.now().timestamp()
    return apy_by_date


@app.route("/get_statistics", methods=["GET"])
def get_statistics() -> dict:
    timestamp = int(request.args.get("timestamp"))
    initial_amount = float(request.args.get("amount"))
    df = apy.read_dataframe_from_csv("data/funding_rates.csv")
    _, statistics = apy.generate_statistics_by_date(df, timestamp, initial_amount)
    statistics["timestamp"] = datetime.now().timestamp()
    return statistics


if __name__ == "__main__":
    app.run(host="0.0.0.0")
