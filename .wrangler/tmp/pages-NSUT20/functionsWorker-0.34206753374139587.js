var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/_shared/auth-utils.js
async function hashPasswordPBKDF2(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 1e5, hash: "SHA-256" },
    keyMaterial,
    512
  );
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}
__name(hashPasswordPBKDF2, "hashPasswordPBKDF2");
async function verifyPasswordPBKDF2(password, storedHashStr) {
  const parts = storedHashStr.split(":");
  if (parts.length !== 2)
    return false;
  const [saltHex, hashHex] = parts;
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 1e5, hash: "SHA-256" },
    keyMaterial,
    512
  );
  const derivedHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return cryptoTimingSafeEqual(derivedHex, hashHex);
}
__name(verifyPasswordPBKDF2, "verifyPasswordPBKDF2");
async function hashSHA256(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashSHA256, "hashSHA256");
function cryptoTimingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string")
    return false;
  let result = 0;
  if (a.length !== b.length) {
    b = a;
    result = 1;
  }
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
__name(cryptoTimingSafeEqual, "cryptoTimingSafeEqual");
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
async function verifyJWT(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3)
      return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const data = headerB64 + "." + payloadB64;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sig = new Uint8Array(atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")).split("").map((c) => c.charCodeAt(0)));
    const isValid = await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(data));
    if (!isValid)
      return null;
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && Math.floor(Date.now() / 1e3) > payload.exp)
      return null;
    return payload;
  } catch (err) {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
function generateSecureOTP(length = 6) {
  const array = new Uint32Array(1);
  const maxSafeValue = Math.floor(4294967295 / Math.pow(10, length)) * Math.pow(10, length);
  let randomVal;
  do {
    crypto.getRandomValues(array);
    randomVal = array[0];
  } while (randomVal >= maxSafeValue);
  return (randomVal % Math.pow(10, length)).toString().padStart(length, "0");
}
__name(generateSecureOTP, "generateSecureOTP");
function validateRedirectUrl(url) {
  if (!url || typeof url !== "string")
    return "/";
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  return "/";
}
__name(validateRedirectUrl, "validateRedirectUrl");
function getGenericErrorMsg() {
  return "Something went wrong. Please try again later.";
}
__name(getGenericErrorMsg, "getGenericErrorMsg");

// api/admin-action.js
async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!user || user.role !== "owner" && user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }
  try {
    const body = await request.json();
    const { type, id, action } = body;
    if (!type || !id || !action) {
      return new Response("Invalid payload", { status: 400 });
    }
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return new Response("Invalid ID format", { status: 400 });
    }
    let statusToSet = "";
    if (action === "approve")
      statusToSet = "approved";
    else if (action === "reject")
      statusToSet = "deleted";
    else if (action === "approve_delete")
      statusToSet = "anonymized";
    else
      return new Response("Invalid action", { status: 400 });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (type === "ugc") {
      await env.DB.prepare(
        "UPDATE ugc_meanings SET status = ?, action_by_id = ?, action_at = ? WHERE id = ?"
      ).bind(statusToSet, user.id, now, parsedId).run();
    } else if (type === "link") {
      const comment = await env.DB.prepare("SELECT reference_links FROM comments WHERE id = ?").bind(parsedId).first();
      if (comment) {
        let refs = JSON.parse(comment.reference_links || "[]");
        refs = refs.map((r) => {
          if (r.status === "pending") {
            return { ...r, status: action === "approve" ? "approved" : "rejected" };
          }
          return r;
        });
        await env.DB.prepare(
          "UPDATE comments SET reference_links = ? WHERE id = ?"
        ).bind(JSON.stringify(refs), parsedId).run();
      }
    } else if (type === "comment") {
      await env.DB.prepare(
        "UPDATE comments SET status = ?, action_by_id = ?, action_at = ? WHERE id = ?"
      ).bind(statusToSet, user.id, now, parsedId).run();
    } else if (type === "user" && action === "approve_delete") {
      await env.DB.prepare(`
        UPDATE users 
        SET 
          name = 'Deleted User',
          username = NULL,
          email = 'deleted_' || id || '_' || hex(randomblob(4)) || '@deleted.englishvidya.com',
          google_id = 'deleted_' || id || '_' || hex(randomblob(4)),
          avatar_url = '',
          social_facebook = '',
          social_youtube = '',
          social_instagram = '',
          social_twitter = '',
          social_linkedin = '',
          social_pinterest = '',
          social_website1 = '',
          social_website2 = '',
          delete_requested_at = 'anonymized'
        WHERE id = ?
      `).bind(parsedId).run();
      return Response.json({ success: true, newStatus: "anonymized" });
    } else if (type === "user_trust") {
      const { trust_score } = body;
      if (trust_score === void 0) {
        return new Response("Missing trust_score", { status: 400 });
      }
      const parsedScore = parseInt(trust_score, 10);
      if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
        return new Response("Invalid trust_score (must be 0-100)", { status: 400 });
      }
      await env.DB.prepare("UPDATE users SET trust_score = ? WHERE id = ?").bind(parsedScore, parsedId).run();
      return Response.json({ success: true, newStatus: parsedScore });
    } else if (type === "user_shadow_ban") {
      const { is_shadow_banned } = body;
      if (is_shadow_banned === void 0) {
        return new Response("Missing is_shadow_banned", { status: 400 });
      }
      await env.DB.prepare("UPDATE users SET is_shadow_banned = ? WHERE id = ?").bind(is_shadow_banned, parsedId).run();
      return Response.json({ success: true, newStatus: is_shadow_banned });
    } else if (type === "ticket_status") {
      const { status } = body;
      if (status === void 0) {
        return new Response("Missing status", { status: 400 });
      }
      const allowedStatus = ["open", "closed", "resolved", "pending"];
      if (!allowedStatus.includes(status)) {
        return new Response("Invalid status", { status: 400 });
      }
      await env.DB.prepare('UPDATE support_tickets SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(status, parsedId).run();
      return Response.json({ success: true, newStatus: status });
    } else if (type === "admin_reset_user_password") {
      const { newPassword } = body;
      if (!newPassword || newPassword.length < 6) {
        return Response.json({ success: false, error: "\u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0915\u092E \u0938\u0947 \u0915\u092E \u096C \u0905\u0915\u094D\u0937\u0930\u094B\u0902 \u0915\u093E \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F\u0964" }, { status: 400 });
      }
      const targetUser = await env.DB.prepare("SELECT admin_reset_requested_at FROM users WHERE id = ?").bind(parsedId).first();
      if (!targetUser) {
        return Response.json({ success: false, error: "\u092F\u0942\u091C\u093C\u0930 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u093E\u0964" }, { status: 404 });
      }
      if (!targetUser.admin_reset_requested_at) {
        return Response.json({ success: false, error: "\u0907\u0938 \u092F\u0942\u091C\u093C\u0930 \u0915\u0947 \u0932\u093F\u090F \u0915\u094B\u0908 \u090F\u0921\u092E\u093F\u0928 \u0930\u0940\u0938\u0947\u091F \u0905\u0928\u0941\u0930\u094B\u0927 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u093E \u0939\u0948\u0964" }, { status: 400 });
      }
      const reqTime = new Date(targetUser.admin_reset_requested_at).getTime();
      const now2 = Date.now();
      const diffHours = (now2 - reqTime) / (1e3 * 60 * 60);
      if (diffHours < 48) {
        const remaining = Math.ceil(48 - diffHours);
        return Response.json({ success: false, error: `\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0915\u093E\u0930\u0923\u094B\u0902 \u0938\u0947 \u0939\u094B\u0932\u094D\u0921 \u0938\u0915\u094D\u0930\u093F\u092F \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E ${remaining} \u0918\u0902\u091F\u0947 \u092C\u093E\u0926 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u0930\u0947\u0902\u0964` }, { status: 400 });
      }
      const password_hash = await hashPasswordPBKDF2(newPassword);
      await env.DB.prepare(
        `UPDATE users 
         SET password_hash = ?, 
             admin_reset_requested_at = NULL, 
             reset_token = NULL, 
             reset_token_expires_at = NULL, 
             reset_attempts = 0 
         WHERE id = ?`
      ).bind(password_hash, parsedId).run();
      return Response.json({ success: true, message: "\u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0938\u092B\u0932\u0924\u093E\u092A\u0942\u0930\u094D\u0935\u0915 \u092C\u0926\u0932 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948!" });
    } else {
      return new Response("Invalid type", { status: 400 });
    }
    return Response.json({ success: true, newStatus: statusToSet });
  } catch (err) {
    return new Response("Something went wrong. Please try again later.", { status: 500 });
  }
}
__name(onRequestPost, "onRequestPost");

