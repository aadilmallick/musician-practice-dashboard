import "./style.css";

class IFrameManager {
  constructor(public iFrame: HTMLIFrameElement) {}

  init() {
    return new Promise<void>((resolve, _) => {
      this.iFrame.onload = () => {
        resolve();
      };
    });
  }

  public get document() {
    return this.iFrame.contentDocument ?? this.window?.document;
  }

  public get window() {
    return this.iFrame.contentWindow;
  }

  sendToMainPage(message: any) {
    console.log("sending message to main page", this.window?.postMessage);
    this.window?.parent.postMessage(message, "*");
  }

  static onIframeMessage(cb: (event: MessageEvent) => void) {
    window.addEventListener("message", (event) => {
      cb(event);
    });
  }

  static onIframeMessageFromOrigin(origin: string, cb: (data: any) => void) {
    window.addEventListener("message", (event) => {
      if (event.origin === origin) {
        cb(event.data);
      }
    });
  }

  public silenceConsole() {
    if (!this.window) return;
    try {
      this.window.console.log = () => {};
      this.window.console.warn = () => {};
      this.window.console.error = () => {};
      const iframes = Array.from(
        this.window.document.getElementsByTagName("iframe")
      );
      for (const item of iframes) {
        if (!item.contentWindow) continue;
        item.contentWindow.console.log = () => {
          /* nop */
        };
        item.contentWindow.console.warn = () => {
          /* nop */
        };
        item.contentWindow.console.error = () => {
          /* nop */
        };
      }
    } catch (e) {
      console.error("security error");
      console.error(e);
    }
  }
}

const googleTimerIFrame = new IFrameManager(
  document.getElementById("timer") as HTMLIFrameElement
);
async function handleGoogle() {
  googleTimerIFrame.iFrame.src = "https://www.google.com/search?igu=1&q=timer";
  await googleTimerIFrame.init();
}

// !it's impossible to access the iframe document if not same origin, to prevent XSS attacks

handleGoogle();
