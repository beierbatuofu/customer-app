import React, { useState, useEffect } from "react";
import { Modal, Divider, Form, Input, Flex, Space, Button } from "antd";
import { styled } from "styled-components";
import IndexDB, { update, reader } from "@renderer/indexdb";

const Wrapper = styled.div``;

const IndexDBIns = new IndexDB("base", "configs", { keyPath: "_name" });
const SettingsModal: React.FC<{
  visible: boolean;
  onOk: (values: ISettings) => void;
  onCancel: () => void;
  onDBError: () => void;
}> = ({ visible, onOk, onCancel, onDBError }) => {
  const [count, setCount] = useState(0);

  const [initValues, setInitValues] = useState(Object.create(null));
  const onFinish = (values: ISettings) => {
    update(IndexDBIns.indexdb.result, "configs", {
      _name: "config",
      ...values,
    });

    onOk(values);
  };

  useEffect(() => {
    if (!visible) return;
    reader(IndexDBIns?.indexdb?.result, "configs", "config")
      .then((res) => {
        if (res) {
          const { _name, ...rest } = res;
          console.log(rest, "restrestrest");
          setInitValues({ ...rest });
          setCount(count + 1);
        }
      })
      .catch(() => {
        onDBError();
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal
      mask={false}
      footer={null}
      width={800}
      title='参数设置'
      open={visible}
      onCancel={() => {
        onCancel();
      }}
    >
      <Wrapper>
        <Form key={count} onFinish={onFinish} initialValues={initValues} labelCol={{ span: 4 }}>
          <Divider titlePlacement='start' plain>
            快普
          </Divider>
          <Form.Item label='前置URL' name='base_url'>
            <Input placeholder='请输入' />
          </Form.Item>
          <Form.Item label='version' name='version'>
            <Input placeholder='请输入' />
          </Form.Item>
          <Form.Item label='appkey' name='kp_appkey'>
            <Input placeholder='请输入' />
          </Form.Item>
          <Form.Item label='secretkey' name='kp_secretkey'>
            <Input placeholder='请输入' />
          </Form.Item>
          <Divider titlePlacement='start' plain>
            启信宝
          </Divider>
          <Form.Item label='appkey' name='qxin_appkey'>
            <Input placeholder='请输入' />
          </Form.Item>
          <Form.Item label='secretkey' name='qxin_secretkey'>
            <Input placeholder='请输入' />
          </Form.Item>
          <Form.Item>
            <Flex justify='right'>
              <Space>
                <Button type='primary' htmlType='submit'>
                  保存
                </Button>
                <Button onClick={() => onCancel()}>取消</Button>
              </Space>
            </Flex>
          </Form.Item>
        </Form>
      </Wrapper>
    </Modal>
  );
};

export default SettingsModal;
