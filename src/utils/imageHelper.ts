import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import imageCompression from 'browser-image-compression';

export async function takeAndCompressPhoto(): Promise<{ base64: string, type: string } | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt, // Pwedeng Camera o Gallery
    });

    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

    // I-compress (max 300KB)
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    });

    // I-convert sa base64
    const base64 = await fileToBase64(compressedFile);
    return { base64, type: 'image/jpeg' };
  } catch (error) {
    console.error('Photo error:', error);
    return null;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Tanggalin ang prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}