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
import { OnStarConfig } from "onstarjs2/dist/types";
import OnStar from "onstarjs2";

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

  getTotp() {
    return this.storage.getItem("totp");
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
      {
        key: "totp",
        title: "OnStar TOTP Secret",
        value: this.getTotp(),
        type: "password",
        description:
          "The TOTP secret for your OnStar account. This is necessary due to a change in OnStar's authentication method in November 2024. You can get this by logging on to onstar.com (on desktop, not mobile) and switching your security method from email/sms to Third-Party Authenticator App",
      },
    ];
  }

  async putSetting(key: string, value: SettingValue): Promise<void> {
    this.storage.setItem(key, value.toString());

    await this.onDeviceEvent(ScryptedInterface.Settings, undefined);
  }

  async getDevice(nativeId: string): Promise<any> {
    return new OnStarVehicle(nativeId, OnStar.create(this.createConnection()));
  }

  createConnection(): OnStarConfig {
    return {
      deviceId: this.deviceId,
      vin: this.getVIN(),
      username: this.getUsername(),
      password: this.getPassword(),
      onStarPin: this.getPin(),
      onStarTOTP: this.getTotp(),
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
        onStarTOTP: this.getTotp(),
      };

      this.connection = OnStar.create(onStarSettings);

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

        onstarVehicles.push({
          nativeId: vehicle.vin + "-horn",
          name: vehicle.nickname + " Horn",
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

        onstarVehicles.push({
          nativeId: vehicle.vin + "-lights",
          name: vehicle.nickname + " Lights",
          type: ScryptedDeviceType.Light,
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
