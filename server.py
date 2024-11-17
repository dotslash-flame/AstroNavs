from flask import Flask, request, jsonify, make_response
import time
import random

# Initialize the Flask app
app = Flask(__name__)

# Initialize dynamic game rooms
game_rooms = {}

# Define move durations in seconds
MOVE_DURATIONS = [60, 45, 45, 30, 30, 30, 30, 30]  # Total: 5 minutes

# Generate safe coordinates for the current move (from Client C)
def generate_safe_coordinates():
    # Generate a list of random safe coordinates, for example:
    return random.sample(range(1, 257), 5)  # Example: 5 safe coordinates randomly selected in a 16x16 grid (1-256)

# Calculate the current move based on elapsed time
def get_current_move(start_time):
    elapsed_time = time.time() - start_time
    total_time = 0

    for index, duration in enumerate(MOVE_DURATIONS):
        total_time += duration
        if elapsed_time < total_time:
            return index + 1  # Moves are 1-indexed
    return len(MOVE_DURATIONS)  # Return the last move if time exceeds

def get_time_remaining(start_time):
    elapsed_time = time.time() - start_time
    total_time = 0

    for duration in MOVE_DURATIONS:
        total_time += duration
        if elapsed_time < total_time:
            return total_time - elapsed_time
    return 0  # Game has ended

# Endpoint to connect a client to a game room
@app.route('/connect', methods=['POST'])
def connect():
    data = request.json
    client = data.get("client")
    game_room = data.get("game_room")

    # Validate input and add client to the game room if there is space
    if not client or not game_room:
        return "Client or game room information missing.", 400

    # Dynamically create game room if it doesn't exist
    if game_room not in game_rooms:
        game_rooms[game_room] = {
            "clients": [],
            "safe_coordinates": None,
            "start_time": time.time(),  # Initialize the game start time
            "move_state": 1,  # First move
            "game_over": False
        }
    
    # Add client to the game room if there is space
    if len(game_rooms[game_room]["clients"]) < 3:
        game_rooms[game_room]["clients"].append(client)
        response = make_response(f"{client} connected to room {game_room}")
        response.set_cookie("client_id", client)
        return response
        
    else:
        return "Game room full.", 400

# Endpoint to acknowledge safe coordinates by Client A
# TODO: write the spec in the README file so that 
#       the clients can work according to your decisions
@app.route('/acknowledge_safe_coordinates/<game_room>', methods=['POST'])
def acknowledge_safe_coordinates(game_room):
    data = request.json
    client = data.get("client")

    # Ensure game room exists and acknowledgment is from Client A
    if game_room in game_rooms and client == 'A' and game_rooms[game_room]["safe_coordinates"]:
        return jsonify({"message": "Start game for Client B and Client C"}), 200
    return "Safe coordinates not acknowledged or not Client A.", 400

# Endpoint to get the current game state for a specific game room
@app.route('/get_game_state/<game_room>', methods=['GET'])
def get_game_state(game_room):
    if game_room in game_rooms:
        room = game_rooms[game_room]
        # Calculate the current move and the remaining time for it
        current_move = get_current_move(room["start_time"])
        time_remaining = get_time_remaining(room["start_time"])
        
        # Return the current game state
        state = {
            "safe_coordinates": room.get("safe_coordinates", None),  # Safe coordinates for the current move
            "clients": room["clients"],  # List of connected clients
            "move_state": current_move,  # The current move number
            "time_remaining": time_remaining,  # Time remaining for the current move
            "game_over": room["game_over"]  # Whether the game is over
        }

        return jsonify(state), 200
    else:
        return "Game room not found.", 404


# Endpoint to get move status (remaining time & current move)
@app.route('/get_move_status/<game_room>', methods=['GET'])
def get_move_status(game_room):
    if game_room in game_rooms:
        room = game_rooms[game_room]
        current_move = get_current_move(room["start_time"])
        time_remaining = get_time_remaining(room["start_time"])
        
        # Check if game is over
        if current_move > len(MOVE_DURATIONS):
            room["game_over"] = True
            return jsonify({"message": "Game Over"}), 200

        return jsonify({
            "current_move": current_move,
            "time_remaining": time_remaining
        }), 200
    else:
        return "Game room not found.", 404


# Polling endpoint for Clients B and C to check if the current move has ended
@app.route('/poll_move_end/<game_room>', methods=['GET'])
def poll_move_end(game_room):
    if game_room in game_rooms:
        room = game_rooms[game_room]
        current_move = get_current_move(room["start_time"])
        time_remaining = get_time_remaining(room["start_time"])

        # If time is up for the current move, proceed to next move
        if time_remaining <= 0:
            # Move has ended, increment move state
            room["move_state"] += 1

            # If all moves are finished, mark the game as over
            if room["move_state"] > len(MOVE_DURATIONS):
                room["game_over"] = True
                return jsonify({
                    "message": "Move ended. Game Over!",
                    "current_move": room["move_state"],
                    "game_over": True
                }), 200

            # Notify clients that the move has ended and the game is transitioning
            return jsonify({
                "message": "Move ended. Transitioning to next move.",
                "current_move": room["move_state"],
                "time_remaining": get_time_remaining(room["start_time"]),
                "game_over": False
            }), 200

        # Otherwise, the move hasn't ended yet
        return jsonify({
            "message": "Move in progress.",
            "time_remaining": time_remaining,
            "current_move": current_move
        }), 200
    else:
        return "Game room not found.", 404


# Endpoint for Client C to send safe coordinates to Client A at the start of each move
@app.route('/send_safe_coordinates/<game_room>', methods=['GET'])
def send_safe_coordinates(game_room):
    if game_room in game_rooms:
        room = game_rooms[game_room]
        current_move = get_current_move(room["start_time"])

        # If the move is starting, generate safe coordinates from Client C
        if current_move > 0 and current_move <= len(MOVE_DURATIONS):
            safe_coordinates = generate_safe_coordinates()

            # Store safe coordinates in the game room
            room["safe_coordinates"] = safe_coordinates

            # Notify Client A with safe coordinates (this is just simulated here)
            return jsonify({
                "message": f"Safe coordinates for move {current_move} sent to Client A.",
                "safe_coordinates": safe_coordinates
            }), 200

        return jsonify({"message": "Invalid move number or game state."}), 400
    else:
        return "Game room not found.", 404
    

# Run the server
if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5101)
