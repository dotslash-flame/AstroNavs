import queue
from flask import Flask, render_template, Response
from .utils import setup_logging, log_queue

def create_app(config_object=None):
    app = Flask(__name__)
    
    if config_object:
        app.config.from_object(config_object)

    # Setup logging
    setup_logging(app)

    # Register blueprints
    from .game import game_bp
    app.register_blueprint(game_bp)

    @app.route("/logs")
    def get_logs():
        return render_template("logs.html")

    @app.route("/logs/stream")
    def stream_logs():
        def generate():
            while True:
                try:
                    log_entry = log_queue.get(timeout=1)
                    yield f"data: {log_entry}\n\n"
                except queue.Empty:
                    yield f"data: \n\n"  # Keep-alive

        return Response(generate(), mimetype="text/event-stream")

    return app


# factory function to have one shared instance across the module
def create_game_manager():
    from .models import GameRoomManager
    return GameRoomManager()