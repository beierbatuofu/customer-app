//社保信息

const getInsuredCount = (basic_endownment_num: string) => {
  let insured_count: any = undefined;
  try {
    const result = basic_endownment_num.match(/\d+\.?\d+/)?.[0] || "";
    if (isNaN(result as any)) {
      insured_count = 0;
    } else {
      insured_count = Number(result);
    }
  } catch (e) {
    return insured_count;
  }
  return insured_count;
};
async function socialSecurity(ins: any, keyword: string) {
  try {
    const results = await ins.get(`https://api.qixin.com/APIService/reports/getSocialSecurityByName`, {
      params: {
        keyword,
      },
    });

    const response = results.data;
    if (response.status == 200) {
      const { social_security = { basic_endownment_num: "" } } = response.data.items[0];
      const { basic_endownment_num = "" } = social_security;
      const insured_count = getInsuredCount(basic_endownment_num);
      return {
        insured_count,
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

export default socialSecurity;
