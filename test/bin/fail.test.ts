import fail from '../../src/bin/fail';

describe('fail', () => {
  let consoleErrorMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
  let processExitMock: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;

  beforeEach(() => {
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation();
    processExitMock = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    if (consoleErrorMock) {
      consoleErrorMock.mockRestore();
    }
    if (processExitMock) {
      processExitMock.mockRestore();
    }
  });

  it('handle message', () => {
    fail('error', null);
    expect(consoleErrorMock).toHaveBeenCalledTimes(1);
    expect(consoleErrorMock).toHaveBeenCalledWith('error');
    expect(processExitMock).toHaveBeenCalledTimes(1);
    expect(processExitMock).toHaveBeenCalledWith(1);
  });

  it('handle error', () => {
    fail(null, new Error('Some error'));
    expect(consoleErrorMock).toHaveBeenCalledTimes(1);
    expect(consoleErrorMock.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(consoleErrorMock.mock.calls[0][0].message).toBe('Some error');
    expect(processExitMock).toHaveBeenCalledTimes(1);
    expect(processExitMock).toHaveBeenCalledWith(1);
  });

  it('handle both message and error', () => {
    fail('error', new Error('Some error'));
    expect(consoleErrorMock).toHaveBeenCalledTimes(2);
    expect(consoleErrorMock.mock.calls[0][0]).toEqual('error');
    expect(consoleErrorMock.mock.calls[1][0]).toBeInstanceOf(Error);
    expect(consoleErrorMock.mock.calls[1][0].message).toBe('Some error');
    expect(processExitMock).toHaveBeenCalledTimes(1);
    expect(processExitMock).toHaveBeenCalledWith(1);
  });
});
