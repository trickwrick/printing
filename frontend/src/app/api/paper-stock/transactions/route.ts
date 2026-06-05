import { withDb } from '@/server/api-handler';
import * as paperStockService from '@/server/services/paperStock';

export async function GET() {
  return withDb(() => paperStockService.getTransactions());
}
