export class SimilarMethodsService {
  getUserData(userId: string) {
    const url = '/api/users/' + userId;
    const headers = { Authorization: 'Bearer token' };
    const response = fetch(url, { headers });
    return response.then(r => r.json());
  }

  getOrderData(orderId: string) {
    const url = '/api/orders/' + orderId;
    const headers = { Authorization: 'Bearer token' };
    const response = fetch(url, { headers });
    return response.then(r => r.json());
  }

  getProductData(productId: string) {
    const url = '/api/products/' + productId;
    const headers = { Authorization: 'Bearer token' };
    const response = fetch(url, { headers });
    return response.then(r => r.json());
  }
}
