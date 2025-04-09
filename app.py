from flask import Flask, jsonify, render_template
from api_call_script import build_cripto_summary
from collections import OrderedDict
import time, requests

app = Flask(__name__)

#Cache config using OrderedDict
cache = OrderedDict()
SUMMARY_CACHE_TTL = 300 # 5 Minutes TTL for each coin
COIN_LIST_CACHE_TTL = 86400 # 1 Day TTL for complete coin list
CACHE_MAX_SIZE = 501 # Up to 500 coins & 1 coin_list

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/v1/coins/list")
def get_coin_list():
    #save actual time
    now = time.time()

    #if coin_list is already in OrderedDict cache
    if "coin_list" in cache and now - cache["coin_list"]["time"] < COIN_LIST_CACHE_TTL:
        print("** Coin_List was already in cache **")
        return jsonify(cache["coin_list"]["data"])
    
    #coin_list was not in OrderedDict cache
    url_list_per_page = "http://api.coingecko.com/api/v3/coins/markets"

    print("** CALLING API, coin_list WAS NOT in cache **")
    all_coins = []
    for page in range(1,2): # first page only from coingecko (top 250) due to limited API, you can modify the range
        url = url_list_per_page
        params = {
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": 250,
            "page": page
        }
        response = requests.get(url_list_per_page, params=params)


        if response.status_code != 200:
            print(f"[ERROR] Status code {response.status_code} in page {page}")
            return {"error": "couldnt get CoinList from API"}


        coins = response.json()
        all_coins.extend(coins)


    #add to cache with "coin_list" key
    cache["coin_list"] = {"data": all_coins, "time": now}
    if len(cache) > CACHE_MAX_SIZE: #if cache is full
        cache.popitem(last=False) #pop out last item
    print(f"[CACHE] Total elementos en caché: {len(cache)}")
    return jsonify(all_coins)


@app.route("/api/v1/coin/<coin_id>")
def get_coin_summary(coin_id):
    #save actual time
    now = time.time()

    #if coin_id is already in OrderedDict cache
    if coin_id in cache and now - cache[coin_id]["time"] < SUMMARY_CACHE_TTL:
        print("** Coin_id was already in cache **")
        response_data = cache[coin_id]["data"].copy() #temporal copy of "data" in response_data variable
        response_data["last_updated"] = cache[coin_id]["time"] #adding how old is the data we send
        return jsonify(response_data)
    
    #coin_id was not in OrderedDict cache
    print("** CALLING API, coin_id WAS NOT in cache **")
    cripto_data = build_cripto_summary(coin_id) #calling Coingecko API via api_call_script.py

    if "error" not in cripto_data:
        cache[coin_id] = {"data": cripto_data, "time": now}
        if len(cache) > CACHE_MAX_SIZE: #if cache is full
            cache.popitem(last=False) #pop out last item (last=False  => FIFO)
        print(f"[CACHE] Total elementos en caché: {len(cache)}")
    else:
        print(f"{coin_id} was not cached. Error: {cripto_data['error']}")

    response_data = cripto_data.copy() #copy to add last time updated
    response_data["last_updated"] = now
    return jsonify(response_data)

if __name__ == "__main__":
    app.run(debug=True)