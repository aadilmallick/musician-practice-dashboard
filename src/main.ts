import { PracticeSessionTimer } from "./PracticeSessionTimer";
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

type Selector = typeof HTMLElement.prototype.querySelector;
export class DOM {
  /**
   * Adding elements
   * */
  static createDomElement(html: string) {
    const dom = new DOMParser().parseFromString(html, "text/html");
    return dom.body.firstElementChild as HTMLElement;
  }
  static addStyleTag(css: string) {
    const styles = document.createElement("style");
    styles.textContent = css;
    document.head.appendChild(styles);
    return styles;
  }
  static addElementsToContainer(
    container: HTMLElement,
    elements: HTMLElement[]
  ) {
    const fragment = document.createDocumentFragment();
    elements.forEach((el) => fragment.appendChild(el));
    container.appendChild(fragment);
  }

  /**
   * querying elements
   * */
  static $ = (selector: string): HTMLElement | null =>
    document.querySelector(selector);
  static $$ = (selector: string): NodeListOf<HTMLElement> =>
    document.querySelectorAll(selector);

  static $throw = (selector: string): HTMLElement => {
    const el = DOM.$(selector);
    if (!el) {
      throw new Error(`Element not found: ${selector}`);
    }
    return el;
  };

  static createQuerySelectorWithThrow(
    containerElement: HTMLElement | ShadowRoot
  ) {
    const select = containerElement.querySelector.bind(
      containerElement
    ) as Selector;
    return ((_class: keyof HTMLElementTagNameMap) => {
      const query = select(_class);
      if (!query) throw new Error(`Element with selector ${_class} not found`);
      return query;
    }) as Selector;
  }
}

const sessionTimerSection = DOM.$throw("#practice-session-timer");
const $timer = DOM.createQuerySelectorWithThrow(sessionTimerSection);

const playButton = $timer("#play");
const pauseButton = $timer("#pause");
const resetButton = $timer("#reset");
const timerValueElement = $timer("#timer-stats");

let practiceSessionTimerManager = new PracticeSessionTimer();

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function updateTimerValue(elapsedTime: number) {
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  timerValueElement!.textContent = `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
  document.title = `current practice duration - ${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

playButton!.addEventListener("click", () => {
  if (practiceSessionTimerManager.inProgress) {
    practiceSessionTimerManager.resume(updateTimerValue);
  } else {
    practiceSessionTimerManager.start(updateTimerValue);
  }
});

pauseButton!.addEventListener("click", () => {
  practiceSessionTimerManager.pause();
});

resetButton!.addEventListener("click", () => {
  practiceSessionTimerManager.stop();
  updateTimerValue(0);
});

const leaderboard = DOM.$throw("#leaderboard") as HTMLUListElement;

async function handleLeaderboard() {
  const durationTimes =
    practiceSessionTimerManager.storageManager.get("elapsedTimes");
  if (durationTimes) {
    const mostRecentTime =
      formatTime(durationTimes[durationTimes.length - 1]).split(":")[0] +
      " minutes";
    const mostRecentTimeElement = DOM.createDomElement(
      `<li>Most recent practice duration: ${mostRecentTime}</li>`
    );
    const longestTime =
      formatTime(Math.max(...durationTimes)).split(":")[0] + " minutes";
    const longestTimeElement = DOM.createDomElement(
      `<li>Longest practice duration: ${longestTime}</li>`
    );
    DOM.addElementsToContainer(leaderboard, [
      mostRecentTimeElement,
      longestTimeElement,
    ]);
  }
}

handleLeaderboard();
