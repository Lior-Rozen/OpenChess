import { fetchServerMessage, type FetchFn } from './hello';

const jsonResponse = (body: unknown, ok = true) =>
  ({ ok, json: async () => body }) as unknown as Response;

describe('fetchServerMessage', () => {
  it('returns the message from /api/hello', async () => {
    const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>(async () =>
      jsonResponse({ message: 'hello friend' }),
    );

    await expect(fetchServerMessage('http://192.168.1.10:5080/', fetchFn)).resolves.toBe('hello friend');
    expect(fetchFn.mock.calls[0][0]).toBe('http://192.168.1.10:5080/api/hello');
  });

  it('returns null when no URL is configured', async () => {
    const fetchFn = jest.fn<ReturnType<FetchFn>, Parameters<FetchFn>>();

    await expect(fetchServerMessage(undefined, fetchFn)).resolves.toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('returns null when the server is unreachable', async () => {
    const fetchFn: FetchFn = async () => {
      throw new TypeError('Network request failed');
    };

    await expect(fetchServerMessage('http://localhost:5080', fetchFn)).resolves.toBeNull();
  });

  it('returns null on an error status or an unexpected body', async () => {
    await expect(fetchServerMessage('http://x', async () => jsonResponse({}, false))).resolves.toBeNull();
    await expect(fetchServerMessage('http://x', async () => jsonResponse({ msg: 1 }))).resolves.toBeNull();
  });

  it('gives up after the timeout', async () => {
    const hangingFetch: FetchFn = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      });

    await expect(fetchServerMessage('http://x', hangingFetch, 10)).resolves.toBeNull();
  });
});
