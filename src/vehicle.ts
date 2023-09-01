import { Lock, LockState, OnOff, ScryptedDeviceBase } from "@scrypted/sdk";
import OnStar from "onstarjs";
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
    this.on = false || this.on;

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
        await this.connection.start();
        this.console.log("Starting engine on vehicle " + this.nativeId);

        /* 
          The start switch needs to be set back to off at some point. 
          OnStar apps for ICE engines have a timeout of 15 minutes, at which point the engine stops on its own.
          Unsure if this is the same on electric vehicles 
        */
        this.switchTimeout = setTimeout(() => {
          this.on = false;
        }, 1000 * 15 * 60);
        break;
      }

      case "horn": {
        await this.connection.alert({ action: [AlertRequestAction.Honk] });
        this.console.log("Sounding horn on vehicle " + this.nativeId);
        this.switchTimeout = setTimeout(() => {
          this.connection.cancelAlert();
          this.on = false;
        }, 1000 * 5 * 60);
        break;
      }

      case "lights": {
        await this.connection.alert({ action: [AlertRequestAction.Flash] });
        this.console.log("Flashing lights on vehicle " + this.nativeId);
        this.switchTimeout = setTimeout(() => {
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
        this.console.log("Cancelling alert on vehicle " + this.nativeId);
        break;
      }
    }

    this.on = false;
    clearTimeout(this.switchTimeout);
  }
}

export default OnStarVehicle;
