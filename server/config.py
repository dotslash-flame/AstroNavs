import os


class Config:
    DEBUG = False
    TESTING = False
    MOVE_DURATIONS = [60, 45, 45, 30, 30, 30, 30, 30]
    VALID_CLIENTS = ["a", "b", "c"]
    LOG_DIR = "logs"
    LOG_FILE = "astronavs.log"
    LOG_PATH = os.path.join(LOG_DIR, LOG_FILE)
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_LEVEL = "INFO"


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    pass
