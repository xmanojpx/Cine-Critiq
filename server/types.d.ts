declare module 'axios-retry' {
  import { AxiosInstance, AxiosError } from 'axios';

  interface IAxiosRetryConfig {
    retries?: number;
    retryCondition?: (error: AxiosError) => boolean;
    retryDelay?: (retryCount: number) => number;
    shouldResetTimeout?: boolean;
  }

  function axiosRetry(
    axios: AxiosInstance,
    config?: IAxiosRetryConfig
  ): void;

  namespace axiosRetry {
    export function isNetworkOrIdempotentRequestError(error: AxiosError): boolean;
  }

  export = axiosRetry;
} 