import requests
import sys

def reset_room(room_id):
    try:
        # Assuming the endpoint is on localhost:5000, adjust URL as needed
        response = requests.post(f'http://172.16.148.79:5000/reset_game/{room_id}')
        if response.status_code == 200:
            print(f"Successfully reset room {room_id}")
        else:
            print(f"Failed to reset room {room_id}. Status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error making request: {e}")

def main():
    print("Room Reset Tool - Enter 'reset room_id' to reset a room or 'quit' to exit")
    
    while True:
        command = input("> ").strip().lower()
        
        if command == 'quit':
            print("Exiting...")
            sys.exit(0)
        
        if command.startswith('reset '):
            try:
                room_id = command.split()[1]
                reset_room(room_id)
            except IndexError:
                print("Please provide a room ID. Usage: reset <room_id>")
        else:
            print("Invalid command. Use 'reset <room_id>' or 'quit'")

if __name__ == "__main__":
    main()