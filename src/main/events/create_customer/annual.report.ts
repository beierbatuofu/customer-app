//工商年报
async function annualReport(ins: any, keyword: string) {
  try {
    const result = await ins.get(`https://api.qixin.com/APIService/reports/getReportListByName`, {
      params: {
        keyword,
      },
    });

    const response = result.data;
    if (response.status == 200) {
      const { sale_income = "", prac_person_num = "" } = response.data[0];
      let custstaff_scope: undefined | string = undefined;
      const nysgm1_0003447782_ex = isNaN(sale_income) ? "" : Number(sale_income);
      if (isNaN(prac_person_num)) {
        custstaff_scope = undefined;
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
        } else if (num < 1000) {
          custstaff_scope = "800-1000人";
        } else if (num < 2000) {
          custstaff_scope = "1000-2000人";
        } else if (num < 5000) {
          custstaff_scope = "2000-5000人";
        } else {
          custstaff_scope = "5000人以上";
        }
      }
      return {
        custstaff_scope,
        nysgm1_0003447782_ex,
      };
    } else {
      return {
        err: JSON.stringify(response),
      };
    }
  } catch (e) {
    console.log(e);
    return {};
  }
}

export default annualReport;
