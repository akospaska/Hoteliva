// Expo Print prints the current page on web, so labels use a separate printable document.
export async function printDocument(html: string) {
  const frame = document.createElement('iframe');
  frame.title = 'Hoteliva QR labels';
  frame.style.position = 'fixed';
  frame.style.width = '1px';
  frame.style.height = '1px';
  frame.style.left = '-10000px';
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      frame.remove();
      reject(new Error('PRINT_UNAVAILABLE'));
    }, 20000);
    frame.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    frame.srcdoc = html;
    document.body.appendChild(frame);
  });
  const target = frame.contentWindow;
  if (!target) {
    frame.remove();
    throw new Error('PRINT_UNAVAILABLE');
  }
  await Promise.all(
    Array.from(frame.contentDocument?.images || []).map((image) => image.decode().catch(() => {})),
  );
  target.onafterprint = () => frame.remove();
  target.focus();
  target.print();
  setTimeout(() => frame.remove(), 60000);
}