// api/admin-data.js
async function onRequestGet(context) {
  const { request, env, data } = context;
  const user = data.user;
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  if (!user || user.role !== "owner" && user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }
  try {
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
    if (type === "pending_ugc") {
      const results = await env.DB.prepare(
        `SELECT u.id, u.word_slug, u.meaning_text, users.name 
         FROM ugc_meanings u 
         JOIN users ON u.user_id = users.id 
         WHERE u.status = 'not_verified' 
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`
      ).bind(limit, offset).all();
      return Response.json(results.results);
    } else if (type === "pending_links") {
      const comments = await env.DB.prepare(
        `SELECT c.id, c.comment_text, c.reference_links, u.name 
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.reference_links LIKE '%"status":"pending"%'
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`
      ).bind(limit, offset).all();
      return Response.json(comments.results);
    } else if (type === "deleted") {
      if (user.role !== "owner")
        return new Response("Owner only", { status: 403 });
      const ugc = await env.DB.prepare(
        `SELECT id, 'ugc' as source, meaning_text as text, action_by_id, action_at 
         FROM ugc_meanings 
         WHERE status = 'deleted' AND action_at > datetime('now', '-30 days')`
      ).all();
      const comments = await env.DB.prepare(
        `SELECT id, 'comment' as source, comment_text as text, action_by_id, action_at 
         FROM comments 
         WHERE status = 'deleted' AND action_at > datetime('now', '-30 days')`
      ).all();
      const combined = [...ugc.results, ...comments.results].sort((a, b) => new Date(b.action_at) - new Date(a.action_at));
      return Response.json(combined.slice(offset, offset + limit));
    } else if (type === "deletion_requests") {
      const results = await env.DB.prepare(
        `SELECT id, email, name, delete_requested_at 
         FROM users 
         WHERE delete_requested_at IS NOT NULL 
         ORDER BY delete_requested_at DESC
         LIMIT ? OFFSET ?`
      ).bind(limit, offset).all();
      return Response.json(results.results);
    } else if (type === "users") {
      const results = await env.DB.prepare(
        `SELECT id, name, email, username, role, trust_score, is_shadow_banned, admin_reset_requested_at, created_at 
         FROM users 
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      ).bind(limit, offset).all();
      return Response.json(results.results);
    } else if (type === "tickets") {
      let query = `
        SELECT t.id, t.title, t.message, t.type, t.status, t.created_at, u.name, u.email 
        FROM support_tickets t 
        JOIN users u ON t.user_id = u.id
      `;
      if (user.role === "admin") {
        query += ` WHERE t.type = 'admin'`;
      }
      query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
      const results = await env.DB.prepare(query).bind(limit, offset).all();
      return Response.json(results.results);
    } else if (type === "ticket_replies") {
      const ticketId = url.searchParams.get("ticket_id");
      if (!ticketId) {
        return new Response("Missing ticket_id", { status: 400 });
      }
      const results = await env.DB.prepare(
        `SELECT r.id, r.reply_text, r.created_at, u.name, u.role, u.avatar_url 
         FROM support_replies r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.ticket_id = ? 
         ORDER BY r.created_at ASC
         LIMIT ? OFFSET ?`
      ).bind(ticketId, limit, offset).all();
      return Response.json(results.results);
    }
    return new Response("Invalid type", { status: 400 });
  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}
__name(onRequestGet, "onRequestGet");

// api/admin-reset-request.js
async function onRequestPost2(context) {
  const { request, env, data } = context;
  try {
    const userContext = data.user;
    if (!userContext || userContext.role !== "owner" && userContext.role !== "admin") {
      return Response.json({ error: "Unauthorized: Admin privileges required." }, { status: 403 });
    }
    const { token, emailOrUsername } = await request.json();
    let user = null;
    if (token && token.trim()) {
      user = await env.DB.prepare(
        "SELECT id, email, recovery_email FROM users WHERE reset_token = ?"
      ).bind(token.trim()).first();
    } else if (emailOrUsername && emailOrUsername.trim()) {
      const cleanInput = emailOrUsername.trim();
      if (cleanInput.includes("@")) {
        user = await env.DB.prepare(
          "SELECT id, email, recovery_email FROM users WHERE email = ?"
        ).bind(cleanInput.toLowerCase()).first();
      } else {
        user = await env.DB.prepare(
          "SELECT id, email, recovery_email FROM users WHERE username = ?"
        ).bind(cleanInput).first();
      }
    }
    if (!user) {
      return Response.json({ error: "\u092F\u0939 \u0905\u0915\u093E\u0909\u0902\u091F \u0939\u092E\u093E\u0930\u0947 \u0938\u093F\u0938\u094D\u091F\u092E \u092E\u0947\u0902 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u093E\u0964" }, { status: 404 });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      `UPDATE users 
       SET admin_reset_requested_at = ?, 
           reset_token = NULL, 
           reset_token_expires_at = NULL, 
           reset_attempts = 0 
       WHERE id = ?`
    ).bind(now, user.id).run();
    console.log(`[ADMIN RESET REQUEST] Simulated security warning sent to Primary and Recovery emails.`);
    return Response.json({
      success: true,
      message: "\u090F\u0921\u092E\u093F\u0928 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0915\u093E \u0905\u0928\u0941\u0930\u094B\u0927 \u0926\u0930\u094D\u091C \u0915\u0930 \u0932\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964 \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0915\u093E\u0930\u0923\u094B\u0902 \u0938\u0947, 48 \u0918\u0902\u091F\u0947 \u0915\u0947 \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0939\u094B\u0932\u094D\u0921 (Security Hold) \u0915\u0947 \u092C\u093E\u0926 \u0939\u0940 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u092C\u0926\u0932\u093E \u091C\u093E \u0938\u0915\u0947\u0917\u093E\u0964 \u0907\u0938 \u0926\u094C\u0930\u093E\u0928 \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u0906\u092A\u0915\u0947 \u0908\u092E\u0947\u0932 \u092A\u0930 \u092D\u0947\u091C \u0926\u0940 \u0917\u0908 \u0939\u0948\u0964"
    });
  } catch (err) {
    return Response.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
__name(onRequestPost2, "onRequestPost");

// api/admin-revert.js
async function onRequestPost3(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!user || user.role !== "owner") {
    return new Response("Unauthorized - Owner Only", { status: 403 });
  }
  try {
    const body = await request.json();
    const { type, id } = body;
    if (!type || !id) {
      return new Response("Invalid payload", { status: 400 });
    }
    if (type === "ugc") {
      await env.DB.prepare(
        "UPDATE ugc_meanings SET status = ?, action_by_id = NULL, action_at = NULL WHERE id = ?"
      ).bind("approved", id).run();
    } else if (type === "comment") {
      await env.DB.prepare(
        "UPDATE comments SET status = ?, action_by_id = NULL, action_at = NULL WHERE id = ?"
      ).bind("active", id).run();
    } else {
      return new Response("Invalid type", { status: 400 });
    }
    return Response.json({ success: true, reverted: true });
  } catch (err) {
    return new Response("Server Error", { status: 500 });
  }
}
__name(onRequestPost3, "onRequestPost");

// api/auth-callback.js
async function onRequestGet2(context) {
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
  let referrerId = null;
  if (!user) {
    const cookie = request.headers.get("Cookie") || "";
    const referrerIdMatch = cookie.match(/(?:^|;\s*)ev_referrer=([^;]*)/);
    referrerId = referrerIdMatch ? parseInt(referrerIdMatch[1]) : null;
    let result;
    if (referrerId) {
      const refUser = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(referrerId).first();
      if (refUser) {
        result = await env.DB.prepare(
          "INSERT INTO users (google_id, email, name, avatar_url, referred_by_id, referral_coins) VALUES (?, ?, ?, ?, ?, 100)"
        ).bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || "", referrerId).run();
        const newUserId = result.meta.last_row_id || result.insertId;
        await env.DB.prepare("UPDATE users SET referral_coins = referral_coins + 100 WHERE id = ?").bind(referrerId).run();
        await env.DB.prepare(
          'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 100, "signup_bonus", "Joined via referral link")'
        ).bind(newUserId).run();
        await env.DB.prepare(
          'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 100, "referral_signup", "Referred a friend (User ID: " || ? || ")")'
        ).bind(referrerId, newUserId).run();
      } else {
        referrerId = null;
        result = await env.DB.prepare(
          "INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)"
        ).bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || "").run();
      }
    } else {
      result = await env.DB.prepare(
        "INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)"
      ).bind(googleUser.id, googleUser.email, googleUser.name, googleUser.picture || "").run();
    }
    user = { id: result.meta.last_row_id || result.insertId, email: googleUser.email, name: googleUser.name };
  }
  const jwt = await createJWT({ userId: user.id, email: user.email }, env.JWT_SECRET, 7 * 24 * 60 * 60);
  const state = url.searchParams.get("state");
  let redirectTo = state ? decodeURIComponent(state) : "/";
  redirectTo = validateRedirectUrl(redirectTo);
  const headers = new Headers();
  headers.append("Location", redirectTo);
  headers.append("Set-Cookie", `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
  if (referrerId) {
    headers.append("Set-Cookie", "ev_referrer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure");
  }
  return new Response(null, {
    status: 302,
    headers
  });
}
__name(onRequestGet2, "onRequestGet");

// api/auth-custom.js
async function onRequestPost4(context) {
  const { request, env } = context;
  try {
    const data = await request.formData();
    const username = data.get("username");
    const password = data.get("password");
    let redirectTo = data.get("redirect_to") || "/admin/";
    redirectTo = validateRedirectUrl(redirectTo);
    if (!username || !password) {
      return new Response("Username and password required", { status: 400 });
    }
    const user = await env.DB.prepare(
      "SELECT id, email, username, password_hash, role FROM users WHERE username = ?"
    ).bind(username).first();
    let isValid = false;
    if (user && user.password_hash) {
      isValid = await verifyPasswordPBKDF2(password, user.password_hash);
    } else {
      await verifyPasswordPBKDF2(password, "0123456789abcdef0123456789abcdef:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    }
    if (!isValid) {
      return new Response("Invalid credentials", { status: 401 });
    }
    if (user.role !== "owner" && user.role !== "admin") {
      return new Response("Access denied", { status: 403 });
    }
    const jwt = await createJWT({ userId: user.id, email: user.email, role: user.role }, env.JWT_SECRET, 7 * 24 * 60 * 60);
    return new Response(null, {
      status: 302,
      headers: {
        "Location": redirectTo,
        "Set-Cookie": `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
      }
    });
  } catch (error) {
    return new Response(getGenericErrorMsg(), { status: 500 });
  }
}
__name(onRequestPost4, "onRequestPost");

// api/auth-google.js
async function onRequestGet3(context) {
  const { request, env } = context;
  const urlParams = new URL(request.url).searchParams;
  let redirectTo = urlParams.get("redirect") || "/";
  redirectTo = validateRedirectUrl(redirectTo);
  const redirectUri = `${env.SITE_URL}/api/auth-callback`;
  const scope = "openid email profile";
  const state = encodeURIComponent(redirectTo);
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&prompt=select_account`;
  return Response.redirect(url, 302);
}
__name(onRequestGet3, "onRequestGet");

// api/auth-login.js
async function onRequestPost5(context) {
  const { request, env } = context;
  try {
    const { loginId, password } = await request.json();
    if (!loginId || !password) {
      return Response.json({ success: false, error: "Email/UserID and password are required." }, { status: 400 });
    }
    let user;
    if (loginId.includes("@")) {
      user = await env.DB.prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?").bind(loginId).first();
    } else if (!isNaN(loginId)) {
      user = await env.DB.prepare("SELECT id, email, name, password_hash FROM users WHERE id = ?").bind(parseInt(loginId)).first();
    } else {
      user = await env.DB.prepare("SELECT id, email, name, password_hash FROM users WHERE username = ?").bind(loginId).first();
    }
    let isValid = false;
    let needsUpgrade = false;
    if (user && user.password_hash) {
      if (user.password_hash.includes(":")) {
        isValid = await verifyPasswordPBKDF2(password, user.password_hash);
      } else {
        const legacyHash = await hashSHA256(password);
        isValid = cryptoTimingSafeEqual(legacyHash, user.password_hash);
        if (isValid) {
          needsUpgrade = true;
        }
      }
    } else {
      await verifyPasswordPBKDF2(password, "0123456789abcdef0123456789abcdef:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    }
    if (!isValid) {
      return Response.json({ success: false, error: "Incorrect email/ID or password." }, { status: 401 });
    }
    if (needsUpgrade) {
      const newHash = await hashPasswordPBKDF2(password);
      await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(newHash, user.id).run();
    }
    const jwt = await createJWT({ userId: user.id, email: user.email }, env.JWT_SECRET, 7 * 24 * 60 * 60);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
      }
    });
  } catch (err) {
    return Response.json({ success: false, error: getGenericErrorMsg() }, { status: 500 });
  }
}
__name(onRequestPost5, "onRequestPost");

// api/auth-logout.js
async function onRequestGet4(context) {
  return new Response(null, {
    status: 302,
    headers: {
      "Location": "/",
      "Set-Cookie": "ev_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
    }
  });
}
__name(onRequestGet4, "onRequestGet");

// api/auth-me.js
async function onRequestGet5(context) {
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
      trust_score: user.trust_score,
      social_instagram: user.social_instagram,
      social_facebook: user.social_facebook,
      social_youtube: user.social_youtube,
      social_twitter: user.social_twitter,
      social_linkedin: user.social_linkedin,
      social_pinterest: user.social_pinterest,
      social_website1: user.social_website1,
      social_website2: user.social_website2,
      delete_requested_at: user.delete_requested_at,
      has_accepted_rules: user.has_accepted_rules,
      location_address: user.location_address
    }
  });
}
__name(onRequestGet5, "onRequestGet");

// api/auth-register.js
async function onRequestPost6(context) {
  const { request, env } = context;
  try {
    const { name, email, username, password } = await request.json();
    if (!name || !email || !username || !password || password.length < 6) {
      return Response.json({ success: false, error: "All fields are required and password must be at least 6 characters." }, { status: 400 });
    }
    const existingUser = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ? OR username = ?"
    ).bind(email, username).first();
    if (existingUser) {
      return Response.json({ success: false, error: "Email or username is already taken." }, { status: 409 });
    }
    const passwordHash = await hashPasswordPBKDF2(password);
    const cookie = request.headers.get("Cookie") || "";
    const referrerIdMatch = cookie.match(/(?:^|;\s*)ev_referrer=([^;]*)/);
    let referrerId = referrerIdMatch ? parseInt(referrerIdMatch[1]) : null;
    let result;
    if (referrerId) {
      const refUser = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(referrerId).first();
      if (refUser) {
        result = await env.DB.prepare(
          "INSERT INTO users (email, username, name, password_hash, referred_by_id, referral_coins) VALUES (?, ?, ?, ?, ?, 100)"
        ).bind(email, username, name, passwordHash, referrerId).run();
        const newUserId2 = result.meta.last_row_id || result.insertId;
        await env.DB.prepare("UPDATE users SET referral_coins = referral_coins + 100 WHERE id = ?").bind(referrerId).run();
        await env.DB.prepare(
          'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 100, "signup_bonus", "Joined via referral link")'
        ).bind(newUserId2).run();
        await env.DB.prepare(
          'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 100, "referral_signup", "Referred a friend (User ID: " || ? || ")")'
        ).bind(referrerId, newUserId2).run();
      } else {
        referrerId = null;
      }
    }
    if (!referrerId) {
      result = await env.DB.prepare(
        "INSERT INTO users (email, username, name, password_hash) VALUES (?, ?, ?, ?)"
      ).bind(email, username, name, passwordHash).run();
    }
    const newUserId = result.meta.last_row_id || result.insertId;
    const jwt = await createJWT({ userId: newUserId, email }, env.JWT_SECRET, 7 * 24 * 60 * 60);
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Set-Cookie", `ev_token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);
    if (referrerId) {
      headers.append("Set-Cookie", "ev_referrer=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure");
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers
    });
  } catch (err) {
    return Response.json({ success: false, error: getGenericErrorMsg() }, { status: 500 });
  }
}
__name(onRequestPost6, "onRequestPost");

// api/auth-reset-request.js
async function onRequestPost7(context) {
  const { request, env } = context;
  try {
    const { emailOrUsername, sendTo } = await request.json();
    if (!emailOrUsername || !emailOrUsername.trim()) {
      return Response.json({ error: "\u0908\u092E\u0947\u0932 \u092F\u093E \u092F\u0942\u091C\u093C\u0930\u0928\u0947\u092E \u0926\u0930\u094D\u091C \u0915\u0930\u0928\u093E \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u0948\u0964" }, { status: 400 });
    }
    const cleanInput = emailOrUsername.trim();
    let user;
    if (cleanInput.includes("@")) {
      user = await env.DB.prepare(
        "SELECT id, email, recovery_email, reset_request_timestamps FROM users WHERE email = ?"
      ).bind(cleanInput.toLowerCase()).first();
    } else {
      user = await env.DB.prepare(
        "SELECT id, email, recovery_email, reset_request_timestamps FROM users WHERE username = ?"
      ).bind(cleanInput).first();
    }
    if (!user) {
      return Response.json({
        success: true,
        requireChoice: false,
        sentTo: obfuscateEmail(cleanInput.includes("@") ? cleanInput : "user@example.com"),
        message: "\u092F\u0926\u093F \u092F\u0939 \u0916\u093E\u0924\u093E \u092E\u094C\u091C\u0942\u0926 \u0939\u0948, \u0924\u094B \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0915\u094B\u0921 \u092D\u0947\u091C \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948!"
      });
    }
    const hasRecoveryEmail = !!(user.recovery_email && user.recovery_email.trim());
    if (!sendTo && hasRecoveryEmail) {
      return Response.json({
        success: true,
        requireChoice: true,
        primaryEmail: obfuscateEmail(user.email),
        recoveryEmail: obfuscateEmail(user.recovery_email)
      });
    }
    let targetEmail = user.email;
    let targetLabel = "Primary Email";
    if (sendTo === "recovery" && hasRecoveryEmail) {
      targetEmail = user.recovery_email;
      targetLabel = "Backup Recovery Email";
    }
    let timestamps = [];
    if (user.reset_request_timestamps) {
      try {
        timestamps = JSON.parse(user.reset_request_timestamps);
      } catch (e) {
        timestamps = [];
      }
    }
    const nowMs = Date.now();
    const twentyFourHoursAgoMs = nowMs - 24 * 60 * 60 * 1e3;
    timestamps = timestamps.filter((ts) => new Date(ts).getTime() > twentyFourHoursAgoMs);
    if (timestamps.length >= 2) {
      return Response.json(
        { error: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0915\u093E\u0930\u0923\u094B\u0902 \u0938\u0947, \u0906\u092A 24 \u0918\u0902\u091F\u0947 \u092E\u0947\u0902 \u0915\u0947\u0935\u0932 2 \u092C\u093E\u0930 \u0939\u0940 \u0930\u0940\u0938\u0947\u091F \u0915\u094B\u0921 \u092D\u0947\u091C \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964" },
        { status: 429 }
      );
    }
    const otp = generateSecureOTP(6);
    const expiryTime = new Date(nowMs + 15 * 60 * 1e3).toISOString();
    timestamps.push(new Date(nowMs).toISOString());
    await env.DB.prepare(
      `UPDATE users 
       SET reset_token = ?, 
           reset_token_expires_at = ?, 
           reset_attempts = 0, 
           reset_request_timestamps = ? 
       WHERE id = ?`
    ).bind(otp, expiryTime, JSON.stringify(timestamps), user.id).run();
    const siteUrl = env.SITE_URL || new URL(request.url).origin;
    const resetLink = `${siteUrl}/reset-password/?email=${encodeURIComponent(targetEmail)}&code=${otp}`;
    console.log(`[EMAIL SIMULATION] Sending password reset details to ${targetEmail} (${targetLabel})`);
    const responsePayload = {
      success: true,
      requireChoice: false,
      sentTo: obfuscateEmail(targetEmail),
      message: `\u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0915\u094B\u0921 \u0938\u092B\u0932\u0924\u093E\u092A\u0942\u0930\u094D\u0935\u0915 ${obfuscateEmail(targetEmail)} \u092A\u0930 \u092D\u0947\u091C \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948!`
    };
    return Response.json(responsePayload);
  } catch (err) {
    return Response.json({ error: getGenericErrorMsg() }, { status: 500 });
  }
}
__name(onRequestPost7, "onRequestPost");
function obfuscateEmail(email) {
  if (!email)
    return "";
  const [name, domain] = email.split("@");
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name.substring(0, 2)}***${name.slice(-1)}@${domain}`;
}
__name(obfuscateEmail, "obfuscateEmail");

// api/auth-reset-verify.js
async function onRequestGet6(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const emailOrUsername = url.searchParams.get("email");
  if (!code || !code.trim() || !emailOrUsername || !emailOrUsername.trim()) {
    return Response.json({ error: "\u0913\u091F\u0940\u092A\u0940 \u0915\u094B\u0921 \u0914\u0930 \u0908\u092E\u0947\u0932/\u092F\u0942\u091C\u093C\u0930\u0928\u0947\u092E \u092A\u094D\u0930\u0926\u093E\u0928 \u0915\u0930\u0928\u093E \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u0948\u0964" }, { status: 400 });
  }
  try {
    const cleanInput = emailOrUsername.trim();
    let user;
    if (cleanInput.includes("@")) {
      user = await env.DB.prepare(
        "SELECT id, security_questions, reset_token, reset_token_expires_at, reset_attempts FROM users WHERE email = ?"
      ).bind(cleanInput.toLowerCase()).first();
    } else {
      user = await env.DB.prepare(
        "SELECT id, security_questions, reset_token, reset_token_expires_at, reset_attempts FROM users WHERE username = ?"
      ).bind(cleanInput).first();
    }
    if (!user || user.reset_token !== code.trim()) {
      if (user && user.reset_token) {
        await env.DB.prepare("UPDATE users SET reset_attempts = reset_attempts + 1 WHERE id = ?").bind(user.id).run();
      }
      return Response.json({ error: "\u0905\u092E\u093E\u0928\u094D\u092F \u0930\u0940\u0938\u0947\u091F \u0915\u094B\u0921 \u0926\u0930\u094D\u091C \u0915\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948 \u092F\u093E \u0908\u092E\u0947\u0932 \u0917\u0932\u0924 \u0939\u0948\u0964" }, { status: 400 });
    }
    if (user.reset_attempts >= 5) {
      await env.DB.prepare("UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?").bind(user.id).run();
      return Response.json(
        { error: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0915\u093E\u0930\u0923\u094B\u0902 \u0938\u0947 \u092F\u0939 \u0915\u094B\u0921 \u092C\u094D\u0932\u0949\u0915 \u0915\u0930 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948 \u0915\u094D\u092F\u094B\u0902\u0915\u093F \u092C\u0939\u0941\u0924 \u0938\u093E\u0930\u0947 \u0917\u0932\u0924 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u093F\u090F \u0917\u090F\u0964 \u0915\u0943\u092A\u092F\u093E \u0928\u092F\u093E \u0915\u094B\u0921 \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0915\u0930\u0947\u0902\u0964" },
        { status: 400 }
      );
    }
    if (user.reset_token_expires_at && new Date(user.reset_token_expires_at).getTime() < Date.now()) {
      await env.DB.prepare("UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?").bind(user.id).run();
      return Response.json({ error: "\u0907\u0938 \u0915\u094B\u0921 \u0915\u0940 \u0938\u092E\u092F \u0938\u0940\u092E\u093E (15 \u092E\u093F\u0928\u091F) \u0938\u092E\u093E\u092A\u094D\u0924 \u0939\u094B \u091A\u0941\u0915\u0940 \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0928\u092F\u093E \u0915\u094B\u0921 \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0915\u0930\u0947\u0902\u0964" }, { status: 400 });
    }
    let questions = [];
    if (user.security_questions) {
      try {
        const parsed = JSON.parse(user.security_questions);
        if (Array.isArray(parsed)) {
          questions = parsed.map((q) => ({
            question: q.question,
            is_custom: !!q.is_custom
          }));
        }
      } catch (e) {
        questions = [];
      }
    }
    if (questions.length === 0) {
      return Response.json({
        success: true,
        noSecurityQuestions: true,
        message: "\u0906\u092A\u0928\u0947 \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092A\u094D\u0930\u0936\u094D\u0928 \u0938\u0947\u091F \u0928\u0939\u0940\u0902 \u0915\u093F\u090F \u0939\u0948\u0902\u0964 \u0915\u0943\u092A\u092F\u093E \u090F\u0921\u092E\u093F\u0928 \u0938\u0947 \u0938\u0902\u092A\u0930\u094D\u0915 \u0915\u0930\u0915\u0947 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0930\u0940\u0938\u0947\u091F \u0915\u093E \u0905\u0928\u0941\u0930\u094B\u0927 \u0915\u0930\u0947\u0902\u0964"
      });
    }
    return Response.json({
      success: true,
      questions
    });
  } catch (err) {
    return Response.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
__name(onRequestGet6, "onRequestGet");
async function onRequestPost8(context) {
  const { request, env } = context;
  try {
    const { email, code, answers, newPassword } = await request.json();
    if (!email || !email.trim() || !code || !code.trim() || !newPassword || newPassword.length < 6) {
      return Response.json({ error: "\u0908\u092E\u0947\u0932, \u0915\u094B\u0921 \u0914\u0930 \u0935\u0948\u0927 \u0928\u092F\u093E \u092A\u093E\u0938\u0935\u0930\u094D\u0921 (\u0915\u092E \u0938\u0947 \u0915\u092E \u096C \u0905\u0915\u094D\u0937\u0930) \u0939\u094B\u0928\u093E \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u0948\u0964" }, { status: 400 });
    }
    const cleanInput = email.trim();
    let user;
    if (cleanInput.includes("@")) {
      user = await env.DB.prepare(
        "SELECT id, security_questions, reset_token, reset_token_expires_at, reset_attempts FROM users WHERE email = ?"
      ).bind(cleanInput.toLowerCase()).first();
    } else {
      user = await env.DB.prepare(
        "SELECT id, security_questions, reset_token, reset_token_expires_at, reset_attempts FROM users WHERE username = ?"
      ).bind(cleanInput).first();
    }
    if (!user || user.reset_token !== code.trim()) {
      if (user && user.reset_token) {
        await env.DB.prepare("UPDATE users SET reset_attempts = reset_attempts + 1 WHERE id = ?").bind(user.id).run();
      }
      return Response.json({ error: "\u0905\u092E\u093E\u0928\u094D\u092F \u0930\u0940\u0938\u0947\u091F \u0915\u094B\u0921 \u092F\u093E \u0908\u092E\u0947\u0932\u0964" }, { status: 400 });
    }
    if (user.reset_attempts >= 5) {
      await env.DB.prepare("UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?").bind(user.id).run();
      return Response.json(
        { error: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0915\u093E\u0930\u0923\u094B\u0902 \u0938\u0947 \u092F\u0939 \u0915\u094B\u0921 \u092C\u094D\u0932\u0949\u0915 \u0915\u0930 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0928\u092F\u093E \u0930\u0940\u0938\u0947\u091F \u0932\u093F\u0902\u0915 \u092E\u0902\u0917\u0935\u093E\u090F\u0902\u0964" },
        { status: 400 }
      );
    }
    if (user.reset_token_expires_at && new Date(user.reset_token_expires_at).getTime() < Date.now()) {
      await env.DB.prepare("UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?").bind(user.id).run();
      return Response.json({ error: "\u0907\u0938 \u0915\u094B\u0921 \u0915\u0940 \u0935\u0948\u0927\u0924\u093E \u0938\u092E\u093E\u092A\u094D\u0924 \u0939\u094B \u091A\u0941\u0915\u0940 \u0939\u0948\u0964" }, { status: 400 });
    }
    let dbQuestions = [];
    if (user.security_questions) {
      try {
        dbQuestions = JSON.parse(user.security_questions);
      } catch (e) {
        dbQuestions = [];
      }
    }
    if (!Array.isArray(dbQuestions) || dbQuestions.length === 0) {
      return Response.json({ error: "\u0906\u092A\u0928\u0947 \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092A\u094D\u0930\u0936\u094D\u0928 \u0938\u0947\u091F \u0928\u0939\u0940\u0902 \u0915\u093F\u090F \u0939\u0948\u0902\u0964 \u0915\u0943\u092A\u092F\u093E \u090F\u0921\u092E\u093F\u0928 \u0930\u0940\u0938\u0947\u091F \u0915\u093E \u0905\u0928\u0941\u0930\u094B\u0927 \u0915\u0930\u0947\u0902\u0964" }, { status: 400 });
    }
    if (!Array.isArray(answers) || answers.length < 2) {
      return Response.json({ error: "\u0915\u0943\u092A\u092F\u093E \u0915\u092E \u0938\u0947 \u0915\u092E \u0968 \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092A\u094D\u0930\u0936\u094D\u0928\u094B\u0902 \u0915\u0947 \u0909\u0924\u094D\u0924\u0930 \u0926\u0930\u094D\u091C \u0915\u0930\u0947\u0902\u0964" }, { status: 400 });
    }
    let matchedCount = 0;
    for (const ansObj of answers) {
      const { question, answer } = ansObj;
      if (!question || !answer || !answer.trim())
        continue;
      const cleanInputQ = question.trim().toLowerCase();
      const cleanInputA = answer.trim().toLowerCase().replace(/\s+/g, "");
      const dbQ = dbQuestions.find((dq) => dq.question.trim().toLowerCase() === cleanInputQ);
      if (!dbQ || !dbQ.answer_hash)
        continue;
      let isValid = false;
      if (dbQ.answer_hash.includes(":")) {
        isValid = await verifyPasswordPBKDF2(cleanInputA, dbQ.answer_hash);
      } else {
        const inputHash = await hashSHA256(cleanInputA);
        isValid = cryptoTimingSafeEqual(inputHash, dbQ.answer_hash);
      }
      if (isValid) {
        matchedCount++;
      }
    }
    if (matchedCount < 2) {
      const newAttempts = (user.reset_attempts || 0) + 1;
      if (newAttempts >= 5) {
        await env.DB.prepare("UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL, reset_attempts = 5 WHERE id = ?").bind(user.id).run();
        return Response.json({ error: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092A\u094D\u0930\u0936\u094D\u0928\u094B\u0902 \u0915\u0947 \u0917\u0932\u0924 \u0909\u0924\u094D\u0924\u0930\u0964 \u0906\u092A\u0915\u093E \u0915\u094B\u0921 \u092C\u094D\u0932\u0949\u0915 \u0939\u094B \u0917\u092F\u093E \u0939\u0948, \u0915\u0943\u092A\u092F\u093E \u0928\u092F\u093E \u0915\u094B\u0921 \u092E\u0902\u0917\u0935\u093E\u090F\u0902\u0964" }, { status: 400 });
      } else {
        await env.DB.prepare("UPDATE users SET reset_attempts = ? WHERE id = ?").bind(newAttempts, user.id).run();
        return Response.json({ error: `\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092A\u094D\u0930\u0936\u094D\u0928\u094B\u0902 \u0915\u0947 \u0909\u0924\u094D\u0924\u0930 \u0938\u0939\u0940 \u0928\u0939\u0940\u0902 \u0939\u0948\u0902\u0964 \u0906\u092A\u0915\u0947 \u092A\u093E\u0938 ${5 - newAttempts} \u092A\u094D\u0930\u092F\u093E\u0938 \u0914\u0930 \u0936\u0947\u0937 \u0939\u0948\u0902\u0964` }, { status: 400 });
      }
    }
    const password_hash = await hashPasswordPBKDF2(newPassword);
    await env.DB.prepare(
      `UPDATE users 
       SET password_hash = ?, 
           reset_token = NULL, 
           reset_token_expires_at = NULL, 
           reset_attempts = 0 
       WHERE id = ?`
    ).bind(password_hash, user.id).run();
    return Response.json({ success: true, message: "\u0906\u092A\u0915\u093E \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0938\u092B\u0932\u0924\u093E\u092A\u0942\u0930\u094D\u0935\u0915 \u092C\u0926\u0932 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948! \u0905\u092C \u0906\u092A \u0932\u0949\u0917\u093F\u0928 \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964" });
  } catch (err) {
    return Response.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
__name(onRequestPost8, "onRequestPost");

// api/comments.js
async function onRequestGet7(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug");
  if (!slug)
    return Response.json({ error: "slug required" }, { status: 400 });
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
  const comments = await context.env.DB.prepare(
    `SELECT c.id, c.comment_text, c.reference_links, c.created_at, u.name, u.avatar_url, u.trust_score,
            (SELECT stars FROM ratings r WHERE r.user_id = c.user_id AND r.page_slug = c.page_slug LIMIT 1) as user_rating
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.page_slug = ? AND u.is_shadow_banned = 0 AND c.status = 'active'
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(slug, limit, offset).all();
  const publicComments = comments.results.map((c) => {
    let approvedRefs = [];
    try {
      const refs = JSON.parse(c.reference_links || "[]");
      approvedRefs = refs.filter((r) => typeof r === "string" || r.status === "approved").map((r) => typeof r === "string" ? r : r.url);
    } catch (e) {
    }
    return {
      ...c,
      reference_links: JSON.stringify(approvedRefs)
    };
  });
  return Response.json(publicComments);
}
__name(onRequestGet7, "onRequestGet");
async function onRequestPost9(context) {
  const user = context.data.user;
  if (!user)
    return Response.json({ error: "Login required to comment" }, { status: 401 });
  if (user.is_shadow_banned) {
    return Response.json({ success: true, message: "Comment posted!" });
  }
  if (!user.has_accepted_rules) {
    return Response.json({ error: "Please accept community guidelines first" }, { status: 403 });
  }
  const body = await context.request.json();
  const { slug, text, references } = body;
  if (!slug || !text || text.trim() === "") {
    return Response.json({ error: "Comment text required" }, { status: 400 });
  }
  if (text.length > 5e3) {
    return Response.json({ error: "\u0915\u092E\u0947\u0902\u091F \u096B\u0966\u0966\u0966 \u0905\u0915\u094D\u0937\u0930\u094B\u0902 \u0938\u0947 \u0915\u092E \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F\u0964" }, { status: 400 });
  }
  const cleanText = text.trim();
  const lastComment = await context.env.DB.prepare(
    "SELECT created_at FROM comments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
  ).bind(user.id).first();
  if (lastComment) {
    const lastTime = new Date(lastComment.created_at).getTime();
    const nowTime = Date.now();
    if (nowTime - lastTime < 15e3) {
      return Response.json({ error: "\u0915\u092E\u0947\u0902\u091F \u092A\u094B\u0938\u094D\u091F \u0915\u0930\u0928\u0947 \u0915\u0940 \u0917\u0924\u093F \u092C\u0939\u0941\u0924 \u0924\u0947\u091C\u093C \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0967\u096B \u0938\u0947\u0915\u0902\u0921 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u0947\u0902\u0964" }, { status: 429 });
    }
  }
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?)/i;
  if (urlRegex.test(cleanText)) {
    return Response.json({ error: '\u0915\u092E\u0947\u0902\u091F \u092E\u0947\u0902 \u0932\u093F\u0902\u0915 (URL) \u0921\u093E\u0932\u0928\u093E \u0938\u0916\u094D\u0924 \u092E\u0928\u093E \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0928\u0940\u091A\u0947 "Reference Links" \u0935\u093E\u0932\u0947 \u092C\u0949\u0915\u094D\u0938 \u0915\u093E \u0907\u0938\u094D\u0924\u0947\u092E\u093E\u0932 \u0915\u0930\u0947\u0902\u0964' }, { status: 400 });
  }
  const blockedKeywords = ["bjp", "congress", "hindu", "muslim", "islam", "christian", "modi", "rahul", "politics", "\u0927\u0930\u094D\u092E", "\u0930\u093E\u091C\u0928\u0940\u0924\u093F", "\u0917\u093E\u0932\u0940", "chutiya", "madarchod", "bhenchod", "scam"];
  const lowerText = cleanText.toLowerCase();
  for (const kw of blockedKeywords) {
    if (lowerText.includes(kw)) {
      return Response.json({ error: "\u0906\u092A\u0915\u093E \u092E\u0948\u0938\u0947\u091C \u0939\u092E\u093E\u0930\u0940 \u0915\u092E\u094D\u092F\u0941\u0928\u093F\u091F\u0940 \u0917\u093E\u0907\u0921\u0932\u093E\u0907\u0928\u094D\u0938 (\u0930\u093E\u091C\u0928\u0940\u0924\u093F, \u0927\u0930\u094D\u092E \u092F\u093E \u0905\u092D\u0926\u094D\u0930 \u092D\u093E\u0937\u093E) \u0915\u0947 \u0916\u093F\u0932\u093E\u092B \u0939\u0948\u0964" }, { status: 400 });
    }
  }
  let refJson = "[]";
  if (Array.isArray(references)) {
    const validRefs = references.filter((l) => l && l.trim().length > 0).slice(0, 5);
    const refsWithStatus = validRefs.map((url) => ({ url, status: "pending" }));
    refJson = JSON.stringify(refsWithStatus);
  }
  await context.env.DB.prepare(
    "INSERT INTO comments (page_slug, user_id, comment_text, reference_links) VALUES (?, ?, ?, ?)"
  ).bind(slug, user.id, cleanText, refJson).run();
  return Response.json({ success: true, message: "Comment posted!" });
}
__name(onRequestPost9, "onRequestPost");

// api/diary.js
async function onRequestGet8(context) {
  const user = context.data.user;
  if (!user)
    return Response.json({ error: "Login required" }, { status: 401 });
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const thisMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  let dailyCount = user.daily_sync_count;
  let monthlyCount = user.monthly_sync_count;
  if (user.last_sync_date !== today) {
    await context.env.DB.prepare(
      "UPDATE users SET daily_sync_count = 0, last_sync_date = ? WHERE id = ?"
    ).bind(today, user.id).run();
    dailyCount = 0;
  }
  if (user.last_sync_month !== thisMonth) {
    await context.env.DB.prepare(
      "UPDATE users SET monthly_sync_count = 0, last_sync_month = ? WHERE id = ?"
    ).bind(thisMonth, user.id).run();
    monthlyCount = 0;
  }
  const url = new URL(context.request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
  const notes = await context.env.DB.prepare(
    "SELECT word_slug, note_content, updated_at FROM user_notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?"
  ).bind(user.id, limit, offset).all();
  const bookmarks = await context.env.DB.prepare(
    "SELECT word_slug, word_text, meaning_text, pron_text, category, created_at FROM user_bookmarks WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).bind(user.id, limit, offset).all();
  return Response.json({
    notes: notes.results,
    bookmarks: bookmarks.results,
    daily_sync_count: dailyCount,
    monthly_sync_count: monthlyCount
  });
}
__name(onRequestGet8, "onRequestGet");
async function onRequestPost10(context) {
  const user = context.data.user;
  if (!user)
    return Response.json({ error: "Login required" }, { status: 401 });
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
  if (user.daily_sync_count + items.length > 15) {
    return Response.json({ error: "Daily sync limit (15) reached. (\u0926\u0948\u0928\u093F\u0915 \u0938\u0940\u092E\u093E 15 \u0938\u092E\u093E\u092A\u094D\u0924)" }, { status: 429 });
  }
  if (user.monthly_sync_count + items.length > 150) {
    return Response.json({ error: "Monthly sync limit (150) reached. (\u092E\u093E\u0938\u093F\u0915 \u0938\u0940\u092E\u093E 150 \u0938\u092E\u093E\u092A\u094D\u0924)" }, { status: 429 });
  }
  for (const item of items) {
    if (item.word_slug && item.word_slug.length > 100) {
      return Response.json({ error: "Word slug exceeds 100 characters limit" }, { status: 400 });
    }
    if (item.type === "note") {
      if (item.note_content && item.note_content.length > 5e3) {
        return Response.json({ error: "Note content exceeds 5000 characters limit" }, { status: 400 });
      }
      await context.env.DB.prepare(
        `INSERT INTO user_notes (user_id, word_slug, note_content, updated_at) 
         VALUES (?, ?, ?, datetime('now')) 
         ON CONFLICT(user_id, word_slug) DO UPDATE SET note_content = ?, updated_at = datetime('now')`
      ).bind(user.id, item.word_slug, item.note_content, item.note_content).run();
    } else if (item.type === "bookmark") {
      if (item.word_text && item.word_text.length > 100 || item.meaning_text && item.meaning_text.length > 500 || item.pron_text && item.pron_text.length > 100 || item.category && item.category.length > 50) {
        return Response.json({ error: "Bookmark data exceeds length limit" }, { status: 400 });
      }
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
__name(onRequestPost10, "onRequestPost");

// api/heartbeat.js
async function onRequestPost11(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const stats = await env.DB.prepare(
      "UPDATE users SET active_seconds = active_seconds + 60 WHERE id = ? RETURNING active_seconds, referred_by_id, referrer_bonus_paid, referred_bonus_paid"
    ).bind(user.id).first();
    if (!stats) {
      return new Response("User not found", { status: 404 });
    }
    const newActiveSeconds = stats.active_seconds;
    const threshold = 10800;
    let awardUser = false;
    let awardReferrer = false;
    if (newActiveSeconds >= threshold) {
      if (stats.referred_bonus_paid === 0) {
        const userAwardRes = await env.DB.prepare(
          "UPDATE users SET referral_coins = referral_coins + 900, referred_bonus_paid = 1 WHERE id = ? AND referred_bonus_paid = 0 RETURNING id"
        ).bind(user.id).first();
        if (userAwardRes) {
          awardUser = true;
          await env.DB.prepare(
            'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 900, "active_bonus", "Completed 3 hours of active study")'
          ).bind(user.id).run();
        }
      }
      if (stats.referred_by_id && stats.referrer_bonus_paid === 0) {
        const refFlagRes = await env.DB.prepare(
          "UPDATE users SET referrer_bonus_paid = 1 WHERE id = ? AND referrer_bonus_paid = 0 RETURNING id"
        ).bind(user.id).first();
        if (refFlagRes) {
          awardReferrer = true;
          const statements = [
            env.DB.prepare("UPDATE users SET referral_coins = referral_coins + 900 WHERE id = ?").bind(stats.referred_by_id),
            env.DB.prepare(
              'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, 900, "referral_active", ?)'
            ).bind(stats.referred_by_id, `Referred friend (User ID: ${user.id}) completed 3 hours of study`)
          ];
          await env.DB.batch(statements);
        }
      }
    }
    return Response.json({
      success: true,
      active_seconds: newActiveSeconds,
      milestone_reached: newActiveSeconds >= threshold,
      user_awarded: awardUser,
      referrer_awarded: awardReferrer
    });
  } catch (err) {
    return new Response("Something went wrong. Please try again later.", { status: 500 });
  }
}
__name(onRequestPost11, "onRequestPost");

// api/owner-analytics.js
async function onRequestGet9(context) {
  const user = context.data.user;
  if (!user || user.role !== "owner" && user.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }
  try {
    const summary = await context.env.DB.prepare(`
      SELECT 
        lesson_slug, 
        COUNT(*) as total_attempts, 
        AVG(CAST(score AS REAL) / total_questions) * 100 as avg_percent,
        MAX(score) as max_score,
        MIN(score) as min_score,
        AVG(score) as avg_score,
        MAX(total_questions) as total_questions
      FROM test_attempts
      GROUP BY lesson_slug
    `).all();
    const attempts = await context.env.DB.prepare(`
      SELECT 
        t.id, 
        t.lesson_slug, 
        t.score, 
        t.total_questions, 
        t.created_at, 
        u.name, 
        u.email 
      FROM test_attempts t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
      LIMIT 1000
    `).all();
    return Response.json({
      summary: summary.results,
      attempts: attempts.results
    });
  } catch (err) {
    return new Response("Database error", { status: 500 });
  }
}
__name(onRequestGet9, "onRequestGet");

// api/rate.js
async function onRequestGet10(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug");
  if (!slug)
    return Response.json({ error: "slug required" }, { status: 400 });
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
__name(onRequestGet10, "onRequestGet");
async function onRequestPost12(context) {
  const user = context.data.user;
  if (!user)
    return Response.json({ error: "Login required to rate" }, { status: 401 });
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
__name(onRequestPost12, "onRequestPost");

// api/redeem-coins.js
async function onRequestPost13(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const { amount } = await request.json();
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0 || amount % 100 !== 0) {
      return Response.json({ success: false, error: "Invalid coin amount. Must be a positive integer multiple of 100." }, { status: 400 });
    }
    if (amount < 100) {
      return Response.json({ success: false, error: "Minimum redemption is 100 coins (\u20B91)." }, { status: 400 });
    }
    const discountRupees = Math.floor(amount / 100);
    const uniqueHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const promoCode = `FB-EV-${uniqueHash}-${discountRupees}`;
    const updateResult = await env.DB.prepare(
      "UPDATE users SET referral_coins = referral_coins - ? WHERE id = ? AND referral_coins >= ?"
    ).bind(amount, user.id, amount).run();
    if (updateResult.meta.changes === 0) {
      return Response.json({ success: false, error: "Insufficient coin balance." }, { status: 400 });
    }
    await env.DB.prepare(
      'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, ?, "redemption", ?)'
    ).bind(user.id, -amount, `Redeemed coins for promo code: ${promoCode}`).run();
    const userInfo = await env.DB.prepare("SELECT referral_coins FROM users WHERE id = ?").bind(user.id).first();
    return Response.json({
      success: true,
      promo_code: promoCode,
      discount_rupees: discountRupees,
      coins_redeemed: amount,
      remaining_coins: userInfo ? userInfo.referral_coins : 0
    });
  } catch (err) {
    return Response.json({ success: false, error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
__name(onRequestPost13, "onRequestPost");

// api/redeem-pass-coins.js
async function onRequestPost14(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const cost = 1e3;
    const durationMs = 864e5;
    const updateResult = await env.DB.prepare(
      "UPDATE users SET referral_coins = referral_coins - ? WHERE id = ? AND referral_coins >= ? RETURNING referral_coins"
    ).bind(cost, user.id, cost).first();
    if (!updateResult) {
      return Response.json({ success: false, error: "Insufficient coin balance (\u0915\u092E \u0938\u0947 \u0915\u092E 1,000 \u0915\u0949\u0907\u0928\u094D\u0938 \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u0948\u0902) \u092F\u093E \u0928\u0947\u091F\u0935\u0930\u094D\u0915 \u090F\u0930\u0930\u0964" }, { status: 400 });
    }
    const expiresAt = Date.now() + durationMs;
    await env.DB.prepare(
      'INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (?, ?, "redemption", "Activated 24-Hour Ad-Free Premium Pass using coins")'
    ).bind(user.id, -cost).run();
    return Response.json({
      success: true,
      expires_at: expiresAt,
      coins_redeemed: cost,
      remaining_coins: updateResult.referral_coins
    });
  } catch (err) {
    return Response.json({ success: false, error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
__name(onRequestPost14, "onRequestPost");

// api/referral.js
async function onRequestGet11(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const userInfo = await env.DB.prepare(
      "SELECT username, referral_coins, active_seconds, created_at FROM users WHERE id = ?"
    ).bind(user.id).first();
    if (!userInfo) {
      return new Response("User not found", { status: 404 });
    }
    const referrals = await env.DB.prepare(
      `SELECT name, active_seconds, created_at, referrer_bonus_paid 
       FROM users 
       WHERE referred_by_id = ? 
       ORDER BY created_at DESC`
    ).bind(user.id).all();
    const transactions = await env.DB.prepare(
      `SELECT amount, type, description, created_at 
       FROM coin_transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 20`
    ).bind(user.id).all();
    return Response.json({
      username: userInfo.username,
      referral_coins: userInfo.referral_coins,
      active_seconds: userInfo.active_seconds,
      created_at: userInfo.created_at,
      referrals: referrals.results,
      transactions: transactions.results
    });
  } catch (err) {
    return new Response("Something went wrong. Please try again later.", { status: 500 });
  }
}
__name(onRequestGet11, "onRequestGet");

// api/support-reply.js
async function onRequestPost15(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const { ticket_id, reply_text } = await request.json();
    if (!ticket_id || !reply_text) {
      return new Response("Missing required fields", { status: 400 });
    }
    const ticket = await env.DB.prepare(
      "SELECT user_id, type, status FROM support_tickets WHERE id = ?"
    ).bind(ticket_id).first();
    if (!ticket) {
      return new Response("Ticket not found", { status: 404 });
    }
    let isAuthorized = false;
    if (user.role === "owner") {
      isAuthorized = true;
    } else if (user.role === "admin") {
      isAuthorized = ticket.type === "admin";
    } else {
      isAuthorized = ticket.user_id === user.id;
    }
    if (!isAuthorized) {
      return new Response("Unauthorized", { status: 403 });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      "INSERT INTO support_replies (ticket_id, user_id, reply_text, created_at) VALUES (?, ?, ?, ?)"
    ).bind(ticket_id, user.id, reply_text, now).run();
    let newStatus = ticket.status;
    if (user.role !== "admin" && user.role !== "owner" && ticket.status === "resolved") {
      newStatus = "open";
    }
    await env.DB.prepare(
      "UPDATE support_tickets SET updated_at = ?, status = ? WHERE id = ?"
    ).bind(now, newStatus, ticket_id).run();
    return Response.json({ success: true });
  } catch (err) {
    return new Response("Something went wrong. Please try again later.", { status: 500 });
  }
}
__name(onRequestPost15, "onRequestPost");

// api/support-ticket.js
async function onRequestGet12(context) {
  const { request, env, data } = context;
  const user = data.user;
  const url = new URL(request.url);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const ticketId = url.searchParams.get("ticket_id");
  try {
    if (ticketId) {
      const ticket = await env.DB.prepare(
        `SELECT t.id, t.user_id, t.title, t.message, t.type, t.status, t.created_at 
         FROM support_tickets t 
         WHERE t.id = ?`
      ).bind(ticketId).first();
      if (!ticket) {
        return new Response("Ticket not found", { status: 404 });
      }
      const isAuthorized = user.role === "admin" || user.role === "owner" || ticket.user_id === user.id;
      if (!isAuthorized) {
        return new Response("Unauthorized", { status: 403 });
      }
      const replies = await env.DB.prepare(
        `SELECT r.id, r.reply_text, r.created_at, u.name, u.role, u.avatar_url 
         FROM support_replies r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.ticket_id = ? 
         ORDER BY r.created_at ASC`
      ).bind(ticketId).all();
      return Response.json({ ticket, replies: replies.results });
    } else {
      const tickets = await env.DB.prepare(
        `SELECT id, title, message, type, status, created_at, updated_at 
         FROM support_tickets 
         WHERE user_id = ? 
         ORDER BY updated_at DESC`
      ).bind(user.id).all();
      return Response.json(tickets.results);
    }
  } catch (err) {
    return new Response("Something went wrong. Please try again later.", { status: 500 });
  }
}
__name(onRequestGet12, "onRequestGet");
async function onRequestPost16(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const { title, message, type } = await request.json();
    if (!title || !message || !type) {
      return new Response("Missing required fields", { status: 400 });
    }
    if (type !== "admin" && type !== "owner") {
      return new Response("Invalid type (must be admin or owner)", { status: 400 });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const result = await env.DB.prepare(
      `INSERT INTO support_tickets (user_id, title, message, type, status, created_at, updated_at) 
       VALUES (?, ?, ?, ?, 'open', ?, ?)`
    ).bind(user.id, title, message, type, now, now).run();
    return Response.json({ success: true, ticketId: result.meta.last_row_id || result.insertId });
  } catch (err) {
    return new Response("Something went wrong. Please try again later.", { status: 500 });
  }
}
__name(onRequestPost16, "onRequestPost");

// api/tests.js
async function onRequestGet13(context) {
  const user = context.data.user;
  if (!user) {
    return Response.json([], { status: 200 });
  }
  try {
    const attempts = await context.env.DB.prepare(
      "SELECT id, lesson_slug, score, total_questions, answers_json, created_at FROM test_attempts WHERE user_id = ? ORDER BY created_at DESC"
    ).bind(user.id).all();
    return Response.json(attempts.results);
  } catch (err) {
    return new Response("Database error", { status: 500 });
  }
}
__name(onRequestGet13, "onRequestGet");
async function onRequestPost17(context) {
  const user = context.data.user;
  if (!user) {
    return Response.json({ error: "Login required" }, { status: 401 });
  }
  try {
    const { lesson_slug, score, total_questions, answers_json } = await context.request.json();
    if (!lesson_slug || score === void 0 || total_questions === void 0) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    await context.env.DB.prepare(
      "INSERT INTO test_attempts (user_id, lesson_slug, score, total_questions, answers_json) VALUES (?, ?, ?, ?, ?)"
    ).bind(
      user.id,
      lesson_slug,
      score,
      total_questions,
      answers_json || "[]"
    ).run();
    return Response.json({ success: true });
  } catch (err) {
    return new Response("Database error", { status: 500 });
  }
}
__name(onRequestPost17, "onRequestPost");

// api/ugc.js
async function onRequestGet14(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug");
  if (!slug)
    return Response.json({ error: "slug required" }, { status: 400 });
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);
  const meanings = await context.env.DB.prepare(
    `SELECT u.id, u.meaning_text, u.region, u.upvotes, u.downvotes, u.status, u.created_at, users.name, users.trust_score
     FROM ugc_meanings u
     JOIN users ON u.user_id = users.id
     WHERE u.word_slug = ? AND u.status != 'banned' AND u.status != 'deleted'
     ORDER BY u.upvotes DESC, u.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(slug, limit, offset).all();
  return Response.json(meanings.results);
}
__name(onRequestGet14, "onRequestGet");
async function onRequestPost18(context) {
  const user = context.data.user;
  if (!user)
    return Response.json({ error: "Login required" }, { status: 401 });
  const body = await context.request.json();
  const { action, slug, meaning_text, region, meaning_id, vote_type } = body;
  if (action === "add") {
    if (!meaning_text || meaning_text.trim() === "") {
      return Response.json({ error: "Meaning text required" }, { status: 400 });
    }
    if (meaning_text.length > 1e3) {
      return Response.json({ error: "\u092F\u094B\u0917\u0926\u093E\u0928 \u0967\u0966\u0966\u0966 \u0905\u0915\u094D\u0937\u0930\u094B\u0902 \u0938\u0947 \u0915\u092E \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F\u0964" }, { status: 400 });
    }
    if (region && region.length > 100) {
      return Response.json({ error: "\u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0967\u0966\u0966 \u0905\u0915\u094D\u0937\u0930\u094B\u0902 \u0938\u0947 \u0915\u092E \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F\u0964" }, { status: 400 });
    }
    if (user.is_shadow_banned) {
      return Response.json({ success: true, message: "Added successfully! Marked as Not Verified." });
    }
    const lastSubmission = await context.env.DB.prepare(
      "SELECT created_at FROM ugc_meanings WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(user.id).first();
    if (lastSubmission) {
      const lastTime = new Date(lastSubmission.created_at).getTime();
      const nowTime = Date.now();
      if (nowTime - lastTime < 15e3) {
        return Response.json({ error: "\u092F\u094B\u0917\u0926\u093E\u0928 \u092D\u0947\u091C\u0928\u0947 \u0915\u0940 \u0917\u0924\u093F \u092C\u0939\u0941\u0924 \u0924\u0947\u091C\u093C \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0967\u096B \u0938\u0947\u0915\u0902\u0921 \u092A\u094D\u0930\u0924\u0940\u0915\u094D\u0937\u093E \u0915\u0930\u0947\u0902\u0964" }, { status: 429 });
      }
    }
    await context.env.DB.prepare(
      `INSERT INTO ugc_meanings (word_slug, user_id, meaning_text, region, status) 
       VALUES (?, ?, ?, ?, 'not_verified')`
    ).bind(slug, user.id, meaning_text.trim(), region || "").run();
    return Response.json({ success: true, message: "Added successfully! Marked as Not Verified." });
  } else if (action === "vote") {
    if (!meaning_id || !vote_type)
      return Response.json({ error: "Invalid vote" }, { status: 400 });
    try {
      const meaningAuthor = await context.env.DB.prepare("SELECT user_id, upvotes, downvotes FROM ugc_meanings WHERE id = ?").bind(meaning_id).first();
      if (!meaningAuthor) {
        return Response.json({ error: "Meaning not found" }, { status: 404 });
      }
      if (meaningAuthor.user_id === user.id) {
        return Response.json({ error: "You cannot vote on your own submission" }, { status: 400 });
      }
      if (user.is_shadow_banned) {
        let fakeUp = meaningAuthor.upvotes;
        let fakeDown = meaningAuthor.downvotes;
        if (vote_type === "up")
          fakeUp++;
        if (vote_type === "down")
          fakeDown++;
        return Response.json({ success: true, upvotes: fakeUp, downvotes: fakeDown });
      }
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
        await context.env.DB.prepare('UPDATE ugc_meanings SET status = "flagged" WHERE id = ?').bind(meaning_id).run();
      }
      return Response.json({ success: true, upvotes: up.c, downvotes: down.c });
    } catch (e) {
      return Response.json({ error: "Database error" }, { status: 500 });
    }
  }
  return Response.json({ error: "Invalid action" }, { status: 400 });
}
__name(onRequestPost18, "onRequestPost");

// api/user-password.js
async function onRequestPost19(context) {
  const { request, env } = context;
  const cookieHeader = request.headers.get("Cookie") || "";
  const match2 = cookieHeader.match(/ev_token=([^;]+)/);
  if (!match2)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  const token = match2[1];
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload)
    return Response.json({ error: "Invalid token" }, { status: 401 });
  try {
    const { currentPassword, password } = await request.json();
    if (!password || password.length < 6) {
      return Response.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }
    const user = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(payload.userId).first();
    if (!user) {
      return Response.json({ success: false, error: "User not found." }, { status: 404 });
    }
    if (user.password_hash) {
      if (!currentPassword) {
        return Response.json({ success: false, error: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u0915\u0947 \u0932\u093F\u090F \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0926\u0930\u094D\u091C \u0915\u0930\u0928\u093E \u0906\u0935\u0936\u094D\u092F\u0915 \u0939\u0948\u0964" }, { status: 400 });
      }
      let isCurrentValid = false;
      if (user.password_hash.includes(":")) {
        isCurrentValid = await verifyPasswordPBKDF2(currentPassword, user.password_hash);
      } else {
        const legacyHash = await hashSHA256(currentPassword);
        isCurrentValid = legacyHash === user.password_hash;
      }
      if (!isCurrentValid) {
        return Response.json({ success: false, error: "\u0917\u0932\u0924 \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u092A\u093E\u0938\u0935\u0930\u094D\u0921 \u0926\u0930\u094D\u091C \u0915\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964" }, { status: 401 });
      }
    }
    const password_hash = await hashPasswordPBKDF2(password);
    await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(password_hash, payload.userId).run();
    return Response.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    return Response.json({ success: false, error: getGenericErrorMsg() }, { status: 500 });
  }
}
__name(onRequestPost19, "onRequestPost");

// api/user-security-questions.js
async function onRequestPost20(context) {
  const { request, env } = context;
  const user = context.data.user;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { recoveryEmail, questions } = await request.json();
    if (!Array.isArray(questions) || questions.length !== 3) {
      return Response.json({ error: "3 security questions are required." }, { status: 400 });
    }
    const existingUser = await env.DB.prepare("SELECT security_questions FROM users WHERE id = ?").bind(user.id).first();
    const existingQs = existingUser && existingUser.security_questions ? JSON.parse(existingUser.security_questions) : [];
    const processedQuestions = [];
    for (let i = 0; i < 3; i++) {
      const q = questions[i];
      if (!q) {
        return Response.json({ error: "3 security questions are required." }, { status: 400 });
      }
      const { question, answer, isCustom } = q;
      if (!question || !question.trim()) {
        return Response.json({ error: "\u0938\u092D\u0940 \u092A\u094D\u0930\u0936\u094D\u0928\u094B\u0902 \u0915\u094B \u092D\u0930\u0928\u093E \u0905\u0928\u093F\u0935\u093E\u0930\u094D\u092F \u0939\u0948\u0964" }, { status: 400 });
      }
      let answerHash = null;
      if (!answer || !answer.trim()) {
        const matchingExisting = existingQs.find((eq) => eq.question.trim().toLowerCase() === question.trim().toLowerCase());
        if (matchingExisting && matchingExisting.answer_hash) {
          answerHash = matchingExisting.answer_hash;
        } else {
          return Response.json({ error: "\u0938\u092D\u0940 \u0928\u090F \u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092A\u094D\u0930\u0936\u094D\u0928\u094B\u0902 \u0915\u0947 \u0909\u0924\u094D\u0924\u0930 \u0926\u0947\u0928\u093E \u0905\u0928\u093F\u0935\u093E\u0930\u094D\u092F \u0939\u0948\u0964" }, { status: 400 });
        }
      } else {
        const cleanAnswer = answer.trim().toLowerCase().replace(/\s+/g, "");
        answerHash = await hashPasswordPBKDF2(cleanAnswer);
      }
      processedQuestions.push({
        question: question.trim(),
        answer_hash: answerHash,
        is_custom: !!isCustom
      });
    }
    const questionsJson = JSON.stringify(processedQuestions);
    const cleanRecoveryEmail = recoveryEmail ? recoveryEmail.trim().toLowerCase() : null;
    await env.DB.prepare("UPDATE users SET security_questions = ?, recovery_email = ? WHERE id = ?").bind(questionsJson, cleanRecoveryEmail, user.id).run();
    return Response.json({ success: true, message: "\u0938\u0941\u0930\u0915\u094D\u0937\u093E \u092A\u094D\u0930\u0936\u094D\u0928 \u0914\u0930 \u092C\u0948\u0915\u0905\u092A \u0908\u092E\u0947\u0932 \u0938\u092B\u0932\u0924\u093E\u092A\u0942\u0930\u094D\u0935\u0915 \u0938\u0939\u0947\u091C \u0932\u093F\u090F \u0917\u090F \u0939\u0948\u0902!" });
  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
__name(onRequestPost20, "onRequestPost");

// api/user-update.js
async function onRequestPut(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const body = await request.json();
    const name = (body.name || "").trim().substring(0, 50);
    const username = (body.username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "").substring(0, 30);
    const social_facebook = (body.social_facebook || "").trim().substring(0, 200);
    const social_youtube = (body.social_youtube || "").trim().substring(0, 200);
    const social_instagram = (body.social_instagram || "").trim().substring(0, 200);
    const social_twitter = (body.social_twitter || "").trim().substring(0, 200);
    const social_linkedin = (body.social_linkedin || "").trim().substring(0, 200);
    const social_pinterest = (body.social_pinterest || "").trim().substring(0, 200);
    const social_website1 = (body.social_website1 || "").trim().substring(0, 200);
    const social_website2 = (body.social_website2 || "").trim().substring(0, 200);
    let location_address = null;
    if (body.location_address) {
      if (typeof body.location_address === "object") {
        location_address = JSON.stringify(body.location_address);
      } else if (typeof body.location_address === "string") {
        location_address = body.location_address;
      }
    }
    if (!name) {
      return new Response("Name is required", { status: 400 });
    }
    if (username) {
      const existing = await env.DB.prepare("SELECT id FROM users WHERE username = ? AND id != ?").bind(username, user.id).first();
      if (existing) {
        return new Response("Username is already taken", { status: 400 });
      }
    }
    await env.DB.prepare(`
      UPDATE users SET 
        name = ?, 
        username = ?,
        social_facebook = ?,
        social_youtube = ?,
        social_instagram = ?,
        social_twitter = ?,
        social_linkedin = ?,
        social_pinterest = ?,
        social_website1 = ?,
        social_website2 = ?,
        location_address = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      name,
      username || null,
      social_facebook,
      social_youtube,
      social_instagram,
      social_twitter,
      social_linkedin,
      social_pinterest,
      social_website1,
      social_website2,
      location_address,
      user.id
    ).run();
    return Response.json({ success: true, message: "Profile updated successfully" });
  } catch (e) {
    return new Response("Something went wrong. Please try again later.", { status: 500 });
  }
}
__name(onRequestPut, "onRequestPut");
async function onRequestPost21(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const body = await request.json();
    if (body.action === "request_delete") {
      await env.DB.prepare(`UPDATE users SET delete_requested_at = datetime('now') WHERE id = ?`).bind(user.id).run();
      return Response.json({ success: true, message: "Account deletion requested successfully" });
    } else if (body.action === "cancel_delete") {
      await env.DB.prepare(`UPDATE users SET delete_requested_at = NULL WHERE id = ?`).bind(user.id).run();
      return Response.json({ success: true, message: "Account deletion request cancelled" });
    } else if (body.action === "accept_rules") {
      await env.DB.prepare(`UPDATE users SET has_accepted_rules = 1 WHERE id = ?`).bind(user.id).run();
      return Response.json({ success: true, message: "Rules accepted" });
    }
    return new Response("Invalid action", { status: 400 });
  } catch (e) {
    return new Response("Something went wrong. Please try again later.", { status: 500 });
  }
}
__name(onRequestPost21, "onRequestPost");

// _middleware.js
async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (url.hostname.endsWith(".pages.dev") || url.hostname === "www.englishvidya.com") {
    url.hostname = "englishvidya.com";
    return Response.redirect(url.toString(), 301);
  }
  const pathname = url.pathname;
  const segments = pathname.split("/").filter(Boolean);
  if (request.method === "GET" && segments.length === 1) {
    const username = segments[0].toLowerCase();
    const reserved = [
      "admin",
      "api",
      "assets",
      "css",
      "js",
      "dictionary",
      "grammar",
      "legal",
      "legal-hindi",
      "settings",
      "login",
      "contact",
      "profile",
      "about-us",
      "about-us-hindi",
      "forum",
      "my-diary",
      "founder-mastermanikant",
      "founder-mastermanikant-hindi",
      "class-10",
      "class-12",
      "flashcards",
      "robots.txt",
      "manifest.json",
      "sitemap.xml",
      "favicon.ico",
      "paid"
    ];
    if (!reserved.includes(username) && /^[a-z0-9_-]{3,20}$/.test(username)) {
      try {
        const referrer = await env.DB.prepare("SELECT id FROM users WHERE LOWER(username) = ?").bind(username).first();
        if (referrer) {
          const headers = new Headers();
          headers.append("Location", "/");
          headers.append("Set-Cookie", `ev_referrer=${referrer.id}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax; Secure`);
          return new Response("", { status: 302, headers });
        }
      } catch (err) {
      }
    }
  }
  const cookie = request.headers.get("Cookie") || "";
  const token = getCookieValue(cookie, "ev_token");
  context.data = context.data || {};
  context.data.user = null;
  if (token) {
    try {
      const payload = await verifyJWT2(token, env.JWT_SECRET);
      const user = await env.DB.prepare(
        "SELECT id, google_id, email, name, username, role, avatar_url, password_hash, trust_score, is_shadow_banned, daily_sync_count, monthly_sync_count, last_sync_date, last_sync_month, social_instagram, social_facebook, social_youtube, social_twitter, social_linkedin, social_pinterest, social_website1, social_website2, delete_requested_at, has_accepted_rules, location_address FROM users WHERE id = ?"
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
async function verifyJWT2(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3)
    throw new Error("Invalid token");
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
  if (!valid)
    throw new Error("Invalid signature");
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
    throw new Error("Token expired");
  }
  return payload;
}
__name(verifyJWT2, "verifyJWT");
function base64UrlDecode(str) {
  let padded = str.replace(/-/g, "+").replace(/_/g, "/");
  while (padded.length % 4)
    padded += "=";
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}
__name(base64UrlDecode, "base64UrlDecode");

// ../.wrangler/tmp/pages-NSUT20/functionsRoutes-0.31329352955100576.mjs
var routes = [
  {
    routePath: "/api/admin-action",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/admin-data",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/admin-reset-request",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/admin-revert",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/auth-callback",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/auth-custom",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/auth-google",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/auth-login",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/auth-logout",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/auth-me",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/auth-register",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/auth-reset-request",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/auth-reset-verify",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/auth-reset-verify",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/api/comments",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/comments",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost9]
  },
  {
    routePath: "/api/diary",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/diary",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost10]
  },
  {
    routePath: "/api/heartbeat",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost11]
  },
  {
    routePath: "/api/owner-analytics",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/api/rate",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  },
  {
    routePath: "/api/rate",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost12]
  },
  {
    routePath: "/api/redeem-coins",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost13]
  },
  {
    routePath: "/api/redeem-pass-coins",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost14]
  },
  {
    routePath: "/api/referral",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet11]
  },
  {
    routePath: "/api/support-reply",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost15]
  },
  {
    routePath: "/api/support-ticket",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet12]
  },
  {
    routePath: "/api/support-ticket",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost16]
  },
  {
    routePath: "/api/tests",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet13]
  },
  {
    routePath: "/api/tests",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost17]
  },
  {
    routePath: "/api/ugc",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet14]
  },
  {
    routePath: "/api/ugc",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost18]
  },
  {
    routePath: "/api/user-password",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost19]
  },
  {
    routePath: "/api/user-security-questions",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost20]
  },
  {
    routePath: "/api/user-update",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost21]
  },
  {
    routePath: "/api/user-update",
    mountPath: "/api",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
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

// ../node_modules/wrangler/templates/pages-template-worker.ts
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
          passThroughOnException: () => {
            isFailOpen = true;
          }
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
