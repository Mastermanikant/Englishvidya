var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/auth-callback.js
async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Login failed: No code received", { status: 400 });
  }
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.SITE_URL}/api/auth-callback`,
      grant_type: "authorization_code"
    })
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return new Response("Login failed: No access token", { status: 400 });
  }
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const googleUser = await userRes.json();
  let user = await env.DB.prepare(
    "SELECT id, email, name, google_id FROM users WHERE google_id = ?"
  ).bind(googleUser.id).first();
  if (!user) {
    const result = await env.DB.prepare(
      "INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)"
    ).bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || "").run();
    user = { id: result.meta.last_row_id, email: googleUser.email, name: googleUser.name };
  }
  const jwt = await createJWT({ userId: user.id, email: user.email }, env.JWT_SECRET, 7 * 24 * 60 * 60);
  return new Response(null, {
    status: 302,
    headers: {
      "Location": "/",
      "Set-Cookie": `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    }
  });
}
__name(onRequestGet, "onRequestGet");
async function createJWT(payload, secret, expiresInSeconds) {
  const header = { alg: "HS256", typ: "JWT" };
  payload.exp = Math.floor(Date.now() / 1e3) + expiresInSeconds;
  payload.iat = Math.floor(Date.now() / 1e3);
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const data = headerB64 + "." + payloadB64;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return data + "." + sigB64;
}
__name(createJWT, "createJWT");

