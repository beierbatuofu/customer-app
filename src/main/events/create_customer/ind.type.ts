// 纳税人类型，1：一般纳税人 0：小规模纳税人 -1：其他
import { kp_industry } from "./kp.ind";
async function indType(ins: any, name: string) {
  try {
    const result = await ins.get(`https://api.qixin.com/APIService/enterprise/getIndClass`, {
      params: {
        name,
      },
    });
    const response = result.data;

    //mock
    // const { industry_name, industry_code } = { industry_code: "A0000", industry_name: "农业" };

    // let platform_industry: string = "";
    // if (industry_code == "J6800") {
    //   platform_industry = "保险业";
    // } else {
    //   const result = kp_industry.find((item) => item.value == industry_code.charAt(0));
    //   platform_industry = result ? result.label : "";
    // }

    // return {
    //   industry_name,
    //   platform_industry,
    // };

    if (response.status == 200) {
      const { industry_name, industry_code } = response.data;
      let platform_industry: string = "";
      if (industry_code == "J6800") {
        platform_industry = "保险业";
      } else {
        const result = kp_industry.find((item) => item.value == industry_code.charAt(0));
        platform_industry = result ? result.label : "";
      }

      return {
        industry_name,
        platform_industry,
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
export default indType;
