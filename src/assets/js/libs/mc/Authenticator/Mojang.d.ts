/**
 * This code is distributed under the CC-BY-NC 4.0 license:
 * https://creativecommons.org/licenses/by-nc/4.0/
 *
 * Original author: Luuxis
 */
declare function login(username: string, password?: string): Promise<any>;
declare function refresh(acc: any): Promise<any>;
declare function validate(acc: any): Promise<boolean>;
declare function signout(acc: any): Promise<boolean>;
declare function ChangeAuthApi(url: string): void;
export { login as login, refresh as refresh, validate as validate, signout as signout, ChangeAuthApi as ChangeAuthApi };
