import React, { useState, useEffect } from "react";
import { Modal, Transfer, Table, Button, Flex, Space } from "antd";
import { styled } from "styled-components";
import IndexDB, { update, reader } from "@renderer/indexdb";
import industryCodes from "@renderer/industry.code";

const Wrapper = styled.div`
  width: 100%;
`;
const TableWrapper = styled.div`
  padding: 0 10px;
`;

const FooterBtns = styled(Flex)`
  padding-top: 20px;
`;

const IndexDBIns = new IndexDB("base", "configs", { keyPath: "_name" });

const IndModal: React.FC<{
  visible: boolean;
  onOk: (values: IndustryCode[]) => void;
  onCancel: () => void;
}> = ({ visible, onOk, onCancel }) => {
  const [selectedKeys, setSelectedKeys] = useState<any[]>([]);
  useEffect(() => {
    if (!visible) return;
    reader(IndexDBIns?.indexdb?.result, "configs", "industry").then((res) => {
      if (res) {
        const { options } = res;
        setSelectedKeys(options.map((item: any) => item.key));
      }
    });
  }, [visible]);

  const handleOk = () => {
    const result = industryCodes.filter((item: any) => selectedKeys.includes(item.key));
    update(IndexDBIns.indexdb.result, "configs", {
      _name: "industry",
      options: result,
    }).then(() => {
      onOk(result);
    });
  };

  return (
    <Modal
      mask={false}
      footer={null}
      width={1000}
      title='设置行业分类'
      open={visible}
      onCancel={() => {
        onCancel();
      }}
    >
      <Wrapper>
        <Transfer
          showSearch={true}
          targetKeys={selectedKeys}
          onChange={(targetKeys: any) => {
            console.log(targetKeys);
            setSelectedKeys(targetKeys);
          }}
          titles={["行业分类", "已选择行业"]}
          showSelectAll={false}
          style={{ width: "100%" }}
          dataSource={industryCodes}
        >
          {({ filteredItems, onItemSelect, onItemSelectAll, selectedKeys: listSelectedKeys, disabled: listDisabled }) => {
            const rowSelection = {
              getCheckboxProps: () => ({ disabled: listDisabled }),
              onChange(selectedRowKeys) {
                onItemSelectAll(selectedRowKeys, "replace");
              },
              selectedRowKeys: listSelectedKeys,
            };

            return (
              <TableWrapper>
                <Table
                  size='small'
                  rowSelection={rowSelection}
                  scroll={{ x: "max-content", y: 400 }}
                  columns={[
                    {
                      title: "行业名称",
                      key: "label",
                      dataIndex: "label",
                    },
                    {
                      title: "行业代码",
                      key: "value",
                      dataIndex: "value",
                      align: "center",
                    },
                  ]}
                  dataSource={filteredItems}
                  onRow={({ key }: any) => ({
                    onClick: () => {
                      onItemSelect(key, !listSelectedKeys.includes(key));
                    },
                  })}
                />
              </TableWrapper>
            );
          }}
        </Transfer>

        <FooterBtns justify='flex-end'>
          <Space>
            <Button type='primary' onClick={handleOk}>
              保存
            </Button>
            <Button
              onClick={() => {
                onCancel();
              }}
            >
              取消
            </Button>
          </Space>
        </FooterBtns>
      </Wrapper>
    </Modal>
  );
};

export default IndModal;
