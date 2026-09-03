declare interface ISettings {
  base_url: string;
  kp_appkey: string;
  kp_secretkey: string;
  qxin_appkey: string;
  qxin_secretkey: string;
  version: string;
}

declare interface INewParams {
  province_code: string;
  start_date?: string;
  pageIndex?: number;
  industry_code: string;
}

declare interface INewCompany {
  name: string;
  start_date: string;
  oper_name: string;
  credit_no: string;
  reg_capi_desc: string;
  reg_no: string;
  status: string;
  address: string;
  district: string;
  regist_capi: string;
}

declare interface IndustryCode {
  label: string;
  value: string;
  key: number;
}
