# Scrypted OnStar

A Scrypted plugin to control OnStar enabled vehicles.

I recommend, if possible, creating a secondary OnStar account and connecting this plugin to it. You can share vehicles with these second OnStar accounts, and it protects your main account as well.

This plugin uses an **UNOFFICIAL** API, [OnStarJS](https://github.com/samrum/OnStarJS). OnStar refuses to provide developers with an API to query. They claim to have commercial development APIs available, but refuse to respond to development requests. Therefore, the community has had to resort to workarounds and reverse engineering the OnStar API. **USE THIS AT YOUR OWN RISK**

This plugin was tested using a `2024 Chevrolet Trax 1RS`. Other vehicle features may vary.

### **<u>Help Wanted</u>**! If you know how to make this plugin better, or want to contribute, please submit a pull request 😄

## Usage

Once installed, you will need four things:

1. The VIN of primary vehicle
2. Your OnStar Username
3. Your OnStar Password
4. Your OnStar Account PIN

Enter those items in the settings pane of the @scrypted/onstar plugin, and save. Then, reload the plugin. Your vehicles should appear momentarily.

## Current Features

1. Remote Lock / Unlock
2. Remote Start
3. Model, Manufacturer, Serial Number, and Firmware Version in the HomeKit device settings all match your vehicle information 😎

## Planned Features

1. Complete the rest of the OnStar feature-set. This includes charge level (Help will be needed on this, I do not own an EV), horns, lights, etc.
2. Add some way to query the OnStar API. This may mean checking every 5 minutes or so, but as it stands currently I'm not sure how to get _current_ status, only set status. I'm not sure if the OnStar API has that functionality, anyway.
3. Add the ability to check diagnostic information from HomeKit. This can be achieved by creating sensors and setting them based on diagnostic levels.

## Current Limitations

1. As far as I'm aware, the OnStar API does not _send_ data on its own, it only sends replies to requests. Therefore, vehicles cannot currently be queried for their status's. You can query diagnostic info, but that does not include things like lights, lock, engine status, or panic.
2. This plugin only supports lock and start at the moment. Sounding horns, flashing lights, obtaining location, and other features are not yet implemented
3. This is an unofficial API. At any time OnStar can block the usage of this API, or even ban your account, if they so chose. Since OnStarJS uses the "official" key from the Android APK, and you are using legitimate credentials, I don't see why they would, but they are the "boss", so-to-speak, regarding their product. So, use this with caution
4. Each feature is its own "device". Unlike HomeBridge, where you can create devices with multiple properties on them (For example, the [Hatch Baby Rest plugin](https://github.com/dgreif/homebridge-hatch-baby-rest/blob/main/packages/homebridge-hatch-baby-rest/README.md) from dgrief, which allows you to set brightness, power, and volume (using a fan speed control) all within the same device), I was not able to figure out how to create a single device with multiple properties. So, for each vehicle you own, you will have at least 2 (for now) devices associated with it.
