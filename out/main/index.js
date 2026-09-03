"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const crypto = require("crypto");
const axios = require("axios");
const electronUpdater = require("electron-updater");
const icon = path.join(__dirname, "../../resources/icon.png");
class BaseEvent {
  eventName;
  emitter;
  constructor(eventName, eventEmitter) {
    this.eventName = eventName;
    this.emitter = eventEmitter;
  }
  on(webContents = void 0) {
    electron.ipcMain.on(this.eventName, (evt, args) => {
      this.emitter(args, webContents).then(
        (response) => {
          evt.reply(this.eventName, {
            code: 0,
            data: response,
            msg: "success"
          });
        },
        (err) => {
          evt.reply(this.eventName, {
            code: 1,
            msg: JSON.stringify(err),
            data: null
          });
        }
      ).catch((err) => {
        evt.reply(this.eventName, {
          code: 1,
          msg: JSON.stringify(err),
          data: null
        });
      });
    });
  }
}
const UPSERT_CONFIG = "upsert:config";
const QXIN_NEW = "qxin:new";
const CREATE_CUSTOMER = "create:customer";
const FILE_NAME = `.${Buffer.from("qxin.app", "utf-8").toString("base64")}`;
utils.is.dev ? `./resources/${FILE_NAME}` : electron.app.getPath("home") + "/" + FILE_NAME;
const MEMORY_DATA = {
  config: /* @__PURE__ */ Object.create(null)
  //配置文件
};
const emitter$2 = async function(values) {
  MEMORY_DATA.config = values;
};
class UpsertConfig extends BaseEvent {
  constructor() {
    super(UPSERT_CONFIG, emitter$2);
  }
}
const upsertConfigIns = new UpsertConfig();
const createQxinSign = (appkey, secretKey) => {
  const timestamp = Date.now();
  const source = `${appkey}${timestamp}${secretKey}`;
  const sign = crypto.createHash("md5").update(source, "utf8").digest("hex");
  return sign;
};
const useAxios = (config = {}) => {
  const headerConfig = Object.assign(
    {
      "Content-Type": "application/json"
    },
    config
  );
  const ins = axios.create({
    timeout: 1e3 * 60,
    headers: headerConfig
  });
  const responseReject = (error) => {
    return Promise.reject(error);
  };
  const responseResolve = (response) => {
    return response;
  };
  const requestReject = () => {
    return Promise.reject();
  };
  const requestResolve = (config2) => {
    return config2;
  };
  ins.interceptors.request.use(requestResolve, requestReject);
  ins.interceptors.response.use(responseResolve, responseReject);
  return ins;
};
const md5 = (text) => {
  const md52 = crypto.createHash("md5");
  return md52.update(String(text)).digest("hex").toUpperCase();
};
const setError = (msg = "") => {
  return {
    status: -1,
    message: msg,
    data: null
  };
};
const setSuccess = (data, msg = "success") => {
  return {
    status: 200,
    message: msg,
    data
  };
};
const dateFormat = (fmt, date) => {
  var o = {
    Y: date.getFullYear(),
    //年份
    M: date.getMonth() + 1,
    //月份
    D: date.getDate(),
    //日
    H: date.getHours(),
    //小时
    m: date.getMinutes(),
    //分
    s: date.getSeconds()
    //秒
  };
  return fmt.replace(/([YMDHms])+/g, function(_, key) {
    var value = o[key];
    if (["H", "M", "D", "m", "s"].includes(key)) {
      value = String(value).padStart(2, "0");
    }
    return value;
  });
};
const emitter$1 = async function(values) {
  console.log(values, "values");
  const { qxin_appkey = void 0, qxin_secretkey = void 0 } = MEMORY_DATA.config;
  const { pageIndex = 1, province_code = void 0, start_date = void 0, industry_code = void 0 } = values;
  if (!qxin_appkey || !qxin_secretkey) return setError("请在设置中配置启信宝appkey和secretkey");
  if (!province_code) return setError("请选择省份");
  const skip = (pageIndex - 1) * 20;
  const instance = useAxios({
    appkey: qxin_appkey,
    timestamp: Date.now(),
    sign: createQxinSign(qxin_appkey, qxin_secretkey),
    "Auth-version": "2.0"
  });
  try {
    const res = await instance.get(`https://api.qixin.com/APIService/enterprise/getNewEnt`, {
      params: {
        province_code,
        start_date,
        industry_code,
        skip
      }
    });
    console.log(res.request.path, "res");
    console.log(JSON.stringify(res.data), "res.data");
    return res.data;
  } catch (err) {
    return setError(JSON.stringify(err));
  }
};
class QxinNew extends BaseEvent {
  constructor() {
    super(QXIN_NEW, emitter$1);
  }
}
const qxinNewIns = new QxinNew();
async function annualReport(ins, keyword) {
  try {
    const result = await ins.get(`https://api.qixin.com/APIService/reports/getReportListByName`, {
      params: {
        keyword
      }
    });
    const response = result.data;
    if (response.status == 200) {
      const { sale_income = "", prac_person_num = "" } = response.data[0];
      let custstaff_scope = void 0;
      const nysgm1_0003447782_ex = isNaN(sale_income) ? "" : Number(sale_income);
      if (isNaN(prac_person_num)) {
        custstaff_scope = void 0;
      } else {
        const num = Number(prac_person_num);
        if (num < 14) {
          custstaff_scope = "15人以内";
        } else if (num < 50) {
          custstaff_scope = "15-50人";
        } else if (num < 100) {
          custstaff_scope = "50-100人";
        } else if (num < 200) {
          custstaff_scope = "100-200人";
        } else if (num < 500) {
          custstaff_scope = "200-500人";
        } else if (num < 800) {
          custstaff_scope = "500-800人";
        } else if (num < 1e3) {
          custstaff_scope = "800-1000人";
        } else if (num < 2e3) {
          custstaff_scope = "1000-2000人";
        } else if (num < 5e3) {
          custstaff_scope = "2000-5000人";
        } else {
          custstaff_scope = "5000人以上";
        }
      }
      return {
        custstaff_scope,
        nysgm1_0003447782_ex
      };
    } else {
      return {
        err: JSON.stringify(response)
      };
    }
  } catch (e) {
    console.log(e);
    return {};
  }
}
const getInsuredCount = (basic_endownment_num) => {
  let insured_count = void 0;
  try {
    const result = basic_endownment_num.match(/\d+\.?\d+/)?.[0] || "";
    if (isNaN(result)) {
      insured_count = 0;
    } else {
      insured_count = Number(result);
    }
  } catch (e) {
    return insured_count;
  }
  return insured_count;
};
async function socialSecurity(ins, keyword) {
  try {
    const results = await ins.get(`https://api.qixin.com/APIService/reports/getSocialSecurityByName`, {
      params: {
        keyword
      }
    });
    const response = results.data;
    if (response.status == 200) {
      const { social_security = { basic_endownment_num: "" } } = response.data.items[0];
      const { basic_endownment_num = "" } = social_security;
      const insured_count = getInsuredCount(basic_endownment_num);
      return {
        insured_count
      };
    } else {
      return {
        err: JSON.stringify(response)
      };
    }
  } catch (e) {
    return {};
  }
}
function getTaxPayerType(type) {
  if (type == "1") {
    return "一般纳税人";
  } else if (type == "0") {
    return "小规模纳税人";
  } else if (type == "-1") {
    return "其他";
  }
  return "其他";
}
async function taxPayer(ins, keyword) {
  try {
    const result = await ins.get(`https://api.qixin.com/APIService/creditgrade/getTaxpayerListByName`, {
      params: {
        keyword
      }
    });
    const response = result.data;
    if (response.status == 200) {
      const { common_taxpayer, tax_num: tax_reg_code } = response.data[0];
      const tax_payer_type1 = getTaxPayerType(common_taxpayer);
      return {
        tax_payer_type1,
        tax_reg_code
      };
    } else {
      return {
        err: JSON.stringify(response)
      };
    }
  } catch (e) {
    return {};
  }
}
const pca_code_list = [
  {
    code: "11",
    name: "北京市",
    children: [
      {
        code: "110101",
        name: "东城区"
      },
      {
        code: "110102",
        name: "西城区"
      },
      {
        code: "110105",
        name: "朝阳区"
      },
      {
        code: "110106",
        name: "丰台区"
      },
      {
        code: "110107",
        name: "石景山区"
      },
      {
        code: "110108",
        name: "海淀区"
      },
      {
        code: "110109",
        name: "门头沟区"
      },
      {
        code: "110111",
        name: "房山区"
      },
      {
        code: "110112",
        name: "通州区"
      },
      {
        code: "110113",
        name: "顺义区"
      },
      {
        code: "110114",
        name: "昌平区"
      },
      {
        code: "110115",
        name: "大兴区"
      },
      {
        code: "110116",
        name: "怀柔区"
      },
      {
        code: "110117",
        name: "平谷区"
      },
      {
        code: "110118",
        name: "密云区"
      },
      {
        code: "110119",
        name: "延庆区"
      }
    ]
  },
  {
    code: "12",
    name: "天津市",
    children: [
      {
        code: "120101",
        name: "和平区"
      },
      {
        code: "120102",
        name: "河东区"
      },
      {
        code: "120103",
        name: "河西区"
      },
      {
        code: "120104",
        name: "南开区"
      },
      {
        code: "120105",
        name: "河北区"
      },
      {
        code: "120106",
        name: "红桥区"
      },
      {
        code: "120110",
        name: "东丽区"
      },
      {
        code: "120111",
        name: "西青区"
      },
      {
        code: "120112",
        name: "津南区"
      },
      {
        code: "120113",
        name: "北辰区"
      },
      {
        code: "120114",
        name: "武清区"
      },
      {
        code: "120115",
        name: "宝坻区"
      },
      {
        code: "120116",
        name: "滨海新区"
      },
      {
        code: "120117",
        name: "宁河区"
      },
      {
        code: "120118",
        name: "静海区"
      },
      {
        code: "120119",
        name: "蓟州区"
      }
    ]
  },
  {
    code: "13",
    name: "河北省",
    children: [
      {
        code: "1301",
        name: "石家庄市"
      },
      {
        code: "1302",
        name: "唐山市"
      },
      {
        code: "1303",
        name: "秦皇岛市"
      },
      {
        code: "1304",
        name: "邯郸市"
      },
      {
        code: "1305",
        name: "邢台市"
      },
      {
        code: "1306",
        name: "保定市"
      },
      {
        code: "1307",
        name: "张家口市"
      },
      {
        code: "1308",
        name: "承德市"
      },
      {
        code: "1309",
        name: "沧州市"
      },
      {
        code: "1310",
        name: "廊坊市"
      },
      {
        code: "1311",
        name: "衡水市"
      }
    ]
  },
  {
    code: "14",
    name: "山西省",
    children: [
      {
        code: "1401",
        name: "太原市"
      },
      {
        code: "1402",
        name: "大同市"
      },
      {
        code: "1403",
        name: "阳泉市"
      },
      {
        code: "1404",
        name: "长治市"
      },
      {
        code: "1405",
        name: "晋城市"
      },
      {
        code: "1406",
        name: "朔州市"
      },
      {
        code: "1407",
        name: "晋中市"
      },
      {
        code: "1408",
        name: "运城市"
      },
      {
        code: "1409",
        name: "忻州市"
      },
      {
        code: "1410",
        name: "临汾市"
      },
      {
        code: "1411",
        name: "吕梁市"
      }
    ]
  },
  {
    code: "15",
    name: "内蒙古自治区",
    children: [
      {
        code: "1501",
        name: "呼和浩特市"
      },
      {
        code: "1502",
        name: "包头市"
      },
      {
        code: "1503",
        name: "乌海市"
      },
      {
        code: "1504",
        name: "赤峰市"
      },
      {
        code: "1505",
        name: "通辽市"
      },
      {
        code: "1506",
        name: "鄂尔多斯市"
      },
      {
        code: "1507",
        name: "呼伦贝尔市"
      },
      {
        code: "1508",
        name: "巴彦淖尔市"
      },
      {
        code: "1509",
        name: "乌兰察布市"
      },
      {
        code: "1522",
        name: "兴安盟"
      },
      {
        code: "1525",
        name: "锡林郭勒盟"
      },
      {
        code: "1529",
        name: "阿拉善盟"
      }
    ]
  },
  {
    code: "21",
    name: "辽宁省",
    children: [
      {
        code: "2101",
        name: "沈阳市"
      },
      {
        code: "2102",
        name: "大连市"
      },
      {
        code: "2103",
        name: "鞍山市"
      },
      {
        code: "2104",
        name: "抚顺市"
      },
      {
        code: "2105",
        name: "本溪市"
      },
      {
        code: "2106",
        name: "丹东市"
      },
      {
        code: "2107",
        name: "锦州市"
      },
      {
        code: "2108",
        name: "营口市"
      },
      {
        code: "2109",
        name: "阜新市"
      },
      {
        code: "2110",
        name: "辽阳市"
      },
      {
        code: "2111",
        name: "盘锦市"
      },
      {
        code: "2112",
        name: "铁岭市"
      },
      {
        code: "2113",
        name: "朝阳市"
      },
      {
        code: "2114",
        name: "葫芦岛市"
      }
    ]
  },
  {
    code: "22",
    name: "吉林省",
    children: [
      {
        code: "2201",
        name: "长春市"
      },
      {
        code: "2202",
        name: "吉林市"
      },
      {
        code: "2203",
        name: "四平市"
      },
      {
        code: "2204",
        name: "辽源市"
      },
      {
        code: "2205",
        name: "通化市"
      },
      {
        code: "2206",
        name: "白山市"
      },
      {
        code: "2207",
        name: "松原市"
      },
      {
        code: "2208",
        name: "白城市"
      },
      {
        code: "2224",
        name: "延边朝鲜族自治州"
      }
    ]
  },
  {
    code: "23",
    name: "黑龙江省",
    children: [
      {
        code: "2301",
        name: "哈尔滨市"
      },
      {
        code: "2302",
        name: "齐齐哈尔市"
      },
      {
        code: "2303",
        name: "鸡西市"
      },
      {
        code: "2304",
        name: "鹤岗市"
      },
      {
        code: "2305",
        name: "双鸭山市"
      },
      {
        code: "2306",
        name: "大庆市"
      },
      {
        code: "2307",
        name: "伊春市"
      },
      {
        code: "2308",
        name: "佳木斯市"
      },
      {
        code: "2309",
        name: "七台河市"
      },
      {
        code: "2310",
        name: "牡丹江市"
      },
      {
        code: "2311",
        name: "黑河市"
      },
      {
        code: "2312",
        name: "绥化市"
      },
      {
        code: "2327",
        name: "大兴安岭地区"
      }
    ]
  },
  {
    code: "31",
    name: "上海市",
    children: [
      {
        code: "310101",
        name: "黄浦区"
      },
      {
        code: "310104",
        name: "徐汇区"
      },
      {
        code: "310105",
        name: "长宁区"
      },
      {
        code: "310106",
        name: "静安区"
      },
      {
        code: "310107",
        name: "普陀区"
      },
      {
        code: "310109",
        name: "虹口区"
      },
      {
        code: "310110",
        name: "杨浦区"
      },
      {
        code: "310112",
        name: "闵行区"
      },
      {
        code: "310113",
        name: "宝山区"
      },
      {
        code: "310114",
        name: "嘉定区"
      },
      {
        code: "310115",
        name: "浦东新区"
      },
      {
        code: "310116",
        name: "金山区"
      },
      {
        code: "310117",
        name: "松江区"
      },
      {
        code: "310118",
        name: "青浦区"
      },
      {
        code: "310120",
        name: "奉贤区"
      },
      {
        code: "310151",
        name: "崇明区"
      }
    ]
  },
  {
    code: "32",
    name: "江苏省",
    children: [
      {
        code: "3201",
        name: "南京市"
      },
      {
        code: "3202",
        name: "无锡市"
      },
      {
        code: "3203",
        name: "徐州市"
      },
      {
        code: "3204",
        name: "常州市"
      },
      {
        code: "3205",
        name: "苏州市"
      },
      {
        code: "3206",
        name: "南通市"
      },
      {
        code: "3207",
        name: "连云港市"
      },
      {
        code: "3208",
        name: "淮安市"
      },
      {
        code: "3209",
        name: "盐城市"
      },
      {
        code: "3210",
        name: "扬州市"
      },
      {
        code: "3211",
        name: "镇江市"
      },
      {
        code: "3212",
        name: "泰州市"
      },
      {
        code: "3213",
        name: "宿迁市"
      }
    ]
  },
  {
    code: "33",
    name: "浙江省",
    children: [
      {
        code: "3301",
        name: "杭州市"
      },
      {
        code: "3302",
        name: "宁波市"
      },
      {
        code: "3303",
        name: "温州市"
      },
      {
        code: "3304",
        name: "嘉兴市"
      },
      {
        code: "3305",
        name: "湖州市"
      },
      {
        code: "3306",
        name: "绍兴市"
      },
      {
        code: "3307",
        name: "金华市"
      },
      {
        code: "3308",
        name: "衢州市"
      },
      {
        code: "3309",
        name: "舟山市"
      },
      {
        code: "3310",
        name: "台州市"
      },
      {
        code: "3311",
        name: "丽水市"
      }
    ]
  },
  {
    code: "34",
    name: "安徽省",
    children: [
      {
        code: "3401",
        name: "合肥市"
      },
      {
        code: "3402",
        name: "芜湖市"
      },
      {
        code: "3403",
        name: "蚌埠市"
      },
      {
        code: "3404",
        name: "淮南市"
      },
      {
        code: "3405",
        name: "马鞍山市"
      },
      {
        code: "3406",
        name: "淮北市"
      },
      {
        code: "3407",
        name: "铜陵市"
      },
      {
        code: "3408",
        name: "安庆市"
      },
      {
        code: "3410",
        name: "黄山市"
      },
      {
        code: "3411",
        name: "滁州市"
      },
      {
        code: "3412",
        name: "阜阳市"
      },
      {
        code: "3413",
        name: "宿州市"
      },
      {
        code: "3415",
        name: "六安市"
      },
      {
        code: "3416",
        name: "亳州市"
      },
      {
        code: "3417",
        name: "池州市"
      },
      {
        code: "3418",
        name: "宣城市"
      }
    ]
  },
  {
    code: "35",
    name: "福建省",
    children: [
      {
        code: "3501",
        name: "福州市"
      },
      {
        code: "3502",
        name: "厦门市"
      },
      {
        code: "3503",
        name: "莆田市"
      },
      {
        code: "3504",
        name: "三明市"
      },
      {
        code: "3505",
        name: "泉州市"
      },
      {
        code: "3506",
        name: "漳州市"
      },
      {
        code: "3507",
        name: "南平市"
      },
      {
        code: "3508",
        name: "龙岩市"
      },
      {
        code: "3509",
        name: "宁德市"
      }
    ]
  },
  {
    code: "36",
    name: "江西省",
    children: [
      {
        code: "3601",
        name: "南昌市"
      },
      {
        code: "3602",
        name: "景德镇市"
      },
      {
        code: "3603",
        name: "萍乡市"
      },
      {
        code: "3604",
        name: "九江市"
      },
      {
        code: "3605",
        name: "新余市"
      },
      {
        code: "3606",
        name: "鹰潭市"
      },
      {
        code: "3607",
        name: "赣州市"
      },
      {
        code: "3608",
        name: "吉安市"
      },
      {
        code: "3609",
        name: "宜春市"
      },
      {
        code: "3610",
        name: "抚州市"
      },
      {
        code: "3611",
        name: "上饶市"
      }
    ]
  },
  {
    code: "37",
    name: "山东省",
    children: [
      {
        code: "3701",
        name: "济南市"
      },
      {
        code: "3702",
        name: "青岛市"
      },
      {
        code: "3703",
        name: "淄博市"
      },
      {
        code: "3704",
        name: "枣庄市"
      },
      {
        code: "3705",
        name: "东营市"
      },
      {
        code: "3706",
        name: "烟台市"
      },
      {
        code: "3707",
        name: "潍坊市"
      },
      {
        code: "3708",
        name: "济宁市"
      },
      {
        code: "3709",
        name: "泰安市"
      },
      {
        code: "3710",
        name: "威海市"
      },
      {
        code: "3711",
        name: "日照市"
      },
      {
        code: "3713",
        name: "临沂市"
      },
      {
        code: "3714",
        name: "德州市"
      },
      {
        code: "3715",
        name: "聊城市"
      },
      {
        code: "3716",
        name: "滨州市"
      },
      {
        code: "3717",
        name: "菏泽市"
      }
    ]
  },
  {
    code: "41",
    name: "河南省",
    children: [
      {
        code: "4101",
        name: "郑州市"
      },
      {
        code: "4102",
        name: "开封市"
      },
      {
        code: "4103",
        name: "洛阳市"
      },
      {
        code: "4104",
        name: "平顶山市"
      },
      {
        code: "4105",
        name: "安阳市"
      },
      {
        code: "4106",
        name: "鹤壁市"
      },
      {
        code: "4107",
        name: "新乡市"
      },
      {
        code: "4108",
        name: "焦作市"
      },
      {
        code: "4109",
        name: "濮阳市"
      },
      {
        code: "4110",
        name: "许昌市"
      },
      {
        code: "4111",
        name: "漯河市"
      },
      {
        code: "4112",
        name: "三门峡市"
      },
      {
        code: "4113",
        name: "南阳市"
      },
      {
        code: "4114",
        name: "商丘市"
      },
      {
        code: "4115",
        name: "信阳市"
      },
      {
        code: "4116",
        name: "周口市"
      },
      {
        code: "4117",
        name: "驻马店市"
      },
      {
        code: "419001",
        name: "济源市"
      }
    ]
  },
  {
    code: "42",
    name: "湖北省",
    children: [
      {
        code: "4201",
        name: "武汉市"
      },
      {
        code: "4202",
        name: "黄石市"
      },
      {
        code: "4203",
        name: "十堰市"
      },
      {
        code: "4205",
        name: "宜昌市"
      },
      {
        code: "4206",
        name: "襄阳市"
      },
      {
        code: "4207",
        name: "鄂州市"
      },
      {
        code: "4208",
        name: "荆门市"
      },
      {
        code: "4209",
        name: "孝感市"
      },
      {
        code: "4210",
        name: "荆州市"
      },
      {
        code: "4211",
        name: "黄冈市"
      },
      {
        code: "4212",
        name: "咸宁市"
      },
      {
        code: "4213",
        name: "随州市"
      },
      {
        code: "4228",
        name: "恩施土家族苗族自治州"
      },
      {
        code: "429004",
        name: "仙桃市"
      },
      {
        code: "429005",
        name: "潜江市"
      },
      {
        code: "429006",
        name: "天门市"
      },
      {
        code: "429021",
        name: "神农架林区"
      }
    ]
  },
  {
    code: "43",
    name: "湖南省",
    children: [
      {
        code: "4301",
        name: "长沙市"
      },
      {
        code: "4302",
        name: "株洲市"
      },
      {
        code: "4303",
        name: "湘潭市"
      },
      {
        code: "4304",
        name: "衡阳市"
      },
      {
        code: "4305",
        name: "邵阳市"
      },
      {
        code: "4306",
        name: "岳阳市"
      },
      {
        code: "4307",
        name: "常德市"
      },
      {
        code: "4308",
        name: "张家界市"
      },
      {
        code: "4309",
        name: "益阳市"
      },
      {
        code: "4310",
        name: "郴州市"
      },
      {
        code: "4311",
        name: "永州市"
      },
      {
        code: "4312",
        name: "怀化市"
      },
      {
        code: "4313",
        name: "娄底市"
      },
      {
        code: "4331",
        name: "湘西土家族苗族自治州"
      }
    ]
  },
  {
    code: "44",
    name: "广东省",
    children: [
      {
        code: "4401",
        name: "广州市"
      },
      {
        code: "4402",
        name: "韶关市"
      },
      {
        code: "4403",
        name: "深圳市"
      },
      {
        code: "4404",
        name: "珠海市"
      },
      {
        code: "4405",
        name: "汕头市"
      },
      {
        code: "4406",
        name: "佛山市"
      },
      {
        code: "4407",
        name: "江门市"
      },
      {
        code: "4408",
        name: "湛江市"
      },
      {
        code: "4409",
        name: "茂名市"
      },
      {
        code: "4412",
        name: "肇庆市"
      },
      {
        code: "4413",
        name: "惠州市"
      },
      {
        code: "4414",
        name: "梅州市"
      },
      {
        code: "4415",
        name: "汕尾市"
      },
      {
        code: "4416",
        name: "河源市"
      },
      {
        code: "4417",
        name: "阳江市"
      },
      {
        code: "4418",
        name: "清远市"
      },
      {
        code: "4419",
        name: "东莞市"
      },
      {
        code: "4420",
        name: "中山市"
      },
      {
        code: "4451",
        name: "潮州市"
      },
      {
        code: "4452",
        name: "揭阳市"
      },
      {
        code: "4453",
        name: "云浮市"
      }
    ]
  },
  {
    code: "45",
    name: "广西壮族自治区",
    children: [
      {
        code: "4501",
        name: "南宁市"
      },
      {
        code: "4502",
        name: "柳州市"
      },
      {
        code: "4503",
        name: "桂林市"
      },
      {
        code: "4504",
        name: "梧州市"
      },
      {
        code: "4505",
        name: "北海市"
      },
      {
        code: "4506",
        name: "防城港市"
      },
      {
        code: "4507",
        name: "钦州市"
      },
      {
        code: "4508",
        name: "贵港市"
      },
      {
        code: "4509",
        name: "玉林市"
      },
      {
        code: "4510",
        name: "百色市"
      },
      {
        code: "4511",
        name: "贺州市"
      },
      {
        code: "4512",
        name: "河池市"
      },
      {
        code: "4513",
        name: "来宾市"
      },
      {
        code: "4514",
        name: "崇左市"
      }
    ]
  },
  {
    code: "46",
    name: "海南省",
    children: [
      {
        code: "4601",
        name: "海口市"
      },
      {
        code: "4602",
        name: "三亚市"
      },
      {
        code: "4603",
        name: "三沙市"
      },
      {
        code: "4604",
        name: "儋州市"
      },
      {
        code: "469001",
        name: "五指山市"
      },
      {
        code: "469002",
        name: "琼海市"
      },
      {
        code: "469005",
        name: "文昌市"
      },
      {
        code: "469006",
        name: "万宁市"
      },
      {
        code: "469007",
        name: "东方市"
      },
      {
        code: "469021",
        name: "定安县"
      },
      {
        code: "469022",
        name: "屯昌县"
      },
      {
        code: "469023",
        name: "澄迈县"
      },
      {
        code: "469024",
        name: "临高县"
      },
      {
        code: "469025",
        name: "白沙黎族自治县"
      },
      {
        code: "469026",
        name: "昌江黎族自治县"
      },
      {
        code: "469027",
        name: "乐东黎族自治县"
      },
      {
        code: "469028",
        name: "陵水黎族自治县"
      },
      {
        code: "469029",
        name: "保亭黎族苗族自治县"
      },
      {
        code: "469030",
        name: "琼中黎族苗族自治县"
      }
    ]
  },
  {
    code: "50",
    name: "重庆市",
    children: [
      {
        code: "500101",
        name: "万州区"
      },
      {
        code: "500102",
        name: "涪陵区"
      },
      {
        code: "500103",
        name: "渝中区"
      },
      {
        code: "500104",
        name: "大渡口区"
      },
      {
        code: "500105",
        name: "江北区"
      },
      {
        code: "500106",
        name: "沙坪坝区"
      },
      {
        code: "500107",
        name: "九龙坡区"
      },
      {
        code: "500108",
        name: "南岸区"
      },
      {
        code: "500109",
        name: "北碚区"
      },
      {
        code: "500110",
        name: "綦江区"
      },
      {
        code: "500111",
        name: "大足区"
      },
      {
        code: "500112",
        name: "渝北区"
      },
      {
        code: "500113",
        name: "巴南区"
      },
      {
        code: "500114",
        name: "黔江区"
      },
      {
        code: "500115",
        name: "长寿区"
      },
      {
        code: "500116",
        name: "江津区"
      },
      {
        code: "500117",
        name: "合川区"
      },
      {
        code: "500118",
        name: "永川区"
      },
      {
        code: "500119",
        name: "南川区"
      },
      {
        code: "500120",
        name: "璧山区"
      },
      {
        code: "500151",
        name: "铜梁区"
      },
      {
        code: "500152",
        name: "潼南区"
      },
      {
        code: "500153",
        name: "荣昌区"
      },
      {
        code: "500154",
        name: "开州区"
      },
      {
        code: "500155",
        name: "梁平区"
      },
      {
        code: "500156",
        name: "武隆区"
      },
      {
        code: "500229",
        name: "城口县"
      },
      {
        code: "500230",
        name: "丰都县"
      },
      {
        code: "500231",
        name: "垫江县"
      },
      {
        code: "500233",
        name: "忠县"
      },
      {
        code: "500235",
        name: "云阳县"
      },
      {
        code: "500236",
        name: "奉节县"
      },
      {
        code: "500237",
        name: "巫山县"
      },
      {
        code: "500238",
        name: "巫溪县"
      },
      {
        code: "500240",
        name: "石柱土家族自治县"
      },
      {
        code: "500241",
        name: "秀山土家族苗族自治县"
      },
      {
        code: "500242",
        name: "酉阳土家族苗族自治县"
      },
      {
        code: "500243",
        name: "彭水苗族土家族自治县"
      }
    ]
  },
  {
    code: "51",
    name: "四川省",
    children: [
      {
        code: "5101",
        name: "成都市"
      },
      {
        code: "5103",
        name: "自贡市"
      },
      {
        code: "5104",
        name: "攀枝花市"
      },
      {
        code: "5105",
        name: "泸州市"
      },
      {
        code: "5106",
        name: "德阳市"
      },
      {
        code: "5107",
        name: "绵阳市"
      },
      {
        code: "5108",
        name: "广元市"
      },
      {
        code: "5109",
        name: "遂宁市"
      },
      {
        code: "5110",
        name: "内江市"
      },
      {
        code: "5111",
        name: "乐山市"
      },
      {
        code: "5113",
        name: "南充市"
      },
      {
        code: "5114",
        name: "眉山市"
      },
      {
        code: "5115",
        name: "宜宾市"
      },
      {
        code: "5116",
        name: "广安市"
      },
      {
        code: "5117",
        name: "达州市"
      },
      {
        code: "5118",
        name: "雅安市"
      },
      {
        code: "5119",
        name: "巴中市"
      },
      {
        code: "5120",
        name: "资阳市"
      },
      {
        code: "5132",
        name: "阿坝藏族羌族自治州"
      },
      {
        code: "5133",
        name: "甘孜藏族自治州"
      },
      {
        code: "5134",
        name: "凉山彝族自治州"
      }
    ]
  },
  {
    code: "52",
    name: "贵州省",
    children: [
      {
        code: "5201",
        name: "贵阳市"
      },
      {
        code: "5202",
        name: "六盘水市"
      },
      {
        code: "5203",
        name: "遵义市"
      },
      {
        code: "5204",
        name: "安顺市"
      },
      {
        code: "5205",
        name: "毕节市"
      },
      {
        code: "5206",
        name: "铜仁市"
      },
      {
        code: "5223",
        name: "黔西南布依族苗族自治州"
      },
      {
        code: "5226",
        name: "黔东南苗族侗族自治州"
      },
      {
        code: "5227",
        name: "黔南布依族苗族自治州"
      }
    ]
  },
  {
    code: "53",
    name: "云南省",
    children: [
      {
        code: "5301",
        name: "昆明市"
      },
      {
        code: "5303",
        name: "曲靖市"
      },
      {
        code: "5304",
        name: "玉溪市"
      },
      {
        code: "5305",
        name: "保山市"
      },
      {
        code: "5306",
        name: "昭通市"
      },
      {
        code: "5307",
        name: "丽江市"
      },
      {
        code: "5308",
        name: "普洱市"
      },
      {
        code: "5309",
        name: "临沧市"
      },
      {
        code: "5323",
        name: "楚雄彝族自治州"
      },
      {
        code: "5325",
        name: "红河哈尼族彝族自治州"
      },
      {
        code: "5326",
        name: "文山壮族苗族自治州"
      },
      {
        code: "5328",
        name: "西双版纳傣族自治州"
      },
      {
        code: "5329",
        name: "大理白族自治州"
      },
      {
        code: "5331",
        name: "德宏傣族景颇族自治州"
      },
      {
        code: "5333",
        name: "怒江傈僳族自治州"
      },
      {
        code: "5334",
        name: "迪庆藏族自治州"
      }
    ]
  },
  {
    code: "54",
    name: "西藏自治区",
    children: [
      {
        code: "5401",
        name: "拉萨市"
      },
      {
        code: "5402",
        name: "日喀则市"
      },
      {
        code: "5403",
        name: "昌都市"
      },
      {
        code: "5404",
        name: "林芝市"
      },
      {
        code: "5405",
        name: "山南市"
      },
      {
        code: "5406",
        name: "那曲市"
      },
      {
        code: "5425",
        name: "阿里地区"
      }
    ]
  },
  {
    code: "61",
    name: "陕西省",
    children: [
      {
        code: "6101",
        name: "西安市"
      },
      {
        code: "6102",
        name: "铜川市"
      },
      {
        code: "6103",
        name: "宝鸡市"
      },
      {
        code: "6104",
        name: "咸阳市"
      },
      {
        code: "6105",
        name: "渭南市"
      },
      {
        code: "6106",
        name: "延安市"
      },
      {
        code: "6107",
        name: "汉中市"
      },
      {
        code: "6108",
        name: "榆林市"
      },
      {
        code: "6109",
        name: "安康市"
      },
      {
        code: "6110",
        name: "商洛市"
      }
    ]
  },
  {
    code: "62",
    name: "甘肃省",
    children: [
      {
        code: "6201",
        name: "兰州市"
      },
      {
        code: "6202",
        name: "嘉峪关市"
      },
      {
        code: "6203",
        name: "金昌市"
      },
      {
        code: "6204",
        name: "白银市"
      },
      {
        code: "6205",
        name: "天水市"
      },
      {
        code: "6206",
        name: "武威市"
      },
      {
        code: "6207",
        name: "张掖市"
      },
      {
        code: "6208",
        name: "平凉市"
      },
      {
        code: "6209",
        name: "酒泉市"
      },
      {
        code: "6210",
        name: "庆阳市"
      },
      {
        code: "6211",
        name: "定西市"
      },
      {
        code: "6212",
        name: "陇南市"
      },
      {
        code: "6229",
        name: "临夏回族自治州"
      },
      {
        code: "6230",
        name: "甘南藏族自治州"
      }
    ]
  },
  {
    code: "63",
    name: "青海省",
    children: [
      {
        code: "6301",
        name: "西宁市"
      },
      {
        code: "6302",
        name: "海东市"
      },
      {
        code: "6322",
        name: "海北藏族自治州"
      },
      {
        code: "6323",
        name: "黄南藏族自治州"
      },
      {
        code: "6325",
        name: "海南藏族自治州"
      },
      {
        code: "6326",
        name: "果洛藏族自治州"
      },
      {
        code: "6327",
        name: "玉树藏族自治州"
      },
      {
        code: "6328",
        name: "海西蒙古族藏族自治州"
      }
    ]
  },
  {
    code: "64",
    name: "宁夏回族自治区",
    children: [
      {
        code: "6401",
        name: "银川市"
      },
      {
        code: "6402",
        name: "石嘴山市"
      },
      {
        code: "6403",
        name: "吴忠市"
      },
      {
        code: "6404",
        name: "固原市"
      },
      {
        code: "6405",
        name: "中卫市"
      }
    ]
  },
  {
    code: "65",
    name: "新疆维吾尔自治区",
    children: [
      {
        code: "6501",
        name: "乌鲁木齐市"
      },
      {
        code: "6502",
        name: "克拉玛依市"
      },
      {
        code: "6504",
        name: "吐鲁番市"
      },
      {
        code: "6505",
        name: "哈密市"
      },
      {
        code: "6523",
        name: "昌吉回族自治州"
      },
      {
        code: "6527",
        name: "博尔塔拉蒙古自治州"
      },
      {
        code: "6528",
        name: "巴音郭楞蒙古自治州"
      },
      {
        code: "6529",
        name: "阿克苏地区"
      },
      {
        code: "6530",
        name: "克孜勒苏柯尔克孜自治州"
      },
      {
        code: "6531",
        name: "喀什地区"
      },
      {
        code: "6532",
        name: "和田地区"
      },
      {
        code: "6540",
        name: "伊犁哈萨克自治州"
      },
      {
        code: "6542",
        name: "塔城地区"
      },
      {
        code: "6543",
        name: "阿勒泰地区"
      },
      {
        code: "659001",
        name: "石河子市"
      },
      {
        code: "659002",
        name: "阿拉尔市"
      },
      {
        code: "659003",
        name: "图木舒克市"
      },
      {
        code: "659004",
        name: "五家渠市"
      },
      {
        code: "659005",
        name: "北屯市"
      },
      {
        code: "659006",
        name: "铁门关市"
      },
      {
        code: "659007",
        name: "双河市"
      },
      {
        code: "659008",
        name: "可克达拉市"
      },
      {
        code: "659009",
        name: "昆玉市"
      },
      {
        code: "659010",
        name: "胡杨河市"
      },
      {
        code: "659011",
        name: "新星市"
      },
      {
        code: "659012",
        name: "白杨市"
      }
    ]
  }
];
const area_code_list = [];
pca_code_list.map((item) => {
  if (item.children) {
    area_code_list.push(...item.children);
  }
});
const company_type_map = {
  "01": "民营企业",
  "03": "政府机关",
  "04": "外资企业"
};
const getRegistCapi = (registCapi) => {
  let capital = 0;
  try {
    const result = registCapi.match(/\d+\.?\d+/);
    const value = result?.[0];
    if (isNaN(value)) {
      capital = 0;
    } else {
      capital = Number(value);
      if (/万/.test(registCapi)) {
        capital = Number(value) * 1e4;
      }
    }
  } catch (e) {
  }
  return capital;
};
const getAreaName = (code) => {
  let name = "";
  const result = area_code_list.find((item) => item.code == code || String(code).startsWith(item.code));
  if (result) {
    name = result.name;
  }
  return name;
};
async function basicInfo(ins, keyword) {
  try {
    const result = await ins.get(`https://api.qixin.com/APIService/enterprise/getBasicInfo`, {
      params: {
        keyword
      }
    });
    const response = result.data;
    if (response.status == 200) {
      const { registCapi = "", startDate = "", operName: sponsor = "", scope = "", address: byuer_address_tel = "", districtCode = "", type_new = "" } = response.data;
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
        "05": "律所及其他组织机构"
      }[type_new];
      const areald_name = getAreaName(districtCode);
      return { capital, record_date, start_date, companynatrue1, company_address, econ_kind, areald_name, sponsor, scope };
    } else {
      return {
        err: JSON.stringify(response)
      };
    }
  } catch (e) {
    return {};
  }
}
const kp_industry = [
  { label: "农、林、牧、渔业", value: "A" },
  { label: "采矿业", value: "B" },
  { label: "制造业", value: "C" },
  { label: "电力、热力、燃气及水生产和供应业", value: "D" },
  { label: "建筑业", value: "E" },
  { label: "批发和零售业", value: "F" },
  { label: "交通运输、仓储和邮政业", value: "G" },
  { label: "住宿和餐饮业", value: "H" },
  { label: "信息传输、软件和信息技术服务业", value: "I" },
  { label: "金融业", value: "J" },
  { label: "房地产业", value: "K" },
  { label: "租赁和商务服务业", value: "L" },
  { label: "科学研究和技术服务业", value: "M" },
  { label: "水利、环境和公共设施管理业", value: "N" },
  { label: "居民服务、修理和其他服务业", value: "O" },
  { label: "教育", value: "P" },
  { label: "卫生和社会工作", value: "Q" },
  { label: "文化、体育和娱乐业", value: "R" },
  { label: "公共管理、社会保障和社会组织", value: "S" },
  { label: "国际组织", value: "T" },
  { label: "保险业", value: "J6800" }
];
async function indType(ins, name) {
  try {
    const result = await ins.get(`https://api.qixin.com/APIService/enterprise/getIndClass`, {
      params: {
        name
      }
    });
    const response = result.data;
    if (response.status == 200) {
      const { industry_name, industry_code } = response.data;
      let platform_industry = "";
      if (industry_code == "J6800") {
        platform_industry = "保险业";
      } else {
        const result2 = kp_industry.find((item) => item.value == industry_code.charAt(0));
        platform_industry = result2 ? result2.label : "";
      }
      return {
        industry_name,
        platform_industry
      };
    } else {
      return {
        err: JSON.stringify(response)
      };
    }
  } catch (e) {
    return {};
  }
}
async function emitter(names) {
  const { qxin_appkey = void 0, qxin_secretkey = void 0, kp_appkey = void 0, kp_secretkey = void 0, base_url = void 0 } = MEMORY_DATA.config;
  if (!qxin_appkey || !qxin_secretkey) {
    return setError("请在设置中配置启信宝appkey和secretkey");
  }
  if (!kp_appkey || !kp_secretkey || !base_url) {
    return setError("请在设置中配置快普的appkey、secretkey和base_url");
  }
  const results = [];
  const hasCreateds = [];
  console.log(hasCreateds, "hasCreateds");
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (hasCreateds.includes(name)) {
      continue;
    }
    const { err = "{}", ...rest } = await qxin(name);
    const kp_res = await kp({
      cust_name: name,
      ...rest || {}
      // TODO: 处理数据
    });
    hasCreateds.push(name);
    results.push(`${name}:${kp_res}`);
  }
  return setSuccess(results);
}
async function qxin(name) {
  const { qxin_appkey, qxin_secretkey } = MEMORY_DATA.config;
  const instance = useAxios({
    appkey: qxin_appkey,
    timestamp: Date.now(),
    sign: createQxinSign(qxin_appkey, qxin_secretkey),
    "Auth-version": "2.0"
  });
  try {
    const base_info_res = await basicInfo(instance, name);
    const annual_report_res = await annualReport(instance, name);
    const social_security_res = await socialSecurity(instance, name);
    const tax_payer_res = await taxPayer(instance, name);
    const industry_type_res = await indType(instance, name);
    console.log("工商照面", JSON.stringify(base_info_res));
    console.log("年报信息", JSON.stringify(annual_report_res));
    console.log("社保信息", JSON.stringify(social_security_res));
    console.log("纳税人信息", JSON.stringify(tax_payer_res));
    console.log("行业信息", JSON.stringify(industry_type_res));
    return {
      ...base_info_res,
      ...annual_report_res,
      ...social_security_res,
      ...tax_payer_res,
      ...industry_type_res
    };
  } catch (e) {
    return {};
  }
}
async function kp(params) {
  console.log("创建客户", params.cust_name);
  const defParams = {
    cust_name: "",
    custom_supplier_type: "客户",
    custom_type: "终端客户",
    cust_souer1: "其他",
    cust_type: "单位客户",
    areald_name: "杨浦区",
    company_address: "无",
    cust_code: "自动生成"
  };
  const { kp_appkey, kp_secretkey, base_url, version } = MEMORY_DATA.config;
  const timestamp = dateFormat("YYYY-MM-DD HH:mm:ss", /* @__PURE__ */ new Date());
  const kpBody = {
    request: {
      iot_create_customer: {
        ...defParams,
        ...params
      }
    }
  };
  const sBody = JSON.stringify(kpBody);
  const method = "iot_create_customer";
  const sign = md5(`${kp_secretkey}app_key${kp_appkey}formatjsonmethod${method}timestamp${timestamp}version${version}${sBody}${kp_secretkey}`);
  const API_URL = `${base_url}/WebApi/DoWebApi?app_key=`;
  const api = `${API_URL}${kp_appkey}&format=json&method=${method}&timestamp=${timestamp}&version=${version}&sign=${sign}`;
  const instance = useAxios({
    timeout: 1e3 * 60,
    headers: {
      "Content-Type": "application/json"
    }
  });
  try {
    const result = await instance({
      method: "POST",
      url: api,
      data: sBody
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
const createCustomerIns = new CreateCustomerEvent();
const Events = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  createCustomerIns,
  qxinNewIns,
  upsertConfigIns
}, Symbol.toStringTag, { value: "Module" }));
const createMenu = (win) => {
  const settingItem = {
    label: "设置",
    submenu: [
      {
        label: "参数设置          ",
        click: () => {
          win.webContents.send("open-setting-window", "evn");
        }
      },
      {
        label: "行业设置          ",
        click: () => {
          win.webContents.send("open-setting-window", "ind");
        }
      }
    ]
  };
  return electron.Menu.buildFromTemplate([
    ...process.platform === "darwin" ? [
      { role: "appMenu", label: "客商信息管理" },
      {
        label: "编辑",
        submenu: [
          { role: "undo", label: "撤销" },
          // 撤销
          { role: "redo", label: "重做" },
          // 重做
          { type: "separator" },
          { role: "cut", label: "剪切" },
          // 剪切
          { role: "copy", label: "复制" },
          // 复制
          { role: "paste", label: "粘贴" },
          // 粘贴
          // 还可以添加 selectAll 等菜单项
          { role: "selectAll", label: "全选" }
          // 全选
        ]
      },
      settingItem
    ] : [
      {
        label: "编辑",
        submenu: [
          { role: "undo", label: "撤销" },
          // 撤销
          { role: "redo", label: "重做" },
          // 重做
          { type: "separator" },
          { role: "cut", label: "剪切" },
          // 剪切
          { role: "copy", label: "复制" },
          // 复制
          { role: "paste", label: "粘贴" },
          // 粘贴
          // 还可以添加 selectAll 等菜单项
          { role: "selectAll", label: "全选" }
          // 全选
        ]
      },
      settingItem
    ]
  ]);
};
electronUpdater.autoUpdater.autoDownload = true;
electronUpdater.autoUpdater.autoInstallOnAppQuit = true;
electronUpdater.autoUpdater.allowDowngrade = false;
console.log("当前应用版本：", electron.app.getVersion());
function initUpdateEvent(mainWindow2) {
  electronUpdater.autoUpdater.on("checking-for-update", () => {
    mainWindow2.webContents.send("update:status", "正在检测最新版本...");
  });
  electronUpdater.autoUpdater.on("update-available", (info) => {
    mainWindow2.webContents.send("update:available", info);
  });
  electronUpdater.autoUpdater.on("update-not-available", () => {
    mainWindow2.webContents.send("update:status", "当前已是最新版本");
  });
  electronUpdater.autoUpdater.on("download-progress", (progress) => {
    mainWindow2.webContents.send("update:progress", progress.percent.toFixed(2));
  });
  electronUpdater.autoUpdater.on("update-downloaded", () => {
    mainWindow2.webContents.send("update:finished", "更新包下载完成，重启即可生效");
  });
  electronUpdater.autoUpdater.on("error", (err) => {
    mainWindow2.webContents.send("update:error", "更新失败：" + err.message);
  });
}
const WINDOW_WIDTH = 1440;
const WINDOW_HEIGHT = 900;
const hasRegisterEvents = [];
let mainWindow;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    show: false,
    minWidth: WINDOW_WIDTH * 0.5,
    minHeight: WINDOW_HEIGHT * 0.5,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      //   contextIsolation: false
      devTools: utils.is.dev
    }
  });
  mainWindow.on("ready-to-show", () => {
    for (let _evt of Object.values(Events)) {
      const { eventName } = _evt;
      if (hasRegisterEvents.includes(eventName)) continue;
      hasRegisterEvents.push(eventName);
      _evt.on(mainWindow.webContents);
    }
    mainWindow.show();
    const menus = createMenu(mainWindow);
    electron.Menu.setApplicationMenu(menus);
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  initUpdateEvent(mainWindow);
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
    hasRegisterEvents.length = 0;
  }
});
