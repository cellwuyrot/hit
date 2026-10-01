import { checkoutBody, checkoutUser, checkoutFailure, quoteCheckout } from "@/lib/checkout";

export async function POST(request: Request) {
  try {
    const userId = checkoutUser(request);
    const body = await checkoutBody(request);
    return Response.json(await quoteCheckout(userId, body.items, body.promoCode, true));
  } catch (error) { return checkoutFailure(error); }
}
