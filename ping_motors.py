
import sys
from lerobot.motors.feetech.feetech import FeetechMotorsBus
from lerobot.motors.motors_bus import Motor, MotorNormMode

def ping_motors(port):
    print(f"\n--- Checking port: {port} ---")
    try:
        # Define motors correctly
        motors = {
            f"motor_{i}": Motor(id=i, model="sts3215", norm_mode=MotorNormMode.RANGE_M100_100)
            for i in range(1, 7)
        }
        bus = FeetechMotorsBus(port=port, motors=motors)
        bus.connect()
        print(f"Successfully connected to {port}")
        
        for name, motor in motors.items():
            try:
                pos = bus.read("Present_Position", name)
                print(f"Motor {motor.id}: FOUND (Pos: {pos})")
            except Exception as e:
                print(f"Motor {motor.id}: NOT FOUND - {e}")
        bus.disconnect()
    except Exception as e:
        print(f"Failed to connect to {port}: {e}")

if __name__ == "__main__":
    ports = ["/dev/tty.usbmodem5AE60583121", "/dev/tty.usbmodem5AE60798501"]
    for p in ports:
        ping_motors(p)
