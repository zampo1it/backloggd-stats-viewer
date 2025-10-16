import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

// Глобальная переменная для отслеживания текущей задержки
let currentRetryDelay = 10000; // Начальная задержка 10 секунд
let consecutiveRateLimits = 0; // Счетчик последовательных rate limits

/**
 * Performs an axios request with automatic retry on rate limiting (429)
 * @param config Axios request configuration
 * @param maxRetries Maximum number of retries (default: 999999 - practically unlimited)
 * @param retryDelay Initial delay in milliseconds between retries (default: 10000)
 * @returns Promise with the axios response
 */
export async function axiosWithRetry(
  config: AxiosRequestConfig,
  maxRetries: number = 999999,
  retryDelay: number = 10000
): Promise<AxiosResponse> {
  let lastError: AxiosError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios(config);
      
      // Если запрос прошел успешно, сбрасываем счетчик rate limits и возвращаем задержку к исходному значению
      if (consecutiveRateLimits > 0) {
        console.log(`Request successful, resetting retry delay to ${retryDelay}ms`);
        currentRetryDelay = retryDelay;
        consecutiveRateLimits = 0;
      }
      
      return response;
    } catch (error) {
      if (error instanceof AxiosError) {
        lastError = error;

        // Check if it's a rate limit error (429)
        if (error.response?.status === 429) {
          if (attempt < maxRetries) {
            consecutiveRateLimits++;
            
            // Если это второй подряд rate limit, увеличиваем задержку
            if (consecutiveRateLimits >= 2) {
              currentRetryDelay = 20000; // Увеличиваем до 20 секунд
              console.log(`Consecutive rate limits detected, increasing delay to ${currentRetryDelay}ms`);
            }
            
            console.log(
              `Rate limited (attempt ${attempt + 1}/${maxRetries + 1}), waiting ${currentRetryDelay}ms before retry...`
            );
            await new Promise((resolve) => setTimeout(resolve, currentRetryDelay));
            continue; // Retry the request
          } else {
            console.log(`Max retries (${maxRetries}) reached for rate limiting`);
          }
        }

        // Check if the response body contains "Rate limited" text
        if (
          error.response?.data &&
          typeof error.response.data === "string" &&
          error.response.data.toLowerCase().includes("rate limited")
        ) {
          if (attempt < maxRetries) {
            consecutiveRateLimits++;
            
            // Если это второй подряд rate limit, увеличиваем задержку
            if (consecutiveRateLimits >= 2) {
              currentRetryDelay = 20000; // Увеличиваем до 20 секунд
              console.log(`Consecutive rate limits detected, increasing delay to ${currentRetryDelay}ms`);
            }
            
            console.log(
              `Rate limited detected in response body (attempt ${attempt + 1}/${maxRetries + 1}), waiting ${currentRetryDelay}ms before retry...`
            );
            await new Promise((resolve) => setTimeout(resolve, currentRetryDelay));
            continue; // Retry the request
          } else {
            console.log(`Max retries (${maxRetries}) reached for rate limiting`);
          }
        }

        // For other errors, throw immediately
        throw error;
      }

      // For non-axios errors, throw immediately
      throw error;
    }
  }

  // If we get here, we've exhausted all retries
  throw lastError || new Error("Request failed after maximum retries");
}

