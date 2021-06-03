## Data
### funding_rates.py
* Ideally, this script would be run as a cron job every minute.
* It stores all the funding rates for ETH/USDC since Jan 1 00:00:00 GMT as a csv file
* This csv is later used by other modules to generate APY statistics

## APY
### apy.py
#### read_dataframe_from_csv()
* Takes the csv file containing the funding rates and returns a Pandas DF
#### generate_apy_inception()
* Returns the APY since the inception of Lemma. Date currently set as mentioned above.

#### generate_statistics_by_date()
* On giving it the initial date of investment and the ETH deposited, returns all the statistics.
* First return dictionary contains the APY and ROI details.
* The second return dictionary contains the Pandas DataFrame that depicts the value/metrics of the investment after every funding rate. Can be used to generate the graph.

## Endpoint
#### get_apy_inception()
* Returns the APY since the inception of Lemma. Date currently set as mentioned above. No arguments.
* Usage - get_apy_inception
#### get_apy_date()
* Returns APY and ROI. Takes initial deposit amount and date as input.
* Usage - get_apy_date?timestamp=1111111111&amount=1
#### get_statistics()
* Returns state of investment after every funding rate. Takes initial deposit amount and date as input.
* Can be used to generate graphs showing investment and how it grew over time.
* Usage - get_statistics?timestamp=1111111111&amount=1

## Server
* Runs on an NGINX/uWSGI/Flask