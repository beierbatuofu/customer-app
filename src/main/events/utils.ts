import crypto from "crypto";
import axios from "axios";
export const createQxinSign = (appkey: string, secretKey: string) => {
  const timestamp = Date.now();
  const source = `${appkey}${timestamp}${secretKey}`;
  const sign = crypto.createHash("md5").update(source, "utf8").digest("hex");
  return sign;
};

export const useAxios = (config: Record<string, any> = {}) => {
  const headerConfig = Object.assign(
    {
      "Content-Type": "application/json",
    },
    config
  );

  const ins = axios.create({
    timeout: 1000 * 60,
    headers: headerConfig,
  });

  const responseReject = (error: any) => {
    return Promise.reject(error);
  };
  const responseResolve = (response: any) => {
    return response;
  };

  const requestReject = () => {
    return Promise.reject();
  };

  const requestResolve = (config: any) => {
    return config;
  };
  ins.interceptors.request.use(requestResolve, requestReject);

  ins.interceptors.response.use(responseResolve, responseReject);
  return ins;
};

export const md5 = (text: string) => {
  const md5 = crypto.createHash("md5");
  return md5.update(String(text)).digest("hex").toUpperCase();
};
export const setError = (msg: string = "") => {
  return {
    status: -1,
    message: msg,
    data: null,
  };
};

export const setSuccess = (data: any, msg: string = "success") => {
  return {
    status: 200,
    message: msg,
    data,
  };
};

export const dateFormat = (fmt, date) => {
  var o = {
    Y: date.getFullYear(), //年份
    M: date.getMonth() + 1, //月份
    D: date.getDate(), //日
    H: date.getHours(), //小时
    m: date.getMinutes(), //分
    s: date.getSeconds(), //秒
  };

  return fmt.replace(/([YMDHms])+/g, function (_, key) {
    var value = o[key];
    if (["H", "M", "D", "m", "s"].includes(key)) {
      value = String(value).padStart(2, "0");
    }
    return value;
  });
};
