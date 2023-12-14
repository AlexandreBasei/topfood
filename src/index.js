import '@capacitor/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { PushNotifications } from '@capacitor/push-notifications';


export function Capacitor() {
    return {
        "Camera" : Camera,
        "CameraResultType" : CameraResultType,
        "Filesystem" : Filesystem,
        "PushNotifications" : PushNotifications,
    }
}