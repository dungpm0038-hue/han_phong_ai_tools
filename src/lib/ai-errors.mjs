/**
 * Map provider status/code to fixed public messages. Never reflect the provider's
 * raw message, request headers, prompt or API key in responses or logs.
 * @param {number | undefined} status
 * @param {string | null | undefined} code
 */
export function describeProviderError(status, code) {
  if (status === 401 || code === "invalid_api_key") {
    return {
      status: 503,
      code: "AI_PROVIDER_AUTH",
      error:
        "Khóa OpenAI chưa hợp lệ. Chủ website cần kiểm tra OPENAI_API_KEY trong Vercel.",
    };
  }
  if (code === "insufficient_quota") {
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
