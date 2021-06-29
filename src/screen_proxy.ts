import { screens, workspaces, focusWindow } from './globals';
import { Workspace } from "./workspace";
const phoenixApp = App.get('Phoenix') || App.get('Phoenix (Debug)');
import { titleModal, showCenterOn, titleModalOn } from './modal';
export class ScreenProxy {
  screen;
  id;
  workspace: Workspace | null = null;
  constructor(screen: Screen, id: number) {
    this.screen = screen;
    this.id = id;
  }

  setWorkspace(workspaceId: number) {
    if (this.workspace?.screen?.id === this.id) {
      this.workspace.screen = null;
    }

    let ws = workspaces[workspaceId];
    this.workspace = ws;
    ws.screen = this;
  }

  activateWorkspace(workspaceId: number) {
    this.setWorkspace(workspaceId);
    let ws = workspaces[workspaceId];
    ws.render();
    focusWindow(ws.windows[0]);
    Phoenix.log(this.id + ' ' + this.workspace?.id);
    this.vlog('Activated');
  }

  vlog(msg: string, append_workspace = true) {
    if (append_workspace) {
      msg += ' ' + this.workspace?.id
    }
    titleModalOn(this.screen, msg , 1, phoenixApp && phoenixApp.icon());
  }

  hideAllApps() {
    let b = this.screen.frame();
    this.screen.windows({ visible: true }).forEach(w => {
      b.y = b.height;
      w.setTopLeft(b);
    });
  }

}
