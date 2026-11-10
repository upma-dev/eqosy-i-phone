import { FOOD_API_BASE_URL } from '../config';
import { createClient } from './http';

// Food + unified auth API: <origin>/api/v1  (paths like /food/orders, /auth/unified/request-otp).
const foodApi = createClient({
  baseURL: FOOD_API_BASE_URL,
  pickToken: (s) => s.foodToken || s.token,
});

export default foodApi;
