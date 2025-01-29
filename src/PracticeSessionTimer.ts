export class LocalStorageBrowser<T extends Record<string, any>> {
  constructor(private prefix: string = "", defaultData?: T) {
    if (defaultData) {
      Object.keys(defaultData).forEach((key) => {
        const item = window.localStorage.getItem(this.getKey(key));
        if (!item) {
          this.set(
            key as keyof T & string,
            defaultData[key as keyof T & string]
          );
        }
      });
    }
  }

  private getKey(key: keyof T & string): string {
    return this.prefix + key;
  }

  public set<K extends keyof T & string>(key: K, value: T[K]): void {
    window.localStorage.setItem(this.getKey(key), JSON.stringify(value));
  }

  public get<K extends keyof T & string>(key: K): T[K] | null {
    const item = window.localStorage.getItem(this.getKey(key));
    return item ? JSON.parse(item) : null;
  }

  public removeItem(key: keyof T & string): void {
    window.localStorage.removeItem(this.getKey(key));
  }

  public clear(): void {
    window.localStorage.clear();
  }
}

export class PracticeSessionTimer {
  private elapsedTime: number = 0;
  private intervalId: number | null = null;
  public storageManager = new LocalStorageBrowser<{ elapsedTimes: number[] }>(
    "practice-session-timer-"
  );

  get inProgress() {
    return this.elapsedTime > 0;
  }

  start(cb: (elapsedTime: number) => void) {
    this.elapsedTime = 0;
    this.play(cb);
  }

  resume(cb: (elapsedTime: number) => void) {
    this.play(cb);
  }

  private play(cb: (elapsedTime: number) => void) {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.elapsedTime++;
      cb(this.elapsedTime);
    }, 1000);
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.storageManager.set("elapsedTimes", [
      ...(this.storageManager.get("elapsedTimes") || []),
      this.elapsedTime,
    ]);
    this.elapsedTime = 0;
  }
}
