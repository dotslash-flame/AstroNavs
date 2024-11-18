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
            room["is_ready"] = True
            room["start_time"] = time.time()
        return True

    def get_game_state(self, room_id: str) -> dict:
        room = self.game_rooms.get(room_id)
        if not room:
            return None

        current_time = time.time()
        elapsed_time = current_time - (room["start_time"] or current_time)

        total_time = 0
        current_move = 0
        for i, duration in enumerate(current_app.config["MOVE_DURATIONS"]):
            total_time += duration
            if elapsed_time <= total_time:
                current_move = i + 1
                break

        return {
            "is_ready": room["is_ready"],
            "is_running": room["is_running"],
            "current_move": current_move,
            "safe_coordinates": room["safe_coordinates"],
            "game_over": current_move >= len(current_app.config["MOVE_DURATIONS"]),
        }
