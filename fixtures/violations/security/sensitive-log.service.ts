export class AuthService {
  login(username: string, password: string) {
    console.log('Login attempt:', username, password);
    console.log('Token:', this.getToken());
    console.debug('Secret key:', process.env.SECRET_KEY);
  }

  private getToken() {
    return 'abc123';
  }
}
