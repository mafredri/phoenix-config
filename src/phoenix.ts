import { pointInsideFrame } from './calc';
import { onKey } from './key';
import log from './logger';
import { Workspace } from './workspace';
import {
  getActiveScreen,
  workspaces,
  screens,
  windowMap,
  focusWindow,
  moveFocusedWindowToWorkspace,
  getActiveWorkspace,
  center,
} from './globals';
import { focusOnMouseMove, modKey, modKeyShift } from './config';


Phoenix.set({
  daemon: false,
  openAtLogin: true,
});

onKey('right', modKey, () => {
  focusWindow(screens[0].workspace?.windows[0]);
});
onKey('right', modKeyShift, () => {
  let ws = screens[0].workspace;
  if (!ws) {
    return;
  }
  moveFocusedWindowToWorkspace(ws.id);
  focusWindow(ws.windows[0]);
});
onKey('left', modKey, () => {
  focusWindow(screens[1].workspace?.windows[0]);
});
onKey('left', modKeyShift, () => {
  let ws = screens[1].workspace;
  if (!ws) {
    return;
  }
  moveFocusedWindowToWorkspace(ws.id);
  focusWindow(ws.windows[0]);
});
onKey('down', modKey, () => focusNextWindow());
onKey('j', modKey, () => focusNextWindow());

onKey('up', modKey, () => focusNextWindow(-1));
onKey('k', modKey, () => focusNextWindow(-1));


onKey('h', modKey, () => {
  getActiveWorkspace().mainRatio -= 0.1;
  getActiveWorkspace().render();
});
onKey('l', modKey, () => {
  getActiveWorkspace().mainRatio += 0.1;
  getActiveWorkspace().render();
});

// Collect current window into active workspace.
onKey('return', modKeyShift, () => {
  let window = Window.focused();
  if (window) {
    getActiveWorkspace().addWindow(window);
  }
});

onKey('delete', modKeyShift, () => {
  let window = Window.focused();
  if (window) {
    getActiveWorkspace().removeWindow(window);
  }
});

onKey('c', modKeyShift, () => {
  let window = Window.focused();
  window?.close();
});

// Rerender current screens.
onKey('space', modKeyShift, () => {
  let window = Window.focused();
  for (let s of screens) {
    s.workspace?.render();
    s.vlog('Rerendered');
  }
  focusWindow(window);
});

onKey('r', modKey, () => {
  getActiveWorkspace().rotate();
});

onKey('r', modKeyShift, () => {
  let oldMousePos = Mouse.location();
  let screenWorkspaces = screens.map(s => s.workspace as Workspace);
  let back = screenWorkspaces.shift() as Workspace;
  screenWorkspaces.push(back);
  log(screenWorkspaces.map(w => w.id));
  screens.forEach((screen, i) => {
    log('setting SCREEN:' + screen.id + ' WINDOW: ' + screenWorkspaces[i].id);
    screen.setWorkspace(screenWorkspaces[i].id);
  });
  screens.forEach((screen) => {
    log('rendering SCREEN:' + screen.id + ' WINDOW: ' + screen.workspace?.id);
    screen.workspace?.render();
  });
  Mouse.move(oldMousePos);
});


for (let i = 0; i <= 9; i++) {
  onKey(i.toString(), modKey, () => {
    let ws = workspaces[i];
    if (ws.screen) {
      let focused = Window.focused();
      let focusedScreen = getActiveScreen();
      log(focusedScreen.id);
      log(focused?.title());
      ws.screen.vlog('Here ');
      ws.render();
      if (focusedScreen === ws.screen) {
        log(focusedScreen.id);
        focusWindow(ws.windows[0]);
      } else {
        log(focused?.title());
        focusWindow(focused);
      }

      return;
    }
    getActiveScreen().activateWorkspace(i);
  });
  onKey(i.toString(), modKeyShift, () => {
    moveFocusedWindowToWorkspace(i);
  });
}

function focusNextWindow(dir = 1) {
  let window = Window.focused();
  if (!window) {
    // TODO use mouse to figure our current screen?
    let screen = getActiveScreen();
    if (screen.workspace)
      screen.activateWorkspace(screen.workspace.id);
    return;
  }
  let hash = window.hash();
  let workspace = windowMap.get(hash);
  if (!workspace) {
    return;
  }
  let windows = workspace.windows;
  focusWindow(windows[(workspace.findIndex(window) + dir + windows.length) % windows.length]);
}

Event.on('windowDidClose', (w) => {
  let ws = windowMap.get(w.hash());
  if (!ws) {
    return;
  }
  log('windowDidClose ' + w.title() + ' APPNAME: ' + w.app().name() + ' HASH: ' + w.hash() + ' removing from: ' + ws.id);
  ws.removeWindow(w);
});

Event.on('windowDidOpen', (w) => {
  if (!w.isVisible() || windowMap.get(w.hash())) {
    return;
  }
  log('windowDidOpen ' + w.title() + ' APPNAME: ' + w.app().name() + ' HASH: ' + w.hash()) + ' adding to: ' + getActiveWorkspace().id;
  // Phoenix modals shouldn't be part of our system.
  if (w.app().name() != 'Phoenix') {
    getActiveWorkspace().addWindow(w, true);
  }
});

if (focusOnMouseMove) {
  Event.on('mouseDidMove', (p) => {
    let w = Window.recent().find(w => pointInsideFrame(p, w.frame()));
    w?.focus();
  });
}

// Debug keys.
onKey('`', modKey, () => {
  for (let s of screens) {
    for (let w of s.workspace?.windows || []) {
      const m = new Modal();
      m.text = (s.workspace?.id.toString() || '') + ' ' + w.title();
      m.duration = 3;
      m.icon = w.app().icon();
      let modalBounds = m.frame();
      let windowBounds = w.frame();
      let origin = center(windowBounds);
      let screenBounds = s.screen.flippedFrame();
      let y = origin.y - screenBounds.y;
      y = screenBounds.height - y;
      origin.x -= modalBounds.width / 2;
      origin.y = y - modalBounds.height + s.screen.frame().y;
      m.origin = origin;
      m.show();
    }
  }
});

onKey('`', modKeyShift, () => {
  let w = Window.focused();
  if (!w) {
    return;
  }
  log('=============================================================');
  log(w.hash() + ' - ' + w.app.name + ' - ' + w.title());
  let loadState = Storage.get('state');
  log(loadState);
  log('=============================================================');
});
