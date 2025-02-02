import {
  Battery,
  Lock,
  LockState,
  OnOff,
  ScryptedDeviceBase,
} from "@scrypted/sdk";
import OnStar from "onstarjs2";
import { SwitchType } from "./types";

enum AlertRequestAction {
  Honk = "Honk",
  Flash = "Flash",
}

class OnStarVehicle extends ScryptedDeviceBase implements OnOff, Lock {
  switchTimeout: NodeJS.Timeout;
  lockTimeout: NodeJS.Timeout;
  vehicle: OnStar;
  switchType: SwitchType;

  constructor(nativeId?: string, private connection?: OnStar) {
    super(nativeId);
    this.lockState = LockState.Locked || LockState.Unlocked;
    this.on = false;

    // Determine the function the switch will control
    if (nativeId.includes("remote-start")) {
      this.switchType = "engine";
    } else if (nativeId.includes("horn")) {
      this.switchType = "horn";
    } else {
      this.switchType = "lights";
    }
  }

  async lock(): Promise<void> {
    await this.connection.lockDoor();

    this.lockState = LockState.Locked;
    clearTimeout(this.lockTimeout);

    this.console.log("Locking vehicle " + this.nativeId);
  }

  async unlock(): Promise<void> {
    await this.connection.unlockDoor();
    this.lockState = LockState.Unlocked;
    this.console.log("Unlocking vehicle " + this.nativeId);

    // Automatically send the lock command after 5 minutes
    // Unfortunately, there isn't a known way to poll current lock status, so this is what we got. Will be configurable later.
    this.lockTimeout = setTimeout(async () => {
      await this.lock();
      this.console.log(
        "Vehicle " +
          this.nativeId +
          " wasn't locked using HomeKit, automatically locking to prevent invalid state"
      );
    }, 1000 * 5 * 60);
  }

  async turnOn(): Promise<void> {
    switch (this.switchType) {
      case "engine": {
        this.console.log("Starting engine on vehicle " + this.nativeId);
        await this.connection.start();
        this.console.log("Engine started on vehicle " + this.nativeId);
        this.console.log(
          "The switch will default to off after 15 minutes, at which point if the vehicle is not in motion then it will also switch off (This is automatic by the vehicle and not OnStar JS)"
        );

        /* 
          The start switch needs to be set back to off at some point. 
          OnStar apps for ICE engines have a timeout of 15 minutes, at which point the engine stops on its own.
          Unsure if this is the same on electric vehicles 

          I also have no idea how (if at all) the app detects the vehicle actually being turned "on" from
          a remote start event. Either way, the switch needs to default back to off after 15 minutes
        */
        this.switchTimeout = setTimeout(async () => {
          this.on = false;
          await this.connection.cancelStart();
        }, 1000 * 15 * 60);
        break;
      }

      case "horn": {
        this.console.log("Starting horn on vehicle " + this.nativeId);
        await this.connection.alert({ action: [AlertRequestAction.Honk] });
        this.console.log("Horn is sounding on vehicle " + this.nativeId);
        this.switchTimeout = setTimeout(() => {
          this.console.log(
            "Horn is no longer sounding on vehicle " + this.nativeId
          );
          this.connection.cancelAlert();
          this.on = false;
        }, 1000 * 5 * 60);
        break;
      }

      case "lights": {
        this.console.log("Starting flash on vehicle " + this.nativeId);
        await this.connection.alert({ action: [AlertRequestAction.Flash] });
        this.console.log("Lights now flashing on vehicle " + this.nativeId);
        this.switchTimeout = setTimeout(() => {
          this.console.log(
            "Lights are no longer flashing on vehicle " + this.nativeId
          );
          this.connection.cancelAlert();
          this.on = false;
        }, 1000 * 5 * 60);
        break;
      }
    }

    this.on = true;
  }

  async turnOff(): Promise<void> {
    switch (this.switchType) {
      case "engine": {
        await this.connection.cancelStart();
        this.console.log("Stopping engine on vehicle " + this.nativeId);
        break;
      }

      case "horn":
      case "lights": {
        await this.connection.cancelAlert();
        this.console.log(
          `Cancelling ${this.switchType} on vehicle ${this.nativeId}`
        );
        break;
      }
    }

    this.on = false;
    clearTimeout(this.switchTimeout);
  }
}

export default OnStarVehicle;
