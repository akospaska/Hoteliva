import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { printDocument } from './print-document';

export type QrLabel = { id: string; title: string; hotel: string; url: string; image: string };
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export async function printLabels(labels: QrLabel[]) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Hoteliva QR</title><style>body{font-family:Arial;color:#193D35}main{display:flex;flex-wrap:wrap;gap:20px}section{border:1px solid #aaa;border-radius:12px;padding:24px;text-align:center;width:220px;break-inside:avoid}img{width:180px;height:180px}small{display:block}</style></head><body><main>${labels.map((l) => `<section><small>HOTELIVA · ${escape(l.hotel)}</small><h1>${escape(l.title)}</h1><img src="${l.image}" alt="QR"><p>Szkennelj a munkavégzéshez<br>Scan to start working</p></section>`).join('')}</main></body></html>`;
  if (Platform.OS === 'web') {
    await printDocument(html);
    return;
  }
  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync())
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf' });
  else await Print.printAsync({ uri: file.uri });
}
