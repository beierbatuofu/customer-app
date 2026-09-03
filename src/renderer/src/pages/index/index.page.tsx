import React, { useState, useEffect, useRef } from "react";
import { sendEvent, listenMenuAction, ListenEvent } from "@renderer/utils";
import { styled } from "styled-components";
import { Flex, Button, message, Tooltip, Modal, Tour } from "antd";
import { kp_def_config } from "./config";
import SettingsModal from "./settings.modal";
import IndModal from "./ind.modal";
import SearchNew from "./search.new";
import TableData from "./table.data";
import IndexDB, { reader, update } from "@renderer/indexdb";
import { AppstoreAddOutlined, CloseOutlined } from "@ant-design/icons";
import { default_industry } from "@renderer/industry.code";

let IndexDBIns = new IndexDB("base", "configs", { keyPath: "_name" });

const Wrapper = styled.div`
  padding: 15px;
`;

const MenuFlex = styled(Flex)`
  margin-bottom: 20px;
`;

const NewCustomerStyle = styled.div`
  position: relative;
  padding: 0 8px;
`;
const NewCustomerClose = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
  cursor: pointer;
`;
ListenEvent("update:available", (info) => {
  alert(JSON.stringify(info));
});
const IndexPage: React.FC = () => {
  const names = useRef<string[]>([]);
  //TODO: 从数据库中读取数据,而不是从mock中读取
  const [data, setData] = useState<any>([]);
  const [options, setOptions] = useState<any>([]);
  const [modal, contextModalHolder] = Modal.useModal();
  const [open, setOpen] = useState(false);
  const [openTour, setOpenTour] = useState(false);
  const [openInd, setOpenInd] = useState(false);
  const [indCount, setIndCount] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();
  const [formState, setFormState] = useState<INewParams>(Object.create(null)); // const [province_code, setProvince_code] = useState("");
  const oldPageInd = useRef<number>(1);
  const pageInd = useRef<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const once = useRef<boolean>(true);
  const [newCustomerLoading, setNewCustomerLoading] = useState<boolean>(false);

  const upsertInd = () => {
    reader(IndexDBIns?.indexdb.result, "configs", "industry").then((res) => {
      if (res) {
        const { options } = res;
        setOptions(options);
      } else {
        update(IndexDBIns?.indexdb?.result, "configs", {
          _name: "industry",
          options: default_industry,
        });
        setOptions(default_industry);
      }
    });
  };
  const upsertConfig = () => {
    reader(IndexDBIns?.indexdb?.result, "configs", "config")
      .then((res) => {
        if (res) {
          const { _name, ...rest } = res;
          sendEvent("UPSERT_CONFIG", rest as ISettings);
        } else {
          update(IndexDBIns?.indexdb?.result, "configs", {
            _name: "config",
            ...kp_def_config,
          });

          sendEvent("UPSERT_CONFIG", { ...kp_def_config } as ISettings);
        }
      })
      .catch(() => {
        // console.log("读取配置失败,请重启应用");
        messageApi.error("读取配置失败,请重启应用");
      });
  };

  useEffect(() => {
    IndexDBIns.onSuccess().then(() => {
      upsertConfig();
      upsertInd();
    });
  }, []);

  useEffect(() => {
    const first = window.localStorage.getItem("first");

    if (!first) {
      setOpenTour(true);
    }

    if (once.current) {
      once.current = false;
      return;
    }
    if (!formState.province_code) {
      messageApi.warning("请选择地区/省市");
      return;
    }

    updateTable();
  }, [formState]);

  const updateTable = () => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      sendEvent("QXIN_NEW", {
        ...formState,
        pageIndex: pageInd.current,
      })
        .then((res) => {
          console.log(res, "res");
          if (res.status == 200) {
            setData(res.data.items);
            setTotal(res.data.total);
            resolve(null);
            oldPageInd.current = pageInd.current;
          } else if (res.status == -1) {
            messageApi.warning(`${res.message}`);
            pageInd.current = oldPageInd.current;
            reject("error");
          } else {
            messageApi.warning(`启信宝:${res.message}`);
            pageInd.current = oldPageInd.current;
            reject("error");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

  const handleNewCustomer = () => {
    const values = names.current;
    if (!values.length) {
      messageApi.warning("请选择企业名称");
      return;
    }

    messageApi.destroy();
    const key = "loading";

    modal.confirm({
      okText: "继续",
      cancelText: "取消",
      title: "批量创建客商信息",
      content: `本次创建${values.length}条客商信息,一共消费${Number(values.length * 0.7).toFixed(2)}元将从启信宝中扣除,是否继续?`,
      mask: false,
      onOk: () => {
        setNewCustomerLoading(true);
        messageApi.loading({
          key,
          content: "创建中...",
        });
        console.log(values, "values");
        sendEvent("CREATE_CUSTOMER", values)
          .then((res) => {
            console.log(res, "res");
            if (res.status == 200) {
              messageApi.open({
                style: {
                  marginTop: "5vh",
                },
                content: (
                  <NewCustomerStyle>
                    {res.data.map((item: string) => (
                      <p>{item}</p>
                    ))}
                    <NewCustomerClose onClick={() => messageApi.destroy()}>
                      <CloseOutlined />
                    </NewCustomerClose>
                  </NewCustomerStyle>
                ),
                duration: 0,
              });
            } else {
              messageApi.destroy();
              messageApi.warning(res.message);
            }
          })
          .finally(() => {
            setNewCustomerLoading(false);
          });
      },
    });
  };
  listenMenuAction((action) => {
    if (action === "evn") setOpen(true);
    if (action === "ind") {
      setOpenInd(true);
      setIndCount(indCount + 1);
    }
  });

  const refSearch = useRef<any>(null);
  const refNew = useRef<any>(null);
  const steps = [
    {
      title: "查询新增企业",
      description: "选择地区/省市、成立时间、行业分类，点击查询新增企业",
      target: () => refSearch.current,
    },
    {
      title: "批量创建客商信息",
      description: "勾选企业后点击批量创建，可在快普生成客商信息",
      target: () => refNew.current,
    },
  ];
  return (
    <Wrapper>
      <Tour
        open={openTour}
        onClose={() => {
          setOpenTour(false);
          window.localStorage.setItem("first", new Date().toISOString());
        }}
        steps={steps}
      />
      {contextHolder}
      {contextModalHolder}
      <IndModal
        onCancel={() => {
          setOpenInd(false);
        }}
        onOk={(values: IndustryCode[]) => {
          setOpenInd(false);
          setOptions(values);
          messageApi.success("设置成功", 1);
        }}
        key={indCount}
        visible={openInd}
      />
      <SettingsModal
        key={new Date().getTime()}
        visible={open}
        onOk={(values: ISettings) => {
          setOpen(false);
          messageApi.success("设置成功", 1);
          sendEvent("UPSERT_CONFIG", values);
        }}
        onDBError={() => {
          // messageApi.error("读取配置失败,请重启应用");
        }}
        onCancel={() => setOpen(false)}
      />
      {/* <Flex justify='right'>
        <Tooltip placement='bottom' title='参数设置'>
          <Button shape='circle' onClick={() => setOpen(true)} icon={<SettingOutlined />} />
        </Tooltip>
      </Flex> */}
      <SearchNew
        ref={refSearch}
        loading={loading}
        options={options}
        onSubmit={(values) => {
          modal.confirm({
            okText: "继续",
            cancelText: "取消",
            title: "本次消费2元,将从启信宝账号扣除,是否继续?",
            mask: false,
            onOk: () => {
              pageInd.current = 1;
              setFormState(values);
            },
          });
        }}
      />
      <MenuFlex>
        <Tooltip title='批量创建客商信息' placement='right'>
          <Button ref={refNew} loading={newCustomerLoading} onClick={() => handleNewCustomer()} ghost type='primary' icon={<AppstoreAddOutlined />}>
            批量创建
          </Button>
        </Tooltip>
      </MenuFlex>
      <TableData
        data={data}
        onPageChange={(page) => {
          modal.confirm({
            okText: "继续",
            cancelText: "取消",
            title: "本次消费2元,将从启信宝账号扣除,是否继续?",
            mask: false,
            onOk: () => {
              pageInd.current = page;

              updateTable();
            },
          });
        }}
        onSelectChange={(selectedRowKeys) => {
          names.current = selectedRowKeys.map((item) => item.name);
        }}
        total={total}
        pageIndex={pageInd.current}
      />
    </Wrapper>
  );
};

export default IndexPage;