// api/auth-google.js
async function onRequestGet2(context) {
  const { env } = context;
  const redirectUri = `${env.SITE_URL}/api/auth-callback`;
  const scope = "openid email profile";
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&prompt=select_account`;
  return Response.redirect(url, 302);
}
__name(onRequestGet2, "onRequestGet");

// api/auth-logout.js
async function onRequestGet3(context) {
  return new Response(null, {
    status: 302,
    headers: {
      "Location": "/",
      "Set-Cookie": "ev_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
    }
  });
}
__name(onRequestGet3, "onRequestGet");

// api/auth-me.js
async function onRequestGet4(context) {
  const user = context.data.user;
  if (!user) {
    return Response.json({ loggedIn: false, user: null });
  }
  return Response.json({
    loggedIn: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      trust_score: user.trust_score
    }
  });
}
__name(onRequestGet4, "onRequestGet");

// api/comments.js
async function onRequestGet5(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return Response.json({ error: "slug required" }, { status: 400 });
  const comments = await context.env.DB.prepare(
    `SELECT c.id, c.comment_text, c.created_at, u.name, u.avatar_url, u.trust_score
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.page_slug = ? AND u.is_shadow_banned = 0
     ORDER BY c.created_at DESC`
  ).bind(slug).all();
  return Response.json(comments.results);
}
__name(onRequestGet5, "onRequestGet");
async function onRequestPost(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: "Login required to comment" }, { status: 401 });
  if (user.is_shadow_banned) {
    return Response.json({ success: true, message: "Comment posted!" });
  }
  const body = await context.request.json();
  const { slug, text } = body;
  if (!slug || !text || text.trim() === "") {
    return Response.json({ error: "Comment text required" }, { status: 400 });
  }
  await context.env.DB.prepare(
    "INSERT INTO comments (page_slug, user_id, comment_text) VALUES (?, ?, ?)"
  ).bind(slug, user.id, text.trim()).run();
  return Response.json({ success: true, message: "Comment posted!" });
}
__name(onRequestPost, "onRequestPost");

// api/diary.js
async function onRequestGet6(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: "Login required" }, { status: 401 });
  const notes = await context.env.DB.prepare(
    "SELECT word_slug, note_content, updated_at FROM user_notes WHERE user_id = ? ORDER BY updated_at DESC"
  ).bind(user.id).all();
  const bookmarks = await context.env.DB.prepare(
    "SELECT word_slug, word_text, meaning_text, pron_text, category, created_at FROM user_bookmarks WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user.id).all();
  return Response.json({ notes: notes.results, bookmarks: bookmarks.results });
}
__name(onRequestGet6, "onRequestGet");
async function onRequestPost2(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: "Login required" }, { status: 401 });
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const thisMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  if (user.last_sync_date !== today) {
    await context.env.DB.prepare(
      "UPDATE users SET daily_sync_count = 0, last_sync_date = ? WHERE id = ?"
    ).bind(today, user.id).run();
    user.daily_sync_count = 0;
  }
  if (user.last_sync_month !== thisMonth) {
    await context.env.DB.prepare(
      "UPDATE users SET monthly_sync_count = 0, last_sync_month = ? WHERE id = ?"
    ).bind(thisMonth, user.id).run();
    user.monthly_sync_count = 0;
  }
  const body = await context.request.json();
  const items = body.items || [];
  if (user.daily_sync_count + items.length > 500) {
    return Response.json({ error: "Daily sync limit (500) reached. Try tomorrow." }, { status: 429 });
  }
  if (user.monthly_sync_count + items.length > 1e4) {
    return Response.json({ error: "Monthly sync limit (10,000) reached." }, { status: 429 });
  }
  for (const item of items) {
    if (item.type === "note") {
      await context.env.DB.prepare(
        `INSERT INTO user_notes (user_id, word_slug, note_content, updated_at) 
         VALUES (?, ?, ?, datetime('now')) 
         ON CONFLICT(user_id, word_slug) DO UPDATE SET note_content = ?, updated_at = datetime('now')`
      ).bind(user.id, item.word_slug, item.note_content, item.note_content).run();
    } else if (item.type === "bookmark") {
      await context.env.DB.prepare(
        `INSERT INTO user_bookmarks (user_id, word_slug, word_text, meaning_text, pron_text, category) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON CONFLICT(user_id, word_slug) DO NOTHING`
      ).bind(user.id, item.word_slug, item.word_text || "", item.meaning_text || "", item.pron_text || "", item.category || "").run();
    } else if (item.type === "remove_bookmark") {
      await context.env.DB.prepare(
        "DELETE FROM user_bookmarks WHERE user_id = ? AND word_slug = ?"
      ).bind(user.id, item.word_slug).run();
    }
  }
  await context.env.DB.prepare(
    "UPDATE users SET daily_sync_count = daily_sync_count + ?, monthly_sync_count = monthly_sync_count + ? WHERE id = ?"
  ).bind(items.length, items.length, user.id).run();
  return Response.json({ success: true, synced: items.length });
}
__name(onRequestPost2, "onRequestPost");

// api/rate.js
async function onRequestGet7(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return Response.json({ error: "slug required" }, { status: 400 });
  const cached = await context.env.DB.prepare(
    "SELECT total_stars, total_votes, avg_rating FROM ratings_cache WHERE page_slug = ?"
  ).bind(slug).first();
  return Response.json({
    slug,
    totalVotes: cached ? cached.total_votes : 0,
    avgRating: cached ? cached.avg_rating : 0,
    userRating: null
    // Frontend will check localStorage for guest state
  });
}
__name(onRequestGet7, "onRequestGet");
async function onRequestPost3(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: "Login required to rate" }, { status: 401 });
  const body = await context.request.json();
  const { slug, stars } = body;
  if (!slug || !stars || stars < 1 || stars > 5) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }
  await context.env.DB.prepare(
    "INSERT INTO ratings (page_slug, user_id, stars) VALUES (?, ?, ?) ON CONFLICT(page_slug, user_id) DO UPDATE SET stars = ?"
  ).bind(slug, user.id, stars, stars).run();
  const agg = await context.env.DB.prepare(
    "SELECT COUNT(*) as cnt, SUM(stars) as total FROM ratings WHERE page_slug = ?"
  ).bind(slug).first();
  const avgRating = agg.cnt > 0 ? agg.total / agg.cnt : 0;
  await context.env.DB.prepare(
    `INSERT INTO ratings_cache (page_slug, total_stars, total_votes, avg_rating, updated_at) 
     VALUES (?, ?, ?, ?, datetime('now')) 
     ON CONFLICT(page_slug) DO UPDATE SET total_stars = ?, total_votes = ?, avg_rating = ?, updated_at = datetime('now')`
  ).bind(slug, agg.total, agg.cnt, avgRating, agg.total, agg.cnt, avgRating).run();
  return Response.json({ success: true, totalVotes: agg.cnt, avgRating });
}
__name(onRequestPost3, "onRequestPost");

// api/ugc.js
async function onRequestGet8(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return Response.json({ error: "slug required" }, { status: 400 });
  const meanings = await context.env.DB.prepare(
    `SELECT u.id, u.meaning_text, u.region, u.upvotes, u.downvotes, u.status, u.created_at, users.name, users.trust_score
     FROM ugc_meanings u
     JOIN users ON u.user_id = users.id
     WHERE u.word_slug = ? AND u.status != 'banned'
     ORDER BY u.upvotes DESC, u.created_at DESC`
  ).bind(slug).all();
  return Response.json(meanings.results);
}
__name(onRequestGet8, "onRequestGet");
async function onRequestPost4(context) {
  const user = context.data.user;
  if (!user) return Response.json({ error: "Login required" }, { status: 401 });
  if (user.is_shadow_banned) {
    return Response.json({ success: true, message: "Meaning submitted for review." });
  }
  const body = await context.request.json();
  const { action, slug, meaning_text, region, meaning_id, vote_type } = body;
  if (action === "add") {
    if (!meaning_text || meaning_text.trim() === "") {
      return Response.json({ error: "Meaning text required" }, { status: 400 });
    }
    await context.env.DB.prepare(
      `INSERT INTO ugc_meanings (word_slug, user_id, meaning_text, region, status) 
       VALUES (?, ?, ?, ?, 'not_verified')`
    ).bind(slug, user.id, meaning_text.trim(), region || "").run();
    return Response.json({ success: true, message: "Added successfully! Marked as Not Verified." });
  } else if (action === "vote") {
    if (!meaning_id || !vote_type) return Response.json({ error: "Invalid vote" }, { status: 400 });
    try {
      await context.env.DB.prepare(
        `INSERT INTO votes (user_id, meaning_id, vote_type) VALUES (?, ?, ?)
         ON CONFLICT(user_id, meaning_id) DO UPDATE SET vote_type = ?`
      ).bind(user.id, meaning_id, vote_type, vote_type).run();
      const up = await context.env.DB.prepare('SELECT COUNT(*) as c FROM votes WHERE meaning_id = ? AND vote_type = "up"').bind(meaning_id).first();
      const down = await context.env.DB.prepare('SELECT COUNT(*) as c FROM votes WHERE meaning_id = ? AND vote_type = "down"').bind(meaning_id).first();
      await context.env.DB.prepare(
        "UPDATE ugc_meanings SET upvotes = ?, downvotes = ? WHERE id = ?"
      ).bind(up.c, down.c, meaning_id).run();
      if (down.c >= 5 && up.c < 2) {
        const ugc = await context.env.DB.prepare("SELECT user_id FROM ugc_meanings WHERE id = ?").bind(meaning_id).first();
        if (ugc) {
          await context.env.DB.prepare("UPDATE users SET is_shadow_banned = 1 WHERE id = ?").bind(ugc.user_id).run();
          await context.env.DB.prepare('UPDATE ugc_meanings SET status = "banned" WHERE id = ?').bind(meaning_id).run();
        }
      }
      return Response.json({ success: true, upvotes: up.c, downvotes: down.c });
    } catch (e) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
  }
  return Response.json({ error: "Invalid action" }, { status: 400 });
}
__name(onRequestPost4, "onRequestPost");

// _middleware.js
async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (url.hostname.endsWith(".pages.dev") || url.hostname === "www.englishvidya.com") {
    url.hostname = "englishvidya.com";
    return Response.redirect(url.toString(), 301);
  }
  const cookie = request.headers.get("Cookie") || "";
  const token = getCookieValue(cookie, "ev_token");
  context.data = context.data || {};
  context.data.user = null;
  if (token) {
    try {
      const payload = await verifyJWT(token, env.JWT_SECRET);
      const user = await env.DB.prepare(
        "SELECT id, google_id, email, name, username, avatar_url, trust_score, is_shadow_banned, daily_sync_count, monthly_sync_count, last_sync_date, last_sync_month FROM users WHERE id = ?"
      ).bind(payload.userId).first();
      if (user) {
        context.data.user = user;
      }
    } catch (e) {
    }
  }
  return context.next();
}
__name(onRequest, "onRequest");
function getCookieValue(cookieString, name) {
  const match2 = cookieString.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match2 ? match2[1] : null;
}
__name(getCookieValue, "getCookieValue");
async function verifyJWT(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [headerB64, payloadB64, signatureB64] = parts;
  const data = headerB64 + "." + payloadB64;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signature = base64UrlDecode(signatureB64);
  const valid = await crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(data));
  if (!valid) throw new Error("Invalid signature");
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
    throw new Error("Token expired");
  }
  return payload;
}
__name(verifyJWT, "verifyJWT");
function base64UrlDecode(str) {
  let padded = str.replace(/-/g, "+").replace(/_/g, "/");
  while (padded.length % 4) padded += "=";
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}
__name(base64UrlDecode, "base64UrlDecode");

// ../.wrangler/tmp/pages-ZZXPdm/functionsRoutes-0.9042483768084169.mjs
var routes = [
  {
    routePath: "/api/auth-callback",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/auth-google",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/auth-logout",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/auth-me",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/comments",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/comments",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/diary",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/diary",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/rate",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/rate",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/ugc",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/ugc",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];

// C:/Users/IT CARE SAHARSA/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// C:/Users/IT CARE SAHARSA/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
