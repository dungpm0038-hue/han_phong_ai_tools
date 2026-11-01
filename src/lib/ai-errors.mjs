/**
 * Map provider status/code to fixed public messages. Never reflect the provider's
 * raw message, request headers, prompt or API key in responses or logs.
 * @param {number | undefined} status
 * @param {string | null | undefined} code
 * @param {string | null | undefined} [type]
 */
export function describeProviderError(status, code, type) {
  if (status === 401 || code === "invalid_api_key") {
    return {
      status: 503,
      code: "AI_PROVIDER_AUTH",
      error:
        "Khóa OpenAI chưa hợp lệ. Chủ website cần kiểm tra OPENAI_API_KEY trong Vercel.",
    };
  }
  if (
    code === "insufficient_quota" ||
    type === "insufficient_quota" ||
    code === "billing_hard_limit_reached"
  ) {
    return {
      status: 503,
      code: "AI_PROVIDER_QUOTA",
      error:
        "Tài khoản OpenAI chưa có đủ hạn mức API. Chủ website cần kiểm tra billing, tín dụng API và giới hạn chi tiêu.",
    };
  }
  if (status === 429) {
    return {
      status: 429,
      code: "AI_PROVIDER_RATE_LIMIT",
      error:
        "OpenAI đang giới hạn lưu lượng. Vui lòng thử lại sau ít phút; lượt thất bại không tính vào hạn mức ngày.",
    };
  }
  if (status === 404 || code === "model_not_found") {
    return {
      status: 503,
      code: "AI_PROVIDER_MODEL",
      error:
        "Model AI đã cấu hình chưa khả dụng cho tài khoản. Chủ website cần kiểm tra OPENAI_MODEL và quyền truy cập model.",
    };
  }
  if (status === 403) {
    return {
      status: 503,
      code: "AI_PROVIDER_PERMISSION",
      error:
        "Tài khoản OpenAI chưa được phép thực hiện yêu cầu này. Chủ website cần kiểm tra quyền của project API.",
    };
  }
  return {
    status: 502,
    code: "AI_PROVIDER_UNAVAILABLE",
    error:
      "Chưa thể nhận phản hồi từ OpenAI. Vui lòng thử lại sau; lượt thất bại không tính vào hạn mức ngày.",
  };
}

/**
 * Owner diagnostics use only whitelisted categories and numeric response limits.
 * No provider message, prompt, request header or credential is accepted here.
 * @param {number | undefined} status
 * @param {string | null | undefined} code
 * @param {string | null | undefined} type
 * @param {Headers | undefined} headers
 */
export function providerDiagnostics(status, code, type, headers) {
  const codes = new Set([
    "invalid_api_key",
    "insufficient_quota",
    "rate_limit_exceeded",
    "model_not_found",
    "billing_hard_limit_reached",
  ]);
  const types = new Set([
    "tokens",
    "requests",
    "invalid_request_error",
    "insufficient_quota",
    "rate_limit_error",
    "authentication_error",
    "server_error",
  ]);
  const numeric = (/** @type {string} */ name) => {
    const raw = headers?.get(name);
    if (!raw || !/^-?\d+(?:\.\d+)?$/.test(raw)) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) && value >= -1 && value <= 1e12
      ? value
      : undefined;
  };
  return {
    status:
      typeof status === "number" && status >= 100 && status <= 599 ? status : 0,
    providerCode: code && codes.has(code) ? code : "unknown",
    providerType: type && types.has(type) ? type : "unknown",
    tokenLimit: numeric("x-ratelimit-limit-tokens"),
    requestLimit: numeric("x-ratelimit-limit-requests"),
    tokensRemaining: numeric("x-ratelimit-remaining-tokens"),
    requestsRemaining: numeric("x-ratelimit-remaining-requests"),
    retryAfterSeconds: numeric("retry-after"),
  };
}
