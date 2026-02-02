/** Update the preview iframe with compiled HTML. */
export function updatePreview(iframe: HTMLIFrameElement, html: string): void {
  iframe.srcdoc = html;
}
