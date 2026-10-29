import QRCode from 'qrcode';

export async function qrImage(url: string) {
  return QRCode.toDataURL(url, { width: 400, margin: 2, errorCorrectionLevel: 'M' });
}
