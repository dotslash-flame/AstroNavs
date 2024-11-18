# AstroNavs

We are going to be creating two Flask applications:
  - Server
  - Clients

The server acts as a channel of communication between each of the clients in the given game room. The clients state their identity via a JSON object:
  - Client: [A, B, C]
  - Game-Room: [101, 102, 103, 104]

The handshake connection with the server allows the server to set the cookie of the client via the above JSON.  
The server will also store the (addr, port) of the client in an in-memory dictionary.
When all clients have connected for a game room, the server asks client C to generate safe co-ordinates.  

The safe co-ordinates are forwarded to client A.  
Once client A receives the safe coordinates, it displays the symbol for the corresponding safe symbols. Client A sends an ack to the server.  
Once the ack is received, the server sends a start game message to client B and client C.  
Client B will start the timer.  
Client C will display the red tint on the grid, for all the unsafe co-ordinates.

# Client A
Client will have the codex displayed and all the safe co-ordinates for the current move.

# Client B
Client B will have the codex displayed (decide whether want to give handout or not).

# Client C
The grid that will be drawn is 16x16  
The ship takes up one co-ordinate (one square).

# Gameplay Loop
The game lasts for 5 minutes.  
The first move lasts for 60 seconds.  
The second move lasts for 45 seconds.  
The third move lasts for 45 seconds.  
The fourth move lasts for 30 seconds.  
The fifth move lasts for 30 seconds.  
The sixth move lasts for 30 seconds.  
The seventh move lasts for 30 seconds.  
The eighth move lasts for 30 seconds.

TODO:  
We have to decide how many safe co-ordinates are there for each move.
The last move only has one safe co-ordinate. Essentially, these are the two ways of ramping up difficulty.

THE CLIENT SERVER INTERACTION

All clients send a request to server's "/connect" endpoint to register their IP and save appropriate cookie.

When server wants to communicate to C that all 3 clients have connected and game can begin, it sends a message to endpoint "/game_start_state" of client C. This is done by sending to the IP address of the client C of a particulr room. If C receives this message, it must respond with a string "Success", no json needed for ease.

When server receives "/add_safe_coordinates/<game_room>" endpoint call from C, it sends the coordinate array [(x, y), ...] to client A at endpoint "/sade_coordinates". Client A must return "Success" (no JSON) for game to end in success. Then server sends to client B a message of the format {"Message" : "Starting"} at endpoint "/game_start" and responds to the API call of C with {"Message" : "Successfully added safe coordinates"}. Game now begins on all 3 clients, with B keeping time.

If the round/game ends successfully, C must send a message of JSON form {"GameState" : "Win"} to server endpoint "/result/win/<game_room>". This JSON is then forwarded by server to client A and client B at endpoint "/game_state". It also sends a string "Successfully communicated results" back to C.

If the timer at B ends, it sends a message of form {"FinalState" : "Loss"} to server at endpoint "/result/loss/<game_room>" . Then this message will be forwarded to clients A and C at endpoint "game_end_loss"
