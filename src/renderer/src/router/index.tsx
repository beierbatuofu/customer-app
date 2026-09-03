import IndexPage from "@renderer/pages/index/index.page";
import { Navigate } from "react-router-dom";
import Layout from "@renderer/components/Layout";

export const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/index",
        key: "index",
        label: "工作台",
        element: <IndexPage />,
      },
      {
        path: "/",
        key: "index",
        label: "工作台",
        element: <Navigate to='/index' replace />,
      },
    ],
  },
];
