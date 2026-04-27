export class UserService {
  publicProp = 'exposed';
  private _privateProp = 'correct';

  getPublic() {
    return this.publicProp;
  }

  private _privateHelper() {
    return this._privateProp;
  }
}
