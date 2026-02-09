import draccus
from lerobot.scripts.lerobot_record import RecordConfig
import sys

def test_parse():
    try:
        cfg = draccus.parse(config_class=RecordConfig, args=sys.argv[1:])
        print("Successfully parsed config:")
        print(cfg)
    except Exception as e:
        print(f"Error during parsing: {e}")

if __name__ == "__main__":
    test_parse()
