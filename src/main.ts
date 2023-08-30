import sdk, {
  Device,
  DeviceProvider,
  ScryptedDeviceBase,
  ScryptedDeviceType,
  ScryptedInterface,
  Setting,
  SettingValue,
  Settings,
} from "@scrypted/sdk";

import { v4 as uuidv4 } from "uuid";
import OnStarVehicle from "./vehicle";
import OnStar from "onstarjs";
import { OnStarConfig } from "onstarjs/dist/types";

class OnStarPlugin
  extends ScryptedDeviceBase
  implements Settings, DeviceProvider
{
  deviceId: string;
  connection: OnStar;

  constructor(nativeId?: string) {
    super(nativeId);
    this.deviceId = uuidv4();

    this.prepareVehicles();
  }

  getVIN() {
    return this.storage.getItem("vin");
  }

  getUsername() {
    return this.storage.getItem("username");
  }

  getPassword() {
    return this.storage.getItem("password");
  }

  getPin() {
    return this.storage.getItem("pin");
  }

  getDeviceId() {
    return this.storage.getItem("device-id");
  }

  async getSettings(): Promise<Setting[]> {
    return [
      {
        key: "vin",
        title: "VIN",
        value: this.getVIN(),
        description:
          "VIN number of your primary vehicle on your OnStar account. All vehicles will become accessible after initial discovery.",
      },
      {
        key: "username",
        title: "OnStar Username",
        value: this.getUsername(),
        description: "Your OnStar Username",
      },
      {
        key: "password",
        title: "OnStar Password",
        value: this.getPassword(),
        type: "password",
        description: "Your password for your OnStar account",
      },
      {
        key: "pin",
        title: "OnStar Account PIN",
        value: this.getPin(),
        type: "password",
        description:
          "Your OnStar account PIN. Forgot it? Reset it at your vehicle manufacturer's website under account settings",
      },
    ];
  }

  async putSetting(key: string, value: SettingValue): Promise<void> {
    this.storage.setItem(key, value.toString());

    this.onDeviceEvent(ScryptedInterface.Settings, undefined);
  }

  async getDevice(nativeId: string): Promise<any> {
    return new OnStarVehicle(
      nativeId,
      await OnStar.create(this.createConnection(nativeId))
    );
  }

  createConnection(nativeId): OnStarConfig {
    return {
      deviceId: this.deviceId,
      vin: nativeId,
      username: this.getUsername(),
      password: this.getPassword(),
      onStarPin: this.getPin(),
    };
  }

  async releaseDevice(id: string, nativeId: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  async prepareVehicles() {
    try {
      const onstarVehicles: Device[] = [];

      let onStarSettings: OnStarConfig = {
        deviceId: this.deviceId,
        vin: this.getVIN(),
        username: this.getUsername(),
        password: this.getPassword(),
        onStarPin: this.getPin(),
      };

      this.connection = await OnStar.create(onStarSettings);

      let tempVehicles: any[] = (
        (await this.connection.getAccountVehicles()).response.data as any
      ).vehicles.vehicle;

      for (let vehicle of tempVehicles) {
        this.console.log(
          "Discovered a new vehicle: " +
            vehicle.year +
            " " +
            vehicle.make +
            " " +
            vehicle.model +
            ". Creating devices"
        );
        onstarVehicles.push({
          nativeId: vehicle.vin + "-remote-lock",
          name: vehicle.nickname + " Remote Lock",
          type: ScryptedDeviceType.Lock,
          interfaces: [ScryptedInterface.Lock],
          info: {
            model: vehicle.model,
            manufacturer: vehicle.make,
            serialNumber: vehicle.vin,
            version: vehicle.year,
            firmware: vehicle.year,
          },
        });

        onstarVehicles.push({
          nativeId: vehicle.vin + "-remote-start",
          name: vehicle.nickname + " Remote Start",
          type: ScryptedDeviceType.Switch,
          interfaces: [ScryptedInterface.OnOff],
          info: {
            model: vehicle.model,
            manufacturer: vehicle.make,
            serialNumber: vehicle.vin,
            version: vehicle.year,
            firmware: vehicle.year,
          },
        });
      }

      await sdk.deviceManager.onDevicesChanged({
        devices: onstarVehicles,
      });
    } catch (e) {
      this.console.error(
        "Failure to get account vehicles. Have you configured the OnStar plugin yet? Please enter credentials and reload plugin."
      );
    }
  }
}

export default OnStarPlugin;
