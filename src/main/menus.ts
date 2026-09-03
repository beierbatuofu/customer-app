import { Menu } from "electron";

export const createMenu = (win: any) => {
  const settingItem = {
    label: "设置",
    submenu: [
      {
        label: "参数设置          ",
        click: () => {
          win.webContents.send("open-setting-window", "evn");
        },
      },
      {
        label: "行业设置          ",
        click: () => {
          win.webContents.send("open-setting-window", "ind");
        },
      },
    ],
  };
  return Menu.buildFromTemplate([
    ...(process.platform === "darwin"
      ? [
          { role: "appMenu", label: "客商信息管理" },
          {
            label: "编辑",
            submenu: [
              { role: "undo", label: "撤销" }, // 撤销
              { role: "redo", label: "重做" }, // 重做
              { type: "separator" },
              { role: "cut", label: "剪切" }, // 剪切
              { role: "copy", label: "复制" }, // 复制
              { role: "paste", label: "粘贴" }, // 粘贴
              // 还可以添加 selectAll 等菜单项
              { role: "selectAll", label: "全选" }, // 全选
            ],
          },
          settingItem,
        ]
      : [
          {
            label: "编辑",
            submenu: [
              { role: "undo", label: "撤销" }, // 撤销
              { role: "redo", label: "重做" }, // 重做
              { type: "separator" },
              { role: "cut", label: "剪切" }, // 剪切
              { role: "copy", label: "复制" }, // 复制
              { role: "paste", label: "粘贴" }, // 粘贴
              // 还可以添加 selectAll 等菜单项
              { role: "selectAll", label: "全选" }, // 全选
            ],
          },
          settingItem,
        ]),
  ] as any);
};
