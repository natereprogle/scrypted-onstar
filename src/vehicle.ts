import sdk, {
  EventDetails,
  Lock,
  LockState,
  OnOff,
  ScryptedDevice,
  ScryptedDeviceBase,
  ScryptedInterface,
} from "@scrypted/sdk";
import OnStar from "onstarjs";

const { systemManager } = sdk;

class OnStarVehicle extends ScryptedDeviceBase implements OnOff, Lock {
  vehicle: OnStar;
  vehicleObject: ScryptedDevice;

  constructor(nativeId?: string, private connection?: OnStar) {
    super(nativeId);
    this.lockState = LockState.Locked || LockState.Unlocked;
    this.on = false || this.on;

    this.vehicleObject = systemManager.getDeviceById(nativeId);
  }

  async lock(): Promise<void> {
    await this.connection.lockDoor();
    this.lockState = LockState.Locked;
    this.console.log("Locking vehicle " + this.nativeId);
  }

  async unlock(): Promise<void> {
    await this.connection.unlockDoor();
    this.lockState = LockState.Unlocked;
    this.console.log("Unlocking vehicle " + this.nativeId);
  }

  async turnOff(): Promise<void> {
    await this.connection.start();
    this.on = true;
    this.console.log("Starting engine on vehicle " + this.nativeId);

    //The start switch needs to be set back to off at some point. OnStar apps for ICE engines have a timeout of 15 minutes. Unsure if this is the same on electric vehicles
    setTimeout(() => {
      this.on = false;
    }, 1000 * 15 * 60);
  }

  async turnOn(): Promise<void> {
    await this.connection.cancelStart();
    this.on = false;
    this.console.log("Stopping engine on vehicle " + this.nativeId);
  }
}

export default OnStarVehicle;
