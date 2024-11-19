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

current_move = 0

@app.route('/connect', methods=['POST'])
def connect():
    print("Received request")
    return '', 200

@app.route('/get_game_state/<room_no>', methods=['GET'])
def get_game_state(room_no):
    global current_move
    game_state = {
        "is_ready": room["is_ready"],
        "is_running": room["is_running"],
        "current_move": current_move,
        "safe_coordinates": room["safe_coordinates"],
        "game_over": current_move >= len(current_app.config["MOVE_DURATIONS"]),
    }
    return jsonify(game_state)

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)
