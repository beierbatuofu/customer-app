import React from "react";
import { styled } from "styled-components";
import { Tooltip, Form, Button, Select, DatePicker, Flex } from "antd";
import { citys_code } from "@renderer/pca";
import { SearchOutlined } from "@ant-design/icons";

const Wrapper = styled.div`
  padding: 15px 0 0;
`;
const FormStyle = styled(Form)`
  width: 100%;
  display: flex;
  column-gap: 20px;
`;
const SelectStyle = styled(Select)`
  width: 100%;
`;

const FormItem = styled(Form.Item)`
  width: 20%;
`;

const DatePickerStyle = styled(DatePicker)`
  width: 100%;
`;

const SearchNew: React.FC<{ options: IndustryCode[]; loading: boolean; onSubmit: (arr: INewParams) => void; ref: any }> = ({ options, loading, onSubmit, ref }) => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    const { province_code, date, industry_code } = values;
    const start_date = date ? date.format("YYYY-MM-DD") : undefined;
    onSubmit({
      province_code,
      start_date,
      industry_code,
    });
  };

  return (
    <Wrapper>
      <FormStyle form={form} autoComplete='off' onFinish={onFinish}>
        <FormItem rules={[{ required: true, message: "请选择省份" }]} label='地区/省市' name='province_code'>
          <SelectStyle
            showSearch={{
              filterOption: (input: string, option: unknown) => {
                return (option as Record<"label" | "value", string>).label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
              },
            }}
            options={citys_code}
          />
        </FormItem>
        <FormItem label='成立时间' name='date'>
          <DatePickerStyle format='YYYY-MM-DD' />
        </FormItem>
        <FormItem label='行业分类' name='industry_code'>
          <SelectStyle
            options={options}
            showSearch={{ filterOption: (input: string, option: unknown) => (option as Record<"label" | "value", string>).label.toLowerCase().indexOf(input.toLowerCase()) >= 0 }}
            placeholder='请选择'
          />
        </FormItem>
        <Form.Item label={null}>
          <Flex>
            <Tooltip placement='right' title='查询新增企业'>
              <Button ref={ref} loading={loading} htmlType='submit' icon={<SearchOutlined />} type='primary'>
                查询
              </Button>
            </Tooltip>
          </Flex>
        </Form.Item>
      </FormStyle>
    </Wrapper>
  );
};

export default SearchNew;
