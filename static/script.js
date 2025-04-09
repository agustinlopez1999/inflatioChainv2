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

    //load coins
    fetch("/api/v1/coins/list")
        .then(res=> res.json())
        .then(coins => {
            coins.forEach(coin =>{
                const option = document.createElement("option");
                option.value = coin.id;
                option.textContent = `${coin.name} (${coin.symbol.toUpperCase()})`;
                select.appendChild(option);
            });
    
            const bitcoinOption = select.querySelector('option[value="bitcoin"]');
            if (bitcoinOption) {
                select.value = "bitcoin";
                select.dispatchEvent(new Event("change"));
            }
        })
        .catch(error => {
            result.textContent = "ERROR: Couldnt load Coin List"
            console.error(error);
        });


    //user choose coin
    select.addEventListener("change", () => {
        const selectedId = select.value;
        if (!selectedId) return;

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
                setText("coin-symbol", data.symbol?.toUpperCase());
                setText("coin-price", `$${data.price?.toFixed(6)}`);
                setText("coin-marketcap", `$${data.market_cap?.toLocaleString()}`);
                setText("coin-rank", `#${data.market_cap_rank}`);

                setText("coin-ath", `$${data.ath?.toFixed(6)}`);
                setText("coin-ath-change", `${data.ath_change_percentage?.toFixed(2)}%`);
                setText("coin-ath-date", new Date(data.ath_date).toLocaleString());

                setText("coin-emission-percent", `${data.circulating_emission_percentage?.toFixed(2)}%`);
                setText("coin-circulating", data.circulating_supply?.toLocaleString());
                setText("coin-max-supply", data.max_supply?.toLocaleString());
                setText("coin-infinity", data.max_supply_is_infinity ? "Sí" : "No");

                setText("coin-old-price", `$${data.old_price?.toFixed(6)}`);
                setText("coin-old-marketcap", `$${data.old_market_cap?.toLocaleString()}`);
                setText("coin-old-supply", data.old_circulating_supply?.toLocaleString());

                setText("coin-days-since-old", `${data.days_since_old_data} días`);
                setText("coin-historical-note", data.historical_note);

                setText("coin-change-24h", `${data.price_change_percentage_24h?.toFixed(2)}%`);
                setText("coin-change-7d", `${data.price_change_percentage_7d?.toFixed(2)}%`);
                setText("coin-change-14d", `${data.price_change_percentage_14d?.toFixed(2)}%`);
                setText("coin-change-30d", `${data.price_change_percentage_30d?.toFixed(2)}%`);
                setText("coin-change-60d", `${data.price_change_percentage_60d?.toFixed(2)}%`);
                setText("coin-change-1y", `${data.price_change_percentage_1y?.toFixed(2)}%`);

                // Tiempo desde última actualización
                const now = Date.now();
                const updated = data.last_updated * 1000;
                const diffInSeconds = Math.floor((now - updated) / 1000);
                const minutes = Math.floor(diffInSeconds / 60);
                const seconds = diffInSeconds % 60;

                setText("last-update", `Última actualización: hace ${minutes}m ${seconds}s`);
            })
            .catch(error => {
                console.error(error);
                alert("ERROR: Couldn't load Cripto Data");
            });
    });
});