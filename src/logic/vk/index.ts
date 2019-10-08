import $ = require("jquery");
import * as userConfig from "../../../config/user.json";

import Vue from "vue";
import Vuex from "vuex";
import { Accounts } from "../../store/Accounts";

function getUrlParameter(url: String, parameter: String) {
  parameter = parameter.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?|&]" + parameter.toLowerCase() + "=([^&#]*)");
  var results = regex.exec("?" + url.toLowerCase().split("?")[1]);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

/**
 * 在vk的页面自动登录
 */
export default {
  async init() {
    const self = this;
    if (!userConfig) {
      console.log("缺少用户信息配置，/config/user.json");
      return;
    }
    // 判断当前是否需要登录
    const isNeedLogin = this.judgeNeedLogin();
    // 如果需要登录，则开始登录
    if (isNeedLogin) {
      chrome.runtime.onMessage.addListener(function(
        request,
        sender,
        sendResponse
      ) {
        console.log(
          sender.tab
            ? "from a content script:" + sender.tab.url
            : "from the extension"
        );
        console.log("收到消息", request, sender, sendResponse);
        sendResponse("我已收到你的消息：" + JSON.stringify(request)); //做出回应
        if (request.code) {
          self.autoLogin(request.code);
        }
      });
    }
  },
  judgeNeedLogin() {
    return window.location.href.indexOf("user/login") > -1;
  },
  autoLogin(code: String) {
    // setTimeout(() => {
    //   console.log("开始自动登录");
    //   // 填充账号密码
    //   const $username = $(
    //     "body > div > div.middle > div > div > div.mainCon > div.rightSide > div > div > form > div:nth-child(1) > div > div > input"
    //   );
    //   const $password = $(
    //     "body > div > div.middle > div > div > div.mainCon > div.rightSide > div > div > form > div:nth-child(2) > div > div.el-input.el-input--large > input"
    //   );
    //   $username.on("keypress", evt => {
    //     console.log(evt);
    //   });
    //   $username.simulate("key-sequence", { sequence: userConfig.username });
    //   $password.simulate("key-sequence", { sequence: userConfig.password });

    //   // 点击登录按钮
    //   const loginBtn = $(
    //     "body > div > div.middle > div > div > div.mainCon > div.rightSide > div > div > form > button"
    //   );
    //   // loginBtn.click();
    // }, 5000);
    this.ssoLogin(code);
  },
  // sso login
  ssoLogin(code: String) {
    const self = this;
    $.ajax({
      url: "/api/sso/login",
      method: "POST",
      dataType: "json",
      contentType: "application/json;charset=UTF-8",
      data: JSON.stringify(userConfig),
      success(data, status) {
        console.log("调用接口成功！/api/sso/login，", data);
        // 直接身份宝登录
        self.loginWithTotpCode({
          code: code,
          mfaTempToken: data.data.mfaTempToken
        });
      },
      error(xhr, status, errorThrown) {
        console.log("调用接口失败！/api/sso/login，", errorThrown);
      }
    });
  },
  // 身份宝登录
  loginWithTotpCode(data: Object) {
    $.ajax({
      url: "/api/sso/loginWithTotpCode",
      method: "POST",
      dataType: "json",
      contentType: "application/json;charset=UTF-8",
      // processData: false,
      data: JSON.stringify(data),
      success(data, status) {
        console.log("调用接口成功！/api/sso/login，", data);
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = decodeURIComponent(
          urlParams.get("redirect_url") || ""
        );
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      },
      error(xhr, status, errorThrown) {
        console.log("调用接口失败！/api/sso/login，", errorThrown);
      }
    });
  }
};
