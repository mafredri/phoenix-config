import { ScreenProxy } from "./screen_proxy";
import { screens, windowMap, saveState } from "./globals"
import log from './logger';

export class Workspace {
    windows: Array<Window> = [];
    id;
    screen : ScreenProxy | null = null;
    mainRatio = 0.8;
  
    constructor(id: number) {
      this.id = id;
    }
  
    garbageCollect() {
      let live = new Set(Window.all().map(w => w.hash()));
      this.windows = this.windows.filter(w => live.has(w.hash()));
    }
  
    render() {
      this.garbageCollect();
      if (!this.screen) {
        throw new Error("render called without a screen: " + this.id);
      }
  
      if (this.windows.length == 0) {
        this.screen.hideAllApps();
        return;
      }
  
      let screen = this.screen.screen;
      let screenBounds = screen.flippedVisibleFrame();
      log(screenBounds.x + ' '  + screenBounds.y + ' ' + screenBounds.width + ' ' + screenBounds.height );
      let mainWidth = screenBounds.width * this.mainRatio;
      for (let i = this.windows.length - 1; i >= 0; i--) {
        let win = this.windows[i];
        let bounds = Object.assign({}, screenBounds);
        if (i === 0) {
          if (this.windows.length > 1) {
            bounds.width = mainWidth;
          }
          win.setTopLeft(bounds);
          win.setSize(bounds);
        } else {
          let sidebarWindows = this.windows.length - 1;
          bounds.x = screenBounds.x + mainWidth + 1;
          bounds.width = screenBounds.width - mainWidth;
          // TODO sort out the boundary conditions lol
          bounds.height = screenBounds.height / sidebarWindows;;
          bounds.y = screenBounds.y + screenBounds.height / sidebarWindows * (i - 1) + 1;
          if (win.frame().width < bounds.width) {
          win.setTopLeft(bounds);
          }
          win.setSize(bounds);
          win.setTopLeft(bounds);
        }
        log(bounds.x + ' '  + bounds.y + ' ' + bounds.width + ' ' + bounds.height + ' ' + win.title());
        win.focus();
      }
      // if (this.windows.length > 0) {
      //   this.windows[0].focus();
      // }
      saveState();
    }
  
    rotate() {
      let x = this.windows.shift();
      if (x)
        this.windows.push(x);
      log(this.windows.map((w) => w.title()));
      this.modal('Rotating ');
      this.render();
    }
  
    modal(message: string) {
      let screen = this.screen;
      if (screen) {
          this.screen?.vlog(message);
      }
    }
  
    findIndexByHash(hash : number) {
      return this.windows.findIndex(w => hash === w.hash());
    }
  
    findIndex(window: Window) {
      return this.findIndexByHash(window.hash());
    }
  
    removeWindow(window: Window) {
      let idx = this.findIndex(window);
      if (idx == -1) {
        return;
      }
      this.windows.splice(idx, 1);
      if (this.screen) {
        this.render();
      }
    }
  
    addWindow(window: Window, asMain?: boolean) {
      let idx = this.findIndex(window);
      if (idx != -1) {
        this.modal('Window already on ');
        return;
      }
  
      let oldWorkspace = windowMap.get(window.hash());
      if (oldWorkspace) {
        oldWorkspace.removeWindow(window);
      }
      if (asMain) {
        this.windows.unshift(window);
      } else {
        this.windows.push(window);
      }
      windowMap.set(window.hash(), this);
      if (this.screen) {
        this.render();
      }
      this.modal('Adding window to ');
    }
  }