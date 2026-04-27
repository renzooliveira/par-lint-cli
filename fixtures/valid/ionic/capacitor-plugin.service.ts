import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

export class DeviceService {
  async takePicture() {
    return Camera.getPhoto({ resultType: 'uri' as any });
  }
}
