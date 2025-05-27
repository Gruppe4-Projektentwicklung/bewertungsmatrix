from flask import Flask, render_template, request
import pandas as pd
import os
import json

app = Flask(__name__, static_folder='static', template_folder='templates')

def lade_ideen():
    return pd.read_excel("daten/ideen.xlsx")

def lade_metriken():
    print("📁 Versuche zu laden:", os.path.abspath("daten/metriken.xlsx"))
    df = pd.read_excel("daten/metriken.xlsx")
    metriken = []
    for _, row in df.iterrows():
        metriken.append({
            "id": str(row.get("ID")),
            "titel": row.get("Kombinationstitel"),
            "formel": row.get("Formel"),
            "beschreibung": row.get("Beschreibung"),
            "einheit": row.get("Einheit", "")
        })
    return metriken

@app.route("/")
def index():
    metriken = lade_metriken()
    print("🔍 Geladene Metriken:", metriken)  # Debug-Ausgabe
    return render_template("bewertung.html", metriken=metriken)

@app.route("/bewerten", methods=["POST"])
def bewerten():
    gewichtungen = request.json.get("gewichtungen")
    ideen = lade_ideen()
    metriken = lade_metriken()
    ergebnisse = []

    for _, idee in ideen.iterrows():
        score = 0
        gesamtgewicht = 0
        kombi_ergebnisse = []
        for metrik in metriken:
            wid = metrik["id"]
            if wid in gewichtungen:
                w = gewichtungen[wid]
                if w == 0:
                    continue
                try:
                    formel = metrik["formel"]
                    context = idee.to_dict()
                    wert = eval(formel, {}, context)
                    score += wert * w
                    gesamtgewicht += w
                    kombi_ergebnisse.append({
                        "titel": metrik["titel"],
                        "wert": round(wert, 2),
                        "gewichtung": w,
                        "einheit": metrik.get("einheit", "")
                    })
                except:
                    continue
        ergebnisse.append({
            "idee": idee.get("Name", "Unbenannt"),
            "score": round(score / gesamtgewicht, 2) if gesamtgewicht > 0 else 0,
            "kombis": sorted(kombi_ergebnisse, key=lambda x: -x["gewichtung"])
        })
    ergebnisse.sort(key=lambda x: -x["score"])
    return json.dumps(ergebnisse)

if __name__ == "__main__":
    app.run(debug=True)
