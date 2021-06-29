import { pointInsideFrame } from "./calc";
import { ScreenProxy } from "./screen_proxy";
import { Workspace } from "./workspace";
import log from './logger';

let windowMap = new Map<number, Workspace>();



log(Window.all().map((w) => w.hash() + " " + w.title()));

let workspaces: Array<Workspace> = [];
for (let i = 0; i <= 9; i++) {
  workspaces.push(new Workspace(i));
}

// We assume that the number of screens does not change. Just reload Phoenix.
let initialFocus = Window.focused();
let screens: Array<ScreenProxy> = [];
for (let [i, screen] of Screen.all().entries()) {
  screens.push(new ScreenProxy(screen, i));
}

loadState();

for (let [i, s] of screens.entries()) {
  if (!s.workspace) {
    s.activateWorkspace(i + 1);
  }
}

focusWindow(initialFocus);

function saveState() {
  let saveState = {
    workspaces: [] as Array<Object>,
    screens: [] as Array<Object>,
  };
  for (let s of screens) {
    saveState.screens.push({
      id: s.id,
      workspace: s.workspace?.id,
    });
  }
  for (let ws of workspaces) {
    saveState.workspaces.push({
      id: ws.id,
      mainRatio: ws.mainRatio,
      windows: ws.windows.map(w => w.hash()),
    });
  }
  log('============SAVING============');
  // log(saveState);
  Storage.set('state', saveState)
}

function loadState() {
  let currentWindows = Window.all();
  let loadState = Storage.get('state');
  log('============LOADING============');
  log(loadState);
  if (loadState) {
    for (let ws of (loadState.workspaces || [])) {
      log('Workspace ' + ws.id);
      let workspace = workspaces[ws.id];
      if (ws.mainRatio)
        workspace.mainRatio = ws.mainRatio;
      for (let hash of ws.windows) {
        let currentWindow = currentWindows.find(w => w.hash() === hash);
        if (currentWindow)
          workspace.addWindow(currentWindow);
      }
    }
    for (let s of (loadState.screens || [])) {
      if (s.workspace) {
        screens[s.id].activateWorkspace(s.workspace);
      }
    }
  }
}


function getActiveScreen(): ScreenProxy {
  let pos = Mouse.location();

  let screen = screens.find(s => {
    let b = s.screen.flippedFrame();
    return pointInsideFrame(pos, b);
  });

  return screen || screens[0];
}

function moveFocusedWindowToWorkspace(workspaceId: number) {
  let window = Window.focused();
  if (window) {
    workspaces[workspaceId].addWindow(window, true);
    getActiveWorkspace().render();
  }
}

function focusWindow(window: Window | undefined | null) {
  if (!window) {
    return;
  }
  window.focus();
  let b = window.frame();
  log('Focusing: ' + window.title());
  // log(b);
  Mouse.move(center(b));
}

function mid(x1: number, x2: number) {
  return (x1 + x2) / 2;
}

function center(r: Rectangle) {
  return {
    x: mid(r.x, r.x + r.width),
    y: mid(r.y, r.y + r.height),
  };
}



function getActiveWorkspace(): Workspace {
  let screen = getActiveScreen();
  log('getActiveWorkspace: screen: ' + screen.id + ' workspace: ' + screen.workspace?.id);
  return screen.workspace as Workspace;
}
export {
  getActiveScreen,
  workspaces,
  screens,
  windowMap,
  focusWindow,
  saveState,
  moveFocusedWindowToWorkspace,
  getActiveWorkspace,
  center,
}