import React from "react";
import { Table } from "antd";
import { styled } from "styled-components";

const Wrapper = styled.div``;

const COLUMNS: {
  title: string;
  dataIndex: keyof INewCompany;
  key: keyof INewCompany;
  width?: number | string;
  ellipsis?: boolean | { showTitle?: boolean };
  fixed?: "left" | "right";
}[] = [
  {
    title: "企业名称",
    dataIndex: "name",
    key: "name",
    fixed: "left",
  },
  {
    title: "注册资本(万元)",
    dataIndex: "regist_capi",
    key: "regist_capi",
  },
  {
    title: "企业法人",
    dataIndex: "oper_name",
    key: "oper_name",
  },
  {
    title: "成立日期",
    dataIndex: "start_date",
    key: "start_date",
  },
  {
    title: "统一社会信用代码",
    dataIndex: "credit_no",
    key: "credit_no",
  },
  {
    title: "企业状态",
    dataIndex: "status",
    key: "status",
  },
  {
    title: "企业地址",
    dataIndex: "address",
    key: "address",
  },
  {
    title: "所在区域",
    dataIndex: "district",
    key: "district",
  },
];

const TableData: React.FC<{ onSelectChange: (selectedRowKeys: INewCompany[]) => void; data: INewCompany[]; pageIndex: number; onPageChange: (page: number) => void; total: number }> = ({
  onSelectChange,
  //@ts-ignore
  data,
  pageIndex,
  onPageChange,
  total,
}) => {
  console.log(data, "data");
  return (
    <Wrapper>
      <Table
        scroll={{ x: "max-content", y: "calc(100vh - 290px)" }}
        rowKey='credit_no'
        rowSelection={{
          type: "checkbox",
          hideSelectAll: false,
          onChange(_, selectedRows) {
            onSelectChange(selectedRows as unknown as INewCompany[]);
          },
        }}
        pagination={{
          showQuickJumper: true,
          showSizeChanger: false,
          pageSize: 20,

          total: total,
          showTotal: (total: number) => `共${total}条`,
          current: pageIndex,
          onChange: (page) => {
            onPageChange(page);
          },
        }}
        bordered={true}
        size='small'
        columns={COLUMNS}
        dataSource={data}
      />
    </Wrapper>
  );
};

export default TableData;
