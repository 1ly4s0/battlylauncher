/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */
declare function login(username: string, password?: string): Promise<any>;
declare function refresh(acc: any): Promise<any>;
declare function validate(acc: any): Promise<boolean>;
declare function signout(acc: any): Promise<boolean>;
declare function ChangeAuthApi(url: string): void;
export { login as login, refresh as refresh, validate as validate, signout as signout, ChangeAuthApi as ChangeAuthApi };
