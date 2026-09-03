import { Outlet } from "react-router-dom";

import { styled } from "styled-components";

const AppWrapper = styled.div`
  height: calc(100vh - 36px);
`;
const Layout = () => {
  return (
    <AppWrapper>
      <Outlet />
    </AppWrapper>
  );
};

export default Layout;
