import {frameRatio, moveToFrame, pointInsideFrame} from './calc';
import {hyper, hyperShift} from './config';
import {cycleBackward, cycleForward} from './cycle';
import {onKey} from './key';
import log from './logger';
import {brightness} from './misc/brightness';
import {TimerStopper} from './misc/coffee';
import coffeTimer from './misc/coffee';
import * as terminal from './misc/terminal';
import {titleModal, showCenterOn, titleModalOn} from './modal';
import {Scanner} from './scan';
import {setFrame, toggleMaximized} from './window';
import {screenAt} from './screen';
import { window } from 'rxjs/operators';
import { textChangeRangeIsUnchanged } from 'typescript';
import { Workspace } from './workspace';
import { ScreenProxy } from './screen_proxy';
import {
  getActiveScreen,
  workspaces,
  screens,
  windowMap,
  focusWindow,
  saveState,
  moveFocusedWindowToWorkspace,
} from './globals';



const phoenixApp = App.get('Phoenix') || App.get('Phoenix (Debug)');
const scanner = new Scanner();
let coffee: TimerStopper | null;

/*
Dev journal

28-06-21
Many simpsons episodes. Implemented simple window adding and rotaties.
Need to do some window hiding to make thing usable
Probably want to store all window hashes so that reloads maintain state
There's something weird about flipped coordinates to work on too. That should get abstracted.
MVP Feature list:
- new window added to current workspace, or apps to workspaces
- switch workspace and hide all other windows
- mod + r to rotate
- mod + left/right to focus monitor
- mod + 1-9 to render workspace 1-9 on active monitor
- mod + shift + left/right to move window to left/right monitor workspace

29-06-21
Boom shakalaka, making good headway.
The basic version works, but I think there might be some weird issues with automagically
adding/removing windows. But maybe not.
Still haven't figured out if I should do something with existing windows, but declaring window bankruptcy for now!

*/



Phoenix.set({
  daemon: false,
  openAtLogin: true,
});

const modKey = 'alt';






function getActiveWorkspace() : Workspace {
  let screen = getActiveScreen();
  log('getActiveWorkspace: screen: ' + screen.id + ' workspace: ' + screen.workspace?.id);
  return screen.workspace as Workspace;
}

// Debug keys.
onKey('`', [modKey], () => {

});
onKey('`', ['shift', modKey], () => {
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






onKey('right', [modKey], () => {
  focusWindow(screens[0].workspace?.windows[0]);
});
onKey('right', ['shift', modKey], () => {
  let ws = screens[0].workspace;
  if (!ws) {
    return;
  }
  moveFocusedWindowToWorkspace(ws.id);
  focusWindow(ws.windows[0]);
});
onKey('left', [modKey], () => {
  focusWindow(screens[1].workspace?.windows[0]);
});
onKey('left', ['shift', modKey], () => {
  let ws = screens[1].workspace;
  if (!ws) {
    return;
  }
  moveFocusedWindowToWorkspace(ws.id);
  focusWindow(ws.windows[0]);
});
onKey('down', [modKey], () => focusNextWindow());
onKey('j', [modKey], () => focusNextWindow());

onKey('up', [modKey], () => focusNextWindow(-1));
onKey('k', [modKey], () => focusNextWindow(-1));


onKey('h', [modKey], () => {
  getActiveWorkspace().mainRatio -= 0.1;
  getActiveWorkspace().render();
});
onKey('l', [modKey], () => {
  getActiveWorkspace().mainRatio += 0.1;
  getActiveWorkspace().render();
});

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

// Collect current window into active workspace. Make this collect app.
onKey('return', ['cmd', 'shift'], () => {
  let window = Window.focused();
  if (window) {
    getActiveWorkspace().addWindow(window);
  }
});

// Rerender current screens.
onKey('space', ['cmd', 'shift'], () => {
  for (let s of screens) {
    s.workspace?.render();
    s.vlog('Rerendered');
  }
});

onKey('r', [modKey], () => {
  getActiveWorkspace().rotate();
});

onKey('r', [modKey, 'shift'], () => {
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
  onKey(i.toString(), [modKey], () => {
    let ws = workspaces[i];
    if (ws.screen) {
      ws.screen.vlog('Here ');
      ws.render();
      if (getActiveScreen() === ws.screen) {
        focusWindow(ws.windows[0]);
      }
      return;
    }
    getActiveScreen().activateWorkspace(i);
  });
  onKey(i.toString(), [modKey, 'shift'], () => {
    moveFocusedWindowToWorkspace(i);
  });
}

Event.on('windowDidClose', (w) => {
  let ws = windowMap.get(w.hash());
  if (!ws) {
    return;
  }
  log('windowDidClose ' + w.title() + ' APPNAME: ' +  w.app().name() + ' HASH: ' + w.hash() + ' removing from: ' + ws.id);
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

Event.on('mouseDidMove', (p) => {
  let w = Window.recent().find(w => pointInsideFrame(p, w.frame()));
  // log(w?.title());
  w?.focus();
});

