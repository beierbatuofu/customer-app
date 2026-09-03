import React from "react";
import { styled } from "styled-components";

const HeaderWrapper = styled.div`
  -webkit-app-region: drag;
  height: 36px;
  line-height: 36px;
  background-color: #ededed;
  porsition: relative;
  text-align: center;
  overflow: hidden;
  font-size: 14px;
  color: #000;
`;

const GlobalHeader: React.FC = () => {
  return <HeaderWrapper>客商信息管理</HeaderWrapper>;
};

export default GlobalHeader;
