import time
from flask import current_app


class GameRoomManager:
    def __init__(self):
        self.game_rooms: dict[str, dict] = {}

    def create_room(self, room_id: str) -> dict:
        if room_id not in self.game_rooms:
            self.game_rooms[room_id] = {
                "clients": {},
                "safe_coordinates": None,
                "is_ready": False,
                "is_running": False,
                "start_time": None,
                "current_move": 0,
                "game_over": False,
                "is_won" : False 
            }
        return self.game_rooms[room_id]

    def add_client(
        self, room_id: str, client: str, client_ip: str, client_port: str
    ) -> bool:
        room = self.game_rooms.get(room_id)
        if not room or len(room["clients"]) >= 3:
            return False

        room["clients"][client] = (client_ip, client_port)
        if len(room["clients"]) == 3:
            print("Room is ready")
            room["is_ready"] = True
            room["start_time"] = time.time()
        return True

    def reset_room(self, room_id: str):
        if room_id in self.game_rooms:
           self.game_rooms[room_id] = {
                "clients": {},
                "safe_coordinates": None,
                "is_ready": False,
                "is_running": False,
                "start_time": None,
                "current_move": 0,
                "game_over": False,
                "is_won" : False 
            }

    def get_game_state(self, room_id: str) -> dict:
        room = self.game_rooms.get(room_id)
        if not room:
            return None
        # let c just say what round it is when it sends coordinates
        return {
            "is_ready": room["is_ready"],
            "is_running": room["is_running"],
            "current_move": room["current_move"],
            "safe_coordinates": room["safe_coordinates"],
            "game_over": room["game_over"],
            "is_won" : room["is_won"],
            "start_time" : room["start_time"]
        }
