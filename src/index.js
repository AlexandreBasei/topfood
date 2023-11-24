import '@capacitor/core';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';


export function Capacitor() {
    return {
        "Camera" : Camera,
        "CameraResultType" : CameraResultType,
        "Filesystem" : Filesystem,
    }
}