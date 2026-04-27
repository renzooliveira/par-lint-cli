import { Camera } from '@ionic-native/camera/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';

export class DeviceService {
  constructor(private camera: Camera, private geo: Geolocation) {}
}
