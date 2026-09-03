import { HashRouter, Route, Routes } from "react-router-dom";
import { routes } from "@renderer/router/index";
import { ConfigProvider } from "antd";

import { styled } from "styled-components";
import "dayjs/locale/zh-cn";
import AntdZhCN from "antd/locale/zh_CN";
import "./assets/app.scss";

const Container = styled.div``;

function App(): React.JSX.Element {
  return (
    <>
      <Container>
        <ConfigProvider
          locale={AntdZhCN}
          theme={{
            components: {
              Popover: {
                titleMinWidth: "auto",
              },
              Menu: {
                itemBg: "transparent",
                itemBorderRadius: 0,
                darkItemSelectedBg: "#3f5763",
                itemMarginInline: 0,
                itemMarginBlock: 0,
              },

              Drawer: {
                paddingLG: 0,
              },
              Form: {
                labelColonMarginInlineEnd: 6,
              },
              Table: {
                headerBg: "#fff",
                cellPaddingInline: 0,
              },
            },
          }}
        >
          <HashRouter>
            <Routes>
              {routes.map((route: any) => (
                <Route key={route.path} path={route.path} element={route.element}>
                  {route.children &&
                    route.children.map((props: any) => {
                      const { element } = props;

                      return <Route key={props.path} path={props.path} element={element} />;
                    })}
                </Route>
              ))}
            </Routes>
          </HashRouter>
        </ConfigProvider>
      </Container>
    </>
  );
}

export default App;
