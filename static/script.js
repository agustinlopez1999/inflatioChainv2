let updateInterval = null;
let lastDataTimestamp = null;
let currentCoinId = null;

document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("coin-select");

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? "N/A";
    };

    const setImage = (id, url) => {
        const el = document.getElementById(id);
        if (el && url) el.src = url;
    };

    const oldDaysElems = document.getElementsByClassName("coin-days-since-old");
    for (const el of oldDaysElems) {
        el.textContent = `${data.days_since_old_data} días`;
    }

    //format price base on the decimals they have
    const formatPrice = (price) => {
        if(price >= 1){
            return `$ ${price.toFixed(2)}`;
        }
        else{
            if(price >= 0.01){
                return `$ ${price.toFixed(4)}`;
            }
            else{{
                return `$ ${price.toFixed(6)}`;
            }}
        }
    }

    //define maxSupply or infinite
    const maxSupply = (max_supply, max_supply_is_infinity) => {
        if(max_supply_is_infinity)
            return `Infinite`;
        else{{
            return `${max_supply?.toLocaleString()}`;
        }}
    }

    //cell color base on % change
    const setChange = (id, value) => {
        const el = document.getElementById(id);
        if (!el || value == null || value === undefined) return;

        const num = parseFloat(value);
        el.textContent = `${num.toFixed(2)}%`;

        el.classList.remove("positive","negative");

        if(num > 0){
            el.classList.add("positive");
        } else if (num < 0) {
            el.classList.add("negative");
        }

    }

    //format marketcap
    const formatMarketCap = (value) => {
        if (value == null || isNaN(value)) return "N/A";
    
        const num = Number(value);
        const trillion = 1e12;
        const billion = 1e9;
        const million = 1e6;
    
        let suffix = "";
        let formatted = "";
    
        if (num >= trillion) {
            formatted = (num / trillion).toFixed(2);
            suffix = "T";
        } else if (num >= billion) {
            formatted = (num / billion).toFixed(2);
            suffix = "B";
        } else if (num >= million) {
            formatted = (num / million).toFixed(2);
            suffix = "M";
        } else {
            formatted = num.toLocaleString();
        }
    
        return `$${formatted}${suffix ? " " + suffix : ""}`;
    };
    


    //load coins
    const input = document.getElementById("coin-select");
    const datalist = document.getElementById("coin-list");

    let coinMap = new Map();

    
fetch("/api/v1/coins/list")
    .then(res => res.json())
    .then(coins => {
        coins.forEach(coin => {
            const option = document.createElement("option");
            option.value = coin.id;
            option.label = `${coin.name} (${coin.symbol.toUpperCase()})`;
            datalist.appendChild(option);
            coinMap.set(coin.id, coin.id);
        });

        input.value = "bitcoin";
        input.dispatchEvent(new Event("change"));
    })
    .catch(error => {
        console.error(error);
    });


    //user choose coin
    select.addEventListener("change", () => {
        const selectedId = input.value.trim().toLowerCase();
        if (!coinMap.has(selectedId)) {
        alert("Invalid coin ID. Please select from the list.");
        return;
    }

        currentCoinId = selectedId;

        setText("coin-name", "Cargando...");
        setText("last-update", "");

        fetch(`/api/v1/coin/${selectedId}`)
            .then(res => res.json())
            .then(data => {
                console.log("OBTAINED DATA:", data);

                if (data.error) {
                    alert(`Error desde la API: ${data.error}`);
                    return;
                }

                setImage("coin-image", data.image_large);

                setText("coin-name", data.name);
                setText("coin-symbol", `(${data.symbol?.toUpperCase()})`);
                setText("coin-price", formatPrice(data.price));
                setText("coin-marketcap", formatMarketCap(data.market_cap));
                setText("coin-rank", `#${data.market_cap_rank}  `);

                setText("coin-ath", formatPrice(data.ath));
                setText("coin-ath-change", `${data.ath_change_percentage?.toFixed(2)}%`);
                setText("coin-ath-date", new Date(data.ath_date).toLocaleString());

                setText("coin-emission-percent", `${data.circulating_emission_percentage?.toFixed(2)}%`);
                setText("coin-circulating", `${data.circulating_supply?.toLocaleString()} ${data.symbol?.toUpperCase()}`);
                setText("coin-max-supply", maxSupply(data.max_supply,data.max_supply_is_infinity));
                setText("coin-infinity", data.max_supply_is_infinity ? "Sí" : "No");

                setText("coin-old-price", formatPrice(data.old_price));
                setText("coin-old-marketcap", formatMarketCap(data.old_market_cap));
                setText("coin-old-supply", data.old_circulating_supply?.toLocaleString());

                setText("coin-days-since-old", `Data from ${data.days_since_old_data} days ago`);
                setText("coin-historical-note", data.historical_note);

                setChange("coin-change-24h", data.price_change_percentage_24h);
                setChange("coin-change-7d", data.price_change_percentage_7d);
                setChange("coin-change-14d", data.price_change_percentage_14d);
                setChange("coin-change-30d", data.price_change_percentage_30d);

                setText("coin-change-60d", `${data.price_change_percentage_60d?.toFixed(2)}%`);
                setText("coin-change-1y", `${data.price_change_percentage_1y?.toFixed(2)}%`);

                // Tiempo desde última actualización
                lastDataTimestamp = data.last_updated * 1000; // timestamp real de la API

            if (updateInterval) clearInterval(updateInterval);

            updateInterval = setInterval(() => {
                const now = Date.now();
                const diffInSeconds = Math.floor((now - lastDataTimestamp) / 1000);
                const minutes = Math.floor(diffInSeconds / 60);
                const seconds = diffInSeconds % 60;

                setText("last-update", `Última actualización: hace ${minutes}m ${seconds}s`);

                // Si pasaron 5 minutos, recargar datos automáticamente SOLO si sigue en la misma cripto
                if (diffInSeconds >= 300) {
                    clearInterval(updateInterval);
                    setText("last-update", "🔄 Actualizando...");
                    if (select.value === currentCoinId) {
                        fetch(`/api/v1/coin/${currentCoinId}`)
                            .then(res => res.json())
                            .then(newData => {
                                select.dispatchEvent(new Event("change")); 
                            });
                    }
                }
            }, 1000);


            })
            .catch(error => {
                console.error(error);
                alert("ERROR: Couldn't load Cripto Data");
            });
    });
});