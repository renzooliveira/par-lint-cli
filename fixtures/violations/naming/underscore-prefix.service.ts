export class UserService {
  _publicProp = 'exposed';
  public _anotherPublic = 'also exposed';
  protected _protectedProp = 'not private';
  private _privateProp = 'this is fine';

  _publicMethod() {
    return this._publicProp;
  }

  private _privateMethod() {
    return this._privateProp;
  }
}
