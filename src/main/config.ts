import { app } from "electron";
import { is } from "@electron-toolkit/utils";

//win C:\Users\<User>	mac /Users/<User>

const FILE_NAME = `.${Buffer.from("qxin.app", "utf-8").toString("base64")}`;

export const DIR_PATH = is.dev ? `./resources/${FILE_NAME}` : app.getPath("home") + "/" + FILE_NAME;

export const MEMORY_DATA: {
  config: ISettings;
} = {
  config: Object.create(null), //配置文件
};
