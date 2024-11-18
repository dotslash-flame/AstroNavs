from . import create_app
from .config import DevelopmentConfig

app = create_app(DevelopmentConfig)

if __name__ == "__main__":
    # serves on local and wlan ip addrs
    app.run(host="0.0.0.0", port=5000)
