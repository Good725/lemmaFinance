import flask
from flask import request
from apy import apy


app = flask.Flask(__name__)


@app.route("/get_apy_inception", methods=["GET"])
def get_apy_inception() -> dict:
    df = apy.read_dataframe_from_csv("data/funding_rates.csv")
    return apy.generate_apy_inception(df)


@app.route("/get_apy_date", methods=["GET"])
def get_apy_date() -> dict:
    date = request.args.get("date")
    initial_amount = float(request.args.get("amount"))
    df = apy.read_dataframe_from_csv("data/funding_rates.csv")
    apy_by_date, _ = apy.generate_statistics_by_date(df, date, initial_amount)
    return apy_by_date


@app.route("/get_statistics", methods=["GET"])
def get_statistics() -> dict:
    date = request.args.get("date")
    initial_amount = float(request.args.get("amount"))
    df = apy.read_dataframe_from_csv("data/funding_rates.csv")
    _, statistics = apy.generate_statistics_by_date(df, date, initial_amount)
    return statistics


@app.route("/tvl", methods=["GET"])
def get_tvl() -> dict:
    return None


if __name__ == "__main__":
    app.run(host="0.0.0.0")
