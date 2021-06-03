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
    DATE = request.args.get("date")
    initial_amount = float(request.args.get("amount"))
    df = apy.read_dataframe_from_csv("data/funding_rates.csv")
    return apy.generate_statistics_by_date(df, DATE, initial_amount)


@app.route("/tvl", methods=["GET"])
def get_tvl() -> dict:
    return None


app.run()
