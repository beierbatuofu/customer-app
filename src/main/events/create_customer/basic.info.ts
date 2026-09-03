import { area_code_list } from "./pca.code";

const company_type_map: Record<string, string> = {
  "01": "民营企业",
  "03": "政府机关",
  "04": "外资企业",
};

const getRegistCapi = (registCapi: string) => {
  let capital = 0;
  try {
    const result = registCapi.match(/\d+\.?\d+/);
    const value = result?.[0];
    if (isNaN(value as any)) {
      capital = 0;
    } else {
      capital = Number(value);
      if (/万/.test(registCapi)) {
        capital = Number(value) * 10000;
      }
    }
  } catch (e) {}
  return capital;
};

const getAreaName = (code: string): string => {
  let name = "";
  const result = area_code_list.find((item) => item.code == code || String(code).startsWith(item.code));
  if (result) {
    name = result.name;
  }
  return name;
};
// 工商照面
async function basicInfo(ins: any, keyword: string) {
  try {
    const result = await ins.get(`https://api.qixin.com/APIService/enterprise/getBasicInfo`, {
      params: {
        keyword,
      },
    });
    const response = result.data;
    if (response.status == 200) {
      const { registCapi = "", startDate = "", operName: sponsor = "", scope: scope = "", address: byuer_address_tel = "", districtCode = "", type_new = "" } = response.data as Record<string, any>;
      const capital = getRegistCapi(registCapi);
      const record_date = startDate;
      const start_date = startDate;
      const companynatrue1 = company_type_map[type_new] || "";
      const company_address = byuer_address_tel || "";
      const econ_kind = {
        "01": "大陆企业",
        "02": "社会组织",
        "03": "机关及事业单位",
        "04": "港澳台及国外企业",
        "05": "律所及其他组织机构",
      }[type_new];
      const areald_name = getAreaName(districtCode);

      return { capital, record_date, start_date, companynatrue1, company_address, econ_kind, areald_name, sponsor, scope };
    } else {
      return {
        err: JSON.stringify(response),
      };
    }
  } catch (e) {
    return {};
  }
}

export default basicInfo;
