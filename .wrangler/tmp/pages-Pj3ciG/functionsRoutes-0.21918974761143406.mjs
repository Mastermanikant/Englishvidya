import { onRequestPost as __api_admin_action_js_onRequestPost } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\admin-action.js"
import { onRequestGet as __api_admin_data_js_onRequestGet } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\admin-data.js"
import { onRequestPost as __api_admin_revert_js_onRequestPost } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\admin-revert.js"
import { onRequestGet as __api_auth_callback_js_onRequestGet } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\auth-callback.js"
import { onRequestPost as __api_auth_custom_js_onRequestPost } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\auth-custom.js"
import { onRequestGet as __api_auth_google_js_onRequestGet } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\auth-google.js"
import { onRequestGet as __api_auth_logout_js_onRequestGet } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\auth-logout.js"
import { onRequestGet as __api_auth_me_js_onRequestGet } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\auth-me.js"
import { onRequestGet as __api_comments_js_onRequestGet } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\comments.js"
import { onRequestPost as __api_comments_js_onRequestPost } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\comments.js"
import { onRequestGet as __api_diary_js_onRequestGet } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\diary.js"
import { onRequestPost as __api_diary_js_onRequestPost } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\diary.js"
import { onRequestGet as __api_rate_js_onRequestGet } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\rate.js"
import { onRequestPost as __api_rate_js_onRequestPost } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\rate.js"
import { onRequestGet as __api_ugc_js_onRequestGet } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\ugc.js"
import { onRequestPost as __api_ugc_js_onRequestPost } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\api\\ugc.js"
import { onRequest as ___middleware_js_onRequest } from "D:\\EnglishVidya Website\\Englishvidya\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/api/admin-action",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_action_js_onRequestPost],
    },
  {
      routePath: "/api/admin-data",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_data_js_onRequestGet],
    },
  {
      routePath: "/api/admin-revert",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_revert_js_onRequestPost],
    },
  {
      routePath: "/api/auth-callback",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_callback_js_onRequestGet],
    },
  {
      routePath: "/api/auth-custom",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_custom_js_onRequestPost],
    },
  {
      routePath: "/api/auth-google",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_google_js_onRequestGet],
    },
  {
      routePath: "/api/auth-logout",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestGet],
    },
  {
      routePath: "/api/auth-me",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_js_onRequestGet],
    },
  {
      routePath: "/api/comments",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_comments_js_onRequestGet],
    },
  {
      routePath: "/api/comments",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_comments_js_onRequestPost],
    },
  {
      routePath: "/api/diary",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_diary_js_onRequestGet],
    },
  {
      routePath: "/api/diary",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_diary_js_onRequestPost],
    },
  {
      routePath: "/api/rate",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_rate_js_onRequestGet],
    },
  {
      routePath: "/api/rate",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_rate_js_onRequestPost],
    },
  {
      routePath: "/api/ugc",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_ugc_js_onRequestGet],
    },
  {
      routePath: "/api/ugc",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_ugc_js_onRequestPost],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]