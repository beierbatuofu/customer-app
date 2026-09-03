// 纳税人类型，1：一般纳税人 0：小规模纳税人 -1：其他

function getTaxPayerType(type: string) {
  if (type == "1") {
    return "一般纳税人";
  } else if (type == "0") {
    return "小规模纳税人";
  } else if (type == "-1") {
    return "其他";
  }
  return "其他";
}

async function taxPayer(ins: any, keyword: string) {
  try {
    const result = await ins.get(`https://api.qixin.com/APIService/creditgrade/getTaxpayerListByName`, {
      params: {
        keyword,
      },
    });
    const response = result.data;

    if (response.status == 200) {
      const { common_taxpayer, tax_num: tax_reg_code } = response.data[0];
      const tax_payer_type1 = getTaxPayerType(common_taxpayer);

      return {
        tax_payer_type1,
        tax_reg_code,
      };
    } else {
      return {
        err: JSON.stringify(response),
      };
    }
  } catch (e) {
    return {};
  }
}
export default taxPayer;
