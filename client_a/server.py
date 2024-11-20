from flask import Flask, jsonify, current_app

from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This enables CORS for all routes and origins

# Sample configuration and state for the room and game
app.config["MOVE_DURATIONS"] = [5, 5, 5]  # Example move durations

room = {
    "is_ready": True,
    "is_running": True,
    "safe_coordinates": [(5, 1), (4, 5)],  # Example safe coordinates
    "is_won" : False,
    "current_move" : 0
}


@app.route('/connect', methods=['POST'])
def connect():
    return '', 200

@app.route('/get_game_state/<room_no>', methods=['GET'])
def get_game_state(room_no):
    game_state = {
        "is_ready": room["is_ready"],
        "is_running": room["is_running"],
        "current_move": 2,
        "safe_coordinates": [(10, 2), (11, 13)],
        "game_over": False,
        "is_won" : True
    }
    print(game_state)
    return jsonify(game_state)

@app.route("/set_timer_over/<room_id>")
def set_timer_over(room_id):
    room["is_running"] = False
    return jsonify({"status" : "success"})

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
