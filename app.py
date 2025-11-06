from flask import Flask, request, jsonify
from flask_cors import CORS
from diet_ai import generate_diet_plan, calculate_tdee, macro_targets

app = Flask(__name__)
CORS(app)  # allows frontend (port 5500) to connect to backend (port 5000)

@app.route('/')
def home():
    return jsonify({"message": "NutriTrack AI Backend is running ✅"})

@app.route('/api/plan', methods=['POST'])
def create_plan():
    data = request.json
    if not data:
        return jsonify({"error": "No input data"}), 400

    try:
        tdee = calculate_tdee(data)
        macros = macro_targets(tdee, data)
        plan = generate_diet_plan(data, tdee)

        return jsonify({
            "tdee": round(tdee, 2),
            "macros": macros,
            "plan": plan
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
