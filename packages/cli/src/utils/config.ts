import Conf from 'conf';

interface ConfigSchema {
  token?: string;
  currentTeam?: string;
}

const config = new Conf<ConfigSchema>({
  projectName: 'titan-cli',
  projectVersion: '0.0.1'
});

export const getToken = () => process.env.TITAN_AUTH_TOKEN || config.get('token');
export const setToken = (token: string) => config.set('token', token);
export const clearToken = () => config.delete('token');
