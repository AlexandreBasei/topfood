import '@capacitor/core';
import { Camera, CameraResultType } from '@capacitor/camera';



export function Capacitor() {
    return {
        "Camera" : Camera,
        "CameraResultType" : CameraResultType,
    }
}