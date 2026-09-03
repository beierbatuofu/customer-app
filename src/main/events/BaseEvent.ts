import { ipcMain } from 'electron';

export abstract class BaseEvent {
  protected eventName: string;
  protected emitter: (...args: any) => any;

  constructor(eventName: string, eventEmitter: (...args: any) => any) {
    this.eventName = eventName;
    this.emitter = eventEmitter;
  }
  public on(webContents: any = undefined) {
    ipcMain.on(this.eventName, (evt, args) => {
      this.emitter(args, webContents)
        .then(
          (response: any) => {
            evt.reply(this.eventName, {
              code: 0,
              data: response,
              msg: 'success'
            });
          },
          (err) => {
            evt.reply(this.eventName, {
              code: 1,
              msg: JSON.stringify(err),
              data: null
            });
          }
        )
        .catch((err: any) => {
          evt.reply(this.eventName, {
            code: 1,
            msg: JSON.stringify(err),
            data: null
          });
        });
    });
  }
}
