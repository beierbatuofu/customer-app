import { BaseEvent } from "../BaseEvent";
import { CREATE_CUSTOMER } from "../event.names";
import { MEMORY_DATA } from "../../config";
import { md5, useAxios, createQxinSign, setError, dateFormat, setSuccess } from "../utils";
import annualReport from "./annual.report";
import socialSecurity from "./social.security";
import taxPayer from "./tax.payer";
import basicInfo from "./basic.info";
import indType from "./ind.type";

async function emitter(names: string[]) {
  const { qxin_appkey = undefined, qxin_secretkey = undefined, kp_appkey = undefined, kp_secretkey = undefined, base_url = undefined } = MEMORY_DATA.config;

  if (!qxin_appkey || !qxin_secretkey) {
    return setError("请在设置中配置启信宝appkey和secretkey");
  }

  if (!kp_appkey || !kp_secretkey || !base_url) {
    return setError("请在设置中配置快普的appkey、secretkey和base_url");
  }

  const results: any[] = [];
  const hasCreateds: string[] = [];
  console.log(hasCreateds, "hasCreateds");
  // let qxin_error: any = null;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (hasCreateds.includes(name)) {
      continue;
    }
    const { err = "{}", ...rest } = await qxin(name);
    // qxin_error = JSON.parse(err);

    const kp_res = await kp({
      cust_name: name,
      ...(rest || {}), // TODO: 处理数据
    });
    hasCreateds.push(name);

    results.push(`${name}:${kp_res}`); // TODO: 处理结果
  }

  // if (qxin_error?.status != 200) {
  //   return setError(`启信宝:${qxin_error.message},无法在快普中创建客户`);
  // }

  return setSuccess(results);
}

async function qxin(name: string) {
  const { qxin_appkey, qxin_secretkey } = MEMORY_DATA.config;
  const instance = useAxios({
    appkey: qxin_appkey,
    timestamp: Date.now(),
    sign: createQxinSign(qxin_appkey, qxin_secretkey),
    "Auth-version": "2.0",
  });
  try {
    const base_info_res = await basicInfo(instance, name); // 基本信息
    const annual_report_res = await annualReport(instance, name); // 年报信息
    const social_security_res = await socialSecurity(instance, name); // 社保信息
    const tax_payer_res = await taxPayer(instance, name); // 税人信息
    const industry_type_res = await indType(instance, name); // 行业信息
    console.log("工商照面", JSON.stringify(base_info_res)); // TODO: 处理数据
    console.log("年报信息", JSON.stringify(annual_report_res)); // TODO: 处理数据
    console.log("社保信息", JSON.stringify(social_security_res)); // TODO: 处理数据
    console.log("纳税人信息", JSON.stringify(tax_payer_res)); // TODO: 处理数据
    console.log("行业信息", JSON.stringify(industry_type_res)); // TODO: 处理数据
    return {
      ...base_info_res,
      ...annual_report_res,
      ...social_security_res,
      ...tax_payer_res,
      ...industry_type_res,
    };
  } catch (e) {
    return {};
  }
}

async function kp(params: Record<string, any>) {
  console.log("创建客户", params.cust_name);
  const defParams = {
    cust_name: "",
    custom_supplier_type: "客户",
    custom_type: "终端客户",
    cust_souer1: "其他",
    cust_type: "单位客户",
    areald_name: "杨浦区",
    company_address: "无",
    cust_code: "自动生成",
  };
  const { kp_appkey, kp_secretkey, base_url, version } = MEMORY_DATA.config;
  const timestamp = dateFormat("YYYY-MM-DD HH:mm:ss", new Date());
  const kpBody = {
    request: {
      iot_create_customer: {
        ...defParams,
        ...params,
      },
    },
  };
  const sBody = JSON.stringify(kpBody);

  const method = "iot_create_customer";
  const sign = md5(`${kp_secretkey}app_key${kp_appkey}formatjsonmethod${method}timestamp${timestamp}version${version}${sBody}${kp_secretkey}`);
  const API_URL = `${base_url}/WebApi/DoWebApi?app_key=`;

  const api = `${API_URL}${kp_appkey}&format=json&method=${method}&timestamp=${timestamp}&version=${version}&sign=${sign}`;

  const instance = useAxios({
    timeout: 1000 * 60,
    headers: {
      "Content-Type": "application/json",
    },
  });
  try {
    const result = await instance({
      method: "POST",
      url: api,
      data: sBody,
    });
    console.log(JSON.stringify(result.data), "result.data");
    if (result.data.response.flag) {
      let { msg, iot_create_customers } = result.data.response;
      try {
        return `${msg}单号${iot_create_customers.iot_create_customer[0].cust_code}`;
      } catch (e) {
        return JSON.stringify(e);
      }
    } else {
      return result.data.response.msg;
    }
  } catch (e) {
    return setError(`创建客户失败: ${JSON.stringify(e)}`);
  }
}

class CreateCustomerEvent extends BaseEvent {
  constructor() {
    super(CREATE_CUSTOMER, emitter);
  }
}

export const createCustomerIns = new CreateCustomerEvent();
