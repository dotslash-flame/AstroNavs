from flask import Flask, request, jsonify, make_response
import aiohttp
#import socket
import json

app= Flask(__name__)
game_rooms = {}

possible_clients = ["A".lower(), "B".lower(), "C".lower()]

@app.route('/connect', methods=['POST'])
def connect():
    data=request.json

    client_ip = request.remote_addr

    client_port = request.environ.get("REMOTE_PORT")

    client= data.get("client")
    if client == None:
        return "Missing argument 'client'", 400
    
    if client.lower() not in possible_clients:
        return f"Client must be in {possible_clients}", 400

    game_room=data.get("game_room")
    if game_room == None:
        return "Missing argument 'game_room'", 400
    

    if game_room in game_rooms and len(game_room) == 3:
        return "Game room is full, please wait for one game room to end before trying again", 400
    
        
    game_rooms[game_room] = {"clients" : {}, "Safe Coordinates" : None, "IsReady" : False}

    if client in game_rooms[game_room]["clients"]:
        return "Client already exists in game room, please disconnect existing client", 400
    
    game_rooms[game_room]["clients"][client] = (client_ip, client_port)

    if len(game_rooms[game_room]["clients"]) == 3:
        game_rooms[game_room]["IsReady"] = True

        ready_data = {
            "GameState" : "Ready"
        }

        ready_data_json = json.dumps(ready_data)

        if not send_data_to_client(game_rooms[game_room]["clients"]["c"][0], "game_start_state", ready_data_json) == "Success":
            return "Error informing C that game is ready", 500

    response_data = {
        "Message" : f"{client} connected to room {game_room} at IP : {game_rooms[game_room]['clients'][client][0]} and port {game_rooms[game_room]['clients'][client][1]}",
    }

    response = jsonify(response_data)

    response.set_cookie("client", client)
    return response

@app.route('/add_safe_coordinates/<game_room>', methods = ['Post'])
def add_safe_coordinates(game_room : str):
    
    client = request.cookies.get("client")

    if client != "C".lower():
        return {"Message" : "Only a connected client C can send a request"}
    
    data = request.json

    safe_coordinates = data.get("safe_coordinates")

    if not safe_coordinates:
        return "Missing required 'safe_coordinates' key", 400
    
    if len(safe_coordinates) == 0:
        return "At least 1 element must be present", 400
    
    if game_room not in game_rooms:
        return {"Message" : "No such game room found"}

    if not game_rooms[game_room]["IsReady"]:
        return "Game room is not in ready state yet", 500

    game_rooms[game_room]["Safe Coordinates"] = safe_coordinates

    data = {"Coordinates" : safe_coordinates, "Message" : "Successfully received safe coordinates"}
    json_data = json.dumps(data)

    if send_data_to_client(game_rooms[game_room]["clients"]["a"][0], "safe_coordinates", json_data) == "Success":

        message = {
            "Message" : "Starting"
        }

        message = json.dumps(message)

        game_rooms[game_room]["IsRunning"] = True
        if not send_data_to_client(game_rooms[game_room]["clients"]["b"][0], "game_start", message):
            return "Could not connect to client b", 500

        return {"Message" : "Successfully added safe coordinates"}, 200
    
    return "Could not send data to client a", 500

#Receives acknowledgment from Client A about receiving safe coordinates

async def send_data_to_client(ip, endpoint, data):
    host = ip
    port = 5000 #Make use of standardized port or make it customizable via command line       

    url = f"http://{host}:{port}/{endpoint}"

    async with aiohttp.ClientSession() as session:
        async with session.post(url, data) as response:
            if response.ok:
                return await response.json()
            else:
                return False


@app.route('/acknowledge_safe_coordinates/<game_room>', methods= ['POST'])
def acknowledge_safe_coordinates(game_room):
    data= request.json
    client= data.get("client")
        #Checks that the acknowledgment comes from Client A and that safe coordinates exist.
    if client=='A' and game_rooms[game_room]["safe_coordinates"]:
        return jsonify({"message": "Start game for Client B and Client C"}), 200 #Sends a "Start game" message to Client B and Client C if the conditions are met.
    return "Safe coordinates not acknowledged or not Client A.", 400

@app.route('/get_game_state/<game_room>',methods=['GET']) #Retrieves the current game state for a specific game room and  links the URL /get_game_state/<game_room> to the function get_game_state.
def get_game_state(game_room):
    if game_room in game_rooms: #Checks if the room exists.
        state={
            "safe_coordinates": game_rooms[game_room]["safe_coordinates"],
            "clients": game_rooms[game_room]["clients"].keys()
        }
        return jsonify(state), 200
    else:
        return "Game room not found.", 404

@app.route("/result/win/<game_room>", methods=["POST"])
def send_game_win_result(game_room):
    client = request.cookies.get("client")

    if client != "C".lower():
        return {"Message" : "Only a connected client C can send a request"}
    
    data = request.json

    if game_room not in game_rooms:
        return {"Message" : "No such game room found"}

    if not game_rooms[game_room]["IsReady"]:
        return "Game room is not in ready state yet", 500
    
    result = data.get("GameState")

    if result not in ['Win', "Continue"]:
        return "Some error occurred, please send correct game state", 500
    
    result = {
        "GameState" : result
    }

    if not send_data_to_client(game_rooms[game_room]["clients"]["b"][0], "game_state", result):
        return "Could not connect to client b", 500
        
    if not send_data_to_client(game_rooms[game_room]["clients"]["a"][0], "game_state", result):
        return "Could not connect to client a", 500
    
    return "Successfully communicated results", 200

@app.route("/result/loss/<game_room>", methods=["POST"])
def send_game_loss_result(game_room):
    client = request.cookies.get("client")

    if client != "B".lower():
        return {"Message" : "Only a connected client B can send a request"}
    
    data = request.json

    if game_room not in game_rooms:
        return {"Message" : "No such game room found"}

    if not game_rooms[game_room]["IsReady"]:
        return "Game room is not in ready state yet", 500
    
    result = data.get("FinalState")

    if not result == "Loss":
        return "Some error occurred, please send correct game state", 500
    
    result = {
        "FinalState" : result
    }

    if not send_data_to_client(game_rooms[game_room]["clients"]["a"][0], "game_end_loss", result):
        return "Could not connect to client a", 500
        
    if not send_data_to_client(game_rooms[game_room]["clients"]["c"][0], "game_end_loss", result):
        return "Could not connect to client c", 500
    
    return "Successfully communicated results", 200
#run the server


if __name__ =='__main__':
    app.run(debug=True)