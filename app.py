from flask import Flask, jsonify, render_template
from api_call_script import build_cripto_summary

app = Flask(__name__)

@app.route("/front/main")
def index():
    return render_template("index.html")

@app.route("/api/v1/coins/list")
def get_coin_list():
    pass


@app.route("/api/v1/coin/<coin_id>")
def get_coin_summary(coin_id):
    data = build_cripto_summary(coin_id)
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)