import os
import logging
import queue
from logging.handlers import RotatingFileHandler, QueueHandler

log_queue = queue.Queue()


class QueueStreamHandler(logging.Handler):
    def emit(self, record):
        log_queue.put(self.format(record))


def setup_logging(app):
    # Create logs directory if it doesn't exist
    if not os.path.exists(app.config["LOG_DIR"]):
        os.makedirs(app.config["LOG_DIR"])

    # Set up file handler
    file_handler = RotatingFileHandler(
        app.config["LOG_PATH"], maxBytes=1024 * 1024, backupCount=10  # 1MB
    )
    file_handler.setFormatter(logging.Formatter(app.config["LOG_FORMAT"]))
    file_handler.setLevel(app.config["LOG_LEVEL"])

    # Add queue handler for streaming
    queue_handler = QueueStreamHandler()
    queue_handler.setFormatter(logging.Formatter(app.config["LOG_FORMAT"]))
    queue_handler.setLevel(app.config["LOG_LEVEL"])

    # Add both handlers
    for handler in [file_handler, queue_handler]:
        app.logger.addHandler(handler)
        logging.getLogger("werkzeug").addHandler(handler)
